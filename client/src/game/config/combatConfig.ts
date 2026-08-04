export const PLAYER_COMBAT_CONFIG = {
  moveSpeed: 300,
  flightSpeed: 300,
  jumpSpeed: 560,
  fastFallSpeed: 720,
  dash: {
    speed: 760,
    duration: 170,
    cooldown: 800,
  },
} as const;

export const RANGED_ENEMY_COMBAT_CONFIG = {
  maxHealth: 100,
  aggroRadius: 520,
  fireInterval: 900,
  /** 재배치 속도. 플레이어보다 느려서 따라잡을 수 있음. */
  moveSpeed: 135,
  /** 이상적인 사격 간격. 더 멀면 다가오고 더 가까우면 물러남. */
  preferredDistance: 360,
  /** 선호 간격 주변 데드존. 경계에서 들락날락 떠는 것을 방지. */
  distanceTolerance: 55,
  projectile: {
    texture: 'enemy-bullet-placeholder',
    speed: 430,
    lifetime: 1800,
    damage: 10,
    maxSize: 40,
    muzzleOffset: 36,
  },
} as const;

export const MELEE_ENEMY_COMBAT_CONFIG = {
  maxHealth: 60,
  aggroRadius: 420,
  moveSpeed: 190,
  contactDamage: 15,
  contactDamageCooldown: 700,
} as const;

/**
 * 봉 휘두르기 근접 동작(초반 스테이지): 접촉 데미지를 주는 대신
 * 적이 `attackRange`까지 접근해 봉을 들어올린 뒤 휘두름 — 실제 휘두르는
 * 궤적만 플레이어를 때리므로, 들어올리는 동작이 회피 가능한 예고 신호가 됨.
 */
export const MELEE_SWING_CONFIG = {
  /** 추격을 멈추고 휘두르기에 돌입하는 수평 간격.
   *  `reach` 안쪽으로 유지해, 멈춘 대상에 대한 휘두르기가 확실히 닿게 함. */
  attackRange: 92,
  windupDuration: 340,
  swingDuration: 200,
  recoverDuration: 520,
  /** 적 중심에서 휘두르기 히트박스가 닿는 수평 거리. */
  reach: 118,
  /** 플레이어가 이 수직 범위 안에 있어야 타격됨. */
  verticalTolerance: 74,
  damage: 15,
  rodLength: 50,
  rodThickness: 8,
  rodColor: 0xcbb78a,
} as const;

export type MeleeSwingConfig = typeof MELEE_SWING_CONFIG;

export const FLYING_ENEMY_COMBAT_CONFIG = {
  maxHealth: 45,
  aggroRadius: 560,
  hoverHeight: 150,
  trackSpeed: 150,
  fireInterval: 1300,
  projectile: {
    texture: 'flying-enemy-bullet-placeholder',
    speed: 360,
    lifetime: 2000,
    damage: 8,
    maxSize: 30,
    muzzleOffset: 20,
  },
} as const;
