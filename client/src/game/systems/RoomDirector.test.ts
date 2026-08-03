import type Phaser from 'phaser';
import { describe, expect, it, vi } from 'vitest';
import { defineRoom } from '@/game/config/roomConfig';
import { RoomDirector } from '@/game/systems/RoomDirector';

function createScene() {
  const doorBody = { enable: true };
  const doorView = {
    body: doorBody,
    setDepth: vi.fn().mockReturnThis(),
    setFillStyle: vi.fn().mockReturnThis(),
    setStrokeStyle: vi.fn().mockReturnThis(),
    setVisible: vi.fn().mockReturnThis(),
  };
  const statusText = {
    destroy: vi.fn(),
    setColor: vi.fn().mockReturnThis(),
    setDepth: vi.fn().mockReturnThis(),
    setOrigin: vi.fn().mockReturnThis(),
    setScrollFactor: vi.fn().mockReturnThis(),
    setText: vi.fn().mockReturnThis(),
  };
  const playerCollider = { active: true, destroy: vi.fn() };
  const scene = {
    add: {
      rectangle: vi.fn(() => doorView),
      text: vi.fn(() => statusText),
    },
    physics: {
      add: {
        collider: vi.fn(() => playerCollider),
        existing: vi.fn(),
      },
    },
    scale: { height: 720, width: 1280 },
    tweens: {
      add: vi.fn(),
      killTweensOf: vi.fn(),
    },
  } as unknown as Phaser.Scene;

  return { doorBody, playerCollider, scene };
}

describe('RoomDirector', () => {
  it('fully disables the exit collision when the room is cleared', () => {
    const { doorBody, playerCollider, scene } = createScene();
    const director = new RoomDirector({
      scene,
      player: {} as Phaser.Physics.Arcade.Sprite,
      config: defineRoom({
        id: 'test-room',
        label: 'TEST ROOM',
        enemySpawns: [],
      }),
      onStateChanged: vi.fn(),
    });

    director.beginEncounter([]);

    expect(playerCollider.active).toBe(false);
    expect(doorBody.enable).toBe(false);
  });
});
