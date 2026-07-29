import type Phaser from 'phaser';
import type { StageConfig } from '@/game/config/stageConfig';

const FILE_LOAD_ERROR_EVENT = 'loaderror';
const imageCompleteEvent = (key: string) => `filecomplete-image-${key}`;

type StageReadyListener = (stage: StageConfig) => void;

/**
 * Loads one upcoming stage background at runtime. Texture keys are global, so
 * a completed image is reused across scene restarts and never requested twice.
 */
export class StageBackgroundPreloader {
  private readonly pendingKeys = new Set<string>();

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly onStageReady: StageReadyListener,
  ) {}

  preload(stage: StageConfig | undefined) {
    const background = stage?.background;

    if (
      !background ||
      this.scene.textures.exists(background.key) ||
      this.pendingKeys.has(background.key)
    ) {
      return false;
    }

    const completeEvent = imageCompleteEvent(background.key);
    const handleComplete = () => {
      this.scene.load.off(FILE_LOAD_ERROR_EVENT, handleError);
      this.pendingKeys.delete(background.key);
      this.onStageReady(stage);
    };
    const handleError = (file: Phaser.Loader.File) => {
      if (file.key !== background.key) {
        return;
      }

      this.scene.load.off(completeEvent, handleComplete);
      this.scene.load.off(FILE_LOAD_ERROR_EVENT, handleError);
      this.pendingKeys.delete(background.key);
    };

    this.pendingKeys.add(background.key);
    this.scene.load.once(completeEvent, handleComplete);
    this.scene.load.on(FILE_LOAD_ERROR_EVENT, handleError);
    this.scene.load.image(background.key, background.path);

    if (!this.scene.load.isLoading()) {
      this.scene.load.start();
    }

    return true;
  }
}
