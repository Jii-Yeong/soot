import {
  defineEnemyAtlasSet,
  type EnemyAnimationFrame,
  type EnemySpriteConfig,
  type GroundedEnemySpriteGeometry,
} from '@/game/config/enemyAnimationAtlasConfig';

type MeleeTag = 'idle' | 'walk' | 'attack' | 'death';

/** Frame ranges and frame times copied from the supplied atlas JSON. */
const TAG_FRAMES: Record<MeleeTag, readonly EnemyAnimationFrame[]> = {
  idle: [0, 1].map((frame) => ({ frame: `${frame}`, duration: 130 })),
  walk: [2, 3].map((frame) => ({ frame: `${frame}`, duration: 130 })),
  attack: [
    { frame: '4', duration: 200 },
    { frame: '5', duration: 100 },
  ],
  death: [
    { frame: '6', duration: 200 },
    { frame: '7', duration: 100 },
  ],
};

export type MeleeSpriteConfig = EnemySpriteConfig<
  MeleeTag,
  GroundedEnemySpriteGeometry
>;

const MELEE_ATLAS_SET = defineEnemyAtlasSet({
  slug: 'neared',
  stages: [1, 2],
  tagFrames: TAG_FRAMES,
  loopingTags: new Set<MeleeTag>(['idle', 'walk']),
  // Trimmed sourceSize is 160x160; feet sit near y=146, centred near x=89.
  sprite: {
    scale: 1,
    bodyWidth: 46,
    bodyHeight: 96,
    bodyOffsetX: 66,
    bodyOffsetY: 50,
  },
});

export const MELEE_ENEMY_ANIMATION_ATLASES = MELEE_ATLAS_SET.atlases;
export const STAGE_ONE_MELEE_SPRITE: MeleeSpriteConfig =
  MELEE_ATLAS_SET.sprites[1];
export const STAGE_TWO_MELEE_SPRITE: MeleeSpriteConfig =
  MELEE_ATLAS_SET.sprites[2];
