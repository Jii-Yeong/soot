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
});
