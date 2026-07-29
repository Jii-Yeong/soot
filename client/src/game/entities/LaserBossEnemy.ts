import Phaser from 'phaser';
import type {
  BossCombatConfig,
  LaserCannonPatternConfig,
} from '@/game/config/bossConfig';
import { isPointInsideLaser } from '@/game/combat/laserGeometry';
import {
  getLaserChargeWindow,
  getLaserPatternTuning,
} from '@/game/combat/laserPattern';
import { BossEnemy } from '@/game/entities/BossEnemy';
import type { EnemyProjectileAttack } from '@/game/entities/Enemy';
import { LaserCannonEffects } from '@/game/systems/LaserCannonEffects';

type LaserState = 'repositioning' | 'charging' | 'firing';
type PlayerDamageHandler = (damage: number) => void;

export class LaserBossEnemy extends BossEnemy {
  private readonly effects: LaserCannonEffects;
  private attackState: LaserState = 'repositioning';
  private stateEndsAt: number;
  private chargeStartedAt = 0;
  private aimLocksAt = 0;
  private aimAngle = 0;
  private shotsRemaining = 0;
  private laserHit = false;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    texture: string,
    config: BossCombatConfig,
    private readonly pattern: LaserCannonPatternConfig,
    private readonly damagePlayer: PlayerDamageHandler,
  ) {
    super(scene, x, y, texture, config);

    this.stateEndsAt = scene.time.now + pattern.firstAttackDelay;
    this.effects = new LaserCannonEffects(scene, pattern);
  }

  updateCombat(
    time: number,
    target: Phaser.Physics.Arcade.Sprite,
    _fireProjectile: EnemyProjectileAttack,
  ) {
    if (!this.active) {
      this.effects.hideAll();
      return false;
    }

    const targetInRange =
      Phaser.Math.Distance.Between(this.x, this.y, target.x, target.y) <=
      this.aggroRadius;
    if (!targetInRange) {
      this.setVelocityX(0);
      this.effects.hideAll();
      return false;
    }

    switch (this.attackState) {
      case 'repositioning':
        this.updateRepositioning(time, target);
        break;
      case 'charging':
        this.updateCharging(time, target);
        break;
      case 'firing':
        this.updateFiring(time, target);
        break;
    }

    return true;
  }

  override onDefeated() {
    super.onDefeated();
    this.effects.hideAll();
  }

  override destroy(fromScene?: boolean) {
    this.effects.destroy();
    super.destroy(fromScene);
  }

  private updateRepositioning(
    time: number,
    target: Phaser.Physics.Arcade.Sprite,
  ) {
    this.effects.hideAll();
    this.moveToPreferredDistance(time, target);

    if (time >= this.stateEndsAt) {
      this.shotsRemaining = this.tuning.volleySize;
      this.beginCharge(time, target, false);
    }
  }

  private updateCharging(
    time: number,
    target: Phaser.Physics.Arcade.Sprite,
  ) {
    this.setVelocityX(0);

    if (time < this.aimLocksAt) {
      this.aimAngle = Phaser.Math.Angle.Between(
        this.x,
        this.y + this.pattern.muzzleOffsetY,
        target.x,
        target.y,
      );
    }
    this.setFlipX(Math.cos(this.aimAngle) < 0);
    this.effects.drawTelegraph(
      this.getMuzzlePosition(),
      this.aimAngle,
      this.getChargeProgress(time),
    );

    if (time >= this.stateEndsAt) {
      this.beginFiring(time);
    }
  }

  private updateFiring(
    time: number,
    target: Phaser.Physics.Arcade.Sprite,
  ) {
    this.setVelocityX(0);
    const muzzle = this.getMuzzlePosition();
    this.effects.updateBeam(muzzle, this.aimAngle);

    if (!this.laserHit && this.isTargetInsideBeam(target, muzzle)) {
      this.laserHit = true;
      this.damagePlayer(this.pattern.damage);
    }

    if (time < this.stateEndsAt) {
      return;
    }

    this.effects.hideBeam();
    if (this.shotsRemaining > 0) {
      this.beginCharge(time, target, true);
      return;
    }

    this.attackState = 'repositioning';
    this.stateEndsAt = time + this.tuning.recoveryDuration;
  }

  private beginCharge(
    time: number,
    target: Phaser.Physics.Arcade.Sprite,
    followUp: boolean,
  ) {
    const { duration, aimLockDuration } = getLaserChargeWindow(
      this.pattern,
      this.isEnraged,
      followUp,
    );

    this.attackState = 'charging';
    this.chargeStartedAt = time;
    this.stateEndsAt = time + duration;
    this.aimLocksAt = this.stateEndsAt - aimLockDuration;
    this.aimAngle = Phaser.Math.Angle.Between(
      this.x,
      this.y + this.pattern.muzzleOffsetY,
      target.x,
      target.y,
    );
    this.effects.hideBeam();
  }

  private beginFiring(time: number) {
    this.attackState = 'firing';
    this.stateEndsAt = time + this.pattern.fireDuration;
    this.shotsRemaining -= 1;
    this.laserHit = false;
    this.effects.showBeam(this.getMuzzlePosition(), this.aimAngle);
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

    if (
      horizontalDistance >
      this.pattern.preferredDistance + this.pattern.distanceTolerance
    ) {
      this.setVelocityX(directionToTarget * this.tuning.moveSpeed);
      return;
    }

    if (
      horizontalDistance <
      this.pattern.preferredDistance - this.pattern.distanceTolerance
    ) {
      this.setVelocityX(-directionToTarget * this.tuning.moveSpeed);
      return;
    }

    this.setVelocityX(0);
  }

  private getChargeProgress(time: number) {
    return Phaser.Math.Clamp(
      (time - this.chargeStartedAt) /
        (this.stateEndsAt - this.chargeStartedAt),
      0,
      1,
    );
  }

  private getMuzzlePosition() {
    return {
      x: this.x + Math.cos(this.aimAngle) * this.pattern.muzzleOffset,
      y:
        this.y +
        this.pattern.muzzleOffsetY +
        Math.sin(this.aimAngle) * this.pattern.muzzleOffset,
    };
  }

  private isTargetInsideBeam(
    target: Phaser.Physics.Arcade.Sprite,
    muzzle: { x: number; y: number },
  ) {
    const body = target.body as Phaser.Physics.Arcade.Body | null;
    const point = body?.center ?? target;
    const targetRadius = body
      ? Math.max(body.width, body.height) * 0.35
      : 24;

    return isPointInsideLaser(
      muzzle,
      this.aimAngle,
      this.pattern.range,
      this.pattern.width,
      point,
      targetRadius,
    );
  }

  private get isEnraged() {
    return (
      this.currentHealth / this.maxHealth <= this.pattern.enrageHealthRatio
    );
  }

  private get tuning() {
    return getLaserPatternTuning(this.pattern, this.isEnraged);
  }
}
