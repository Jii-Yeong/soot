import Phaser from 'phaser';
import type { ArchitectBossPatternConfig } from '@/game/config/bossConfigTypes';

const EFFECT_DEPTH = 7;
const UI_EFFECT_DEPTH = 24;

/** Owns all temporary and persistent visuals for the stage-5 final boss. */
export class ArchitectBossView {
  private readonly telegraph: Phaser.GameObjects.Graphics;
  private readonly phaseOverlay: Phaser.GameObjects.Graphics;
  private readonly haloGlow: Phaser.GameObjects.Ellipse;
  private readonly eyeGlow: Phaser.GameObjects.Arc;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly pattern: ArchitectBossPatternConfig,
    x: number,
    y: number,
  ) {
    this.telegraph = scene.add.graphics().setDepth(EFFECT_DEPTH);
    this.phaseOverlay = scene.add
      .graphics()
      .setDepth(UI_EFFECT_DEPTH)
      .setScrollFactor(0);
    this.haloGlow = scene.add
      .ellipse(x, y - 68, 118, 34, pattern.goldColor, 0.16)
      .setStrokeStyle(4, pattern.goldColor, 0.85)
      .setDepth(EFFECT_DEPTH);
    this.eyeGlow = scene.add
      .circle(x, y, 16, pattern.skyColor, 0.82)
      .setStrokeStyle(3, 0xffffff, 0.75)
      .setDepth(EFFECT_DEPTH + 1);
  }

  sync(x: number, y: number, time: number, phaseTwo: boolean) {
    this.haloGlow
      .setPosition(x, y - 68)
      .setRotation(
        phaseTwo ? -0.14 + Math.sin(time * 0.001) * 0.05 : time * 0.0004,
      );
    this.eyeGlow.setPosition(x, y);
  }

  clearTelegraph() {
    this.telegraph.clear();
  }

  showRecovery(phaseTwo: boolean) {
    this.telegraph.clear();
    this.haloGlow.setAlpha(0.8).setScale(1);
    this.eyeGlow.setAlpha(phaseTwo ? 0.95 : 0.82);
  }

  beginPhaseTwo() {
    this.haloGlow
      .setFillStyle(this.pattern.corruptionColor, 0.35)
      .setStrokeStyle(4, this.pattern.goldColor, 0.7)
      .setRotation(-0.14);
  }

  drawPhaseTransition(time: number) {
    const pulse = 0.4 + Math.sin(time * 0.025) * 0.22;
    const width = this.scene.cameras.main.width;
    const height = this.scene.cameras.main.height;
    this.phaseOverlay
      .clear()
      .fillStyle(this.pattern.corruptionColor, 0.08)
      .fillRect(0, 0, width, height)
      .lineStyle(3, this.pattern.skyColor, pulse)
      .lineBetween(0, height * 0.28, width * 0.34, height * 0.48)
      .lineBetween(width * 0.34, height * 0.48, width * 0.22, height * 0.82)
      .lineBetween(width, height * 0.22, width * 0.66, height * 0.46)
      .lineBetween(width * 0.66, height * 0.46, width * 0.78, height * 0.86);
    this.eyeGlow
      .setFillStyle(this.pattern.skyColor, 1)
      .setScale(1 + Math.sin(time * 0.025) * 0.2);
  }

  endPhaseTransition() {
    this.eyeGlow.setScale(1);
    this.phaseOverlay.clear();
  }

  drawHaloWarning(
    x: number,
    y: number,
    gapAngle: number,
    time: number,
    progress: number,
  ) {
    const pulse = 0.45 + progress * 0.5;
    this.haloGlow.setAlpha(pulse).setScale(1 + Math.sin(time * 0.02) * 0.06);
    this.telegraph
      .lineStyle(4, this.pattern.goldColor, pulse)
      .strokeCircle(x, y - 64, 72 + progress * 12)
      .lineStyle(5, this.pattern.skyColor, 0.9)
      .lineBetween(
        x,
        y - 64,
        x + Math.cos(gapAngle) * 92,
        y - 64 + Math.sin(gapAngle) * 92,
      );
  }

  endHalo() {
    this.haloGlow.setScale(1);
  }

  drawWingWarning(x: number, y: number, time: number, step: number) {
    const pulse = 0.4 + Math.sin(time * 0.025) * 0.18;
    this.telegraph.fillStyle(this.pattern.goldColor, pulse);
    if (step === 0 || step === 2) {
      this.telegraph.fillTriangle(
        x - 40,
        y - 20,
        x - 155,
        y - 105,
        x - 125,
        y + 80,
      );
    }
    if (step === 1 || step === 2) {
      this.telegraph.fillTriangle(
        x + 40,
        y - 20,
        x + 155,
        y - 105,
        x + 125,
        y + 80,
      );
    }
  }

  drawEyeTracking(
    targetX: number,
    targetY: number,
    time: number,
    progress: number,
  ) {
    const pulse = 0.55 + Math.sin(time * 0.03) * 0.2;
    this.telegraph
      .lineStyle(3, this.pattern.skyColor, pulse)
      .strokeCircle(targetX, targetY, 46 - progress * 18)
      .lineStyle(1, 0xffffff, 0.65)
      .lineBetween(this.eyeGlow.x, this.eyeGlow.y, targetX, targetY);
  }

  drawEyeLocked(targetX: number, targetY: number, time: number) {
    const pulse = 0.65 + Math.sin(time * 0.045) * 0.25;
    this.telegraph
      .fillStyle(this.pattern.goldColor, 0.12)
      .fillCircle(targetX, targetY, this.pattern.eye.orbRadius)
      .lineStyle(4, this.pattern.goldColor, pulse)
      .strokeCircle(targetX, targetY, this.pattern.eye.orbRadius);
  }

  beginSalvation() {
    this.telegraph.clear();
  }

  drawSalvationTransition(
    progress: number,
    centerX: number,
    centerY: number,
  ) {
    this.phaseOverlay
      .clear()
      .fillStyle(this.pattern.goldColor, progress * 0.32)
      .fillRect(
        0,
        0,
        this.scene.cameras.main.width,
        this.scene.cameras.main.height,
      );
    this.telegraph
      .lineStyle(5, this.pattern.goldColor, 0.8)
      .strokeCircle(centerX, centerY, 70 + progress * 170);
  }

  clearOverlay() {
    this.phaseOverlay.clear();
  }

  exposeCore() {
    this.eyeGlow
      .setFillStyle(0xffffff, 1)
      .setStrokeStyle(5, this.pattern.skyColor, 1)
      .setScale(1.55);
    this.haloGlow
      .setFillStyle(this.pattern.corruptionColor, 0.5)
      .setStrokeStyle(3, this.pattern.skyColor, 0.5)
      .setRotation(-0.28);
  }

  drawExposedCore(x: number, y: number, time: number) {
    const pulse = 0.65 + Math.sin(time * 0.035) * 0.25;
    this.telegraph
      .lineStyle(5, this.pattern.skyColor, pulse)
      .strokeCircle(x, y, 34 + pulse * 10)
      .lineStyle(2, 0xffffff, pulse)
      .strokeCircle(x, y, 52 + pulse * 12);
  }

  defeat(x: number, y: number) {
    this.telegraph.clear();
    this.phaseOverlay.clear();
    this.haloGlow.setVisible(false);
    this.eyeGlow.setVisible(false);

    for (let index = 0; index < 14; index += 1) {
      const angle = (index / 14) * Math.PI * 2;
      const shard = this.scene.add
        .rectangle(
          x,
          y,
          8 + (index % 3) * 5,
          18 + (index % 4) * 6,
          index % 2 === 0 ? this.pattern.goldColor : this.pattern.skyColor,
          0.9,
        )
        .setRotation(angle)
        .setDepth(EFFECT_DEPTH + 2);
      this.scene.tweens.add({
        targets: shard,
        x: x + Math.cos(angle) * (160 + (index % 4) * 45),
        y: y + Math.sin(angle) * (120 + (index % 3) * 50),
        rotation: angle + Math.PI,
        alpha: 0,
        duration: 900,
        ease: 'Quad.easeOut',
        onComplete: () => shard.destroy(),
      });
    }
  }

  destroy() {
    this.telegraph.destroy();
    this.phaseOverlay.destroy();
    this.haloGlow.destroy();
    this.eyeGlow.destroy();
  }
}
