import Phaser from 'phaser';

export type RangedEnemyConfig = {
  health: number;
  aggroRadius: number;
  fireInterval: number;
};

export class RangedEnemy extends Phaser.Physics.Arcade.Sprite {
  readonly aggroRadius: number;
  readonly fireInterval: number;
  readonly maxHealth: number;

  private health: number;
  private nextFireAt = 0;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    texture: string,
    config: RangedEnemyConfig,
  ) {
    super(scene, x, y, texture);

    this.health = config.health;
    this.maxHealth = config.health;
    this.aggroRadius = config.aggroRadius;
    this.fireInterval = config.fireInterval;

    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setCollideWorldBounds(true);
  }

  updateCombat(
    time: number,
    target: Phaser.Physics.Arcade.Sprite,
    fire: (enemy: RangedEnemy, target: Phaser.Physics.Arcade.Sprite) => void,
  ) {
    if (!this.active) {
      return false;
    }

    const distance = Phaser.Math.Distance.Between(this.x, this.y, target.x, target.y);
    const targetInRange = distance <= this.aggroRadius;

    this.setFlipX(target.x < this.x);

    if (targetInRange && time >= this.nextFireAt) {
      fire(this, target);
      this.nextFireAt = time + this.fireInterval;
    }

    return targetInRange;
  }

  takeDamage(amount: number) {
    if (!this.active) {
      return false;
    }

    this.health = Math.max(0, this.health - amount);
    return this.health === 0;
  }

  get currentHealth() {
    return this.health;
  }
}
