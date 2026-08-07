// @vitest-environment jsdom

import { describe, expect, it, vi } from 'vitest';
import type { Enemy } from '@/game/entities/Enemy';
import { GameScene } from '@/game/scenes/GameScene';

vi.hoisted(() => {
  HTMLCanvasElement.prototype.getContext = (() => ({
    fillStyle: '',
    fillRect: () => {},
    getImageData: () => ({ data: new Uint8ClampedArray(4) }),
    putImageData: () => {},
  })) as unknown as HTMLCanvasElement['getContext'];
});

describe('GameScene run reset', () => {
  it('clears enemies and descent cutscene state before a restarted run', () => {
    const gameScene = new GameScene();
    const staleEnemy = {} as Enemy;
    const runState = gameScene as unknown as { enemies: Enemy[] };
    runState.enemies.push(staleEnemy);
    const resetTransition = vi.fn();
    const replaceEnemies = vi.fn();
    Object.assign(gameScene, {
      stageTransitionDirector: { reset: resetTransition },
      enemyCombatDirector: { replaceEnemies },
      adminStageNavigator: {
        consumeRequest: () => ({ immediateEncounter: false }),
      },
    });

    (gameScene as unknown as { resetRunState(): void }).resetRunState();

    expect(runState.enemies).toEqual([]);
    expect(replaceEnemies).toHaveBeenCalledWith([]);
    expect(resetTransition).toHaveBeenCalledOnce();
  });
});
