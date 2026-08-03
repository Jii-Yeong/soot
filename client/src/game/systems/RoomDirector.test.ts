import type Phaser from 'phaser';
import { describe, expect, it, vi } from 'vitest';
import { defineRoom } from '@/game/config/roomConfig';
import { RoomDirector } from '@/game/systems/RoomDirector';

function createScene() {
  const doorBody = { enable: true };
  const portalBody = { enable: true };
  const doorView = {
    body: doorBody,
    setDepth: vi.fn().mockReturnThis(),
    setFillStyle: vi.fn().mockReturnThis(),
    setStrokeStyle: vi.fn().mockReturnThis(),
    setVisible: vi.fn().mockReturnThis(),
  };
  const entranceDetector = { destroy: vi.fn() };
  const portalZone = { body: portalBody, destroy: vi.fn() };
  const portalView = {
    destroy: vi.fn(),
    fillEllipse: vi.fn().mockReturnThis(),
    fillStyle: vi.fn().mockReturnThis(),
    lineStyle: vi.fn().mockReturnThis(),
    setAlpha: vi.fn().mockReturnThis(),
    setDepth: vi.fn().mockReturnThis(),
    setPosition: vi.fn().mockReturnThis(),
    setScale: vi.fn().mockReturnThis(),
    setVisible: vi.fn().mockReturnThis(),
    strokeEllipse: vi.fn().mockReturnThis(),
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
  const entranceOverlap = { destroy: vi.fn() };
  // Controls the synchronous "is the player in the portal?" test.
  const portalContact = { value: true };
  const scene = {
    add: {
      graphics: vi.fn(() => portalView),
      rectangle: vi.fn(() => doorView),
      text: vi.fn(() => statusText),
      zone: vi
        .fn()
        .mockReturnValueOnce(entranceDetector)
        .mockReturnValueOnce(portalZone),
    },
    physics: {
      add: {
        collider: vi.fn(() => playerCollider),
        existing: vi.fn(),
        overlap: vi.fn(() => entranceOverlap),
      },
      overlap: vi.fn(() => portalContact.value),
    },
    scale: { height: 720, width: 1280 },
    tweens: {
      add: vi.fn(),
      killTweensOf: vi.fn(),
    },
  } as unknown as Phaser.Scene;

  return { doorBody, playerCollider, portalBody, portalContact, scene };
}

describe('RoomDirector', () => {
  it('replaces the locked exit with an open portal when cleared', () => {
    const { doorBody, playerCollider, portalBody, scene } = createScene();
    const director = new RoomDirector({
      scene,
      player: {} as Phaser.Physics.Arcade.Sprite,
      config: defineRoom({
        id: 'test-room',
        label: 'TEST ROOM',
        enemySpawns: [],
      }),
      onStateChanged: vi.fn(),
      onEntranceDetected: vi.fn(),
      onExitRequested: vi.fn(),
    });

    director.beginEncounter([]);

    expect(playerCollider.active).toBe(false);
    expect(doorBody.enable).toBe(false);
    expect(portalBody.enable).toBe(true);
  });

  it('leaves only while standing in a cleared portal, and only once', () => {
    const { portalContact, scene } = createScene();
    const onExitRequested = vi.fn();
    const director = new RoomDirector({
      scene,
      player: {} as Phaser.Physics.Arcade.Sprite,
      config: defineRoom({
        id: 'test-room',
        label: 'TEST ROOM',
        enemySpawns: [],
      }),
      onStateChanged: vi.fn(),
      onEntranceDetected: vi.fn(),
      onExitRequested,
    });

    // Not cleared yet: pressing to leave does nothing.
    director.tryExit();
    expect(onExitRequested).not.toHaveBeenCalled();

    director.beginEncounter([]);

    // Cleared but not standing in the portal: still no exit.
    portalContact.value = false;
    director.tryExit();
    expect(onExitRequested).not.toHaveBeenCalled();

    // Standing in the portal: leaves exactly once.
    portalContact.value = true;
    director.tryExit();
    director.tryExit();
    expect(onExitRequested).toHaveBeenCalledOnce();
  });
});
