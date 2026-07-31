import Phaser from 'phaser';
import type { WeaponConfig } from '@/game/config/weaponConfig';

export class WeaponFeedback {
  readonly display: Phaser.GameObjects.Image;

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
      .setOrigin(0.24, 0.5)
      .setDepth(9);
  }

  update(delta: number, aimPoint: Phaser.Math.Vector2) {
    // The slide settles faster than the barrel drops. Recoil that decays on one
    // curve reads as the whole weapon being dragged back into place; letting the
    // muzzle hang gives the heavy weapons their weight.
    this.recoil = Math.max(0, this.recoil - delta * 0.12);
    this.climb = Math.max(0, this.climb - delta * 0.006);

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
      .setPosition(
        this.player.x + Math.cos(angle) * (8 - this.recoil),
        this.player.y - 7 + Math.sin(angle) * 4 - Math.sin(angle) * this.recoil,
      )
      .setRotation(climbed)
      .setFlipY(aimingLeft);
  }

  setWeapon(weapon: WeaponConfig) {
    this.display.setTexture(weapon.displayTexture);
  }

  hide() {
    this.display.setVisible(false);
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
      .setRotation(baseAngle)
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
    this.climb = Math.max(this.climb, feedback.recoilClimb);
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
   * needed: the sprite's origin is the grip, and every barrel sits 8-11px above
   * it, so projecting along the aim vector alone puts the muzzle inside the
   * shooter's fist. The perpendicular flips with the weapon, otherwise firing
   * left would push the muzzle down through the grip instead of up over it.
   */
  getMuzzlePosition(angle: number, offset: number, rise = 0) {
    const lift = this.display.flipY ? rise : -rise;
    return {
      x: this.display.x + Math.cos(angle) * offset - Math.sin(angle) * lift,
      y: this.display.y + Math.sin(angle) * offset + Math.cos(angle) * lift,
    };
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

    const traces = this.scene.add.graphics().setDepth(9).setAlpha(1);
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
