import { describe, expect, it } from 'vitest';
import {
  BOSS_COMBAT_CONFIGS,
  type BossVariant,
} from '@/game/config/bossConfig';
import {
  getWeaponSustainedDamagePerSecond,
  WEAPON_CONFIGS,
} from '@/game/config/weaponConfig';

describe('weapon progression', () => {
  it('offers exactly four distinct firearms', () => {
    expect(WEAPON_CONFIGS).toHaveLength(4);
    expect(new Set(WEAPON_CONFIGS.map(({ id }) => id)).size).toBe(4);
  });

  it('keeps every weapon within the same viable sustained-damage band', () => {
    for (const weapon of WEAPON_CONFIGS) {
      expect(
        getWeaponSustainedDamagePerSecond(weapon),
      ).toBeGreaterThanOrEqual(95);
      expect(
        getWeaponSustainedDamagePerSecond(weapon),
      ).toBeLessThanOrEqual(105);
    }
  });

  it('keeps each stage boss within its target ideal clear time', () => {
    const slowestWeaponDamage = Math.min(
      ...WEAPON_CONFIGS.map(getWeaponSustainedDamagePerSecond),
    );
    const targetClearSeconds = {
      'city-warden': 6,
      'alley-hunter': 7,
      'underground-guardian': 9,
      'infernal-executioner': 11,
      'returning-architect': 13,
    } satisfies Record<BossVariant, number>;

    Object.entries(BOSS_COMBAT_CONFIGS).forEach(([variant, boss]) => {
      expect(boss.maxHealth / slowestWeaponDamage).toBeLessThanOrEqual(
        targetClearSeconds[variant as BossVariant],
      );
    });
  });
});
