import Phaser from 'phaser';
import { PLAYER_STACK_DEPTH } from '@/game/config/renderDepth';
import { BackArm } from '@/game/systems/BackArm';
import { muzzlePoint } from '@/game/systems/muzzlePoint';
import type { WeaponConfig } from '@/game/config/weaponConfig';

/**
 * The grip inside the 72x24 weapon sprite, as a fraction. Every weapon shares
 * this canvas, so one constant covers all four: the art is aligned to the grip
 * rather than to its own bounding box, which is what lets a 43px SMG and a 60px
 * rail rifle sit in the same hand.
 */
const GRIP_ORIGIN_X = 18 / 72;
const GRIP_ORIGIN_Y = 14 / 24;

/**
 * Where that grip sits relative to the player sprite's centre. The player frame
 * is 96x96 with a centred origin and the hand is drawn at (53, 45), so the
 * weapon hangs 5px right of centre and 3px above it. Mirrored when aiming left.
 */
const HAND_FROM_CENTRE_X = 5;
const HAND_FROM_CENTRE_Y = -3;

/**
 * Recoil settles on a half-life rather than a flat rate per millisecond. A flat
 * rate cannot serve both ends of the rack: tuned to the rail rifle's 22-degree
 * kick it leaves the SMG visibly tilted between rounds, and tuned to the SMG it
 * erases the rail rifle's kick inside three frames. Halving is scale-free, so
 * both read the same way.
 */
const RECOIL_HALF_LIFE_MS = 55;
const CLIMB_HALF_LIFE_MS = 75;

/** Below this the offset is under a pixel and the rotation under a degree. */
const RECOIL_EPSILON = 0.05;
const CLIMB_EPSILON = 0.004;

export class WeaponFeedback {
  readonly display: Phaser.GameObjects.Image;

