import Phaser from 'phaser';
import { Enemy, type EnemyProjectileAttack } from '@/game/entities/Enemy';

export type MeleeEnemyConfig = {
  health: number;
  aggroRadius: number;
  moveSpeed: number;
  contactDamage: number;
  contactDamageCooldown: number;
  /** Where it may pace while unaware. Absent means there is no room to. */
  patrol?: { left: number; right: number; speed: number };
};

export class MeleeEnemy extends Enemy {
  readonly aggroRadius: number;
  readonly aggroIndicatorColor = 0xf08b52;

  private readonly moveSpeed: number;
  private readonly contactDamage: number;
  private readonly contactDamageCooldown: number;
  private readonly patrol?: MeleeEnemyConfig['patrol'];
  private patrolHeading: -1 | 1;
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
    this.contactDamage = config.contactDamage;
    this.contactDamageCooldown = config.contactDamageCooldown;
    this.patrol = config.patrol;
    // Set off toward the longer half of its beat, so a patrol that was cut
    // short on one side by a pit does not open by turning around.
    this.patrolHeading =
      this.patrol && x - this.patrol.left > this.patrol.right - x ? -1 : 1;
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

    // While staggered, let the knockback impulse carry it instead of
    // immediately resuming the chase.
    if (this.isStaggered(time)) {
      return targetInRange;
    }

    if (!targetInRange) {
      this.patrolStep();
      return false;
    }

    const direction = Math.sign(target.x - this.x);
    this.setFlipX(direction < 0);
    this.setVelocityX(direction * this.moveSpeed);

    return true;
  }

  /**
   * The beat it walks while nothing is in range. The turn is taken on reaching
   * an end rather than on a timer, so an enemy knocked or chased outside its
   * span walks back into it instead of pacing wherever it was left.
   */
  private patrolStep() {
    if (!this.patrol) {
      this.setVelocityX(0);
      return;
    }

    if (this.x <= this.patrol.left) {
      this.patrolHeading = 1;
    } else if (this.x >= this.patrol.right) {
      this.patrolHeading = -1;
    }

    this.setFlipX(this.patrolHeading < 0);
    this.setVelocityX(this.patrolHeading * this.patrol.speed);
  }

  override tryContactAttack(time: number) {
    if (!this.active || time < this.contactDamageReadyAt) {
      return null;
    }

    this.contactDamageReadyAt = time + this.contactDamageCooldown;
    return this.contactDamage;
  }
}
