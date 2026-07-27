import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '@/game/config/gameDimensions';
import { gameEvents } from '@/game/events/gameEvents';

export class TitleScene extends Phaser.Scene {
  constructor() {
    super('title');
  }

  create() {
    gameEvents.emit('scene-changed', 'title');

    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 32, 'SOOT', {
        color: '#e8ece9',
        fontFamily: 'Arial, sans-serif',
        fontSize: '84px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 68, 'PRESS ENTER', {
        color: '#b6ffe4',
        fontFamily: 'Arial, sans-serif',
        fontSize: '18px',
      })
      .setOrigin(0.5);

    this.input.keyboard?.once('keydown-ENTER', () => {
      this.scene.start('game');
    });
  }
}
