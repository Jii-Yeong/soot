import type { WeaponConfig } from '@/game/config/weaponConfig';

export type RandomSource = () => number;

export const WEAPON_PICKUP_RADIUS = 140;

/**
 * Picks one boss reward uniformly while excluding the currently equipped gun,
 * so every boss kill always offers a meaningful weapon swap.
 */
export const selectBossWeaponDrop = (
  weapons: readonly WeaponConfig[],
  activeWeaponId: string,
  random: RandomSource = Math.random,
) => {
  const candidates = weapons.filter((weapon) => weapon.id !== activeWeaponId);
  if (candidates.length === 0) {
    return null;
  }

  const index = Math.min(
    candidates.length - 1,
    Math.floor(random() * candidates.length),
  );
  return candidates[index];
};
