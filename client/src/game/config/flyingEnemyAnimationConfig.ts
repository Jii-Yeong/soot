import {
  defineEnemyAtlasSet,
  type EnemyAnimationFrame,
  type EnemySpriteConfig,
  type EnemySpriteGeometry,
} from '@/game/config/enemyAnimationAtlasConfig';

type FlyingTag = 'idle' | 'hit' | 'deathFall' | 'deathLand';

/**
 * 제공된 아틀라스 JSON의 프레임 범위와 프레임 시간. 아틀라스의 `death`
 * 태그(프레임 3-5)를 나눠, 격추된 비행체가 부서지기 전에 먼저 떨어지게 함.
 */
const TAG_FRAMES: Record<FlyingTag, readonly EnemyAnimationFrame[]> = {
  idle: [0, 1].map((frame) => ({ frame: `${frame}`, duration: 180 })),
  hit: [{ frame: '2', duration: 100 }],
  deathFall: [{ frame: '3', duration: 500 }],
  deathLand: [
    { frame: '4', duration: 180 },
    { frame: '5', duration: 100 },
  ],
};

export type FlyingSpriteConfig = EnemySpriteConfig<
  FlyingTag,
  EnemySpriteGeometry
>;

const FLYING_ATLAS_SET = defineEnemyAtlasSet({
  slug: 'flying',
  stages: [1, 2],
  tagFrames: TAG_FRAMES,
  loopingTags: new Set<FlyingTag>(['idle']),
  sprite: { scale: 1, bodyWidth: 50, bodyHeight: 42 },
});

export const FLYING_ENEMY_ANIMATION_ATLASES = FLYING_ATLAS_SET.atlases;
export const STAGE_ONE_FLYING_SPRITE: FlyingSpriteConfig =
  FLYING_ATLAS_SET.sprites[1];
export const STAGE_TWO_FLYING_SPRITE: FlyingSpriteConfig =
  FLYING_ATLAS_SET.sprites[2];
