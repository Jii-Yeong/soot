export type WeaponConfig = {
  id: string;
  label: string;
  texture: string;
  damage: number;
  fireInterval: number;
  projectileSpeed: number;
  projectileLifetime: number;
  pelletCount: number;
  spreadDegrees: number;
  pierce: number;
  muzzleOffset: number;
  maxPoolSize: number;
};

export const SMG_WEAPON_CONFIG: WeaponConfig = {
  id: 'smg',
  label: 'SMG',
  texture: 'bullet-placeholder',
  damage: 10,
  fireInterval: 110,
  projectileSpeed: 950,
  projectileLifetime: 1200,
  pelletCount: 1,
  spreadDegrees: 0,
  pierce: 0,
  muzzleOffset: 28,
  maxPoolSize: 80,
};

export const SHOTGUN_WEAPON_CONFIG: WeaponConfig = {
  id: 'shotgun',
  label: 'SHOTGUN',
  texture: 'shotgun-pellet-placeholder',
  damage: 7,
  fireInterval: 620,
  projectileSpeed: 820,
  projectileLifetime: 650,
  pelletCount: 5,
  spreadDegrees: 26,
  pierce: 0,
  muzzleOffset: 26,
  maxPoolSize: 60,
};

export const WEAPON_CONFIGS: readonly WeaponConfig[] = [
  SMG_WEAPON_CONFIG,
  SHOTGUN_WEAPON_CONFIG,
];
