import Phaser from 'phaser';

export type EnemyCombatUpdate = {
  targetInRange: boolean;
  shouldFireProjectile: boolean;
};

export abstract class Enemy extends Phaser.Physics.Arcade.Sprite {
  abstract readonly aggroRadius: number;
  readonly maxHealth: number;

  private health: number;

  protected constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    texture: string,
    health: number,
  ) {
    super(scene, x, y, texture);

    this.health = health;
    this.maxHealth = health;

    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setCollideWorldBounds(true);
  }

  abstract updateCombat(
    time: number,
    target: Phaser.Physics.Arcade.Sprite,
  ): EnemyCombatUpdate;

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
