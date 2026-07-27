import Phaser from 'phaser';
import { Enemy, type EnemyProjectileAttack } from '@/game/entities/Enemy';

export type RangedEnemyConfig = {
  health: number;
  aggroRadius: number;
  fireInterval: number;
  muzzleOffset: number;
};

export class RangedEnemy extends Enemy {
  readonly aggroRadius: number;
  readonly aggroIndicatorColor = 0xff5263;
  readonly projectile: { kind: 'ranged'; muzzleOffset: number };

  private readonly fireInterval: number;

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
    this.projectile = { kind: 'ranged', muzzleOffset: config.muzzleOffset };
  }

  updateCombat(
    time: number,
    target: Phaser.Physics.Arcade.Sprite,
    fireProjectile: EnemyProjectileAttack,
  ) {
    if (!this.active) {
      return false;
    }

    return this.updateRangedAttack(time, target, fireProjectile, this.fireInterval);
  }
}
