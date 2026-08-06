import {
  defineEnemyAtlasSet,
  type EnemyAnimationFrame,
} from '@/game/config/enemyAnimationAtlasConfig';

type ExecutionerDollTag =
  | 'idle'
  | 'fly'
  | 'takeDown'
  | 'slam'
  | 'land'
  | 'death';

/** 제공된 아틀라스 JSON의 태그별 프레임과 재생 시간. */
const EXECUTIONER_DOLL_TAG_FRAMES: Record<
  ExecutionerDollTag,
  readonly EnemyAnimationFrame[]
> = {
  idle: [0, 1].map((frame) => ({
    frame: `${frame}`,
    duration: 220,
  })),
  fly: [2, 3].map((frame) => ({
    frame: `${frame}`,
    duration: 180,
  })),
  // 화면상 5·6·7번 모션은 JSON 프레임 4·5·6에 대응함.
  takeDown: [{ frame: '4', duration: 1_000 }],
  slam: [{ frame: '5', duration: 1_000 }],
  land: [{ frame: '6', duration: 1_000 }],
  death: [7, 8].map((frame) => ({
    frame: `${frame}`,
    duration: 180,
  })),
};

const EXECUTIONER_DOLL_ATLAS_SET = defineEnemyAtlasSet({
  slug: 'takedown',
  stages: [4],
  tagFrames: EXECUTIONER_DOLL_TAG_FRAMES,
  loopingTags: new Set<ExecutionerDollTag>(['idle', 'fly']),
  // sourceSize 140x140에서 불투명 픽셀 하단(y=135)에 바디 하단을 맞춤.
  sprite: {
    scale: 1,
    bodyWidth: 54,
    bodyHeight: 78,
    bodyOffsetX: 43,
    bodyOffsetY: 57,
  },
});

export const EXECUTIONER_DOLL_ANIMATION_ATLASES =
  EXECUTIONER_DOLL_ATLAS_SET.atlases;

export const INFERNAL_HOUND_CONFIG = {
  texture: 'infernal-hound-placeholder',
  maxHealth: 85,
  aggroRadius: 680,
  bodyWidth: 68,
  bodyHeight: 34,
  prowlSpeed: 150,
  warningDuration: 650,
  chargeSpeed: 820,
  maxChargeDuration: 1_000,
  stunDuration: 700,
  attackCooldown: 1_450,
  chargeDamage: 20,
  trailInterval: 90,
  trailLifetime: 1_000,
  trailDamage: 4,
  trailDamageCooldown: 400,
} as const;

export const EXECUTIONER_DOLL_CONFIG = {
  ...EXECUTIONER_DOLL_ATLAS_SET.sprites[4],
  maxHealth: 100,
  aggroRadius: 700,
  hoverSpeed: 230,
  hoverOffset: 190,
  warningDuration: 700,
  slamSpeed: 1_000,
  recoveryDuration: 700,
  attackCooldown: 1_700,
  shockwaveRange: 180,
  shockwaveDamage: 16,
} as const;

export const JUDGMENT_EYE_CONFIG = {
  texture: 'judgment-eye-placeholder',
  bulletTexture: 'judgment-eye-bullet-placeholder',
  maxHealth: 75,
  aggroRadius: 720,
  bodySize: 52,
  moveSpeed: 150,
  trackingDuration: 600,
  orbChargeDuration: 300,
  orbLifetime: 1_000,
  bulletSpeed: 220,
  bulletLifetime: 1_800,
  bulletDamage: 8,
  attackCooldown: 2_100,
  repositionDuration: 800,
} as const;
