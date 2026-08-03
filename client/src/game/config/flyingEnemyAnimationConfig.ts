import {
  defineEnemyAtlasSet,
  type EnemyAnimationFrame,
  type EnemySpriteConfig,
  type EnemySpriteGeometry,
} from '@/game/config/enemyAnimationAtlasConfig';

type FlyingTag = 'idle' | 'hit' | 'deathFall' | 'deathLand';

/**
 * Frame ranges and frame times from the supplied atlas JSON. The atlas `death`
 * tag (frames 3-5) is split so a downed flyer drops before it breaks apart.
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
