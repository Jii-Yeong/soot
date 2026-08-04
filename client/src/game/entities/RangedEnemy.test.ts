// @vitest-environment jsdom

import type Phaser from "phaser";
import { describe, expect, it, vi } from "vitest";
import { RangedEnemy } from "@/game/entities/RangedEnemy";

vi.hoisted(() => {
  HTMLCanvasElement.prototype.getContext = (() => ({
    fillStyle: "",
    fillRect: () => {},
    getImageData: () => ({ data: new Uint8ClampedArray(4) }),
    putImageData: () => {},
  })) as unknown as HTMLCanvasElement["getContext"];
});

describe("RangedEnemy patrol", () => {
  it("patrols while the player is outside its aggro radius", () => {
    const setVelocityX = vi.fn();
    const enemy = Object.assign(Object.create(RangedEnemy.prototype), {
      x: 100,
      patrol: { left: 50, right: 150, speed: 70 },
      patrolHeading: 1,
      setFlipX: vi.fn(),
      setVelocityX,
      isStaggered: vi.fn(() => false),
    }) as RangedEnemy;

    const moving = (
      enemy as unknown as {
        updatePositioning(
          time: number,
          target: Phaser.Physics.Arcade.Sprite,
          targetInRange: boolean,
        ): boolean;
      }
    ).updatePositioning(0, { x: 800 } as Phaser.Physics.Arcade.Sprite, false);

    expect(moving).toBe(true);
    expect(setVelocityX).toHaveBeenCalledWith(70);
  });
});
