export type WeaponFeedbackConfig = {
  muzzleColor: number;
  muzzleLength: number;
  recoilDistance: number;
  shakeDuration: number;
  shakeIntensity: number;
  hitColor: number;
  hitStopMs: number;
  traceLength: number;
  traceAlpha: number;
};

/**
 * On-hit behaviors that change how a weapon plays, beyond raw stats. All
 * optional so plain weapons omit the whole block.
 */
export type WeaponEffects = {
  /** Impulse (px/s) shoved onto the enemy along the shot direction. */
  knockback?: number;
  /** Area damage on impact: everything within radius takes explosionDamage. */
  explosionRadius?: number;
  explosionDamage?: number;
  /** How many times a bolt re-targets the nearest other enemy after a hit. */
  ricochet?: number;
};

export type WeaponConfig = {
  id: string;
  label: string;
  texture: string;
  displayTexture: string;
  pickupColor: number;
  dropWeight: number;
  damage: number;
  fireInterval: number;
  burstCount: number;
  burstInterval: number;
  projectileSpeed: number;
  projectileLifetime: number;
  pelletCount: number;
  spreadDegrees: number;
  pierce: number;
  muzzleOffset: number;
  maxPoolSize: number;
  feedback: WeaponFeedbackConfig;
  effects?: WeaponEffects;
};

export const SMG_WEAPON_CONFIG: WeaponConfig = {
  id: 'smg',
  label: 'SMG',
  texture: 'bullet-placeholder',
  displayTexture: 'weapon-smg-placeholder',
  pickupColor: 0xb6ffe4,
  dropWeight: 1,
  damage: 10,
  fireInterval: 110,
  burstCount: 1,
  burstInterval: 0,
  projectileSpeed: 950,
  projectileLifetime: 1200,
  pelletCount: 1,
  spreadDegrees: 0,
  pierce: 0,
  muzzleOffset: 28,
  maxPoolSize: 80,
  feedback: {
    muzzleColor: 0xfff4c7,
    muzzleLength: 10,
    recoilDistance: 2,
    shakeDuration: 28,
    shakeIntensity: 0.0012,
    hitColor: 0xf4c66d,
    hitStopMs: 10,
    traceLength: 0,
    traceAlpha: 0,
  },
};

export const SHOTGUN_WEAPON_CONFIG: WeaponConfig = {
  id: 'shotgun',
  label: 'SHOTGUN',
  texture: 'shotgun-pellet-placeholder',
  displayTexture: 'weapon-shotgun-placeholder',
  pickupColor: 0xf0a35b,
  dropWeight: 1,
  damage: 7,
  fireInterval: 620,
  burstCount: 1,
  burstInterval: 0,
  projectileSpeed: 820,
  projectileLifetime: 650,
  pelletCount: 5,
  spreadDegrees: 26,
  pierce: 0,
  muzzleOffset: 26,
  maxPoolSize: 60,
  feedback: {
    muzzleColor: 0xffd29f,
    muzzleLength: 18,
    recoilDistance: 8,
    shakeDuration: 80,
    shakeIntensity: 0.006,
    hitColor: 0xf0a35b,
    hitStopMs: 28,
    traceLength: 86,
    traceAlpha: 0.34,
  },
  effects: { knockback: 300 },
};

export const BURST_RIFLE_WEAPON_CONFIG: WeaponConfig = {
  id: 'burst-rifle',
  label: 'BURST RIFLE',
  texture: 'bullet-placeholder',
  displayTexture: 'weapon-burst-placeholder',
  pickupColor: 0x8fb8ff,
  dropWeight: 0.8,
  damage: 12,
  fireInterval: 520,
  burstCount: 3,
  burstInterval: 72,
  projectileSpeed: 1040,
  projectileLifetime: 1300,
  pelletCount: 1,
  spreadDegrees: 0,
  pierce: 0,
  muzzleOffset: 32,
  maxPoolSize: 72,
  feedback: {
    muzzleColor: 0xc6d8ff,
    muzzleLength: 13,
    recoilDistance: 4,
    shakeDuration: 42,
    shakeIntensity: 0.0025,
    hitColor: 0x8fb8ff,
    hitStopMs: 16,
    traceLength: 48,
    traceAlpha: 0.24,
  },
};

