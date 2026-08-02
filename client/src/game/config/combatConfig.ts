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
  /**
   * Pacing while nobody is in range. Rooms are built with their enemies now, so
   * the player walks into one already occupied — but an enemy standing at
   * perfect attention reads as one waiting to be switched on. A slow beat
   * around where it was placed reads as something that was already there.
   *
   * Well under the 190 it chases at: the gear change is what tells the player
   * they have been noticed.
   */
  patrolRange: 90,
  patrolSpeed: 70,
  /** Clear of a pit edge by more than half a 48px-wide body. */
  patrolEdgeMargin: 28,
  /** Any shorter and the turns come often enough to read as twitching. */
  patrolMinimumSpan: 60,
} as const;

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
