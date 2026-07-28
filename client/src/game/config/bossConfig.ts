export type BossCombatConfig = {
  texture: string;
  placeholder: {
    bodyColor: number;
    accentColor: number;
  };
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
export const BOSS_COMBAT_CONFIGS = {
  'city-warden': {
    texture: 'city-warden-placeholder',
    placeholder: {
      bodyColor: 0x286783,
      accentColor: 0x8ee3ff,
    },
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
    placeholder: {
      bodyColor: 0x7a3821,
      accentColor: 0xffb06f,
    },
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
    placeholder: {
      bodyColor: 0x3f5c28,
      accentColor: 0xc5ec72,
    },
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
  'infernal-executioner': {
    texture: 'infernal-executioner-placeholder',
    placeholder: {
      bodyColor: 0x7d1f16,
      accentColor: 0xff6a3d,
    },
    maxHealth: 1000,
    aggroRadius: 1800,
    aggroIndicatorColor: 0xff5a36,
    moveSpeed: 170,
    enragedMoveSpeed: 245,
    enrageHealthRatio: 0.65,
    chargeSpeed: 590,
    chargeDuration: 540,
    chargeInterval: 1700,
    contactDamage: 28,
    contactDamageCooldown: 560,
  },
} satisfies Record<string, BossCombatConfig>;

export type BossVariant = keyof typeof BOSS_COMBAT_CONFIGS;
