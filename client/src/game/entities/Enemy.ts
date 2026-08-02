import Phaser from 'phaser';

export type EnemyProjectileAttack = (
  enemy: Enemy,
  target: Phaser.Physics.Arcade.Sprite,
) => void;

export type EnemyProjectileKind = 'ranged' | 'flying';

export type EnemyProjectileProfile = {
  kind: EnemyProjectileKind;
  muzzleOffset: number;
};

export abstract class Enemy extends Phaser.Physics.Arcade.Sprite {
  abstract readonly aggroRadius: number;
  abstract readonly aggroIndicatorColor: number;
  /** Whether this enemy uses the shared white damage flash. */
  readonly usesHitFlash: boolean = true;
  /** Opacity used while the white fill tint is visible. */
  readonly hitFlashAlpha: number = 1;
  readonly maxHealth: number;
  /** Set by ranged-style subclasses so GameScene can route fire without an instanceof check. */
  readonly projectile: EnemyProjectileProfile | null = null;

  private health: number;
  private nextFireAt = 0;
  private staggeredUntil = 0;

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
    // Lets a knockback impulse decay to rest instead of sliding forever;
    // enemies that drive their own velocity each frame overwrite it anyway.
    this.setDragX(520);
  }

  /**
   * Shoves the enemy along `angle` and briefly stuns it so its own movement
   * doesn't immediately cancel the push. A grounded enemy also pops upward a
   * little so the hit reads.
   */
  applyKnockback(angle: number, force: number, time: number, durationMs = 160) {
    if (!this.active || force <= 0) {
      return;
    }

    this.setVelocity(Math.cos(angle) * force, -Math.abs(force) * 0.18);
    this.staggeredUntil = time + durationMs;
  }

  isStaggered(time: number) {
    return time < this.staggeredUntil;
  }

  abstract updateCombat(
    time: number,
    target: Phaser.Physics.Arcade.Sprite,
    fireProjectile: EnemyProjectileAttack,
  ): boolean;

  tryContactAttack(_time: number): number | null {
    return null;
  }

  defeat() {
    if (!this.active) {
      return;
    }

    this.onDefeated();
    this.disableBody(true, true);
  }

  protected onDefeated() {
    this.setVelocity(0);
  }

  /**
   * Shared "face the target, fire on cooldown when in range" behavior for
   * ranged-style enemies. Returns whether the target is within aggro range.
   */
  protected updateRangedAttack(
    time: number,
    target: Phaser.Physics.Arcade.Sprite,
    fireProjectile: EnemyProjectileAttack,
    fireInterval: number,
  ): boolean {
    const targetInRange =
      Phaser.Math.Distance.Between(this.x, this.y, target.x, target.y) <=
      this.aggroRadius;

    this.setFlipX(target.x < this.x);

    if (targetInRange && !this.isStaggered(time) && time >= this.nextFireAt) {
      fireProjectile(this, target);
      this.nextFireAt = time + fireInterval;
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
