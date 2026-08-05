import { describe, expect, it } from 'vitest';
import {
  selectBossWeaponDrop,
  WEAPON_PICKUP_RADIUS,
} from '@/game/config/weaponDropConfig';
import {
  SMG_WEAPON_CONFIG,
  WEAPON_CONFIGS,
} from '@/game/config/weaponConfig';

describe('boss weapon drops', () => {
  it('uses a reachable pickup radius', () => {
    expect(WEAPON_PICKUP_RADIUS).toBeGreaterThan(0);
  });

  it('selects one of the three guns that are not owned yet', () => {
    const first = selectBossWeaponDrop(
      WEAPON_CONFIGS,
      [SMG_WEAPON_CONFIG.id],
      () => 0,
    );
    const middle = selectBossWeaponDrop(
      WEAPON_CONFIGS,
      [SMG_WEAPON_CONFIG.id],
      () => 0.5,
    );
    const last = selectBossWeaponDrop(
      WEAPON_CONFIGS,
      [SMG_WEAPON_CONFIG.id],
      () => 0.999,
    );

    expect([first?.id, middle?.id, last?.id]).toEqual([
      'shotgun',
      'burst-rifle',
      'rail-rifle',
    ]);
  });

  it('never drops a duplicate when no alternative weapon exists', () => {
    expect(
      selectBossWeaponDrop(
        [SMG_WEAPON_CONFIG],
        [SMG_WEAPON_CONFIG.id],
        () => 0,
      ),
    ).toBeNull();
  });

  it('does not offer any weapon already stored in the inventory', () => {
    expect(
      selectBossWeaponDrop(
        WEAPON_CONFIGS,
        ['smg', 'shotgun', 'burst-rifle'],
        () => 0.5,
      )?.id,
    ).toBe('rail-rifle');
  });
});
