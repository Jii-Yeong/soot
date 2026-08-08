import type Phaser from 'phaser';
import { getStageAssetManifest } from '@/game/config/stageAssetConfig';
import type { StageConfig } from '@/game/config/stageConfig';
import { createAtlasAnimations } from '@/game/systems/createAtlasAnimations';

const FILE_LOAD_ERROR_EVENT = 'loaderror';
const atlasCompleteEvent = (key: string) => `filecomplete-atlasjson-${key}`;
const imageCompleteEvent = (key: string) => `filecomplete-image-${key}`;

/** 활성 스테이지를 막지 않고 한 스테이지의 선택적 전투 아트를 로드함. */
export class StageAssetPreloader {
  private readonly pendingSettlers = new Map<string, Set<() => void>>();

  constructor(private readonly scene: Phaser.Scene) {}

  /**
   * @param onReady 이 스테이지가 아직 필요로 하는 텍스처가 모두 도착하면 한
   *   번 호출됨. 이미 워밍된 스테이지에서는 아예 등록되지 않으므로, 호출자는
   *   초기 빌드가 콜드 로드보다 앞서 나간 경우에만 방을 다시 스킨하면 됨.
   */
  preload(stage: StageConfig | undefined, onReady?: () => void) {
    if (!stage) {
      return false;
    }

    const { enemyAtlases, terrainImages } = getStageAssetManifest(stage);
    let queued = false;
    // 아직 텍스처 캐시에 없는 모든 키 — 여기서 새로 큐에 넣었든, 이전의
    // 예측 프리로드에서 아직 로딩 중이든 — 그래서 onReady는 이 호출이
    // 큐에 넣은 것만이 아니라 전체 집합을 기다림.
    const awaited = [
      ...enemyAtlases.map(({ texture }) => texture),
      ...terrainImages.map(({ key }) => key),
    ].filter((key) => !this.scene.textures.exists(key));
    const remaining = onReady ? new Set(awaited) : undefined;
    const settle = (key: string) => {
      if (!remaining?.delete(key) || remaining.size > 0) {
        return;
      }
      onReady?.();
    };

    for (const atlas of enemyAtlases) {
      if (this.scene.textures.exists(atlas.texture)) {
        createAtlasAnimations(this.scene.anims, atlas);
        continue;
      }

      queued =
        this.queueTexture(
          atlas.texture,
          atlasCompleteEvent(atlas.texture),
          () => this.scene.load.atlas(atlas.texture, atlas.png, atlas.json),
          () => createAtlasAnimations(this.scene.anims, atlas),
          remaining ? () => settle(atlas.texture) : undefined,
        ) || queued;
    }

    for (const image of terrainImages) {
      if (this.scene.textures.exists(image.key)) {
        continue;
      }

      queued =
        this.queueTexture(
          image.key,
          imageCompleteEvent(image.key),
          () => this.scene.load.image(image.key, image.path),
          undefined,
          remaining ? () => settle(image.key) : undefined,
        ) || queued;
    }

    if (queued && !this.scene.load.isLoading()) {
      this.scene.load.start();
    }

    return queued;
  }

  private queueTexture(
    key: string,
    completeEvent: string,
    enqueue: () => void,
    onComplete?: () => void,
    onSettled?: () => void,
  ) {
    const pendingSettlers = this.pendingSettlers.get(key);
    if (pendingSettlers) {
      if (onSettled) {
        pendingSettlers.add(onSettled);
      }
      return false;
    }

    const settlers = new Set<() => void>();
    if (onSettled) {
      settlers.add(onSettled);
    }
    this.pendingSettlers.set(key, settlers);
    const finish = () => {
      const callbacks = this.pendingSettlers.get(key);
      this.pendingSettlers.delete(key);
      for (const callback of callbacks ?? []) {
        callback();
      }
    };
    const handleComplete = () => {
      this.scene.load.off(FILE_LOAD_ERROR_EVENT, handleError);
      onComplete?.();
      finish();
    };
    const handleError = (file: Phaser.Loader.File) => {
      if (file.key !== key) {
        return;
      }

      this.scene.load.off(completeEvent, handleComplete);
      this.scene.load.off(FILE_LOAD_ERROR_EVENT, handleError);
      finish();
    };

    this.scene.load.once(completeEvent, handleComplete);
    this.scene.load.on(FILE_LOAD_ERROR_EVENT, handleError);
    enqueue();
    return true;
  }
}
