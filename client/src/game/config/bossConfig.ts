import {
  STAGE_ONE_BOSS_ANIMATIONS,
  STAGE_ONE_BOSS_ATLAS_KEY,
  STAGE_ONE_BOSS_BATTLE_FRAME,
} from '@/game/config/bossAnimationConfig';

export type ChargeBossPatternConfig = {
  type: 'charge';
  moveSpeed: number;
  enragedMoveSpeed: number;
  enrageHealthRatio: number;
  chargeSpeed: number;
  chargeDuration: number;
  chargeInterval: number;
};

export type LaserCannonPatternConfig = {
  type: 'laser-cannon';
  moveSpeed: number;
  enragedMoveSpeed: number;
  enrageHealthRatio: number;
  preferredDistance: number;
  distanceTolerance: number;
  firstAttackDelay: number;
  chargeDuration: number;
  enragedChargeDuration: number;
  aimLockDuration: number;
  followUpChargeDuration: number;
  fireDuration: number;
  recoveryDuration: number;
  enragedRecoveryDuration: number;
  range: number;
  width: number;
  damage: number;
  muzzleOffset: number;
  muzzleOffsetY: number;
  telegraphColor: number;
  beamColor: number;
};

/** Visual-only fields a beam effect needs; shared by any beam-firing boss. */
export type BeamVisualConfig = {
  range: number;
  width: number;
  telegraphColor: number;
  beamColor: number;
};

/**
 * Stage-2 hound: a mobile searchlight predator. Alternates a player-tracking
 * lock-on beam (the headlamp lance) with a lunging pounce, and adds a wide
 * sweeping beam once enraged.
 */
export type HoundBossPatternConfig = {
  type: 'hound';
  moveSpeed: number;
  enragedMoveSpeed: number;
  enrageHealthRatio: number;
  preferredDistance: number;
  distanceTolerance: number;
  firstAttackDelay: number;
  recoveryDuration: number;
  enragedRecoveryDuration: number;
  beam: BeamVisualConfig & {
    damage: number;
    muzzleOffset: number;
    muzzleOffsetY: number;
  };
  lance: {
    chargeDuration: number;
    enragedChargeDuration: number;
    aimLockDuration: number;
    fireDuration: number;
  };
  pounce: {
    telegraphDuration: number;
    chargeSpeed: number;
    chargeDuration: number;
  };
  sweep: {
    chargeDuration: number;
    fireDuration: number;
    arcDegrees: number;
  };
};

export type BossPatternConfig =
  | ChargeBossPatternConfig
  | LaserCannonPatternConfig
  | HoundBossPatternConfig;

/**
 * When a boss has a real sprite atlas (rather than a generated placeholder), it
 * idles on a looping animation and snaps to a single battle frame while firing.
 * The physics body is sized to the character since the atlas frame is padded.
 */
export type BossSpriteConfig = {
  idleAnimation: string;
  battleFrame: string;
  scale: number;
  bodyWidth: number;
  bodyHeight: number;
};

export type BossCombatConfig<
  Pattern extends BossPatternConfig = BossPatternConfig,
> = {
  texture: string;
  placeholder: {
    bodyColor: number;
    accentColor: number;
  };
  maxHealth: number;
  aggroRadius: number;
  aggroIndicatorColor: number;
  contactDamage: number;
  contactDamageCooldown: number;
  pattern: Pattern;
};

export type ChargingBossCombatConfig =
  BossCombatConfig<ChargeBossPatternConfig>;
export type LaserBossCombatConfig =
  BossCombatConfig<LaserCannonPatternConfig>;
export type HoundBossCombatConfig = BossCombatConfig<HoundBossPatternConfig>;

export const hasBossPattern = <Type extends BossPatternConfig['type']>(
  config: BossCombatConfig,
  type: Type,
): config is BossCombatConfig<Extract<BossPatternConfig, { type: Type }>> =>
  config.pattern.type === type;

/**
 * Boss stats and pattern tuning live together while their runtime behavior is
 * split into dedicated enemy classes.
 */
