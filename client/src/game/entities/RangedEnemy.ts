import Phaser from 'phaser';
import type { RangedSpriteConfig } from '@/game/config/rangedEnemyAnimationConfig';
import {
  Enemy,
  ENEMY_DEPTH,
  type EnemyProjectileAttack,
} from '@/game/entities/Enemy';
import { GroundedEnemySprite } from '@/game/systems/GroundedEnemySprite';

export type RangedEnemyConfig = {
  health: number;
  aggroRadius: number;
  fireInterval: number;
  muzzleOffset: number;
  moveSpeed: number;
  preferredDistance: number;
  distanceTolerance: number;
  sprite?: RangedSpriteConfig;
};

/** How long the attack pose holds after a shot before returning to idle. */
const ATTACK_POSE_MS = 220;

export class RangedEnemy extends Enemy {
  readonly aggroRadius: number;
  readonly aggroIndicatorColor = 0xff5263;
  readonly projectile: { kind: 'ranged'; muzzleOffset: number };

  private readonly fireInterval: number;
  private readonly moveSpeed: number;
  private readonly preferredDistance: number;
  private readonly distanceTolerance: number;
  private readonly sprite?: RangedSpriteConfig;
  private readonly rig?: GroundedEnemySprite;
  private attackPoseUntil = 0;
  private dying = false;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    texture: string,
    config: RangedEnemyConfig,
  ) {
    super(scene, x, y, texture, config.health);

    this.aggroRadius = config.aggroRadius;
    this.fireInterval = config.fireInterval;
    this.moveSpeed = config.moveSpeed;
    this.preferredDistance = config.preferredDistance;
    this.distanceTolerance = config.distanceTolerance;
    this.projectile = { kind: 'ranged', muzzleOffset: config.muzzleOffset };
    this.sprite = config.sprite;
    // Render in front of terrain platforms, under the player.
    this.setDepth(ENEMY_DEPTH);
    if (this.sprite) {
      this.rig = new GroundedEnemySprite(this, this.sprite);
      this.rig.apply();
    }
  }

  updateCombat(
    time: number,
    target: Phaser.Physics.Arcade.Sprite,
    fireProjectile: EnemyProjectileAttack,
  ) {
    if (!this.active || this.dying) {
      return false;
    }

    const targetInRange = this.updateRangedAttack(
      time,
      target,
      fireProjectile,
      this.fireInterval,
    );

    const moving = this.updatePositioning(time, target, targetInRange);

    // Attack pose wins briefly after a shot; otherwise walk while repositioning
    // or idle when holding at the preferred gap.
    if (this.sprite && time >= this.attackPoseUntil) {
      this.rig?.play(
        moving ? this.sprite.animations.walk : this.sprite.animations.idle,
      );
    }

    return targetInRange;
  }

  /**
   * Holds a preferred firing gap (still facing/firing at the player): advances
   * when the player is too far, backpedals when they close in.
   */
  private updatePositioning(
    time: number,
    target: Phaser.Physics.Arcade.Sprite,
    targetInRange: boolean,
  ) {
    if (this.isStaggered(time) || !targetInRange) {
      this.setVelocityX(0);
      return false;
    }

    const distance = Math.abs(target.x - this.x);
    const directionToTarget = Math.sign(target.x - this.x) || 1;

    if (distance > this.preferredDistance + this.distanceTolerance) {
      this.setVelocityX(directionToTarget * this.moveSpeed);
      return true;
    }

    if (distance < this.preferredDistance - this.distanceTolerance) {
      this.setVelocityX(-directionToTarget * this.moveSpeed);
      return true;
    }

    this.setVelocityX(0);
    return false;
  }

  protected override onRangedFire(time: number) {
    if (!this.sprite) {
      return;
    }

    this.attackPoseUntil = time + ATTACK_POSE_MS;
    this.rig?.play(this.sprite.animations.attack);
  }

  override get playsOwnDeathAnimation() {
    return Boolean(this.sprite);
  }

  override defeat() {
    if (!this.active || !this.rig) {
      super.defeat();
      return;
    }

    this.dying = true;
    this.onDefeated();
    this.rig.playDeath(() => this.disableBody(true, true));
  }
}
