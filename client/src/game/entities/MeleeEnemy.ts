import Phaser from 'phaser';
import type { MeleeSwingConfig } from '@/game/config/combatConfig';
import type { MeleeSpriteConfig } from '@/game/config/meleeEnemyAnimationConfig';
import { Enemy, type EnemyProjectileAttack } from '@/game/entities/Enemy';
import { FLOOR_SURFACE_Y } from '@/game/systems/FloorBuilder';

export type MeleeEnemyConfig = {
  health: number;
  aggroRadius: number;
  moveSpeed: number;
  contactDamage: number;
  contactDamageCooldown: number;
  /** When set, the enemy attacks by swinging instead of dealing contact damage. */
  swing?: MeleeSwingConfig;
  /** Real-atlas art; the swing then shows as an attack anim + slash VFX. */
  sprite?: MeleeSpriteConfig;
};

type MeleeState = 'chase' | 'windup' | 'swing' | 'recover';

type PlayerDamageHandler = (damage: number) => void;

/** Rod pivot offset from the enemy centre (front hand), in px. */
const HAND_OFFSET_X = 12;
const HAND_OFFSET_Y = -6;
/** Rod angles for a right-facing enemy, in radians (0 = horizontal forward). */
const ROD_REST_ANGLE = 0.38;
const ROD_RAISED_ANGLE = -2.05;
const ROD_FORWARD_ANGLE = 0.85;

/** Slash VFX geometry (right-facing); mirrored when the enemy faces left. */
const SLASH_DEPTH = 9;
const SLASH_INNER_RADIUS = 30;
const SLASH_OUTER_RADIUS = 96;
const SLASH_START_ANGLE = -1.95;
const SLASH_END_ANGLE = 0.8;
/** Angular width of the blade trail, in radians. */
const SLASH_ARC = 0.95;
const SLASH_COLOR = 0xbff4ff;

/** Death corpse timing for the real-atlas variant (matches the other mobs). */
const DEATH_HOLD_MS = 400;
const DEATH_FADE_MS = 350;

export class MeleeEnemy extends Enemy {
  readonly aggroRadius: number;
  readonly aggroIndicatorColor = 0xf08b52;

  private readonly moveSpeed: number;
  private readonly contactDamage: number;
  private readonly contactDamageCooldown: number;
  private contactDamageReadyAt = 0;

