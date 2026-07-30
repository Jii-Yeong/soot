import Phaser from 'phaser';
import type {
  HoundBossPatternConfig,
  HoundBossCombatConfig,
} from '@/game/config/bossConfig';
import { isPointInsideCone } from '@/game/combat/coneGeometry';
import { BossEnemy } from '@/game/entities/BossEnemy';
import type { EnemyProjectileAttack } from '@/game/entities/Enemy';
import { SearchlightCone } from '@/game/systems/SearchlightCone';

type HoundState = 'recover' | 'scanning' | 'locking';

type PlayerDamageHandler = (damage: number) => void;

type Point = { x: number; y: number };

const ORB_LIFETIME = 2600;
const ORB_DEPTH = 10;

/**
 * Stage-2 boss (the searchlight hound). It sweeps a wide red detection fan
 * toward the player and down across the ground; the instant the player is
 * caught inside it the hound locks on (the fan flares) and lobs a round energy
 * orb along the line of sight. No hitscan beam — deliberately unlike the city
 * warden's laser cannon.
 */
export class HoundBossEnemy extends BossEnemy<HoundBossPatternConfig> {
  private readonly cone: SearchlightCone;
  private attackState: HoundState = 'recover';
  private stateStartedAt = 0;
  private stateEndsAt: number;
  private centerAngle = 0;
  private readonly orbCleanups = new Set<() => void>();

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    texture: string,
    config: HoundBossCombatConfig,
    private readonly damagePlayer: PlayerDamageHandler,
  ) {
    super(scene, x, y, texture, config);

    this.stateEndsAt = scene.time.now + config.pattern.firstAttackDelay;
    this.cone = new SearchlightCone(scene, config.pattern.cone.color);
  }

  updateCombat(
    time: number,
    target: Phaser.Physics.Arcade.Sprite,
    _fireProjectile: EnemyProjectileAttack,
  ) {
    if (!this.active) {
      this.cone.hide();
      return false;
    }

    const targetInRange =
      Phaser.Math.Distance.Between(this.x, this.y, target.x, target.y) <=
      this.aggroRadius;
    if (!targetInRange) {
      this.setVelocityX(0);
      this.cone.hide();
      return false;
    }

    switch (this.attackState) {
      case 'recover':
        this.updateRecover(time, target);
        break;
      case 'scanning':
        this.updateScanning(time, target);
        break;
      case 'locking':
        this.updateLocking(time, target);
        break;
    }

    return true;
  }

  protected override onDefeated() {
    super.onDefeated();
    this.cone.hide();
    this.clearOrbs();
  }

  override destroy(fromScene?: boolean) {
    this.cone.destroy();
    this.clearOrbs();
    super.destroy(fromScene);
  }

  private updateRecover(time: number, target: Phaser.Physics.Arcade.Sprite) {
    this.cone.hide();
    this.moveToPreferredDistance(time, target);

    if (time >= this.stateEndsAt) {
      this.attackState = 'scanning';
    }
  }

  private updateScanning(time: number, target: Phaser.Physics.Arcade.Sprite) {
    this.moveToPreferredDistance(time, target);
    this.aimConeAt(target);
    this.cone.draw(
      this.coneApex(),
      this.centerAngle,
      this.coneHalfAngle(),
      this.pattern.cone.range,
      0.15,
    );

    if (this.playerInCone(target)) {
      this.attackState = 'locking';
      this.stateStartedAt = time;
      this.stateEndsAt = time + this.lockDuration;
    }
  }

  private updateLocking(time: number, target: Phaser.Physics.Arcade.Sprite) {
    // Commit: stop moving and keep the fan trained on the player as it flares.
    this.setVelocityX(0);
    this.aimConeAt(target);
    this.cone.draw(
      this.coneApex(),
      this.centerAngle,
      this.coneHalfAngle(),
      this.pattern.cone.range,
      0.15 + 0.85 * this.stateProgress(time),
    );

    if (time >= this.stateEndsAt) {
      this.fireOrb(target);
      this.beginRecover(time);
    }
  }

  private beginRecover(time: number) {
    this.attackState = 'recover';
    this.stateEndsAt =
      time +
      (this.isEnraged
        ? this.pattern.enragedRecoveryDuration
        : this.pattern.recoveryDuration);
    this.cone.hide();
  }

  private fireOrb(target: Phaser.Physics.Arcade.Sprite) {
    const apex = this.coneApex();
    const angle = Phaser.Math.Angle.Between(apex.x, apex.y, target.x, target.y);
    const { radius, color, speed, damage } = this.pattern.orb;

    const orb = this.scene.add
      .circle(apex.x, apex.y, radius, color, 0.95)
      .setStrokeStyle(3, 0xffe4de, 0.9)
      .setDepth(ORB_DEPTH);
    this.scene.physics.add.existing(orb);
    const body = orb.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(false);
    body.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);

    let cleaned = false;
    const cleanup = () => {
      if (cleaned) {
        return;
      }
      cleaned = true;
      this.scene.physics.world.removeCollider(overlap);
      timer.remove(false);
      this.orbCleanups.delete(cleanup);
      orb.destroy();
    };
    const overlap = this.scene.physics.add.overlap(orb, target, () => {
      this.damagePlayer(damage);
      cleanup();
    });
    const timer = this.scene.time.delayedCall(ORB_LIFETIME, cleanup);
    this.orbCleanups.add(cleanup);
  }

  private clearOrbs() {
    // Snapshot: each cleanup removes itself from the set as it runs.
    for (const cleanup of Array.from(this.orbCleanups)) {
      cleanup();
    }
  }

  private moveToPreferredDistance(
    time: number,
    target: Phaser.Physics.Arcade.Sprite,
  ) {
    if (this.isStaggered(time)) {
      return;
    }

    const horizontalDistance = Math.abs(target.x - this.x);
    const directionToTarget = Math.sign(target.x - this.x) || 1;
    this.setFlipX(directionToTarget < 0);

    const speed = this.isEnraged
      ? this.pattern.enragedMoveSpeed
      : this.pattern.moveSpeed;

    if (
      horizontalDistance >
      this.pattern.preferredDistance + this.pattern.distanceTolerance
    ) {
      this.setVelocityX(directionToTarget * speed);
      return;
    }

    if (
      horizontalDistance <
      this.pattern.preferredDistance - this.pattern.distanceTolerance
    ) {
      this.setVelocityX(-directionToTarget * speed);
      return;
    }

    this.setVelocityX(0);
  }

  private aimConeAt(target: Phaser.Physics.Arcade.Sprite) {
    const apex = this.coneApex();
    const base = Phaser.Math.Angle.Between(apex.x, apex.y, target.x, target.y);
    const tilt = Phaser.Math.DegToRad(this.pattern.cone.tiltDegrees);
    // Lean the fan downward whichever way it faces, so it always rakes the floor.
    const facingRight = Math.cos(base) >= 0;
    this.centerAngle = base + (facingRight ? tilt : -tilt);
    this.setFlipX(!facingRight);
  }

  private playerInCone(target: Phaser.Physics.Arcade.Sprite) {
    const body = target.body as Phaser.Physics.Arcade.Body | null;
    const point = body?.center ?? target;
    const targetRadius = body ? Math.max(body.width, body.height) * 0.35 : 24;

    return isPointInsideCone(
      this.coneApex(),
      this.centerAngle,
      this.coneHalfAngle(),
      this.pattern.cone.range,
      point,
      targetRadius,
    );
  }

  private coneApex(): Point {
    return { x: this.x, y: this.y + this.pattern.cone.apexOffsetY };
  }

  private coneHalfAngle() {
    return Phaser.Math.DegToRad(this.pattern.cone.halfAngleDegrees);
  }

  private get lockDuration() {
    return this.isEnraged
      ? this.pattern.orb.enragedLockDuration
      : this.pattern.orb.lockDuration;
  }

  private stateProgress(time: number) {
    return Phaser.Math.Clamp(
      (time - this.stateStartedAt) / (this.stateEndsAt - this.stateStartedAt),
      0,
      1,
    );
  }

  private get isEnraged() {
    return (
      this.currentHealth / this.maxHealth <= this.pattern.enrageHealthRatio
    );
  }

  private get pattern() {
    return this.config.pattern;
  }
}
