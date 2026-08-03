import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '@/game/config/gameDimensions';
import { gameEvents } from '@/game/events/gameEvents';

/**
 * A one-click browser gate. Phaser unlocks Web Audio from this pointer gesture,
 * then the actual title can begin its music without making the title's Enter
 * prompt serve two unrelated jobs.
 */
export class StartScene extends Phaser.Scene {
  constructor() {
    super('start');
  }

  create() {
    gameEvents.emit('scene-changed', 'start');

    this.add
      .text(
        GAME_WIDTH / 2,
        GAME_HEIGHT / 2,
        'CLICK OR PRESS ANY KEY TO START',
        {
        color: '#b6ffe4',
        fontFamily: 'Arial, sans-serif',
        fontSize: '18px',
        fontStyle: 'bold',
        },
      )
      .setOrigin(0.5);

    let isStarting = false;
    const startTitle = () => {
      if (isStarting) {
        return;
      }

      isStarting = true;
      this.scene.start('title');
    };

    this.input.once('pointerdown', startTitle);
    this.input.keyboard?.once('keydown', startTitle);
  }
}
