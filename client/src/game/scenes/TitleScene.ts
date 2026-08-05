import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '@/game/config/gameDimensions';
import {
  STARTING_STAGE_INDEX,
  STAGES,
} from '@/game/config/stageConfig';
import { gameEvents } from '@/game/events/gameEvents';
import { StageAssetPreloader } from '@/game/systems/StageAssetPreloader';

export class TitleScene extends Phaser.Scene {
  constructor() {
    super('title');
  }

  preload() {
    this.load.image('title-player', '/assets/title-player.png');
  }

  create() {
    gameEvents.emit('scene-changed', 'title');

    // 1스테이지 배경을 cover로 채움(비율 유지, 다른 해상도 지원). 맨 뒤.
    const bg = STAGES[STARTING_STAGE_INDEX]?.background;
    if (bg && this.textures.exists(bg.key)) {
      const image = this.add
        .image(GAME_WIDTH / 2, GAME_HEIGHT / 2, bg.key)
        .setDepth(-2);
      image.setScale(
        Math.max(GAME_WIDTH / image.width, GAME_HEIGHT / image.height),
      );
    }

    // 우하단 정렬, 높이는 화면의 80%(비율 유지). 배경 앞, 텍스트 뒤.
    const player = this.add
      .image(GAME_WIDTH, GAME_HEIGHT, 'title-player')
      .setOrigin(1, 1)
      .setDepth(-1);
    player.setScale((GAME_HEIGHT * 0.8) / player.height);

    // SOOT: 검은 글자로 잠시 표시 후 페이드아웃.
    const title = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 32, 'SOOT', {
        color: '#0b0b0b',
        fontFamily: 'Arial, sans-serif',
        fontSize: '84px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
    this.tweens.add({
      targets: title,
      alpha: 0,
      delay: 1200,
      duration: 600,
      onComplete: () => title.destroy(),
    });

    const prompt = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 68, 'PRESS ENTER', {
        color: '#b6ffe4',
        fontFamily: 'Arial, sans-serif',
        fontSize: '18px',
      })
      .setOrigin(0.5);

    const startingStage = STAGES[STARTING_STAGE_INDEX];
    const background = startingStage?.background;
    let queued = false;

    if (background && !this.textures.exists(background.key)) {
      this.load.image(background.key, background.path);
      queued = true;
    }
    queued = new StageAssetPreloader(this).preload(startingStage) || queued;
    if (queued && !this.load.isLoading()) {
      this.load.start();
    }

    this.input.keyboard?.once('keydown-ENTER', () => {
      if (this.load.isLoading()) {
        prompt.setText('LOADING...');
        this.load.once('complete', () => this.scene.start('game'));
        return;
      }

      this.scene.start('game');
    });
  }
}