  private readonly backArm: BackArm;
  /** The arm needs the barrel length to know where the handguard runs out. */
  private weapon: WeaponConfig;
  private recoil = 0;
  private climb = 0;
  private hitStopTimer?: Phaser.Time.TimerEvent;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly player: Phaser.Physics.Arcade.Sprite,
    initialWeapon: WeaponConfig,
    private readonly canApplyHitStop: () => boolean,
  ) {
    this.display = scene.add
      .image(player.x, player.y, initialWeapon.displayTexture)
      .setOrigin(GRIP_ORIGIN_X, GRIP_ORIGIN_Y)
      .setDepth(PLAYER_STACK_DEPTH.weapon);

    this.backArm = new BackArm(scene, player);
    this.weapon = initialWeapon;
  }

  update(delta: number, aimPoint: Phaser.Math.Vector2) {
    // The slide settles faster than the barrel drops. Recoil that decays on one
    // curve reads as the whole weapon being dragged back into place; letting the
    // muzzle hang gives the heavy weapons their weight.
    this.recoil *= Math.pow(0.5, delta / RECOIL_HALF_LIFE_MS);
    this.climb *= Math.pow(0.5, delta / CLIMB_HALF_LIFE_MS);
    if (this.recoil < RECOIL_EPSILON) {
      this.recoil = 0;
    }
    if (this.climb < CLIMB_EPSILON) {
      this.climb = 0;
    }

    const angle = Phaser.Math.Angle.Between(
      this.player.x,
      this.player.y,
      aimPoint.x,
      aimPoint.y,
    );
    const aimingLeft = Math.cos(angle) < 0;
    // Climb is always away from the ground, and the sprite is mirrored when
    // aiming left, so the sign has to follow the flip or the barrel dips.
    const climbed = angle + (aimingLeft ? this.climb : -this.climb);

    this.player.setFlipX(aimingLeft);
    this.display
      .setVisible(true)
      // Anchored to the hand, not swung around the player's centre. Recoil then
      // pushes back along the aim vector from wherever the hand actually is.
      .setPosition(
        this.player.x +
          (aimingLeft ? -HAND_FROM_CENTRE_X : HAND_FROM_CENTRE_X) -
          Math.cos(angle) * this.recoil,
        this.player.y + HAND_FROM_CENTRE_Y - Math.sin(angle) * this.recoil,
      )
      .setRotation(climbed)
      .setFlipY(aimingLeft);

    // Rides the body, not the weapon: it is the joint, and a joint that turns
    // with the arm is the gap it exists to close.
    // After the weapon, never before: the arm is chasing where the gun ended up
    // this frame, recoil and climb included.
    this.backArm.update(this.display, aimingLeft, this.weapon.muzzleOffset);
  }

  setWeapon(weapon: WeaponConfig) {
    this.weapon = weapon;
    this.display.setTexture(weapon.displayTexture);
    // Recoil belongs to the weapon that produced it. Carrying it across a swap
    // makes the new weapon's first shot clamp the leftover down to its own
    // ceiling in one frame — a rail rifle's 0.38 snapping to an SMG's 0.17.
    this.recoil = 0;
    this.climb = 0;
  }

  hide() {
    this.display.setVisible(false);
    this.backArm.hide();
  }

  playFire(weapon: WeaponConfig, baseAngle: number, pelletAngles: number[]) {
    const { feedback } = weapon;
    const muzzle = this.getMuzzlePosition(
      baseAngle,
      weapon.muzzleOffset,
      weapon.muzzleRise,
    );
    const thickness = Math.max(3, Math.round(feedback.muzzleLength * 0.28));
    const flash = this.scene.add
      .rectangle(
        muzzle.x,
        muzzle.y,
        feedback.muzzleLength,
        thickness,
        feedback.muzzleColor,
        0.96,
      )
      .setOrigin(0, 0.5)
      // The shot's own direction, climb included — see getMuzzlePosition.
      .setRotation(this.climbedAngle(baseAngle))
      .setDepth(12);
    const core = this.scene.add
      .circle(muzzle.x, muzzle.y, Math.max(2, thickness * 0.55), 0xffffff, 0.9)
      .setDepth(12);

    this.scene.tweens.add({
      targets: [flash, core],
      alpha: 0,
      scaleX: 0.35,
      duration: 55,
      onComplete: () => {
        flash.destroy();
        core.destroy();
      },
    });

    this.recoil = Math.max(this.recoil, feedback.recoilDistance);
    // Climb stacks round on round up to the weapon's ceiling, which is what
    // separates holding an SMG trigger from tapping one.
    this.climb = Math.min(
      feedback.recoilClimbMax,
      this.climb + feedback.recoilClimb,
    );
    this.scene.cameras.main.shake(
      feedback.shakeDuration,
      feedback.shakeIntensity,
    );
    this.playShotTraces(weapon, muzzle.x, muzzle.y, pelletAngles);
  }

  playEnemyHit(enemy: Phaser.Physics.Arcade.Sprite, weapon: WeaponConfig) {
    const { feedback } = weapon;
    const sparks = this.scene.add
      .graphics({ x: enemy.x, y: enemy.y })
      .setDepth(13);
    const sparkCount =
      weapon.id === 'rail-rifle' ? 9 : weapon.id === 'shotgun' ? 7 : 4;
    const baseLength =
      weapon.id === 'rail-rifle' ? 18 : weapon.id === 'shotgun' ? 13 : 8;

    sparks.lineStyle(
      weapon.id === 'rail-rifle' ? 3 : 2,
      feedback.hitColor,
      0.95,
    );
    for (let index = 0; index < sparkCount; index += 1) {
      const angle =
        (Math.PI * 2 * index) / sparkCount +
        Phaser.Math.FloatBetween(-0.2, 0.2);
      const length = baseLength + Phaser.Math.Between(-2, 5);
      sparks.lineBetween(
        Math.cos(angle) * 3,
        Math.sin(angle) * 3,
        Math.cos(angle) * length,
        Math.sin(angle) * length,
      );
    }
    sparks.fillStyle(0xffffff, 0.9);
    sparks.fillCircle(0, 0, weapon.id === 'rail-rifle' ? 4 : 2);

    this.scene.tweens.add({
      targets: sparks,
      alpha: 0,
      scale: 1.55,
      duration: weapon.id === 'rail-rifle' ? 160 : 105,
      ease: 'Quad.easeOut',
      onComplete: () => sparks.destroy(),
    });

    this.flashEnemyHit(enemy, 0xffffff);
    this.applyHitStop(feedback.hitStopMs);
  }

  playEquip(weapon: WeaponConfig) {
    const ring = this.scene.add
      .circle(this.player.x, this.player.y - 6, 18, weapon.pickupColor, 0)
      .setStrokeStyle(3, weapon.pickupColor, 0.95)
      .setDepth(13);
    const sparks = this.scene.add
      .graphics({ x: this.player.x, y: this.player.y - 6 })
      .setDepth(13);
    sparks.lineStyle(2, weapon.pickupColor, 0.9);
    for (let index = 0; index < 8; index += 1) {
      const angle = (Math.PI * 2 * index) / 8;
      sparks.lineBetween(
        Math.cos(angle) * 20,
        Math.sin(angle) * 20,
        Math.cos(angle) * 31,
        Math.sin(angle) * 31,
      );
    }

    const color = Phaser.Display.Color.IntegerToRGB(weapon.pickupColor);
    this.scene.cameras.main.flash(90, color.r, color.g, color.b, false);
    this.scene.tweens.add({
      targets: [ring, sparks],
      alpha: 0,
      scale: 1.9,
      duration: 280,
      ease: 'Quad.easeOut',
      onComplete: () => {
        ring.destroy();
        sparks.destroy();
      },
    });
  }

  private flashEnemyHit(
    enemy: Phaser.Physics.Arcade.Sprite,
    color: number,
  ) {
    enemy.setTint(color).setTintMode(Phaser.TintModes.FILL);
    this.scene.time.delayedCall(70, () => {
      if (enemy.active) {
        enemy.clearTint();
      }
    });
  }

  /**
   * The barrel tip in world space.
   *
   * `offset` runs along the barrel and `rise` perpendicular to it. Both are
   * needed: the sprite's origin is the grip, and every barrel sits 6-9px above
   * it, so projecting along the aim vector alone puts the muzzle inside the
   * shooter's fist. The perpendicular flips with the weapon, otherwise firing
   * left would push the muzzle down through the grip instead of up over it.
   *
   * The geometry lives in muzzlePoint so it can be checked without a renderer.
   */
  getMuzzlePosition(angle: number, offset: number, rise = 0) {
    return muzzlePoint({
      gripX: this.display.x,
      gripY: this.display.y,
      angle,
      climb: this.climb,
      mirrored: this.display.flipY,
      offset,
      rise,
    });
  }

  private climbedAngle(angle: number) {
    return angle + (this.display.flipY ? this.climb : -this.climb);
  }

  cancelHitStop() {
    this.hitStopTimer?.remove(false);
    this.hitStopTimer = undefined;
    this.scene.physics.world.resume();
  }

  private playShotTraces(
    weapon: WeaponConfig,
    x: number,
    y: number,
    angles: number[],
  ) {
    const { feedback } = weapon;
    if (feedback.traceLength <= 0 || feedback.traceAlpha <= 0) {
      return;
    }

    const traces = this.scene.add
      .graphics()
      .setDepth(PLAYER_STACK_DEPTH.shotTrace)
      .setAlpha(1);
    traces.lineStyle(
      weapon.id === 'rail-rifle' ? 3 : 1,
      feedback.muzzleColor,
      feedback.traceAlpha,
    );
    for (const angle of angles) {
      traces.lineBetween(
        x,
        y,
        x + Math.cos(angle) * feedback.traceLength,
        y + Math.sin(angle) * feedback.traceLength,
      );
    }

    this.scene.tweens.add({
      targets: traces,
      alpha: 0,
      duration: weapon.id === 'rail-rifle' ? 150 : 85,
      onComplete: () => traces.destroy(),
    });
  }

  private applyHitStop(duration: number) {
    if (duration <= 0 || !this.canApplyHitStop()) {
      return;
    }

    this.scene.physics.world.pause();
    this.hitStopTimer?.remove(false);
    this.hitStopTimer = this.scene.time.delayedCall(duration, () => {
      this.scene.physics.world.resume();
      this.hitStopTimer = undefined;
    });
  }
}
