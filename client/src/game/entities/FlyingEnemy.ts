import Phaser from 'phaser';
import {
  AerialMovementMode,
  type AerialMovementConfig,
} from '@/game/config/aerialMovementConfig';
import type { FlyingSpriteConfig } from '@/game/config/flyingEnemyAnimationConfig';
import { PLAYER_FLIGHT_BOUNDS } from '@/game/config/playerMovementConfig';
import { Enemy, type EnemyProjectileAttack } from '@/game/entities/Enemy';
import { FLOOR_SURFACE_Y } from '@/game/systems/FloorBuilder';

/** How fast a downed flyer plummets, in px/s (feeds the fall tween duration). */
const DEATH_FALL_SPEED = 720;
/** How long the crumpled wreck rests on the ground before fading out. */
const DEATH_WRECK_HOLD_MS = 1000;
/** Fade-out duration once the hold ends. */
const DEATH_FADE_MS = 450;

export type FlyingEnemyConfig = {
  health: number;
  aggroRadius: number;
  hoverY: number;
  trackSpeed: number;
  fireInterval: number;
  muzzleOffset: number;
  movement?: AerialMovementConfig;
  sprite?: FlyingSpriteConfig;
};

export class FlyingEnemy extends Enemy {
  readonly aggroRadius: number;
  readonly aggroIndicatorColor = 0xb884ff;
  readonly projectile: { kind: 'flying'; muzzleOffset: number };

  private readonly hoverY: number;
  private readonly trackSpeed: number;
  private readonly fireInterval: number;
  private readonly anchorX: number;
  private readonly movement?: AerialMovementConfig;
  private readonly sprite?: FlyingSpriteConfig;
  private inHitPose = false;
  private dying = false;

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
    this.anchorX = x;
    this.movement = config.movement;
    this.sprite = config.sprite;
    this.projectile = { kind: 'flying', muzzleOffset: config.muzzleOffset };

    (this.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);
    // Flyers hover at platform height, so they render in front of terrain
    // (depth 5) instead of being hidden behind it — still under the player (8).
    this.setDepth(6);
    this.applySprite();
  }

  /** The real atlas frame is padded, so size the body down to the drone. */
  private applySprite() {
    if (!this.sprite) {
      return;
    }

    this.setScale(this.sprite.scale);
    (this.body as Phaser.Physics.Arcade.Body).setSize(
      this.sprite.bodyWidth,
      this.sprite.bodyHeight,
      true,
    );
    this.play(this.sprite.animations.idle);
  }

  /** Shows the flinch pose while staggered, then falls back to idle hover. */
  private updateHitPose(time: number) {
    if (!this.sprite) {
      return;
    }

    const staggered = this.isStaggered(time);
    if (staggered && !this.inHitPose) {
      this.inHitPose = true;
      this.play(this.sprite.animations.hit);
    } else if (!staggered && this.inHitPose) {
      this.inHitPose = false;
      this.play(this.sprite.animations.idle);
    }
  }

  /** Real-atlas flyers play their own death animation instead of the pop ghost. */
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
    // Stop combat/collision immediately; the wreck then falls and crumbles
    // under a tween (physics stays off) before the object is removed.
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.enable = false;

    const sprite = this.sprite;
    // Phase 1: hold the first death frame while dropping to the ground.
    this.play(sprite.animations.deathFall);
    const restY = FLOOR_SURFACE_Y - this.displayHeight * 0.3;
    const fallDistance = Math.max(0, restY - this.y);
    this.scene.tweens.add({
      targets: this,
      y: this.y + fallDistance,
      duration: Phaser.Math.Clamp(
        (fallDistance / DEATH_FALL_SPEED) * 1000,
        120,
        900,
      ),
      ease: 'Quad.easeIn',
      onComplete: () => {
        // Phase 2: crumple on impact, hold the wreck briefly, then fade out.
        this.play(sprite.animations.deathLand);
        this.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
          this.scene.time.delayedCall(DEATH_WRECK_HOLD_MS, () => {
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
      },
    });
  }

  updateCombat(
    time: number,
    target: Phaser.Physics.Arcade.Sprite,
    fireProjectile: EnemyProjectileAttack,
  ) {
    if (!this.active || this.dying) {
      return false;
    }

    // Flinch only while a knockback stagger holds, so rapid low-knockback fire
    // (SMG) doesn't lock the pose while a shotgun/rail hit clearly rocks it.
    this.updateHitPose(time);

    const targetInRange = this.updateRangedAttack(
      time,
      target,
      fireProjectile,
      this.fireInterval,
    );

    // While staggered, let the knockback push it before hover control resumes.
    if (this.isStaggered(time)) {
      if (this.movement) {
        this.clampAerialHeight();
      }
      return targetInRange;
    }

    if (this.movement) {
      this.updateAerialMovement(time, target, targetInRange);
      this.clampAerialHeight();
    } else {
      // Preserve the original stages 1-4 behavior exactly when no strategy is
      // supplied: follow horizontally and return to the configured hover line.
      const horizontalDirection = Math.sign(target.x - this.x);
      this.setVelocityX(
        targetInRange ? horizontalDirection * this.trackSpeed : 0,
      );
      this.seekVertical(this.hoverY);
    }

    return targetInRange;
  }

  private updateAerialMovement(
    time: number,
    target: Phaser.Physics.Arcade.Sprite,
    targetInRange: boolean,
  ) {
    const movement = this.movement;
    if (!movement) {
      return;
    }

    const rangeX = movement.rangeX ?? 110;
    const rangeY = movement.rangeY ?? 45;
    const cycleDuration = movement.cycleDuration ?? 2600;
    const phase = (time / cycleDuration) * Math.PI * 2;

    switch (movement.mode) {
      case AerialMovementMode.HOVER:
        this.seek(
          this.anchorX + Math.sin(phase) * rangeX * 0.25,
          this.hoverY + Math.sin(phase * 1.5) * rangeY,
        );
        break;
      case AerialMovementMode.TRACK:
        this.seek(
          targetInRange ? target.x : this.anchorX,
          targetInRange ? target.y : this.hoverY,
        );
        break;
      case AerialMovementMode.PATROL:
        this.seek(
          this.anchorX + Math.sin(phase) * rangeX,
          this.hoverY + Math.sin(phase * 2) * rangeY,
        );
        break;
      case AerialMovementMode.ORBIT:
        this.seek(
          this.anchorX + Math.cos(phase) * rangeX,
          this.hoverY + Math.sin(phase) * rangeY,
        );
        break;
    }
  }

  private seek(targetX: number, targetY: number) {
    const deltaX = targetX - this.x;
    const deltaY = targetY - this.y;
    const distance = Math.hypot(deltaX, deltaY);
    if (distance < 4) {
      this.setVelocity(0, 0);
      return;
    }

    const speed = Math.min(this.trackSpeed, distance * 4);
    this.setVelocity((deltaX / distance) * speed, (deltaY / distance) * speed);
  }

  private seekVertical(targetY: number) {
    const verticalOffset = targetY - this.y;
    this.setVelocityY(
      Phaser.Math.Clamp(verticalOffset * 4, -this.trackSpeed, this.trackSpeed),
    );
  }

  private clampAerialHeight() {
    this.setY(
      Phaser.Math.Clamp(
        this.y,
        PLAYER_FLIGHT_BOUNDS.minY,
        PLAYER_FLIGHT_BOUNDS.maxY,
      ),
    );
  }
}
