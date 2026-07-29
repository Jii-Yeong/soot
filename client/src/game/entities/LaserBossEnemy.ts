import Phaser from 'phaser';
import type {
  LaserCannonPatternConfig,
  LaserBossCombatConfig,
} from '@/game/config/bossConfig';
import { isPointInsideLaser } from '@/game/combat/laserGeometry';
import { LaserAttackCycle } from '@/game/combat/LaserAttackCycle';
import { getLaserPatternTuning } from '@/game/combat/laserPattern';
import { BossEnemy } from '@/game/entities/BossEnemy';
import type { EnemyProjectileAttack } from '@/game/entities/Enemy';
import { BeamEffects } from '@/game/systems/BeamEffects';

type PlayerDamageHandler = (damage: number) => void;

export class LaserBossEnemy extends BossEnemy<LaserCannonPatternConfig> {
  private readonly effects: BeamEffects;
  private readonly attackCycle: LaserAttackCycle;
  private aimAngle = 0;
  private laserHit = false;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    texture: string,
    config: LaserBossCombatConfig,
    private readonly damagePlayer: PlayerDamageHandler,
  ) {
    super(scene, x, y, texture, config);

    this.attackCycle = new LaserAttackCycle(config.pattern, scene.time.now);
    this.effects = new BeamEffects(scene, config.pattern);
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

    switch (this.attackCycle.state) {
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

  protected override onDefeated() {
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

    if (this.attackCycle.isComplete(time)) {
      this.attackCycle.beginVolley(time, this.isEnraged);
      this.lockAimOn(target);
    }
  }

  private updateCharging(
    time: number,
    target: Phaser.Physics.Arcade.Sprite,
  ) {
    this.setVelocityX(0);

    if (this.attackCycle.shouldTrackAim(time)) {
      this.lockAimOn(target);
    }
    this.setFlipX(Math.cos(this.aimAngle) < 0);
    this.effects.drawTelegraph(
      this.getMuzzlePosition(),
      this.aimAngle,
      this.attackCycle.getChargeProgress(time),
    );

    if (this.attackCycle.isComplete(time)) {
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

    if (!this.attackCycle.isComplete(time)) {
      return;
    }

    this.effects.hideBeam();
    if (this.attackCycle.finishFiring(time, this.isEnraged)) {
      this.lockAimOn(target);
    }
  }

  private beginFiring(time: number) {
    this.attackCycle.beginFiring(time);
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

  private lockAimOn(target: Phaser.Physics.Arcade.Sprite) {
    this.aimAngle = Phaser.Math.Angle.Between(
      this.x,
      this.y + this.pattern.muzzleOffsetY,
      target.x,
      target.y,
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

  private get pattern() {
    return this.config.pattern;
  }
}
