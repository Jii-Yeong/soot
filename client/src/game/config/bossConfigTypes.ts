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

/** Stage-2 searchlight detection followed by a dodgeable energy orb. */
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
  cone: {
    color: number;
    range: number;
    halfAngleDegrees: number;
    tiltDegrees: number;
    apexOffsetY: number;
  };
  orb: {
    lockDuration: number;
    enragedLockDuration: number;
    speed: number;
    radius: number;
    damage: number;
    color: number;
  };
};

/** Stage-3 capture, targeted slam, and full-arena vacuum patterns. */
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
  grab: {
    warnDuration: number;
    strikeDuration: number;
    reach: number;
    damage: number;
    holdDuration: number;
  };
  slam: {
    warnDuration: number;
    strikeDuration: number;
    launchSpeedY: number;
    maxTravelSpeedX: number;
    landingRadius: number;
    shockwaveSpeed: number;
    shockwaveDamage: number;
    shockwaveWidth: number;
    shockwaveHeight: number;
    shockwaveRange: number;
  };
  vacuum: {
    warnDuration: number;
    duration: number;
    pullSpeed: number;
    enragedPullSpeed: number;
  };
};

/** Stage-4 ground rupture, charge, and persistent magma-shard patterns. */
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

/** Stage-5 aerial bullet patterns and the final core-exposure sequence. */
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
  | LaserCannonPatternConfig
  | HoundBossPatternConfig
  | PurifierBossPatternConfig
  | InfernalBossPatternConfig
  | ArchitectBossPatternConfig;

export type BossSpriteConfig = {
  animations: {
    idle: string;
    walk: string;
    charge: string;
    fire: string;
    recoil: string;
    death: string;
  };
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

export type LaserBossCombatConfig =
  BossCombatConfig<LaserCannonPatternConfig>;
export type HoundBossCombatConfig = BossCombatConfig<HoundBossPatternConfig>;
export type PurifierBossCombatConfig =
  BossCombatConfig<PurifierBossPatternConfig>;
export type InfernalBossCombatConfig =
  BossCombatConfig<InfernalBossPatternConfig>;
export type ArchitectBossCombatConfig =
  BossCombatConfig<ArchitectBossPatternConfig>;
