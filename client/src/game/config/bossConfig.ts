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
  aerial?: {
    minY: number;
    maxY: number;
    verticalTrackSpeed: number;
  };
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
 * Stage-2 hound: a searchlight predator. Casts a wide red detection fan toward
 * the player and down across the ground; once the player is caught inside it,
 * the hound locks on and lobs a round energy orb. No hitscan beam, to stay
 * distinct from the city warden's laser cannon.
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
  /** A wide red searchlight fan cast toward the player and down the ground. */
  cone: {
    color: number;
    range: number;
    /** Half-width of the fan, in degrees. */
    halfAngleDegrees: number;
    /** Extra downward lean of the cone centre from the line to the player. */
    tiltDegrees: number;
    /** Apex height above the sprite centre (the head sensor). */
    apexOffsetY: number;
  };
  /** The round energy orb lobbed once the player is caught in the cone. */
  orb: {
    /** Warning window after the player is caught, before the orb launches. */
    lockDuration: number;
    enragedLockDuration: number;
    speed: number;
    radius: number;
    damage: number;
    color: number;
  };
};

/**
 * Stage-3 boss (the purification enforcer). A capture/crush android, not a
 * gunner: a claw yanks the grounded player toward its central tank (where the
 * boss's own contact damage finishes the "collection"), and a targeting leap
 * lands on the player's marked position before sending green pressure waves
 * along the floor. Its intake also pulls the player across the arena unless
 * they keep running away from it. Distinct axis from stages 1-2.
 */
export type PurifierBossPatternConfig = {
  type: 'purifier';
  moveSpeed: number;
  enragedMoveSpeed: number;
  enrageHealthRatio: number;
  preferredDistance: number;
  distanceTolerance: number;
  firstAttackDelay: number;
  recoveryDuration: number;
  enragedRecoveryDuration: number;
  telegraphColor: number;
  /** Impurity collection: warn on the player's spot, then the claw strikes. */
  grab: {
    warnDuration: number;
    strikeDuration: number;
    /** Width of the ground strike zone at the marked spot. */
    reach: number;
    damage: number;
    /** After a catch, the boss holds still this long so the drag reaches it. */
    holdDuration: number;
  };
  /** Waste compaction: leap to the player, then rake two pressure waves out. */
  slam: {
    warnDuration: number;
    strikeDuration: number;
    launchSpeedY: number;
    maxTravelSpeedX: number;
    /** Radius of the marked landing zone. */
    landingRadius: number;
    shockwaveSpeed: number;
    shockwaveDamage: number;
    shockwaveWidth: number;
    shockwaveHeight: number;
    shockwaveRange: number;
  };
  /** Full-arena intake: movement away can overcome its continuous pull. */
  vacuum: {
    warnDuration: number;
    duration: number;
    pullSpeed: number;
    enragedPullSpeed: number;
  };
};

/**
 * Stage-4 boss: a grounded magma executioner. Sequential eruptions force
 * movement, a locked horizontal charge creates a punish window, and phase two
 * adds persistent shard hazards while always preserving one safe lane.
 */
export type InfernalBossPatternConfig = {
  type: 'infernal';
  enrageHealthRatio: number;
  firstAttackDelay: number;
  recoveryDuration: number;
  enragedRecoveryDuration: number;
  phaseTransitionDuration: number;
  telegraphColor: number;
  magmaColor: number;
  rupture: {
    count: number;
    warnDuration: number;
    activeDuration: number;
    markerInterval: number;
    width: number;
    height: number;
    damage: number;
  };
  charge: {
    warnDuration: number;
    duration: number;
    speed: number;
    enragedSpeedMultiplier: number;
    damage: number;
    staggerDuration: number;
    coreDamageMultiplier: number;
    wallPadding: number;
  };
  shards: {
    warnDuration: number;
    impactDamage: number;
    magmaDamage: number;
    magmaTickInterval: number;
    magmaDuration: number;
    followUpDelay: number;
    zoneWidth: number;
    zoneHeight: number;
    laneCount: number;
  };
};

export type ArchitectBossPatternConfig = {
  type: 'architect';
  enrageHealthRatio: number;
  salvationHealthRatio: number;
  firstAttackDelay: number;
  recoveryDuration: number;
  enragedRecoveryDuration: number;
  phaseTransitionDuration: number;
  goldColor: number;
  skyColor: number;
  corruptionColor: number;
  aerial: {
    minY: number;
    maxY: number;
    moveSpeed: number;
  };
  projectile: {
    speed: number;
    lifetime: number;
    radius: number;
  };
  halo: {
    warnDuration: number;
    bulletCount: number;
    phaseOneRings: number;
    phaseTwoRings: number;
    ringInterval: number;
    gapWidth: number;
    gapStep: number;
    damage: number;
  };
  wings: {
    warnDuration: number;
    bulletCount: number;
    simultaneousBulletCount: number;
    stepInterval: number;
    recoveryDuration: number;
    spread: number;
    simultaneousSeparation: number;
    speed: number;
    damage: number;
  };
  eye: {
    trackingDuration: number;
    lockedWarningDuration: number;
    orbDuration: number;
    phaseTwoFollowUpDelay: number;
    orbRadius: number;
    directDamage: number;
    splitBulletCount: number;
    splitDamage: number;
  };
  salvation: {
    transitionDuration: number;
    ringDuration: number;
    ringCount: number;
    bulletCount: number;
    innerRadius: number;
    radiusStep: number;
    gapWidth: number;
    bulletSpeed: number;
    damage: number;
    coreDamageMultiplier: number;
  };
};

