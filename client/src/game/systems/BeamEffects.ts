import Phaser from 'phaser';
import { STAGE_ONE_BOSS_LASER_ASSETS } from '@/game/config/bossAnimationConfig';
import type { BeamVisualConfig } from '@/game/config/bossConfigTypes';

type Point = {
  x: number;
  y: number;
};

export class BeamEffects {
  private readonly telegraph: Phaser.GameObjects.Graphics;
  private readonly beamBack: Phaser.GameObjects.Image;
  private readonly beamMiddle: Phaser.GameObjects.Image;
  private readonly beamFront: Phaser.GameObjects.Image;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly pattern: BeamVisualConfig,
  ) {
    this.telegraph = scene.add.graphics().setDepth(11);
    this.beamBack = scene.add
      .image(0, 0, STAGE_ONE_BOSS_LASER_ASSETS.back.key)
      .setDepth(11)
      .setVisible(false);
    this.beamBack.setOrigin(
      STAGE_ONE_BOSS_LASER_ASSETS.back.muzzleAnchorX / this.beamBack.width,
      0.5,
    );
    this.beamMiddle = scene.add
      .image(0, 0, STAGE_ONE_BOSS_LASER_ASSETS.middle.key)
      .setOrigin(0, 0.5)
      .setDepth(11)
      .setVisible(false);
    this.beamFront = scene.add
      .image(0, 0, STAGE_ONE_BOSS_LASER_ASSETS.front.key)
      .setOrigin(0, 0.5)
      .setDepth(11)
      .setVisible(false);
  }

  drawTelegraph(muzzle: Point, angle: number, progress: number) {
    const endX = muzzle.x + Math.cos(angle) * this.pattern.range;
    const endY = muzzle.y + Math.sin(angle) * this.pattern.range;

    this.telegraph
      .clear()
      .lineStyle(
        1 + progress * 2,
        this.pattern.telegraphColor,
        0.35 + progress * 0.55,
      )
      .lineBetween(muzzle.x, muzzle.y, endX, endY)
      .fillStyle(this.pattern.telegraphColor, 0.35 + progress * 0.6)
      .fillCircle(muzzle.x, muzzle.y, 4 + progress * 8);
  }

  showBeam(muzzle: Point, angle: number) {
    this.telegraph.clear();
    this.positionBeam(muzzle, angle);
    this.setBeamVisible(true);
    this.scene.cameras.main.shake(100, 0.006);
  }

  updateBeam(muzzle: Point, angle: number) {
    this.positionBeam(muzzle, angle);
  }

  hideBeam() {
    this.setBeamVisible(false);
  }

  hideAll() {
    this.telegraph.clear();
    this.hideBeam();
  }

  destroy() {
    this.telegraph.destroy();
    this.beamBack.destroy();
    this.beamMiddle.destroy();
    this.beamFront.destroy();
  }

  private positionBeam(muzzle: Point, angle: number) {
    const directionX = Math.cos(angle);
    const directionY = Math.sin(angle);
    const backForwardLength =
      this.beamBack.width - STAGE_ONE_BOSS_LASER_ASSETS.back.muzzleAnchorX;
    const middleLength = Math.max(
      1,
      this.pattern.range - backForwardLength - this.beamFront.width,
    );

    this.beamBack.setPosition(muzzle.x, muzzle.y).setRotation(angle);
    this.beamMiddle
      .setPosition(
        muzzle.x + directionX * backForwardLength,
        muzzle.y + directionY * backForwardLength,
      )
      .setRotation(angle)
      .setDisplaySize(middleLength, this.beamMiddle.height);
    this.beamFront
      .setPosition(
        muzzle.x + directionX * (this.pattern.range - this.beamFront.width),
        muzzle.y + directionY * (this.pattern.range - this.beamFront.width),
      )
      .setRotation(angle);
  }

  private setBeamVisible(visible: boolean) {
    this.beamBack.setVisible(visible);
    this.beamMiddle.setVisible(visible);
    this.beamFront.setVisible(visible);
  }
}
