import Phaser from 'phaser';
import type {
  ChargeBossPatternConfig,
  ChargingBossCombatConfig,
} from '@/game/config/bossConfig';
import { BossEnemy } from '@/game/entities/BossEnemy';
import type { EnemyProjectileAttack } from '@/game/entities/Enemy';

export class ChargingBossEnemy extends BossEnemy<ChargeBossPatternConfig> {
  private nextChargeAt = 0;
  private chargeEndsAt = 0;
  private chargeDirection = 1;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    texture: string,
    config: ChargingBossCombatConfig,
  ) {
    super(scene, x, y, texture, config);

    if (config.pattern.aerial) {
      (this.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);
      this.setDepth(6);
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

    if (!targetInRange) {
      this.setVelocity(0, 0);
      this.clampAerialPosition();
      return false;
    }

    if (this.isStaggered(time)) {
      this.clampAerialPosition();
      return true;
    }

    if (time < this.chargeEndsAt) {
      this.setVelocity(
        this.chargeDirection * this.config.pattern.chargeSpeed,
        0,
      );
      this.clampAerialPosition();
      return true;
    }

    const direction = Math.sign(target.x - this.x) || this.chargeDirection;
    this.setFlipX(direction < 0);

    if (time >= this.nextChargeAt) {
      this.chargeDirection = direction;
      this.chargeEndsAt = time + this.config.pattern.chargeDuration;
      this.nextChargeAt = time + this.config.pattern.chargeInterval;
      this.setVelocity(direction * this.config.pattern.chargeSpeed, 0);
      this.clampAerialPosition();
      return true;
    }

    const healthRatio = this.currentHealth / this.maxHealth;
    const moveSpeed =
      healthRatio <= this.config.pattern.enrageHealthRatio
        ? this.config.pattern.enragedMoveSpeed
        : this.config.pattern.moveSpeed;
    this.setVelocityX(direction * moveSpeed);
    this.updateAerialHeight(target);
    this.clampAerialPosition();
    return true;
  }

  private updateAerialHeight(target: Phaser.Physics.Arcade.Sprite) {
    const aerial = this.config.pattern.aerial;
    if (!aerial) {
      return;
    }

    const targetY = Phaser.Math.Clamp(target.y, aerial.minY, aerial.maxY);
    this.setVelocityY(
      Phaser.Math.Clamp(
        (targetY - this.y) * 3,
        -aerial.verticalTrackSpeed,
        aerial.verticalTrackSpeed,
      ),
    );
  }

  private clampAerialPosition() {
    const aerial = this.config.pattern.aerial;
    if (!aerial) {
      return;
    }

    this.setY(Phaser.Math.Clamp(this.y, aerial.minY, aerial.maxY));
  }
}