export const RAIL_RIFLE_WEAPON_CONFIG: WeaponConfig = {
  id: 'rail-rifle',
  label: 'RAIL RIFLE',
  texture: 'rail-bolt-placeholder',
  displayTexture: 'weapon-rail-placeholder',
  pickupColor: 0xd5a8ff,
  dropWeight: 0.55,
  damage: 34,
  fireInterval: 760,
  burstCount: 1,
  burstInterval: 0,
  projectileSpeed: 1280,
  projectileLifetime: 1400,
  pelletCount: 1,
  spreadDegrees: 0,
  pierce: 2,
  muzzleOffset: 38,
  maxPoolSize: 36,
  feedback: {
    muzzleColor: 0xf2e6ff,
    muzzleLength: 28,
    recoilDistance: 10,
    shakeDuration: 110,
    shakeIntensity: 0.008,
    hitColor: 0xd5a8ff,
    hitStopMs: 42,
    traceLength: 190,
    traceAlpha: 0.75,
  },
  effects: { knockback: 180 },
};

export const PULSE_MORTAR_WEAPON_CONFIG: WeaponConfig = {
  id: 'pulse-mortar',
  label: 'PULSE MORTAR',
  texture: 'mortar-shell-placeholder',
  displayTexture: 'weapon-mortar-placeholder',
  pickupColor: 0xff8a5c,
  dropWeight: 0.5,
  damage: 0,
  fireInterval: 880,
  burstCount: 1,
  burstInterval: 0,
  projectileSpeed: 660,
  projectileLifetime: 1500,
  pelletCount: 1,
  spreadDegrees: 0,
  pierce: 0,
  muzzleOffset: 34,
  maxPoolSize: 24,
  feedback: {
    muzzleColor: 0xffb27a,
    muzzleLength: 22,
    recoilDistance: 11,
    shakeDuration: 90,
    shakeIntensity: 0.006,
    hitColor: 0xff8a5c,
    hitStopMs: 34,
    traceLength: 0,
    traceAlpha: 0,
  },
  effects: { explosionRadius: 128, explosionDamage: 24, knockback: 260 },
};

export const ARC_COIL_WEAPON_CONFIG: WeaponConfig = {
  id: 'arc-coil',
  label: 'ARC COIL',
  texture: 'arc-bolt-placeholder',
  displayTexture: 'weapon-arc-placeholder',
  pickupColor: 0x7cf5d3,
  dropWeight: 0.6,
  damage: 9,
  fireInterval: 300,
  burstCount: 1,
  burstInterval: 0,
  projectileSpeed: 900,
  projectileLifetime: 1200,
  pelletCount: 1,
  spreadDegrees: 0,
  pierce: 0,
  muzzleOffset: 30,
  maxPoolSize: 60,
  feedback: {
    muzzleColor: 0xc4fff0,
    muzzleLength: 12,
    recoilDistance: 3,
    shakeDuration: 34,
    shakeIntensity: 0.002,
    hitColor: 0x7cf5d3,
    hitStopMs: 14,
    traceLength: 60,
    traceAlpha: 0.4,
  },
  effects: { ricochet: 2 },
};

export const WEAPON_CONFIGS: readonly WeaponConfig[] = [
  SMG_WEAPON_CONFIG,
  SHOTGUN_WEAPON_CONFIG,
  BURST_RIFLE_WEAPON_CONFIG,
  RAIL_RIFLE_WEAPON_CONFIG,
  PULSE_MORTAR_WEAPON_CONFIG,
  ARC_COIL_WEAPON_CONFIG,
];

export const STARTING_WEAPON_ID = SMG_WEAPON_CONFIG.id;
