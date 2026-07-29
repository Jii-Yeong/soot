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

export type WeaponConfig = {
  id: string;
  label: string;
  texture: string;
  displayTexture: string;
  pickupColor: number;
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
  knockback?: number;
  feedback: WeaponFeedbackConfig;
};

export const getWeaponTriggerDamage = (weapon: WeaponConfig) =>
  weapon.damage * weapon.pelletCount * weapon.burstCount;

export const getWeaponSustainedDamagePerSecond = (weapon: WeaponConfig) =>
  (getWeaponTriggerDamage(weapon) * 1000) / weapon.fireInterval;

export const SMG_WEAPON_CONFIG: WeaponConfig = {
  id: 'smg',
  label: 'SMG',
  texture: 'bullet-placeholder',
  displayTexture: 'weapon-smg-placeholder',
  pickupColor: 0xb6ffe4,
  damage: 11,
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
  damage: 12,
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
  knockback: 300,
};

export const BURST_RIFLE_WEAPON_CONFIG: WeaponConfig = {
  id: 'burst-rifle',
  label: 'BURST RIFLE',
  texture: 'bullet-placeholder',
  displayTexture: 'weapon-burst-placeholder',
  pickupColor: 0x8fb8ff,
  damage: 17,
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
  damage: 75,
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
  knockback: 180,
};

export const WEAPON_CONFIGS: readonly WeaponConfig[] = [
  SMG_WEAPON_CONFIG,
  SHOTGUN_WEAPON_CONFIG,
  BURST_RIFLE_WEAPON_CONFIG,
  RAIL_RIFLE_WEAPON_CONFIG,
];

export const STARTING_WEAPON_ID = SMG_WEAPON_CONFIG.id;
