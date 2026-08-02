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
 * Rod-swing melee behaviour (early stages): instead of dealing contact damage,
 * the enemy closes to `attackRange`, winds the rod up, then sweeps it — only the
 * active swing arc hurts the player, so the wind-up is a punishable tell.
 */
export const MELEE_SWING_CONFIG = {
  /** Horizontal gap at which it stops chasing and commits to a swing.
   *  Kept inside `reach` so a committed swing on a still target connects. */
  attackRange: 92,
  windupDuration: 340,
  swingDuration: 200,
  recoverDuration: 520,
  /** Horizontal reach of the swing hitbox from the enemy centre. */
  reach: 118,
  /** Player must be within this vertical band of the enemy to be struck. */
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
