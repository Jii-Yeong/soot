import Phaser from 'phaser';
import { FLOOR_SURFACE_Y } from '@/game/systems/FloorBuilder';

/** How long the corpse rests before fading, then how long the fade takes. */
const DEATH_HOLD_MS = 400;
const DEATH_FADE_MS = 350;

/** The real-atlas fields a grounded enemy needs to place and animate itself. */
export type GroundedEnemySpriteConfig = {
  animations: { idle: string; death: string };
  scale: number;
  bodyWidth: number;
  bodyHeight: number;
  bodyOffsetX: number;
  bodyOffsetY: number;
};

/**
 * Shared real-atlas lifecycle for grounded enemies (melee, ranged): sizes and
 * feet-aligns the padded body, dedups animation plays, and runs the death
 * "corpse holds then fades out" sequence. Composed by the enemy classes so the
 * two don't duplicate it.
 */
export class GroundedEnemySprite {
  private activeAnimation?: string;

  constructor(
    private readonly sprite: Phaser.Physics.Arcade.Sprite,
    private readonly config: GroundedEnemySpriteConfig,
  ) {}

  /**
   * Size the body down and bottom-align it to the character's feet on the floor.
   * The idle frame plays first so the body maps to the atlas frame rather than
   * the placeholder the sprite was constructed with, and spawning feet-on-floor
   * keeps the tall padded body from overlapping a floor tile and tunnelling.
   */
  apply() {
    this.sprite.setScale(this.config.scale);
    this.play(this.config.animations.idle);
    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    body.setSize(this.config.bodyWidth, this.config.bodyHeight);
    body.setOffset(this.config.bodyOffsetX, this.config.bodyOffsetY);
    this.sprite.setY(
      FLOOR_SURFACE_Y -
        this.config.bodyOffsetY -
        this.config.bodyHeight +
        this.sprite.displayOriginY,
    );
    body.reset(this.sprite.x, this.sprite.y);
  }

  /** Plays an animation only when it isn't already the active one. */
  play(key: string) {
    if (this.activeAnimation === key) {
      return;
    }

    this.activeAnimation = key;
    this.sprite.play(key, true);
  }

  /**
   * Freezes the enemy, plays its death frames, holds the corpse, then fades it
   * out and calls `remove`.
   */
  playDeath(remove: () => void) {
    (this.sprite.body as Phaser.Physics.Arcade.Body).enable = false;
    this.play(this.config.animations.death);
    this.sprite.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
      this.sprite.scene.time.delayedCall(DEATH_HOLD_MS, () => {
        if (!this.sprite.active) {
          return;
        }
        this.sprite.scene.tweens.add({
          targets: this.sprite,
          alpha: 0,
          duration: DEATH_FADE_MS,
          ease: 'Sine.easeIn',
          onComplete: remove,
        });
      });
    });
  }
}
