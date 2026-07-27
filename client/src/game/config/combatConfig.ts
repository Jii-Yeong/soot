export const PLAYER_COMBAT_CONFIG = {
  maxHealth: 100,
  moveSpeed: 300,
  jumpSpeed: 560,
  fastFallSpeed: 720,
  dash: {
    speed: 760,
    duration: 170,
    cooldown: 800,
  },
  projectile: {
    texture: 'bullet-placeholder',
    speed: 950,
    fireInterval: 110,
    lifetime: 900,
    damage: 10,
    maxSize: 80,
    muzzleOffset: 28,
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
