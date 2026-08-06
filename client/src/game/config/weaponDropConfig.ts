import type { WeaponConfig } from '@/game/config/weaponConfig';

export type RandomSource = () => number;

export const WEAPON_PICKUP_RADIUS = 140;

/**
 * 아직 인벤토리에 없는 보스 보상을 균등하게 고름. 네 종류를 모두 모은 뒤에는
 * 더 이상 의미 없는 중복 무기를 떨어뜨리지 않음.
 */
export const selectBossWeaponDrop = (
  weapons: readonly WeaponConfig[],
  ownedWeaponIds: readonly string[],
  random: RandomSource = Math.random,
) => {
  const owned = new Set(ownedWeaponIds);
  const candidates = weapons.filter((weapon) => !owned.has(weapon.id));
  if (candidates.length === 0) {
    return null;
  }

  const index = Math.min(
    candidates.length - 1,
    Math.floor(random() * candidates.length),
  );
  return candidates[index];
};
