import Phaser from 'phaser';
import type { BossCombatConfig } from '@/game/config/bossConfig';
import { Enemy, type EnemyProjectileAttack } from '@/game/entities/Enemy';

export class BossEnemy extends Enemy {
  readonly aggroRadius: number;
  readonly aggroIndicatorColor: number;

  private readonly config: BossCombatConfig;
  private contactDamageReadyAt = 0;
  private nextChargeAt = 0;
  private chargeEndsAt = 0;
  private chargeDirection = 1;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    texture: string,
    config: BossCombatConfig,
  ) {
    super(scene, x, y, texture, config.maxHealth);

    this.config = config;
    this.aggroRadius = config.aggroRadius;
    this.aggroIndicatorColor = config.aggroIndicatorColor;
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

    if (!targetInRange) {
      this.setVelocityX(0);
      return false;
    }

    if (this.isStaggered(time)) {
      return true;
    }

    if (time < this.chargeEndsAt) {
      this.setVelocityX(this.chargeDirection * this.config.chargeSpeed);
      return true;
    }

    const direction = Math.sign(target.x - this.x) || this.chargeDirection;
    this.setFlipX(direction < 0);

    if (time >= this.nextChargeAt) {
      this.chargeDirection = direction;
      this.chargeEndsAt = time + this.config.chargeDuration;
      this.nextChargeAt = time + this.config.chargeInterval;
      this.setVelocityX(direction * this.config.chargeSpeed);
      return true;
    }

    const healthRatio = this.currentHealth / this.maxHealth;
    const moveSpeed =
      healthRatio <= this.config.enrageHealthRatio
        ? this.config.enragedMoveSpeed
        : this.config.moveSpeed;
    this.setVelocityX(direction * moveSpeed);
    return true;
  }

  override tryContactAttack(time: number) {
    if (!this.active || time < this.contactDamageReadyAt) {
      return null;
    }

    this.contactDamageReadyAt = time + this.config.contactDamageCooldown;
    return this.config.contactDamage;
  }

  override applyKnockback(
    angle: number,
    force: number,
    time: number,
    durationMs = 160,
  ) {
    super.applyKnockback(angle, force * 0.18, time, durationMs * 0.5);
  }
}
