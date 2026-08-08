import {
  defineEnemyAtlasSet,
  type EnemyAnimationFrame,
  type EnemySpriteConfig,
  type EnemySpriteGeometry,
} from '@/game/config/enemyAnimationAtlasConfig';

type CeilingMaintainerTag =
  | 'pipeIdle'
  | 'pipeMove'
  | 'warning'
  | 'falling'
  | 'groundDash'
  | 'floorIdle';

const TAG_FRAMES: Record<
  CeilingMaintainerTag,
  readonly EnemyAnimationFrame[]
> = {
  pipeIdle: [0, 1].map((frame) => ({
    frame: `${frame}`,
    duration: 220,
  })),
  pipeMove: [2, 3].map((frame) => ({
    frame: `${frame}`,
    duration: 140,
  })),
  warning: [{ frame: '4', duration: 180 }],
  // 5번은 가로 돌진 포즈라 낙하 중에는 사용하지 않음.
  falling: [{ frame: '6', duration: 180 }],
  groundDash: [{ frame: '10', duration: 140 }],
  floorIdle: [7, 8, 9].map((frame) => ({
    frame: `${frame}`,
    duration: 180,
  })),
};

export type CeilingMaintainerSpriteConfig = EnemySpriteConfig<
  CeilingMaintainerTag,
  EnemySpriteGeometry
>;

const CEILING_MAINTAINER_ATLAS_SET = defineEnemyAtlasSet({
  slug: 'flying',
  stages: [3],
  tagFrames: TAG_FRAMES,
  loopingTags: new Set<CeilingMaintainerTag>([
    'pipeIdle',
    'pipeMove',
    'floorIdle',
  ]),
  sprite: { scale: 1, bodyWidth: 60, bodyHeight: 86 },
});

export const CEILING_MAINTAINER_ANIMATION_ATLASES =
  CEILING_MAINTAINER_ATLAS_SET.atlases;
export const STAGE_THREE_CEILING_MAINTAINER_SPRITE:
  CeilingMaintainerSpriteConfig = CEILING_MAINTAINER_ATLAS_SET.sprites[3];
