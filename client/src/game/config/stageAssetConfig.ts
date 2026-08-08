import type { EnemyAnimationAtlasConfig } from '@/game/config/enemyAnimationAtlasConfig';
import { FLYING_ENEMY_ANIMATION_ATLASES } from '@/game/config/flyingEnemyAnimationConfig';
import { MELEE_ENEMY_ANIMATION_ATLASES } from '@/game/config/meleeEnemyAnimationConfig';
import { RANGED_ENEMY_ANIMATION_ATLASES } from '@/game/config/rangedEnemyAnimationConfig';
import type { StageConfig } from '@/game/config/stageConfig';
import type { SliceImage } from '@/game/config/terrainSkinConfig';

export type StageEnemyAtlas = EnemyAnimationAtlasConfig<string>;

export type StageAssetManifest = {
  enemyAtlases: readonly StageEnemyAtlas[];
  terrainImages: readonly SliceImage[];
};

const ENEMY_ATLAS_BY_TEXTURE = new Map<string, StageEnemyAtlas>(
  [
    ...FLYING_ENEMY_ANIMATION_ATLASES,
    ...RANGED_ENEMY_ANIMATION_ATLASES,
    ...MELEE_ENEMY_ANIMATION_ATLASES,
  ].map((atlas) => [atlas.texture, atlas as StageEnemyAtlas]),
);

const manifestCache = new WeakMap<StageConfig, StageAssetManifest>();

/** 한 스테이지가 가진 선택적 적·지형 아트를 해석하고 캐시함. */
export function getStageAssetManifest(stage: StageConfig): StageAssetManifest {
  const cached = manifestCache.get(stage);
  if (cached) {
    return cached;
  }

  const enemyAtlases = [
    stage.flyingSprite?.texture,
    stage.rangedSprite?.texture,
    stage.meleeSprite?.texture,
  ].flatMap((texture) => {
    const atlas = texture ? ENEMY_ATLAS_BY_TEXTURE.get(texture) : undefined;
    return atlas ? [atlas] : [];
  }).concat(stage.enemyAtlases ?? []);
  const terrainImages = [
    stage.floorSkin,
    stage.terrainSkin,
    stage.pipeSkin,
  ].flatMap((skin) => (skin ? [skin.left, skin.middle, skin.right] : []));
  const manifest = { enemyAtlases, terrainImages };

  manifestCache.set(stage, manifest);
  return manifest;
}
