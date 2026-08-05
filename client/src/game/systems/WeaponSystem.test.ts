// @vitest-environment jsdom
import type Phaser from 'phaser';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  BURST_RIFLE_WEAPON_CONFIG,
  RAIL_RIFLE_WEAPON_CONFIG,
  SHOTGUN_WEAPON_CONFIG,
  SMG_WEAPON_CONFIG,
  WEAPON_CONFIGS,
} from '@/game/config/weaponConfig';
import { gameEvents } from '@/game/events/gameEvents';
import { WeaponSystem } from '@/game/systems/WeaponSystem';

const mocks = vi.hoisted(() => ({
  fireProjectile: vi.fn(),
  clearOutsideCamera: vi.fn(),
  getMuzzlePosition: vi.fn(),
  muzzleAngleScale: 0,
  playFire: vi.fn(),
}));

vi.hoisted(() => {
  // Phaser probes canvas while it is imported, although these tests only need
  // its angle helper and never create a renderer.
  HTMLCanvasElement.prototype.getContext = (() => ({
    fillStyle: '',
    fillRect: () => {},
    getImageData: () => ({ data: new Uint8ClampedArray(4) }),
    putImageData: () => {},
  })) as unknown as HTMLCanvasElement['getContext'];
});

vi.mock('@/game/systems/ProjectilePool', () => ({
  ProjectilePool: class {
    group = {};

    fire(...args: unknown[]) {
      mocks.fireProjectile(...args);
    }

    collideWith() {}

    clearOutsideCamera(...args: unknown[]) {
      mocks.clearOutsideCamera(...args);
    }

    clear() {}

    registerHit() {
      return true;
    }
  },
}));

vi.mock('@/game/systems/WeaponFeedback', () => ({
  WeaponFeedback: class {
    update() {}

    setWeapon() {}

    playEquip() {}

    hide() {}

    cancelHitStop() {}

    getMuzzlePosition(...args: [number, number, number, number]) {
      mocks.getMuzzlePosition(...args);
      return {
        x: 100 + args[0] * mocks.muzzleAngleScale,
        y: 200 + args[0] * mocks.muzzleAngleScale,
        rotation: args[0],
      };
    }

    playFire(...args: unknown[]) {
      mocks.playFire(...args);
    }
  },
}));

