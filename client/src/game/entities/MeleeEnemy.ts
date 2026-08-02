import Phaser from 'phaser';
import type { MeleeSwingConfig } from '@/game/config/combatConfig';
import { Enemy, type EnemyProjectileAttack } from '@/game/entities/Enemy';

export type MeleeEnemyConfig = {
  health: number;
  aggroRadius: number;
  moveSpeed: number;
  contactDamage: number;
  contactDamageCooldown: number;
  /** When set, the enemy attacks by swinging a rod instead of dealing contact damage. */
  swing?: MeleeSwingConfig;
};

type MeleeState = 'chase' | 'windup' | 'swing' | 'recover';

type PlayerDamageHandler = (damage: number) => void;

/** Rod pivot offset from the enemy centre (front hand), in px. */
const HAND_OFFSET_X = 12;
const HAND_OFFSET_Y = -6;
/** Rod angles for a right-facing enemy, in radians (0 = horizontal forward). */
const ROD_REST_ANGLE = 0.38;
const ROD_RAISED_ANGLE = -2.05;
const ROD_FORWARD_ANGLE = 0.85;

export class MeleeEnemy extends Enemy {
  readonly aggroRadius: number;
  readonly aggroIndicatorColor = 0xf08b52;

  private readonly moveSpeed: number;
  private readonly contactDamage: number;
  private readonly contactDamageCooldown: number;
  private contactDamageReadyAt = 0;