  private readonly swing?: MeleeSwingConfig;
  private readonly sprite?: MeleeSpriteConfig;
  private readonly damagePlayer?: PlayerDamageHandler;
  private readonly rod?: Phaser.GameObjects.Rectangle;
  private readonly slash?: Phaser.GameObjects.Graphics;
  private attackState: MeleeState = 'chase';
  private stateStartedAt = 0;
  private stateEndsAt = 0;
  private swingConnected = false;
  private activeAnimation?: string;
  private dying = false;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    texture: string,
    config: MeleeEnemyConfig,
    damagePlayer?: PlayerDamageHandler,
  ) {
    super(scene, x, y, texture, config.health);

    this.aggroRadius = config.aggroRadius;
    this.moveSpeed = config.moveSpeed;
    this.contactDamage = config.contactDamage;
    this.contactDamageCooldown = config.contactDamageCooldown;
    this.swing = config.swing;
    this.sprite = config.sprite;
    this.damagePlayer = damagePlayer;

    if (this.sprite) {
      this.slash = scene.add.graphics().setDepth(SLASH_DEPTH);
      this.applySprite();
    } else if (this.swing) {
      this.rod = scene.add
        .rectangle(
          x,
          y,
          this.swing.rodLength,
          this.swing.rodThickness,
          this.swing.rodColor,
        )
        .setOrigin(0.12, 0.5)
        .setDepth(this.depth);
      this.positionRod(ROD_REST_ANGLE);
    }
  }

  /**
   * The real atlas frame is padded, so size the body down and bottom-align it to
   * the fighter's feet (play the idle frame first so the body maps to the atlas
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
    // Spawn with feet exactly on the floor: the tall padded body otherwise
    // spawns overlapping a floor tile and tunnels through it.
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
    _fireProjectile: EnemyProjectileAttack,
  ) {
    if (!this.active || this.dying) {
      return false;
    }

    const distance = Phaser.Math.Distance.Between(
      this.x,
      this.y,
      target.x,
      target.y,
    );
    const targetInRange = distance <= this.aggroRadius;

    if (this.swing) {
      return this.updateSwingCombat(time, target, targetInRange);
    }

    // While staggered, let the knockback impulse carry it instead of
    // immediately resuming the chase.
    if (this.isStaggered(time)) {
      return targetInRange;
    }

    if (!targetInRange) {
      this.setVelocityX(0);
      return false;
    }

    const direction = Math.sign(target.x - this.x);
    this.setFlipX(direction < 0);
    this.setVelocityX(direction * this.moveSpeed);

    return true;
  }

  private updateSwingCombat(
    time: number,
    target: Phaser.Physics.Arcade.Sprite,
    targetInRange: boolean,
  ) {
    // A stagger interrupts the wind-up so a well-timed knockback-heavy shot
    // cancels the swing; visuals snap back to rest.
    if (this.isStaggered(time)) {
      if (this.attackState !== 'chase') {
        this.attackState = 'chase';
      }
      this.restVisual();
      return targetInRange;
    }

    switch (this.attackState) {
      case 'chase':
        this.updateChase(time, target, targetInRange);
        break;
      case 'windup':
        this.updateWindup(time);
        break;
      case 'swing':
        this.updateSwing(time, target);
        break;
      case 'recover':
        this.updateRecover(time);
        break;
    }

    return targetInRange;
  }

  private updateChase(
    time: number,
    target: Phaser.Physics.Arcade.Sprite,
    targetInRange: boolean,
  ) {
    if (!targetInRange) {
      this.setVelocityX(0);
      this.restVisual();
      return;
    }

    const swing = this.swing!;
    const direction = Math.sign(target.x - this.x) || 1;
    this.setFlipX(direction < 0);

    const horizontalDistance = Math.abs(target.x - this.x);
    const withinHeight =
      Math.abs(target.y - this.y) <= swing.verticalTolerance;

    if (horizontalDistance <= swing.attackRange && withinHeight) {
      this.beginState('windup', time, swing.windupDuration);
      this.setVelocityX(0);
      this.beginAttackVisual();
      return;
    }

    this.setVelocityX(direction * this.moveSpeed);
    // Walk while closing in (sprite), or carry the rod at rest.
    if (this.sprite) {
      this.playAnimation(this.sprite.animations.walk);
    } else {
      this.positionRod(ROD_REST_ANGLE);
    }
  }

  private updateWindup(time: number) {
    this.setVelocityX(0);
    if (this.rod) {
      // Raise the rod over the windup so the incoming swing is telegraphed.
      this.positionRod(
        Phaser.Math.Linear(
          ROD_REST_ANGLE,
          ROD_RAISED_ANGLE,
          this.stateProgress(time),
        ),
      );
    }

    if (time >= this.stateEndsAt) {
      this.beginState('swing', time, this.swing!.swingDuration);
      this.swingConnected = false;
    }
  }

  private updateSwing(time: number, target: Phaser.Physics.Arcade.Sprite) {
    this.setVelocityX(0);
    const progress = this.stateProgress(time);
    // Ease-out so the arc snaps down.
    const swingCurve = 1 - (1 - progress) * (1 - progress);

    if (this.slash) {
      this.drawSlash(swingCurve, 1 - progress);
    } else if (this.rod) {
      this.positionRod(
        Phaser.Math.Linear(ROD_RAISED_ANGLE, ROD_FORWARD_ANGLE, swingCurve),
      );
    }

    if (!this.swingConnected && this.swingHits(target)) {
      this.swingConnected = true;
      this.damagePlayer?.(this.swing!.damage);
    }

    if (time >= this.stateEndsAt) {
      this.slash?.clear();
      this.beginState('recover', time, this.swing!.recoverDuration);
    }
  }

  private updateRecover(time: number) {
    this.setVelocityX(0);
    if (this.sprite) {
      this.playAnimation(this.sprite.animations.idle);
    } else if (this.rod) {
      this.positionRod(
        Phaser.Math.Linear(
          ROD_FORWARD_ANGLE,
          ROD_REST_ANGLE,
          this.stateProgress(time),
        ),
      );
    }

    if (time >= this.stateEndsAt) {
      this.attackState = 'chase';
    }
  }

  private swingHits(target: Phaser.Physics.Arcade.Sprite) {
    const swing = this.swing!;
    const facing = this.flipX ? -1 : 1;
    const dx = target.x - this.x;
    const onFacingSide = Math.sign(dx) === facing || Math.abs(dx) < 10;

    return (
      onFacingSide &&
      Math.abs(dx) <= swing.reach &&
      Math.abs(target.y - this.y) <= swing.verticalTolerance
    );
  }

  /** Rest pose: rod carried low, or walk/idle for the real sprite. */
  private restVisual() {
    if (this.sprite) {
      const moving = Math.abs(this.body?.velocity.x ?? 0) > 1;
      this.playAnimation(
        moving ? this.sprite.animations.walk : this.sprite.animations.idle,
      );
    } else {
      this.positionRod(ROD_REST_ANGLE);
    }
    this.slash?.clear();
  }

  private beginAttackVisual() {
    if (this.sprite) {
      this.playAnimation(this.sprite.animations.attack);
    }
  }

  private drawSlash(sweep: number, fade: number) {
    if (!this.slash) {
      return;
    }

    const facing = this.flipX ? -1 : 1;
    const cx = this.x + facing * HAND_OFFSET_X;
    const cy = this.y + HAND_OFFSET_Y;
    const leadRight = Phaser.Math.Linear(
      SLASH_START_ANGLE,
      SLASH_END_ANGLE,
      sweep,
    );
    const trailRight = leadRight - SLASH_ARC;
    // Mirror the arc across the vertical axis when facing left.
    const a = facing === 1 ? trailRight : Math.PI - leadRight;
    const b = facing === 1 ? leadRight : Math.PI - trailRight;
    const alpha = 0.2 + fade * 0.55;

    this.slash
      .clear()
      .fillStyle(SLASH_COLOR, alpha)
      .beginPath();
    this.slash.arc(cx, cy, SLASH_OUTER_RADIUS, a, b, false);
    this.slash.arc(cx, cy, SLASH_INNER_RADIUS, b, a, true);
    this.slash.closePath();
    this.slash.fillPath();
    // Bright leading edge.
    this.slash
      .lineStyle(3, 0xffffff, alpha)
      .beginPath();
    this.slash.arc(cx, cy, SLASH_OUTER_RADIUS, a, b, false);
    this.slash.strokePath();
  }

  private positionRod(angleForRight: number) {
    if (!this.rod) {
      return;
    }

    const facing = this.flipX ? -1 : 1;
    this.rod.setPosition(
      this.x + facing * HAND_OFFSET_X,
      this.y + HAND_OFFSET_Y,
    );
    // Mirror the angle when facing left so the rod stays on the front side.
    this.rod.setRotation(facing === 1 ? angleForRight : Math.PI - angleForRight);
    this.rod.setDepth(this.depth);
  }

  private playAnimation(key: string) {
    if (this.activeAnimation === key) {
      return;
    }

    this.activeAnimation = key;
    this.play(key, true);
  }

  private beginState(state: MeleeState, time: number, duration: number) {
    this.attackState = state;
    this.stateStartedAt = time;
    this.stateEndsAt = time + duration;
  }

  private stateProgress(time: number) {
    if (this.stateEndsAt <= this.stateStartedAt) {
      return 1;
    }

    return Phaser.Math.Clamp(
      (time - this.stateStartedAt) / (this.stateEndsAt - this.stateStartedAt),
      0,
      1,
    );
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

  protected override onDefeated() {
    super.onDefeated();
    this.rod?.destroy();
    this.slash?.destroy();
  }

  override destroy(fromScene?: boolean) {
    this.rod?.destroy();
    this.slash?.destroy();
    super.destroy(fromScene);
  }

  override tryContactAttack(time: number) {
    // Rod-swing enemies deal damage only through the swing, not on contact.
    if (this.swing || !this.active || time < this.contactDamageReadyAt) {
      return null;
    }

    this.contactDamageReadyAt = time + this.contactDamageCooldown;
    return this.contactDamage;
  }
}
