import type Phaser from 'phaser';
import { describe, expect, it, vi } from 'vitest';
import {
  SHOTGUN_WEAPON_CONFIG,
  SMG_WEAPON_CONFIG,
} from '@/game/config/weaponConfig';
import { WeaponDropDirector } from '@/game/systems/WeaponDropDirector';

vi.mock('phaser', () => ({
  default: {
    Math: {
      Distance: {
        Between: (x1: number, y1: number, x2: number, y2: number) =>
          Math.hypot(x2 - x1, y2 - y1),
      },
    },
  },
}));

vi.mock('@/game/entities/WeaponPickup', () => ({
  WeaponPickup: class {
    active = true;

    constructor(
      _scene: Phaser.Scene,
      readonly x: number,
      readonly y: number,
      readonly weapon: typeof SHOTGUN_WEAPON_CONFIG,
    ) {}

    setTint() {
      return this;
    }

    setHighlighted() {}

    destroy() {
      this.active = false;
    }
  },
}));

describe('WeaponDropDirector pickup transaction', () => {
  it('leaves a pickup on the floor until the inventory accepts it', () => {
    const scene = {
      physics: { add: { collider: vi.fn() } },
    } as unknown as Phaser.Scene;
    const director = new WeaponDropDirector(
      scene,
      {} as Phaser.Physics.Arcade.StaticGroup,
      [SMG_WEAPON_CONFIG, SHOTGUN_WEAPON_CONFIG],
      () => {},
      () => 0,
    );
    const pickup = director.dropBossReward(100, 200, ['smg']);
    const player = { x: 100, y: 200 } as Phaser.Physics.Arcade.Sprite;

    expect(director.takeNearest(player, () => false)).toBeNull();
    expect(pickup?.active).toBe(true);

    expect(director.takeNearest(player, () => true)?.id).toBe('shotgun');
    expect(pickup?.active).toBe(false);
  });
});
