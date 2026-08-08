// @vitest-environment jsdom

import { describe, expect, it, vi } from 'vitest';
import { StageTransitionDirector } from '@/game/systems/StageTransitionDirector';

vi.hoisted(() => {
  HTMLCanvasElement.prototype.getContext = (() => ({
    fillStyle: '',
    fillRect: () => {},
    getImageData: () => ({ data: new Uint8ClampedArray(4) }),
    putImageData: () => {},
  })) as unknown as HTMLCanvasElement['getContext'];
});

describe('StageTransitionDirector', () => {
  it('clears the room override and cutscene guards on reset', () => {
    const destroyPrompt = vi.fn();
    const director = Object.assign(
      Object.create(StageTransitionDirector.prototype),
      {
        roomConfig: { id: 'stale-descent-room' },
        descentStarted: true,
        ascensionStarted: true,
        promptText: { destroy: destroyPrompt },
        pendingNextStageIndex: 4,
      },
    ) as StageTransitionDirector;

    director.reset();

    expect(director.roomOverride).toBeUndefined();
    expect(director.hasRoomOverride).toBe(false);
    expect(destroyPrompt).toHaveBeenCalledOnce();
    expect(director).toMatchObject({
      descentStarted: false,
      ascensionStarted: false,
      pendingNextStageIndex: null,
    });
  });

  it('centers the camera immediately when placing the landing-room player', () => {
    const centerOnX = vi.fn();
    const body = {
      checkCollision: { none: true },
      setCollideWorldBounds: vi.fn(),
      reset: vi.fn(),
    };
    const player = {
      body,
      play: vi.fn(),
      setPosition: vi.fn(),
      setVelocity: vi.fn(),
    };
    const director = Object.assign(
      Object.create(StageTransitionDirector.prototype),
      {
        options: {
          scene: {
            cameras: { main: { centerOnX } },
            physics: { world: { bounds: { width: 5_120 } } },
          },
          player,
          idleAnimation: () => 'idle',
        },
      },
    ) as StageTransitionDirector;

    (director as unknown as { placePlayer(y: number): void }).placePlayer(680);

    expect(player.setPosition).toHaveBeenCalledWith(2_560, 680);
    expect(centerOnX).toHaveBeenCalledWith(2_560);
  });
});
