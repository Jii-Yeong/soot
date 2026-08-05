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
