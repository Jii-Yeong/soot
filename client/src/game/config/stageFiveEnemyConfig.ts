export const CHOIR_SUPPORTER_CONFIG = {
  texture: 'choir-supporter-placeholder',
  bulletTexture: 'celestial-bullet-placeholder',
  maxHealth: 55,
  aggroRadius: 900,
  bodySize: 42,
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
  chargeSpeed: 1_050,
  returnSpeed: 340,
  chargeDamage: 18,
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
