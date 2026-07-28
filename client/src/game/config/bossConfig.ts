export type BossVariant =
  | 'city-warden'
  | 'alley-hunter'
  | 'underground-guardian';

export type BossCombatConfig = {
  texture: string;
  maxHealth: number;
  aggroRadius: number;
  aggroIndicatorColor: number;
  moveSpeed: number;
  enragedMoveSpeed: number;
  enrageHealthRatio: number;
  chargeSpeed: number;
  chargeDuration: number;
  chargeInterval: number;
  contactDamage: number;
  contactDamageCooldown: number;
};

/**
 * All bosses currently use the same chase/charge behavior. Keeping the
 * variant data here lets their tuning evolve without coupling it to standard
 * enemy or projectile configuration.
 */
export const BOSS_COMBAT_CONFIGS: Record<BossVariant, BossCombatConfig> = {
  'city-warden': {
    texture: 'city-warden-placeholder',
    maxHealth: 500,
    aggroRadius: 1500,
    aggroIndicatorColor: 0x61c6ff,
    moveSpeed: 115,
    enragedMoveSpeed: 170,
    enrageHealthRatio: 0.5,
    chargeSpeed: 410,
    chargeDuration: 420,
    chargeInterval: 2500,
    contactDamage: 18,
    contactDamageCooldown: 700,
  },
  'alley-hunter': {
    texture: 'alley-hunter-placeholder',
    maxHealth: 650,
    aggroRadius: 1600,
    aggroIndicatorColor: 0xff9a52,
    moveSpeed: 135,
    enragedMoveSpeed: 195,
    enrageHealthRatio: 0.55,
    chargeSpeed: 470,
    chargeDuration: 460,
    chargeInterval: 2200,
    contactDamage: 22,
    contactDamageCooldown: 650,
  },
  'underground-guardian': {
    texture: 'underground-guardian-placeholder',
    maxHealth: 800,
    aggroRadius: 1700,
    aggroIndicatorColor: 0xa8d65c,
    moveSpeed: 150,
    enragedMoveSpeed: 220,
    enrageHealthRatio: 0.6,
    chargeSpeed: 530,
    chargeDuration: 500,
    chargeInterval: 1900,
    contactDamage: 25,
    contactDamageCooldown: 600,
  },
};
