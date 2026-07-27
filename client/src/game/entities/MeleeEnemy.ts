import Phaser from 'phaser';
import { Enemy, type EnemyCombatUpdate } from '@/game/entities/Enemy';

export type MeleeEnemyConfig = {
  health: number;
  aggroRadius: number;
  moveSpeed: number;
  contactDamageCooldown: number;
};

export class MeleeEnemy extends Enemy {
  readonly aggroRadius: number;

  private readonly moveSpeed: number;
  private readonly contactDamageCooldown: number;
  private contactDamageReadyAt = 0;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    texture: string,
    config: MeleeEnemyConfig,
  ) {
    super(scene, x, y, texture, config.health);

    this.aggroRadius = config.aggroRadius;
    this.moveSpeed = config.moveSpeed;
    this.contactDamageCooldown = config.contactDamageCooldown;
  }

  updateCombat(
    _time: number,
    target: Phaser.Physics.Arcade.Sprite,
  ): EnemyCombatUpdate {
    if (!this.active) {
      return { targetInRange: false, shouldFireProjectile: false };
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
      return { targetInRange, shouldFireProjectile: false };
    }

    const direction = Math.sign(target.x - this.x);
    this.setFlipX(direction < 0);
    this.setVelocityX(direction * this.moveSpeed);

    return { targetInRange, shouldFireProjectile: false };
  }

  tryContactDamage(time: number) {
    if (!this.active || time < this.contactDamageReadyAt) {
      return false;
    }

    this.contactDamageReadyAt = time + this.contactDamageCooldown;
    return true;
  }
}
