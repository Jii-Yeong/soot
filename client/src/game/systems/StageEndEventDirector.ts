import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '@/game/config/gameDimensions';
import type { StageEndEvent } from '@/game/config/stageConfig';

const SIEGE_SILHOUETTE_X_POSITIONS = [340, 470, 600, 730, 860, 990];
const SIEGE_REVEAL_INTERVAL = 200;

export class StageEndEventDirector {
  constructor(private readonly scene: Phaser.Scene) {}

  play(event: StageEndEvent, onComplete: () => void) {
    switch (event) {
      case 'siege':
        this.playSiege(onComplete);
        return;
      default: {
        const unhandledEvent: never = event;
        throw new Error(`Unsupported stage end event: ${unhandledEvent}`);
      }
    }
  }

  private playSiege(onComplete: () => void) {
    const viewportLeft = this.scene.cameras.main.scrollX;
    const statusText = this.scene.add
      .text(GAME_WIDTH / 2, 154, 'CONTAINMENT PROTOCOL', {
        color: '#ff7180',
        fontFamily: 'Arial, sans-serif',
        fontSize: '17px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setDepth(20)
      .setScrollFactor(0);

    SIEGE_SILHOUETTE_X_POSITIONS.forEach((x, index) => {
      const worldX = viewportLeft + x;
      const body = this.scene.add
        .rectangle(worldX, GAME_HEIGHT - 116, 36, 98, 0x1b2332, 0.98)
        .setDepth(6)
        .setAlpha(0);
      const eye = this.scene.add
        .rectangle(worldX, GAME_HEIGHT - 150, 24, 6, 0xff4657, 1)
        .setDepth(6)
        .setAlpha(0);
      const eyeGlow = this.scene.add
        .rectangle(worldX, GAME_HEIGHT - 150, 40, 16, 0xff4657, 0.28)
        .setDepth(5)
        .setAlpha(0);

      this.scene.time.delayedCall(SIEGE_REVEAL_INTERVAL * index, () => {
        this.scene.tweens.add({ targets: body, alpha: 1, duration: 260 });
        this.scene.tweens.add({
          targets: [eye, eyeGlow],
          alpha: 1,
          duration: 180,
          delay: 120,
        });
        this.scene.cameras.main.shake(110, 0.003);
      });
    });

    const blackoutDelay =
      SIEGE_REVEAL_INTERVAL * SIEGE_SILHOUETTE_X_POSITIONS.length + 360;
    this.scene.time.delayedCall(blackoutDelay, () => {
      statusText.destroy();
      this.scene.cameras.main.shake(320, 0.011);
      const blackout = this.scene.add
        .rectangle(
          GAME_WIDTH / 2,
          GAME_HEIGHT / 2,
          GAME_WIDTH,
          GAME_HEIGHT,
          0x000000,
          1,
        )
        .setDepth(95)
        .setAlpha(0)
        .setScrollFactor(0);
      this.scene.tweens.add({
        targets: blackout,
        alpha: 1,
        duration: 520,
        onComplete,
      });
    });
  }
}
