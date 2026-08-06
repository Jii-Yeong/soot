// @vitest-environment jsdom

import { describe, expect, it, vi } from 'vitest';
import type { Enemy } from '@/game/entities/Enemy';
import { FlyingEnemy } from '@/game/entities/FlyingEnemy';
import { GameScene } from '@/game/scenes/GameScene';

vi.hoisted(() => {
  HTMLCanvasElement.prototype.getContext = (() => ({
    fillStyle: '',
    fillRect: () => {},
    getImageData: () => ({ data: new Uint8ClampedArray(4) }),
    putImageData: () => {},
  })) as unknown as HTMLCanvasElement['getContext'];
});

describe('GameScene enemy defeat cleanup', () => {
  it('clears a flying enemy\'s projectiles when its own death animation plays', () => {
    const scene = new GameScene();
    const clearFrom = vi.fn();
    const enemy = Object.assign(Object.create(FlyingEnemy.prototype), {
      x: 320,
      y: 240,
      projectile: { kind: 'flying', muzzleOffset: 18 },
      defeat: vi.fn(),
    }) as Enemy;
    Object.defineProperty(enemy, 'playsOwnDeathAnimation', { value: true });
    Object.assign(scene, {
      enemyProjectilePools: {
        flying: { clearFrom },
        ranged: { clearFrom: vi.fn() },
      },
      roomDirector: { notifyEnemyDefeated: vi.fn() },
      weaponDropDirector: { dropBossReward: vi.fn() },
      weaponSystem: { activeConfig: { id: 'smg' } },
    });

    (
      scene as unknown as { defeatEnemy(defeatedEnemy: Enemy): void }
    ).defeatEnemy(enemy);

    expect(clearFrom).toHaveBeenCalledWith(enemy);
  });
});

describe('GameScene admin stage restart', () => {
  it('ignores load errors from assets other than the requested background', () => {
    const gameScene = new GameScene();
    const listeners = new Map<string, (...args: never[]) => void>();
    const restart = vi.fn();
    const load = {
      image: vi.fn(),
      off: vi.fn((event: string) => listeners.delete(event)),
      on: vi.fn((event: string, listener: (...args: never[]) => void) =>
        listeners.set(event, listener),
      ),
      once: vi.fn((event: string, listener: (...args: never[]) => void) =>
        listeners.set(event, listener),
      ),
      start: vi.fn(),
    };
    Object.defineProperties(gameScene, {
      load: { value: load },
      scene: { value: { restart } },
      textures: { value: { exists: vi.fn(() => false) } },
    });
    Object.assign(gameScene, { setPaused: vi.fn() });

    (
      gameScene as unknown as { restartToStage(stageIndex: number): void }
    ).restartToStage(4);

    listeners.get('loaderror')?.({ key: 'unrelated' } as never);
    expect(restart).not.toHaveBeenCalled();

    listeners.get('filecomplete-image-stage-05-bg')?.();
    expect(restart).toHaveBeenCalledOnce();
    expect(load.off).toHaveBeenCalledWith(
      'loaderror',
      expect.any(Function),
    );
  });
});

describe('GameScene run reset', () => {
  it('clears descent cutscene state before a restarted run', () => {
    const gameScene = new GameScene();
    Object.assign(gameScene, {
      descentRoomConfig: { id: 'stale-descent-room' },
      descentCutsceneStarted: true,
      descentPromptText: {},
      pendingNextStageIndex: 4,
    });

    (gameScene as unknown as { resetRunState(): void }).resetRunState();

    expect(gameScene).toMatchObject({
      descentRoomConfig: undefined,
      descentCutsceneStarted: false,
      descentPromptText: undefined,
      pendingNextStageIndex: null,
    });
  });
});
