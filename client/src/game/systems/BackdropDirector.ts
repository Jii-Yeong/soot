import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '@/game/config/gameDimensions';
import type {
  StageBackground,
  StageConfig,
  StagePalette,
} from '@/game/config/stageConfig';
import {
  getParallaxLayerWidth,
  getParallaxScrollFactor,
} from '@/game/config/worldConfig';
import { StageBackgroundPreloader } from '@/game/systems/StageBackgroundPreloader';

const BACKDROP_DEPTH = {
  far: -12,
  middle: -11,
  near: -10,
} as const;

const PROCEDURAL_PARALLAX = {
  grid: 0.25,
  accent: 0.5,
} as const;

type BackdropConfig = Pick<StageConfig, 'background' | 'palette'>;

export class BackdropDirector {
  private layers: Phaser.GameObjects.GameObject[] = [];
  private neonFlickerTimer?: Phaser.Time.TimerEvent;
  private readonly backgroundPreloader: StageBackgroundPreloader;
  private activeStage?: { config: StageConfig; width: number };

  constructor(private readonly scene: Phaser.Scene) {
    this.backgroundPreloader = new StageBackgroundPreloader(
      scene,
      this.handleBackgroundReady,
    );
  }

  show(
    stage: StageConfig,
    stageWidth: number,
    nextStage: StageConfig | undefined,
  ) {
    this.activeStage = { config: stage, width: stageWidth };
    this.draw(stage, stageWidth);
    // The current stage is normally cached by the previous scene or stage.
    // Queueing it again is a no-op unless that speculative request failed.
    this.backgroundPreloader.preload(stage);
    this.backgroundPreloader.preload(nextStage);
  }

  private draw({ background, palette }: BackdropConfig, stageWidth: number) {
    this.clear();

    if (background && this.scene.textures.exists(background.key)) {
      this.drawImage(background, stageWidth);
      return;
    }

    this.drawProcedural(palette, stageWidth);
  }

  private handleBackgroundReady = (stage: StageConfig) => {
    if (stage.id !== this.activeStage?.config.id) {
      return;
    }

    this.draw(stage, this.activeStage.width);
  };

  private clear() {
    this.neonFlickerTimer?.remove();
    this.neonFlickerTimer = undefined;

    for (const layer of this.layers) {
      layer.destroy();
    }
    this.layers = [];
  }

  private drawImage(background: StageBackground, stageWidth: number) {
    const image = this.scene.add
      .image(0, GAME_HEIGHT, background.key)
      .setOrigin(0, 1)
      .setDepth(BACKDROP_DEPTH.near);
    const coverScale = Math.max(
      1,
      GAME_WIDTH / image.width,
      GAME_HEIGHT / image.height,
    );

    image.setScale(coverScale);
    image.setScrollFactor(
      getParallaxScrollFactor(image.displayWidth, stageWidth),
      0,
    );
    this.layers.push(image);
  }

  private drawProcedural(palette: StagePalette, stageWidth: number) {
    const farLayer = this.scene.add
      .graphics()
      .setDepth(BACKDROP_DEPTH.far)
      .setScrollFactor(0);
    farLayer.fillGradientStyle(
      palette.backgroundTop,
      palette.backgroundTop,
      palette.backgroundBottom,
      palette.backgroundBottom,
    );
    farLayer.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    const gridWidth = getParallaxLayerWidth(
      PROCEDURAL_PARALLAX.grid,
      stageWidth,
    );
    const gridLayer = this.scene.add
      .graphics()
      .setDepth(BACKDROP_DEPTH.middle)
      .setScrollFactor(PROCEDURAL_PARALLAX.grid, 0);
    gridLayer.lineStyle(1, palette.gridLine, 0.55);
    for (let x = 64; x < gridWidth; x += 64) {
      gridLayer.lineBetween(x, 0, x, GAME_HEIGHT - 64);
    }
    for (let y = 80; y < GAME_HEIGHT - 64; y += 64) {
      gridLayer.lineBetween(0, y, gridWidth, y);
    }

    const accentWidth = getParallaxLayerWidth(
      PROCEDURAL_PARALLAX.accent,
      stageWidth,
    );
    const accentLayer = this.scene.add
      .graphics()
      .setDepth(BACKDROP_DEPTH.near)
      .setScrollFactor(PROCEDURAL_PARALLAX.accent, 0);
    accentLayer.fillStyle(palette.accentPrimary, 0.8);
    accentLayer.fillRect(0, 110, accentWidth, 3);

    const neonAccent = this.scene.add
      .rectangle(0, 116, accentWidth * 0.36, 1, palette.accentSecondary, 0.7)
      .setOrigin(0, 0.5)
      .setDepth(BACKDROP_DEPTH.near)
      .setScrollFactor(PROCEDURAL_PARALLAX.accent, 0);

    this.layers.push(farLayer, gridLayer, accentLayer, neonAccent);
    this.startNeonFlicker(neonAccent, palette.neonFlicker);
  }

  private startNeonFlicker(
    neonAccent: Phaser.GameObjects.Rectangle,
    enabled = false,
  ) {
    if (!enabled) {
      return;
    }

    this.neonFlickerTimer = this.scene.time.addEvent({
      delay: 90,
      loop: true,
      callback: () => {
        neonAccent.setAlpha(Math.random() < 0.15 ? 0.15 : 0.7);
      },
    });
  }
}
