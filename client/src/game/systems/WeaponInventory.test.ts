import { describe, expect, it } from 'vitest';
import { WeaponInventory } from '@/game/systems/WeaponInventory';

describe('WeaponInventory', () => {
  it('starts with only the first slot selected and filled', () => {
    const inventory = new WeaponInventory('smg', 4);

    expect(inventory.snapshot).toEqual({
      slots: ['smg', null, null, null],
      activeSlotIndex: 0,
    });
    expect(inventory.activeWeaponId).toBe('smg');
    expect(inventory.ownedWeaponIds).toEqual(['smg']);
  });

  it('fills empty slots in order and selects the latest weapon', () => {
    const inventory = new WeaponInventory('smg', 4);

    expect(inventory.collect('shotgun')).toBe(true);
    expect(inventory.collect('burst-rifle')).toBe(true);
    expect(inventory.collect('rail-rifle')).toBe(true);

    expect(inventory.snapshot).toEqual({
      slots: ['smg', 'shotgun', 'burst-rifle', 'rail-rifle'],
      activeSlotIndex: 3,
    });
    expect(inventory.collect('extra-weapon')).toBe(false);
  });

  it('reselects an owned weapon without creating a duplicate slot', () => {
    const inventory = new WeaponInventory('smg', 4);
    inventory.collect('shotgun');
    inventory.collect('smg');

    expect(inventory.snapshot).toEqual({
      slots: ['smg', 'shotgun', null, null],
      activeSlotIndex: 0,
    });
  });

  it('rejects empty, fractional, and out-of-range slot selections', () => {
    const inventory = new WeaponInventory('smg', 4);

    expect(inventory.select(1)).toBe(false);
    expect(inventory.select(0.5)).toBe(false);
    expect(inventory.select(-1)).toBe(false);
    expect(inventory.select(4)).toBe(false);
    expect(inventory.select(0)).toBe(true);
  });
});
