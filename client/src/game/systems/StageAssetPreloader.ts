import type Phaser from 'phaser';
import type { EnemyAnimationFrame } from '@/game/config/enemyAnimationAtlasConfig';
import {
  getStageAssetManifest,
  type StageEnemyAtlas,
} from '@/game/config/stageAssetConfig';
import type { StageConfig } from '@/game/config/stageConfig';

const FILE_LOAD_ERROR_EVENT = 'loaderror';
const FILE_COMPLETE_EVENT = 'filecomplete';
const atlasCompleteEvent = (key: string) => `filecomplete-atlasjson-${key}`;
const imageCompleteEvent = (key: string) => `filecomplete-image-${key}`;

/** Loads one stage's optional combat art without blocking the active stage. */
export class StageAssetPreloader {
  private readonly pendingKeys = new Set<string>();

  constructor(private readonly scene: Phaser.Scene) {}

  /**
   * @param onReady Fires once every texture this stage still needs has arrived.
   *   Skipped entirely when the stage is already warm, so the caller only has to
   *   re-skin the room when the initial build raced ahead of a cold load.
   */
  preload(stage: StageConfig | undefined, onReady?: () => void) {
    if (!stage) {
      return false;
    }

    const { enemyAtlases, terrainImages } = getStageAssetManifest(stage);
    let queued = false;
    // Every key not yet in the texture cache — whether newly queued here or
    // still in flight from an earlier speculative preload — so onReady waits
    // for the whole set, not just what this call happened to enqueue.
    const awaited: string[] = [];

    for (const atlas of enemyAtlases) {
      if (this.scene.textures.exists(atlas.texture)) {
        this.createEnemyAnimations(atlas);
        continue;
      }

      awaited.push(atlas.texture);
      queued =
        this.queueTexture(
          atlas.texture,
          atlasCompleteEvent(atlas.texture),
          () => this.scene.load.atlas(atlas.texture, atlas.png, atlas.json),
          () => this.createEnemyAnimations(atlas),
        ) || queued;
    }

    for (const image of terrainImages) {
      if (this.scene.textures.exists(image.key)) {
        continue;
      }

      awaited.push(image.key);
      queued =
        this.queueTexture(
          image.key,
          imageCompleteEvent(image.key),
          () => this.scene.load.image(image.key, image.path),
        ) || queued;
    }

    if (onReady && awaited.length > 0) {
      this.whenAllLoaded(awaited, onReady);
    }

    if (queued && !this.scene.load.isLoading()) {
      this.scene.load.start();
    }

    return queued;
  }

  /** Invokes onReady once each awaited key has either loaded or failed. */
  private whenAllLoaded(keys: readonly string[], onReady: () => void) {
    const remaining = new Set(keys);
    const settle = (key: string) => {
      if (!remaining.delete(key) || remaining.size > 0) {
        return;
      }

      this.scene.load.off(FILE_COMPLETE_EVENT, onComplete);
      this.scene.load.off(FILE_LOAD_ERROR_EVENT, onError);
      onReady();
    };
    const onComplete = (key: string) => settle(key);
    const onError = (file: Phaser.Loader.File) => settle(file.key);

    this.scene.load.on(FILE_COMPLETE_EVENT, onComplete);
    this.scene.load.on(FILE_LOAD_ERROR_EVENT, onError);
  }

  private queueTexture(
    key: string,
    completeEvent: string,
    enqueue: () => void,
    onComplete?: () => void,
  ) {
    if (this.pendingKeys.has(key)) {
      return false;
    }

    const handleComplete = () => {
      this.scene.load.off(FILE_LOAD_ERROR_EVENT, handleError);
      this.pendingKeys.delete(key);
      onComplete?.();
    };
    const handleError = (file: Phaser.Loader.File) => {
      if (file.key !== key) {
        return;
      }

      this.scene.load.off(completeEvent, handleComplete);
      this.scene.load.off(FILE_LOAD_ERROR_EVENT, handleError);
      this.pendingKeys.delete(key);
    };

    this.pendingKeys.add(key);
    this.scene.load.once(completeEvent, handleComplete);
    this.scene.load.on(FILE_LOAD_ERROR_EVENT, handleError);
    enqueue();
    return true;
  }

  private createEnemyAnimations(atlas: StageEnemyAtlas) {
    for (const [tag, frames] of Object.entries(atlas.tagFrames) as [
      string,
      readonly EnemyAnimationFrame[],
    ][]) {
      const animationKey = atlas.animations[tag];
      if (this.scene.anims.exists(animationKey)) {
        continue;
      }

      this.scene.anims.create({
        key: animationKey,
        frames: frames.map(({ frame, duration }) => ({
          key: atlas.texture,
          frame,
          duration,
        })),
        repeat: atlas.loopingTags.has(tag) ? -1 : 0,
      });
    }
  }
}