describe('WeaponSystem bursts', () => {
  afterEach(() => {
    mocks.fireProjectile.mockReset();
    mocks.clearOutsideCamera.mockReset();
    mocks.getMuzzlePosition.mockReset();
    mocks.muzzleAngleScale = 0;
    mocks.playFire.mockReset();
  });

  it('keeps delayed rounds on the firing rig and emits an audio cue for each one', () => {
    const delayed: Array<() => void> = [];
    const scene = {
      physics: { add: { overlap: vi.fn() } },
      time: {
        delayedCall: (_delay: number, callback: () => void) => {
          delayed.push(callback);
        },
      },
    } as unknown as Phaser.Scene;
    const player = { x: 100, y: 200 } as Phaser.Physics.Arcade.Sprite;
    const system = new WeaponSystem(
      scene,
      player,
      [],
      [BURST_RIFLE_WEAPON_CONFIG],
      BURST_RIFLE_WEAPON_CONFIG.id,
      () => true,
      () => {},
    );
    const fired: string[] = [];
    const onWeaponFired = (weaponId: string) => fired.push(weaponId);
    gameEvents.on('weapon-fired', onWeaponFired);

    try {
      system.tryFire({ x: 300, y: 200 } as Phaser.Math.Vector2, 0);
      expect(fired).toEqual(['burst-rifle']);
      expect(delayed).toHaveLength(2);

      for (const fireDelayedRound of delayed) {
        fireDelayedRound();
      }

      expect(fired).toEqual([
        'burst-rifle',
        'burst-rifle',
        'burst-rifle',
      ]);
      expect(mocks.fireProjectile).toHaveBeenCalledTimes(3);
      expect(mocks.playFire).toHaveBeenCalledTimes(3);
      // The fourth argument is the rig angle. It stays at the trigger angle
      // for rounds two and three even if the rendered weapon has turned.
      expect(mocks.getMuzzlePosition.mock.calls).toEqual(
        expect.arrayContaining([
          [0, 36, 8, 0],
          [0, 36, 8, 0],
          [0, 36, 8, 0],
        ]),
      );
    } finally {
      gameEvents.off('weapon-fired', onWeaponFired);
    }
  });

  it('spawns every shotgun pellet from the one central muzzle', () => {
    const scene = {
      physics: { add: { overlap: vi.fn() } },
      time: { delayedCall: vi.fn() },
    } as unknown as Phaser.Scene;
    const player = { x: 100, y: 200 } as Phaser.Physics.Arcade.Sprite;
    const system = new WeaponSystem(
      scene,
      player,
      [],
      [SHOTGUN_WEAPON_CONFIG],
      SHOTGUN_WEAPON_CONFIG.id,
      () => true,
      () => {},
    );
    // Any per-pellet muzzle lookup would now produce a different coordinate.
    mocks.muzzleAngleScale = 100;

    system.tryFire({ x: 300, y: 200 } as Phaser.Math.Vector2, 0);

    expect(mocks.fireProjectile).toHaveBeenCalledTimes(5);
    expect(
      new Set(
        mocks.fireProjectile.mock.calls.map(([x, y]) => `${x},${y}`),
      ),
    ).toEqual(new Set(['100,200']));
    expect(mocks.getMuzzlePosition).toHaveBeenCalledExactlyOnceWith(0, 47, 6.5, 0);
  });

  it('clears player projectiles outside the current camera view', () => {
    const camera = {} as Phaser.Cameras.Scene2D.Camera;
    const scene = {
      cameras: { main: camera },
      physics: { add: { overlap: vi.fn() } },
      time: { delayedCall: vi.fn() },
    } as unknown as Phaser.Scene;
    const system = new WeaponSystem(
      scene,
      { x: 100, y: 200 } as Phaser.Physics.Arcade.Sprite,
      [],
      [SHOTGUN_WEAPON_CONFIG],
      SHOTGUN_WEAPON_CONFIG.id,
      () => true,
      () => {},
    );

    system.update(16, { x: 300, y: 200 } as Phaser.Math.Vector2);

    expect(mocks.clearOutsideCamera).toHaveBeenCalledExactlyOnceWith(camera);
  });
});

describe('WeaponSystem inventory', () => {
  const createSystem = () => {
    const scene = {
      physics: { add: { overlap: vi.fn() } },
      time: { delayedCall: vi.fn() },
    } as unknown as Phaser.Scene;
    return new WeaponSystem(
      scene,
      { x: 100, y: 200 } as Phaser.Physics.Arcade.Sprite,
      [],
      WEAPON_CONFIGS,
      SMG_WEAPON_CONFIG.id,
      () => true,
      () => {},
    );
  };

  it('starts with the SMG in slot one and leaves the other slots empty', () => {
    const system = createSystem();

    expect(system.inventoryWeaponIds).toEqual(['smg', null, null, null]);
    expect(system.activeSlotIndex).toBe(0);
    expect(system.activeConfig).toBe(SMG_WEAPON_CONFIG);
  });

  it('stores pickups in order and automatically equips the newest slot', () => {
    const system = createSystem();

    expect(system.collect(SHOTGUN_WEAPON_CONFIG.id)).toBe(true);
    expect(system.collect(BURST_RIFLE_WEAPON_CONFIG.id)).toBe(true);
    expect(system.collect(RAIL_RIFLE_WEAPON_CONFIG.id)).toBe(true);

    expect(system.inventoryWeaponIds).toEqual([
      'smg',
      'shotgun',
      'burst-rifle',
      'rail-rifle',
    ]);
    expect(system.activeSlotIndex).toBe(3);
    expect(system.activeConfig).toBe(RAIL_RIFLE_WEAPON_CONFIG);
  });

  it('switches only to filled slots and reuses an owned weapon slot', () => {
    const system = createSystem();
    system.collect(SHOTGUN_WEAPON_CONFIG.id);

    expect(system.equipSlot(0)).toBe(true);
    expect(system.activeConfig).toBe(SMG_WEAPON_CONFIG);
    expect(system.equipSlot(3)).toBe(false);
    expect(system.activeSlotIndex).toBe(0);

    expect(system.collect(SHOTGUN_WEAPON_CONFIG.id)).toBe(true);
    expect(system.inventoryWeaponIds).toEqual(['smg', 'shotgun', null, null]);
    expect(system.activeSlotIndex).toBe(1);
  });
});