export const BOSS_COMBAT_CONFIGS = {
  'city-warden': {
    texture: STAGE_ONE_BOSS_ATLAS_KEY,
    placeholder: {
      bodyColor: 0x286783,
      accentColor: 0x8ee3ff,
    },
    maxHealth: 500,
    aggroRadius: 1500,
    aggroIndicatorColor: 0x61c6ff,
    contactDamage: 18,
    contactDamageCooldown: 700,
    pattern: {
      type: 'laser-cannon',
      moveSpeed: 95,
      enragedMoveSpeed: 125,
      enrageHealthRatio: 0.5,
      preferredDistance: 520,
      distanceTolerance: 90,
      firstAttackDelay: 800,
      chargeDuration: 900,
      enragedChargeDuration: 700,
      aimLockDuration: 300,
      followUpChargeDuration: 500,
      fireDuration: 220,
      recoveryDuration: 1250,
      enragedRecoveryDuration: 950,
      range: 1700,
      width: 30,
      damage: 20,
      // Battle-pose cannon muzzle sits at source (+64, +10) from the sprite
      // centre, so the beam leaves the barrel rather than the chest.
      muzzleOffset: 64,
      muzzleOffsetY: 10,
      telegraphColor: 0x8ee3ff,
      beamColor: 0xc8f7ff,
    },
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
    contactDamage: 22,
    contactDamageCooldown: 650,
    pattern: {
      type: 'hound',
      moveSpeed: 130,
      enragedMoveSpeed: 190,
      enrageHealthRatio: 0.55,
      preferredDistance: 470,
      distanceTolerance: 90,
      firstAttackDelay: 800,
      recoveryDuration: 1100,
      enragedRecoveryDuration: 820,
      beam: {
        range: 1700,
        width: 26,
        damage: 20,
        muzzleOffset: 48,
        muzzleOffsetY: -14,
        telegraphColor: 0x8ee3ff,
        beamColor: 0xc8f7ff,
      },
      lance: {
        chargeDuration: 850,
        enragedChargeDuration: 640,
        aimLockDuration: 260,
        fireDuration: 200,
      },
      pounce: {
        telegraphDuration: 360,
        chargeSpeed: 480,
        chargeDuration: 440,
      },
      sweep: {
        chargeDuration: 720,
        fireDuration: 900,
        arcDegrees: 68,
      },
    },
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
    contactDamage: 25,
    contactDamageCooldown: 600,
    pattern: {
      type: 'charge',
      moveSpeed: 150,
      enragedMoveSpeed: 220,
      enrageHealthRatio: 0.6,
      chargeSpeed: 530,
      chargeDuration: 500,
      chargeInterval: 1900,
    },
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
    contactDamage: 28,
    contactDamageCooldown: 560,
    pattern: {
      type: 'charge',
      moveSpeed: 170,
      enragedMoveSpeed: 245,
      enrageHealthRatio: 0.65,
      chargeSpeed: 590,
      chargeDuration: 540,
      chargeInterval: 1700,
    },
  },
  'returning-architect': {
    texture: 'returning-architect-placeholder',
    placeholder: {
      bodyColor: 0x46306f,
      accentColor: 0xf0c8ff,
    },
    maxHealth: 1200,
    aggroRadius: 1900,
    aggroIndicatorColor: 0xd89cff,
    contactDamage: 32,
    contactDamageCooldown: 520,
    pattern: {
      type: 'charge',
      moveSpeed: 185,
      enragedMoveSpeed: 270,
      enrageHealthRatio: 0.7,
      chargeSpeed: 640,
      chargeDuration: 560,
      chargeInterval: 1550,
    },
  },
} satisfies Record<string, BossCombatConfig>;

export type BossVariant = keyof typeof BOSS_COMBAT_CONFIGS;

/**
 * Real-atlas rendering for bosses that have one, kept apart from combat tuning
 * so the combat-config union stays uniform (and its pattern-type exhaustiveness
 * intact). Bosses absent here fall back to the generated placeholder.
 */
export const BOSS_SPRITES: Partial<Record<BossVariant, BossSpriteConfig>> = {
  'city-warden': {
    idleAnimation: STAGE_ONE_BOSS_ANIMATIONS.idle,
    battleFrame: STAGE_ONE_BOSS_BATTLE_FRAME,
    scale: 1,
    bodyWidth: 72,
    bodyHeight: 132,
  },
};
