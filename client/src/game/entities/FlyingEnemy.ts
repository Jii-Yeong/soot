import Phaser from 'phaser';
import { Enemy, type EnemyProjectileAttack } from '@/game/entities/Enemy';

export type FlyingEnemyConfig = {
  health: number;
  aggroRadius: number;
  hoverY: number;
  trackSpeed: number;
  fireInterval: number;
  muzzleOffset: number;
};

export class FlyingEnemy extends Enemy {
  readonly aggroRadius: number;
  readonly aggroIndicatorColor = 0xb884ff;
  readonly projectile: { kind: 'flying'; muzzleOffset: number };

  private readonly hoverY: number;
  private readonly trackSpeed: number;
  private readonly fireInterval: number;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    texture: string,
    config: FlyingEnemyConfig,
  ) {
    super(scene, x, y, texture, config.health);

    this.aggroRadius = config.aggroRadius;
    this.hoverY = config.hoverY;
    this.trackSpeed = config.trackSpeed;
    this.fireInterval = config.fireInterval;
    this.projectile = { kind: 'flying', muzzleOffset: config.muzzleOffset };

    (this.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);
  }

  updateCombat(
    time: number,
    target: Phaser.Physics.Arcade.Sprite,
    fireProjectile: EnemyProjectileAttack,
  ) {
    if (!this.active) {
      return false;
    }

    const targetInRange = this.updateRangedAttack(
      time,
      target,
      fireProjectile,
      this.fireInterval,
    );

    // While staggered, let the knockback push it before hover control resumes.
    if (this.isStaggered(time)) {
      return targetInRange;
    }

    const horizontalDirection = Math.sign(target.x - this.x);
    this.setVelocityX(targetInRange ? horizontalDirection * this.trackSpeed : 0);

    const verticalOffset = this.hoverY - this.y;
    this.setVelocityY(
      Phaser.Math.Clamp(verticalOffset * 4, -this.trackSpeed, this.trackSpeed),
    );

    return targetInRange;
  }
}
