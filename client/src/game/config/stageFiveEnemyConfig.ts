import {
  defineEnemyAtlasSet,
  type EnemyAnimationFrame,
} from '@/game/config/enemyAnimationAtlasConfig';

type ChoirSupporterTag =
  | 'idle'
  | 'fly'
  | 'crossShot'
  | 'homingPair'
  | 'noteWave'
  | 'deathFall'
  | 'deathLand';

const CHOIR_SUPPORTER_TAG_FRAMES: Record<
  ChoirSupporterTag,
  readonly EnemyAnimationFrame[]
> = {
  idle: [0, 1].map((frame) => ({ frame: `${frame}`, duration: 180 })),
  fly: [2, 3].map((frame) => ({ frame: `${frame}`, duration: 180 })),
  crossShot: [{ frame: '4', duration: 100 }],
  homingPair: [{ frame: '5', duration: 100 }],
  noteWave: [{ frame: '6', duration: 100 }],
  deathFall: [{ frame: '7', duration: 500 }],
  deathLand: [{ frame: '8', duration: 180 }],
};

const CHOIR_SUPPORTER_SCALE = 72 / 78;
const CHOIR_SUPPORTER_SOURCE_SIZE = 120;
const CHOIR_SUPPORTER_BODY_SIZE = 42 / CHOIR_SUPPORTER_SCALE;

const CHOIR_SUPPORTER_ATLAS_SET = defineEnemyAtlasSet({
  slug: 'supporter',
  stages: [5],
  tagFrames: CHOIR_SUPPORTER_TAG_FRAMES,
  loopingTags: new Set<ChoirSupporterTag>(['idle', 'fly']),
  sprite: {
    // 원본 불투명 높이 78px를 게임 내 권장 높이 72px로 표시함.
    scale: CHOIR_SUPPORTER_SCALE,
    bodyWidth: CHOIR_SUPPORTER_BODY_SIZE,
    bodyHeight: CHOIR_SUPPORTER_BODY_SIZE,
    bodyOffset: (CHOIR_SUPPORTER_SOURCE_SIZE - CHOIR_SUPPORTER_BODY_SIZE) / 2,
  },
});

export const CHOIR_SUPPORTER_ANIMATION_ATLASES =
  CHOIR_SUPPORTER_ATLAS_SET.atlases;

export const CHOIR_SUPPORTER_CONFIG = {
  ...CHOIR_SUPPORTER_ATLAS_SET.sprites[5],
  bulletTexture: 'celestial-bullet-placeholder',
  maxHealth: 55,
  aggroRadius: 900,
  moveSpeed: 190,
  warningDuration: 500,
  attackCooldown: 1_250,
  bulletSpeed: 210,
  bulletDamage: 7,
  homingDuration: 600,
  homingTurnRate: 2.8,
} as const;

export const SANCTUM_ENFORCER_CONFIG = {
  texture: 'sanctum-enforcer-placeholder',
  spearTexture: 'celestial-spear-placeholder',
  maxHealth: 115,
  aggroRadius: 940,
  bodyWidth: 52,
  bodyHeight: 72,
  moveSpeed: 250,
  warningDuration: 450,
  attackCooldown: 1_500,
  spearSpeed: 620,
  spearDamage: 12,
  crossSpread: 130,
} as const;

export const CELESTIAL_ORACLE_CONFIG = {
  texture: 'celestial-oracle-placeholder',
  bulletTexture: 'celestial-bullet-placeholder',
  maxHealth: 230,
  aggroRadius: 1_100,
  bodySize: 72,
  moveSpeed: 150,
  warningDuration: 520,
  attackCooldown: 1_800,
  bulletSpeed: 245,
  wallSpeed: 180,
  bulletDamage: 9,
} as const;

export const CELESTIAL_PROJECTILE_BOUNDS = {
  top: 72,
  bottom: 672,
  padding: 96,
} as const;
