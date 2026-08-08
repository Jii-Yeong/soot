// @vitest-environment jsdom

import { describe, expect, it, vi } from 'vitest';
import { STAGE_FIVE_PLAYER_SPRITE } from '@/game/config/playerAnimationConfig';
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

  it('drops an airborne player to the floor before showing the landed death frame', () => {
    const setFrame = vi.fn();
    const stopAnimation = vi.fn();
    const addTween = vi.fn();
    const body = {
      blocked: { down: false },
      bottom: 300,
      enable: true,
    };
    const player = {
      anims: { stop: stopAnimation },
      body,
      setFrame,
      y: 250,
    };
    const gameScene = Object.assign(Object.create(GameScene.prototype), {
      currentStageIndex: 4,
      player,
      tweens: { add: addTween },
    }) as GameScene;

    (
      gameScene as unknown as { playPlayerDeathAnimation(): void }
    ).playPlayerDeathAnimation();

    expect(body.enable).toBe(false);
    expect(stopAnimation).toHaveBeenCalledOnce();
    expect(setFrame).toHaveBeenCalledWith(
      STAGE_FIVE_PLAYER_SPRITE.deathFrames?.[0],
    );
    const tween = addTween.mock.calls[0]?.[0] as {
      onComplete: () => void;
      y: number;
    };
    expect(tween.y).toBeGreaterThan(player.y);
    tween.onComplete();
    expect(setFrame).toHaveBeenLastCalledWith(
      STAGE_FIVE_PLAYER_SPRITE.deathFrames?.[1],
    );
  });
});
