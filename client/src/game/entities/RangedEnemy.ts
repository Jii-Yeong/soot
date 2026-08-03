import Phaser from 'phaser';
import type { RangedSpriteConfig } from '@/game/config/rangedEnemyAnimationConfig';
import { Enemy, type EnemyProjectileAttack } from '@/game/entities/Enemy';
import { FLOOR_SURFACE_Y } from '@/game/systems/FloorBuilder';

export type RangedEnemyConfig = {
  health: number;
  aggroRadius: number;
  fireInterval: number;
  muzzleOffset: number;
  moveSpeed: number;
  preferredDistance: number;
  distanceTolerance: number;
  sprite?: RangedSpriteConfig;
};

/** How long the attack pose holds after a shot before returning to idle. */
const ATTACK_POSE_MS = 220;
/** How long the corpse rests before fading (matches the flyer's feel). */
const DEATH_HOLD_MS = 400;
const DEATH_FADE_MS = 350;

export class RangedEnemy extends Enemy {
  readonly aggroRadius: number;
  readonly aggroIndicatorColor = 0xff5263;
  readonly projectile: { kind: 'ranged'; muzzleOffset: number };

  private readonly fireInterval: number;
  private readonly moveSpeed: number;
  private readonly preferredDistance: number;
  private readonly distanceTolerance: number;
  private readonly sprite?: RangedSpriteConfig;
  private attackPoseUntil = 0;
  private activeAnimation?: string;
  private dying = false;

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
    this.moveSpeed = config.moveSpeed;
    this.preferredDistance = config.preferredDistance;
    this.distanceTolerance = config.distanceTolerance;
    this.projectile = { kind: 'ranged', muzzleOffset: config.muzzleOffset };
    this.sprite = config.sprite;
    this.applySprite();
  }

  /**
   * The real atlas frame is padded, so size the body down and bottom-align it to
   * the shooter's feet (play the idle frame first so the body maps to the atlas
   * frame, not the placeholder it was constructed with).
   */
  private applySprite() {
    if (!this.sprite) {
      return;
    }

    this.setScale(this.sprite.scale);
    this.playAnimation(this.sprite.animations.idle);
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setSize(this.sprite.bodyWidth, this.sprite.bodyHeight);
    body.setOffset(this.sprite.bodyOffsetX, this.sprite.bodyOffsetY);
    // Spawn with feet exactly on the floor so the tall padded body never spawns
    // overlapping a floor tile (which would tunnel it through).
    this.setY(
      FLOOR_SURFACE_Y -
        this.sprite.bodyOffsetY -
        this.sprite.bodyHeight +
        this.displayOriginY,
    );
    body.reset(this.x, this.y);
  }

  updateCombat(
    time: number,
    target: Phaser.Physics.Arcade.Sprite,
    fireProjectile: EnemyProjectileAttack,
  ) {
    if (!this.active || this.dying) {
      return false;
    }

    const targetInRange = this.updateRangedAttack(
      time,
      target,
      fireProjectile,
      this.fireInterval,
    );

    const moving = this.updatePositioning(time, target, targetInRange);

    // Attack pose wins briefly after a shot; otherwise walk while repositioning
    // or idle when holding at the preferred gap.
    if (this.sprite && time >= this.attackPoseUntil) {
      this.playAnimation(
        moving ? this.sprite.animations.walk : this.sprite.animations.idle,
      );
    }

    return targetInRange;
  }

  /**
   * Holds a preferred firing gap (still facing/firing at the player): advances
   * when the player is too far, backpedals when they close in.
   */
  private updatePositioning(
    time: number,
    target: Phaser.Physics.Arcade.Sprite,
    targetInRange: boolean,
  ) {
    if (this.isStaggered(time) || !targetInRange) {
      this.setVelocityX(0);
      return false;
    }

    const distance = Math.abs(target.x - this.x);
    const directionToTarget = Math.sign(target.x - this.x) || 1;

    if (distance > this.preferredDistance + this.distanceTolerance) {
      this.setVelocityX(directionToTarget * this.moveSpeed);
      return true;
    }

    if (distance < this.preferredDistance - this.distanceTolerance) {
      this.setVelocityX(-directionToTarget * this.moveSpeed);
      return true;
    }

    this.setVelocityX(0);
    return false;
  }

  protected override onRangedFire(time: number) {
    if (!this.sprite) {
      return;
    }

    this.attackPoseUntil = time + ATTACK_POSE_MS;
    this.playAnimation(this.sprite.animations.attack);
  }

  override get playsOwnDeathAnimation() {
    return Boolean(this.sprite);
  }

  override defeat() {
    if (!this.active || !this.sprite) {
      super.defeat();
      return;
    }

    this.dying = true;
    this.onDefeated();
    // Freeze in place, play the death frames, hold the corpse, then fade out.
    (this.body as Phaser.Physics.Arcade.Body).enable = false;
    this.playAnimation(this.sprite.animations.death);
    this.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
      this.scene.time.delayedCall(DEATH_HOLD_MS, () => {
        if (!this.active) {
          return;
        }
        this.scene.tweens.add({
          targets: this,
          alpha: 0,
          duration: DEATH_FADE_MS,
          ease: 'Sine.easeIn',
          onComplete: () => this.disableBody(true, true),
        });
      });
    });
  }

  private playAnimation(key: string) {
    if (this.activeAnimation === key) {
      return;
    }

    this.activeAnimation = key;
    this.play(key, true);
  }
}