  private readonly swing?: MeleeSwingConfig;
  private readonly damagePlayer?: PlayerDamageHandler;
  private readonly rod?: Phaser.GameObjects.Rectangle;
  private attackState: MeleeState = 'chase';
  private stateStartedAt = 0;
  private stateEndsAt = 0;
  private swingConnected = false;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    texture: string,
    config: MeleeEnemyConfig,
    damagePlayer?: PlayerDamageHandler,
  ) {
    super(scene, x, y, texture, config.health);

    this.aggroRadius = config.aggroRadius;
    this.moveSpeed = config.moveSpeed;
    this.contactDamage = config.contactDamage;
    this.contactDamageCooldown = config.contactDamageCooldown;
    this.swing = config.swing;
    this.damagePlayer = damagePlayer;

    if (this.swing) {
      this.rod = scene.add
        .rectangle(x, y, this.swing.rodLength, this.swing.rodThickness, this.swing.rodColor)
        .setOrigin(0.12, 0.5)
        .setDepth(this.depth);
      this.positionRod(ROD_REST_ANGLE);
    }
  }

  updateCombat(
    time: number,
    target: Phaser.Physics.Arcade.Sprite,
    _fireProjectile: EnemyProjectileAttack,
  ) {
    if (!this.active) {
      return false;
    }

    const distance = Phaser.Math.Distance.Between(
      this.x,
      this.y,
      target.x,
      target.y,
    );
    const targetInRange = distance <= this.aggroRadius;

    if (this.swing) {
      return this.updateSwingCombat(time, target, targetInRange);
    }

    // While staggered, let the knockback impulse carry it instead of
    // immediately resuming the chase.
    if (this.isStaggered(time)) {
      return targetInRange;
    }

    if (!targetInRange) {
      this.setVelocityX(0);
      return false;
    }

    const direction = Math.sign(target.x - this.x);
    this.setFlipX(direction < 0);
    this.setVelocityX(direction * this.moveSpeed);

    return true;
  }

  private updateSwingCombat(
    time: number,
    target: Phaser.Physics.Arcade.Sprite,
    targetInRange: boolean,
  ) {
    // A stagger interrupts the wind-up so a well-timed knockback-heavy shot
    // cancels the swing; the rod snaps back to rest.
    if (this.isStaggered(time)) {
      if (this.attackState !== 'chase') {
        this.attackState = 'chase';
      }
      this.positionRod(ROD_REST_ANGLE);
      return targetInRange;
    }

    switch (this.attackState) {
      case 'chase':
        this.updateChase(time, target, targetInRange);
        break;
      case 'windup':
        this.updateWindup(time);
        break;
      case 'swing':
        this.updateSwing(time, target);
        break;
      case 'recover':
        this.updateRecover(time);
        break;
    }

    return targetInRange;
  }

  private updateChase(
    time: number,
    target: Phaser.Physics.Arcade.Sprite,
    targetInRange: boolean,
  ) {
    this.positionRod(ROD_REST_ANGLE);

    if (!targetInRange) {
      this.setVelocityX(0);
      return;
    }

    const swing = this.swing!;
    const direction = Math.sign(target.x - this.x) || 1;
    this.setFlipX(direction < 0);

    const horizontalDistance = Math.abs(target.x - this.x);
    const withinHeight =
      Math.abs(target.y - this.y) <= swing.verticalTolerance;

    if (horizontalDistance <= swing.attackRange && withinHeight) {
      this.beginState('windup', time, swing.windupDuration);
      this.setVelocityX(0);
      return;
    }

    this.setVelocityX(direction * this.moveSpeed);
  }

  private updateWindup(time: number) {
    this.setVelocityX(0);
    // Raise the rod over the windup so the incoming swing is clearly telegraphed.
    this.positionRod(
      Phaser.Math.Linear(
        ROD_REST_ANGLE,
        ROD_RAISED_ANGLE,
        this.stateProgress(time),
      ),
    );

    if (time >= this.stateEndsAt) {
      this.beginState('swing', time, this.swing!.swingDuration);
      this.swingConnected = false;
    }
  }

  private updateSwing(time: number, target: Phaser.Physics.Arcade.Sprite) {
    this.setVelocityX(0);
    const progress = this.stateProgress(time);
    // Fast overhead chop: ease-out so the arc snaps down.
    this.positionRod(
      Phaser.Math.Linear(
        ROD_RAISED_ANGLE,
        ROD_FORWARD_ANGLE,
        1 - (1 - progress) * (1 - progress),
      ),
    );

    if (!this.swingConnected && this.swingHits(target)) {
      this.swingConnected = true;
      this.damagePlayer?.(this.swing!.damage);
    }

    if (time >= this.stateEndsAt) {
      this.beginState('recover', time, this.swing!.recoverDuration);
    }
  }

  private updateRecover(time: number) {
    this.setVelocityX(0);
    this.positionRod(
      Phaser.Math.Linear(
        ROD_FORWARD_ANGLE,
        ROD_REST_ANGLE,
        this.stateProgress(time),
      ),
    );

    if (time >= this.stateEndsAt) {
      this.attackState = 'chase';
    }
  }

  private swingHits(target: Phaser.Physics.Arcade.Sprite) {
    const swing = this.swing!;
    const facing = this.flipX ? -1 : 1;
    const dx = target.x - this.x;
    const onFacingSide = Math.sign(dx) === facing || Math.abs(dx) < 10;

    return (
      onFacingSide &&
      Math.abs(dx) <= swing.reach &&
      Math.abs(target.y - this.y) <= swing.verticalTolerance
    );
  }

  private positionRod(angleForRight: number) {
    if (!this.rod) {
      return;
    }

    const facing = this.flipX ? -1 : 1;
    this.rod.setPosition(this.x + facing * HAND_OFFSET_X, this.y + HAND_OFFSET_Y);
    // Mirror the angle when facing left so the rod stays on the front side.
    this.rod.setRotation(facing === 1 ? angleForRight : Math.PI - angleForRight);
    this.rod.setDepth(this.depth);
  }

  private beginState(state: MeleeState, time: number, duration: number) {
    this.attackState = state;
    this.stateStartedAt = time;
    this.stateEndsAt = time + duration;
  }

  private stateProgress(time: number) {
    if (this.stateEndsAt <= this.stateStartedAt) {
      return 1;
    }

    return Phaser.Math.Clamp(
      (time - this.stateStartedAt) / (this.stateEndsAt - this.stateStartedAt),
      0,
      1,
    );
  }

  protected override onDefeated() {
    super.onDefeated();
    this.rod?.destroy();
  }

  override destroy(fromScene?: boolean) {
    this.rod?.destroy();
    super.destroy(fromScene);
  }

  override tryContactAttack(time: number) {
    // Rod-swing enemies deal damage only through the swing, not on contact.
    if (this.swing || !this.active || time < this.contactDamageReadyAt) {
      return null;
    }

    this.contactDamageReadyAt = time + this.contactDamageCooldown;
    return this.contactDamage;
  }
}
