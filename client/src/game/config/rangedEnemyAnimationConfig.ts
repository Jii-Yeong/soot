import {
  defineEnemyAtlasSet,
  type EnemyAnimationFrame,
  type EnemySpriteConfig,
  type GroundedEnemySpriteGeometry,
} from '@/game/config/enemyAnimationAtlasConfig';

type RangedTag = 'idle' | 'walk' | 'attack' | 'death';

/** Frame ranges and frame times copied from the supplied atlas JSON. */
const TAG_FRAMES: Record<RangedTag, readonly EnemyAnimationFrame[]> = {
  idle: [0, 1].map((frame) => ({ frame: `${frame}`, duration: 100 })),
  walk: [2, 3].map((frame) => ({ frame: `${frame}`, duration: 180 })),
  attack: [4, 5].map((frame) => ({ frame: `${frame}`, duration: 100 })),
  death: [
    { frame: '6', duration: 200 },
    { frame: '7', duration: 100 },
  ],
};

export type RangedSpriteConfig = EnemySpriteConfig<
  RangedTag,
  GroundedEnemySpriteGeometry
>;

const RANGED_ATLAS_SET = defineEnemyAtlasSet({
  slug: 'ranged',
  stages: [1, 2],
  tagFrames: TAG_FRAMES,
  loopingTags: new Set<RangedTag>(['idle', 'walk']),
  // Trimmed sourceSize is 120x120; feet sit near y=112, centred near x=66.
  sprite: {
    scale: 1,
    bodyWidth: 44,
    bodyHeight: 86,
    bodyOffsetX: 44,
    bodyOffsetY: 26,
  },
});

export const RANGED_ENEMY_ANIMATION_ATLASES = RANGED_ATLAS_SET.atlases;
export const STAGE_ONE_RANGED_SPRITE: RangedSpriteConfig =
  RANGED_ATLAS_SET.sprites[1];
export const STAGE_TWO_RANGED_SPRITE: RangedSpriteConfig =
  RANGED_ATLAS_SET.sprites[2];
