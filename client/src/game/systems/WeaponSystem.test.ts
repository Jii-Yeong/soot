// @vitest-environment jsdom
import type Phaser from 'phaser';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { BURST_RIFLE_WEAPON_CONFIG } from '@/game/config/weaponConfig';
import { gameEvents } from '@/game/events/gameEvents';
import { WeaponSystem } from '@/game/systems/WeaponSystem';

const mocks = vi.hoisted(() => ({
  fireProjectile: vi.fn(),
  getMuzzlePosition: vi.fn(),
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
      return { x: 100, y: 200, rotation: args[0] };
    }

    playFire(...args: unknown[]) {
      mocks.playFire(...args);
    }
  },
}));

describe('WeaponSystem bursts', () => {
  afterEach(() => {
    mocks.fireProjectile.mockReset();
    mocks.getMuzzlePosition.mockReset();
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
});
