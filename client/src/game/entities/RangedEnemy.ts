import Phaser from 'phaser';
import { Enemy, type EnemyCombatUpdate } from '@/game/entities/Enemy';

export type RangedEnemyConfig = {
  health: number;
  aggroRadius: number;
  fireInterval: number;
};

export class RangedEnemy extends Enemy {
  readonly aggroRadius: number;
  readonly fireInterval: number;

  private nextFireAt = 0;

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
  }

  updateCombat(
    time: number,
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

    this.setFlipX(target.x < this.x);

    if (targetInRange && time >= this.nextFireAt) {
      this.nextFireAt = time + this.fireInterval;
      return { targetInRange, shouldFireProjectile: true };
    }

    return { targetInRange, shouldFireProjectile: false };
  }
}
