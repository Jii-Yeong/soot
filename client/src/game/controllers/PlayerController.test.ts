import { describe, expect, it, vi } from 'vitest';
import { MovementMode } from '@/game/config/playerMovementConfig';
import { PlayerController } from '@/game/controllers/PlayerController';

vi.mock('phaser', () => ({
  default: {
    Input: {
      Keyboard: {
        KeyCodes: { A: 65, D: 68, W: 87, S: 83, SHIFT: 16 },
      },
    },
    Math: {
      Clamp: (value: number, min: number, max: number) =>
        Math.min(max, Math.max(min, value)),
    },
    Events: {
      EventEmitter: class {
        emit() {}
        on() {}
        off() {}
      },
    },
  },
}));

describe('PlayerController stage transition', () => {
  it('clamps flight entry against the current scroll instead of stale worldView', () => {
    const keys = {
      left: {},
      right: {},
      jump: {},
      down: {},
      dash: {},
    };
    const scene = {
      input: {
        keyboard: {
          addKeys: vi.fn(() => keys),
          createCursorKeys: vi.fn(() => ({})),
        },
        mouse: { disableContextMenu: vi.fn() },
      },
      cameras: {
        main: {
          scrollX: 0,
          worldView: { left: 4720 },
        },
      },
      anims: { exists: vi.fn(() => true) },
    };
    const body = {
      setAllowGravity: vi.fn(),
      setVelocity: vi.fn(),
    };
    const player = {
      x: 180,
      y: 566,
      body,
      anims: { stop: vi.fn() },
      setPosition: vi.fn(),
      play: vi.fn(),
    };
    const controller = new PlayerController(scene as never, player as never, {
      moveSpeed: 300,
      flightSpeed: 300,
      jumpSpeed: 560,
      fastFallSpeed: 720,
      dash: { speed: 760, duration: 170, cooldown: 800 },
    });

    controller.setMovementMode(MovementMode.FLIGHT);

    expect(player.setPosition).toHaveBeenCalledWith(180, 566);
  });
});
