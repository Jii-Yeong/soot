import Phaser from 'phaser';
import type {
  BossCombatConfig,
  ChargeBossPatternConfig,
} from '@/game/config/bossConfig';
import { BossEnemy } from '@/game/entities/BossEnemy';
import type { EnemyProjectileAttack } from '@/game/entities/Enemy';

export class ChargingBossEnemy extends BossEnemy {
  private nextChargeAt = 0;
  private chargeEndsAt = 0;
  private chargeDirection = 1;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    texture: string,
    config: BossCombatConfig,
    private readonly pattern: ChargeBossPatternConfig,
  ) {
    super(scene, x, y, texture, config);
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
      this.setVelocityX(this.chargeDirection * this.pattern.chargeSpeed);
      return true;
    }

    const direction = Math.sign(target.x - this.x) || this.chargeDirection;
    this.setFlipX(direction < 0);

    if (time >= this.nextChargeAt) {
      this.chargeDirection = direction;
      this.chargeEndsAt = time + this.pattern.chargeDuration;
      this.nextChargeAt = time + this.pattern.chargeInterval;
      this.setVelocityX(direction * this.pattern.chargeSpeed);
      return true;
    }

    const healthRatio = this.currentHealth / this.maxHealth;
    const moveSpeed =
      healthRatio <= this.pattern.enrageHealthRatio
        ? this.pattern.enragedMoveSpeed
        : this.pattern.moveSpeed;
    this.setVelocityX(direction * moveSpeed);
    return true;
  }
}