export type BossPatternConfig =
  | ChargeBossPatternConfig
  | LaserCannonPatternConfig
  | HoundBossPatternConfig
  | PurifierBossPatternConfig
  | InfernalBossPatternConfig
  | ArchitectBossPatternConfig;

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
export type PurifierBossCombatConfig =
  BossCombatConfig<PurifierBossPatternConfig>;
export type InfernalBossCombatConfig =
  BossCombatConfig<InfernalBossPatternConfig>;
export type ArchitectBossCombatConfig =
  BossCombatConfig<ArchitectBossPatternConfig>;

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
      recoveryDuration: 950,
      enragedRecoveryDuration: 700,
      cone: {
        color: 0xff3b3b,
        range: 720,
        halfAngleDegrees: 40,
        tiltDegrees: 14,
        apexOffsetY: -34,
      },
      orb: {
        lockDuration: 420,
        enragedLockDuration: 300,
        speed: 430,
        radius: 16,
        damage: 22,
        color: 0xff5a4a,
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
    aggroRadius: 2600,
    aggroIndicatorColor: 0xa8d65c,
    contactDamage: 25,
    contactDamageCooldown: 600,
    pattern: {
      type: 'purifier',
      moveSpeed: 90,
      enragedMoveSpeed: 120,
      enrageHealthRatio: 0.5,
      preferredDistance: 430,
      distanceTolerance: 80,
      firstAttackDelay: 800,
      recoveryDuration: 900,
      enragedRecoveryDuration: 700,
      telegraphColor: 0x66ff8c,
      grab: {
        warnDuration: 650,
        strikeDuration: 250,
        reach: 150,
        damage: 16,
        holdDuration: 800,
      },
      slam: {
        warnDuration: 900,
        strikeDuration: 300,
        launchSpeedY: 720,
        maxTravelSpeedX: 900,
        landingRadius: 110,
        shockwaveSpeed: 420,
        shockwaveDamage: 18,
        shockwaveWidth: 46,
        shockwaveHeight: 46,
        shockwaveRange: 1400,
      },
      vacuum: {
        warnDuration: 700,
        duration: 2400,
        pullSpeed: 250,
        enragedPullSpeed: 280,
      },
    },
  },
  'infernal-executioner': {
    texture: 'infernal-executioner-placeholder',
    placeholder: {
      bodyColor: 0x7d1f16,
      accentColor: 0xff6a3d,
    },
    maxHealth: 1000,
    aggroRadius: 2200,
    aggroIndicatorColor: 0xff5a36,
    contactDamage: 20,
    contactDamageCooldown: 560,
    pattern: {
      type: 'infernal',
      enrageHealthRatio: 0.5,
      firstAttackDelay: 900,
      recoveryDuration: 750,
      enragedRecoveryDuration: 550,
      phaseTransitionDuration: 700,
      telegraphColor: 0xff5a36,
      magmaColor: 0xff8a2b,
      rupture: {
        count: 3,
        warnDuration: 700,
        activeDuration: 350,
        markerInterval: 250,
        width: 92,
        height: 250,
        damage: 20,
      },
      charge: {
        warnDuration: 850,
        duration: 600,
        speed: 2200,
        enragedSpeedMultiplier: 1.15,
        damage: 26,
        staggerDuration: 900,
        coreDamageMultiplier: 1.5,
        wallPadding: 90,
      },
      shards: {
        warnDuration: 650,
        impactDamage: 16,
        magmaDamage: 4,
        magmaTickInterval: 400,
        magmaDuration: 1500,
        followUpDelay: 450,
        zoneWidth: 300,
        zoneHeight: 26,
        laneCount: 4,
      },
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
      type: 'architect',
      enrageHealthRatio: 0.5,
      salvationHealthRatio: 0.1,
      firstAttackDelay: 1000,
      recoveryDuration: 900,
      enragedRecoveryDuration: 700,
      phaseTransitionDuration: 1000,
      goldColor: 0xffd86b,
      skyColor: 0x9eeeff,
      corruptionColor: 0x17131f,
      aerial: {
        minY: 150,
        maxY: 570,
        moveSpeed: 240,
      },
      projectile: {
        speed: 260,
        lifetime: 6500,
        radius: 7,
      },
      halo: {
        warnDuration: 700,
        bulletCount: 18,
        phaseOneRings: 2,
        phaseTwoRings: 3,
        ringInterval: 450,
        gapWidth: Math.PI / 2,
        gapStep: Math.PI / 4,
        damage: 9,
      },
      wings: {
        warnDuration: 550,
        bulletCount: 7,
        simultaneousBulletCount: 5,
        stepInterval: 500,
        recoveryDuration: 800,
        spread: Math.PI / 3,
        simultaneousSeparation: 0.62,
        speed: 340,
        damage: 10,
      },
      eye: {
        trackingDuration: 800,
        lockedWarningDuration: 350,
        orbDuration: 1200,
        phaseTwoFollowUpDelay: 650,
        orbRadius: 38,
        directDamage: 15,
        splitBulletCount: 8,
        splitDamage: 8,
      },
      salvation: {
        transitionDuration: 900,
        ringDuration: 2800,
        ringCount: 3,
        bulletCount: 24,
        innerRadius: 90,
        radiusStep: 64,
        gapWidth: Math.PI / 2.4,
        bulletSpeed: 125,
        damage: 9,
        coreDamageMultiplier: 2,
      },
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
