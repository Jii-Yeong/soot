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
  const portalOverlap = { active: true, destroy: vi.fn() };
  let portalCallback = () => {};
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
        overlap: vi
          .fn()
          .mockReturnValueOnce(entranceOverlap)
          .mockImplementationOnce(
            (
              _player: Phaser.GameObjects.GameObject,
              _zone: Phaser.GameObjects.GameObject,
              callback: () => void,
            ) => {
              portalCallback = callback;
              return portalOverlap;
            },
          ),
      },
    },
    scale: { height: 720, width: 1280 },
    tweens: {
      add: vi.fn(),
      killTweensOf: vi.fn(),
    },
  } as unknown as Phaser.Scene;

  return {
    doorBody,
    playerCollider,
    portalBody,
    portalOverlap,
    requestPortalExit: () => portalCallback(),
    scene,
  };
}

describe('RoomDirector', () => {
  it('replaces the locked exit with an active portal when cleared', () => {
    const { doorBody, playerCollider, portalBody, portalOverlap, scene } =
      createScene();
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
    expect(portalOverlap.active).toBe(true);
  });

  it('requests the next room only once when the cleared portal is entered', () => {
    const { requestPortalExit, scene } = createScene();
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

    requestPortalExit();
    expect(onExitRequested).not.toHaveBeenCalled();

    director.beginEncounter([]);
    requestPortalExit();
    requestPortalExit();

    expect(onExitRequested).toHaveBeenCalledOnce();
  });
});
