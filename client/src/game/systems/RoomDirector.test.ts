import type Phaser from "phaser";
import { describe, expect, it, vi } from "vitest";
import { defineRoom } from "@/game/config/roomConfig";
import { RoomDirector } from "@/game/systems/RoomDirector";

function createScene() {
  const portalBody = { enable: true };
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
  const portalPrompt = {
    destroy: vi.fn(),
    setDepth: vi.fn().mockReturnThis(),
    setOrigin: vi.fn().mockReturnThis(),
    setText: vi.fn().mockReturnThis(),
    setVisible: vi.fn().mockReturnThis(),
  };
  // 동기적인 "플레이어가 포탈 안에 있는가?" 판정을 제어함.
  const portalContact = { value: true };
  const scene = {
    add: {
      graphics: vi.fn(() => portalView),
      text: vi
        .fn()
        .mockReturnValueOnce(portalPrompt)
        .mockReturnValueOnce(statusText),
      zone: vi.fn(() => portalZone),
    },
    physics: {
      add: {
        existing: vi.fn(),
      },
      overlap: vi.fn(() => portalContact.value),
    },
    scale: { height: 720, width: 1280 },
    tweens: {
      add: vi.fn(),
      killTweensOf: vi.fn(),
    },
  } as unknown as Phaser.Scene;

  return { portalBody, portalContact, portalPrompt, scene };
}

describe("RoomDirector", () => {
  it("opens a portal when the room is cleared", () => {
    const { portalBody, scene } = createScene();
    const director = new RoomDirector({
      scene,
      player: {} as Phaser.Physics.Arcade.Sprite,
      config: defineRoom({
        id: "test-room",
        label: "TEST ROOM",
        enemySpawns: [],
      }),
      onStateChanged: vi.fn(),
      onExitRequested: vi.fn(),
    });

    director.beginEncounter([]);

    expect(portalBody.enable).toBe(true);
  });

  it("leaves only while standing in a cleared portal, and only once", () => {
    const { portalContact, scene } = createScene();
    const onExitRequested = vi.fn();
    const director = new RoomDirector({
      scene,
      player: {} as Phaser.Physics.Arcade.Sprite,
      config: defineRoom({
        id: "test-room",
        label: "TEST ROOM",
        enemySpawns: [],
      }),
      onStateChanged: vi.fn(),
      onExitRequested,
    });

    // 아직 클리어 전: 나가기를 눌러도 아무 일 없음.
    director.tryExit();
    expect(onExitRequested).not.toHaveBeenCalled();

    director.beginEncounter([]);

    // 클리어했지만 포탈 안에 서 있지 않음: 여전히 나가지 못함.
    portalContact.value = false;
    director.tryExit();
    expect(onExitRequested).not.toHaveBeenCalled();

    // 포탈 안에 서 있음: 정확히 한 번만 나감.
    portalContact.value = true;
    director.tryExit();
    director.tryExit();
    expect(onExitRequested).toHaveBeenCalledOnce();
  });

  it("shows the W prompt only while the player overlaps a cleared portal", () => {
    const { portalContact, portalPrompt, scene } = createScene();
    const director = new RoomDirector({
      scene,
      player: {} as Phaser.Physics.Arcade.Sprite,
      config: defineRoom({
        id: "test-room",
        label: "TEST ROOM",
        enemySpawns: [],
      }),
      onStateChanged: vi.fn(),
      onExitRequested: vi.fn(),
    });

    portalContact.value = true;
    director.update();
    expect(portalPrompt.setVisible).toHaveBeenLastCalledWith(false);

    director.beginEncounter([]);
    director.update();
    expect(portalPrompt.setVisible).toHaveBeenLastCalledWith(true);

    portalContact.value = false;
    director.update();
    expect(portalPrompt.setVisible).toHaveBeenLastCalledWith(false);
  });
});
