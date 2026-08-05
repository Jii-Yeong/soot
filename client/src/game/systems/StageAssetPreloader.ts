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

/** 활성 스테이지를 막지 않고 한 스테이지의 선택적 전투 아트를 로드함. */
export class StageAssetPreloader {
  private readonly pendingKeys = new Set<string>();

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

  /** 기다리던 각 키가 로드되거나 실패하면 onReady를 호출함. */
  private whenAllLoaded(keys: readonly string[], onReady: () => void) {
    const remaining = new Set(keys);
    const settle = (key: string) => {
      if (!remaining.delete(key) || remaining.size > 0) {
        return;
      }

      this.scene.load.off(FILE_COMPLETE_EVENT, onComplete);
      this.scene.load.off(FILE_LOAD_ERROR_EVENT, onError);
      // 다음 틱으로 미뤄, 같은 파일 완료 이벤트에서 뒤이어 실행되는 아틀라스
      // 애니메이션 생성이 끝난 뒤에 onReady(리스킨)가 돌게 한다.
      this.scene.time.delayedCall(0, onReady);
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
