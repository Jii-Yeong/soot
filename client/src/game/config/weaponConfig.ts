export type WeaponFeedbackConfig = {
  muzzleColor: number;
  muzzleLength: number;
  recoilDistance: number;
  /**
   * How far the muzzle kicks upward per shot, in radians. Pushing the weapon
   * straight back reads as the whole gun sliding; it is the barrel lifting that
   * reads as recoil, which is why a heavy weapon needs both.
   */
  recoilClimb: number;
  /**
   * The ceiling climb accumulates to while the trigger is held. An automatic
   * lands one small kick at a time and only reads as recoil once they stack, so
   * a per-shot value large enough to see on an SMG would throw the barrel at
   * the ceiling by the fifth round. Single-shot weapons set this equal to
   * `recoilClimb`, which makes the accumulation a no-op for them.
   */
  recoilClimbMax: number;
  shakeDuration: number;
  shakeIntensity: number;
  hitColor: number;
  hitStopMs: number;
  traceLength: number;
  traceAlpha: number;
};

/**
 * What the round looks like in flight.
 *
 * Kept beside the weapon rather than drawn inline in BootScene because a bullet
 * that does not match the weapon that fired it gives the player no way to read
 * their own screen — four weapons previously shared three textures, with the
 * SMG and the burst rifle firing identical amber slugs.
 */
export type WeaponProjectileConfig = {
  /** The body of the round. Taken from the weapon sprite's identity block. */
  color: number;
  /** The leading edge, which is what stays visible against a dark stage. */
  tipColor: number;
  length: number;
  thickness: number;
  /** A round bead rather than a streak. Buckshot, not a tracer. */
  round?: boolean;
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
  /**
   * Distance from the grip to the barrel tip, measured off the sprite rather
   * than guessed. The previous values were estimates and the shotgun's was 21px
   * short, so its rounds appeared out of the middle of the receiver.
   */
  muzzleOffset: number;
  /**
   * How far the barrel sits above the grip, measured to the centre of the
   * muzzle face on the sprite. The grip is the rotation origin, so without this
   * every weapon fires from the shooter's fist — but guessing high is just as
   * wrong, and the first pass had every weapon firing over its own barrel.
   */
  muzzleRise: number;
  maxPoolSize: number;
  knockback?: number;
  projectile: WeaponProjectileConfig;
  feedback: WeaponFeedbackConfig;
};

export const getWeaponTriggerDamage = (weapon: WeaponConfig) =>
  weapon.damage * weapon.pelletCount * weapon.burstCount;

export const getWeaponSustainedDamagePerSecond = (weapon: WeaponConfig) =>
  (getWeaponTriggerDamage(weapon) * 1000) / weapon.fireInterval;

export const SMG_WEAPON_CONFIG: WeaponConfig = {
  id: 'smg',
  label: 'SMG',
  texture: 'smg-round',
  displayTexture: 'weapon-smg',
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
  muzzleOffset: 24,
  muzzleRise: 7,
  maxPoolSize: 80,
  projectile: {
    color: 0x73d7a1,
    tipColor: 0xd6fff0,
    length: 12,
    thickness: 3,
  },
  feedback: {
    muzzleColor: 0xfff4c7,
    muzzleLength: 10,
    recoilDistance: 3.5,
    recoilClimb: 0.035,
    recoilClimbMax: 0.17,
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
  texture: 'shotgun-pellet',
  displayTexture: 'weapon-shotgun',
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
  muzzleOffset: 47,
  muzzleRise: 6.5,
  maxPoolSize: 60,
  projectile: {
    color: 0xe99816,
    tipColor: 0xffd9a0,
    length: 6,
    thickness: 6,
    round: true,
  },
  feedback: {
    muzzleColor: 0xffd29f,
    muzzleLength: 18,
    recoilDistance: 13,
    recoilClimb: 0.3,
    recoilClimbMax: 0.3,
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
  texture: 'burst-round',
  displayTexture: 'weapon-burst-rifle',
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
  muzzleOffset: 36,
  muzzleRise: 8,
  maxPoolSize: 72,
  projectile: {
    color: 0x9fd8fb,
    tipColor: 0xeaf8ff,
    length: 14,
    thickness: 3,
  },
  feedback: {
    muzzleColor: 0xc6d8ff,
    muzzleLength: 13,
    recoilDistance: 6,
    recoilClimb: 0.075,
    // Three rounds inside 144ms, so the burst walks up and stops there.
    recoilClimbMax: 0.2,
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
  texture: 'rail-bolt',
  displayTexture: 'weapon-rail-rifle',
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
  muzzleOffset: 47,
  muzzleRise: 8.5,
  maxPoolSize: 36,
  projectile: {
    color: 0xc271f0,
    tipColor: 0xf6e6ff,
    length: 26,
    thickness: 5,
  },
  feedback: {
    muzzleColor: 0xf2e6ff,
    muzzleLength: 28,
    recoilDistance: 16,
    recoilClimb: 0.38,
    recoilClimbMax: 0.38,
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
