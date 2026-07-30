import Phaser from 'phaser';
import type { BeamVisualConfig } from '@/game/config/bossConfigTypes';

type Point = {
  x: number;
  y: number;
};

export class BeamEffects {
  private readonly telegraph: Phaser.GameObjects.Graphics;
  private readonly beamGlow: Phaser.GameObjects.Rectangle;
  private readonly beamCore: Phaser.GameObjects.Rectangle;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly pattern: BeamVisualConfig,
  ) {
    this.telegraph = scene.add.graphics().setDepth(11);
    this.beamGlow = scene.add
      .rectangle(0, 0, pattern.range, pattern.width * 2.2, pattern.beamColor, 0.2)
      .setOrigin(0, 0.5)
      .setDepth(10)
      .setVisible(false);
    this.beamCore = scene.add
      .rectangle(0, 0, pattern.range, pattern.width, pattern.beamColor, 0.95)
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
    this.beamGlow.setVisible(true);
    this.beamCore.setVisible(true);
    this.scene.cameras.main.shake(100, 0.006);
  }

  updateBeam(muzzle: Point, angle: number) {
    this.positionBeam(muzzle, angle);
  }

  hideBeam() {
    this.beamGlow.setVisible(false);
    this.beamCore.setVisible(false);
  }

  hideAll() {
    this.telegraph.clear();
    this.hideBeam();
  }

  destroy() {
    this.telegraph.destroy();
    this.beamGlow.destroy();
    this.beamCore.destroy();
  }

  private positionBeam(muzzle: Point, angle: number) {
    for (const beam of [this.beamGlow, this.beamCore]) {
      beam.setPosition(muzzle.x, muzzle.y).setRotation(angle);
    }
  }
}
