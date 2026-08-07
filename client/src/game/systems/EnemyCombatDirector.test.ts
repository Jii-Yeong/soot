// @vitest-environment jsdom

import { describe, expect, it, vi } from 'vitest';
import type { Enemy } from '@/game/entities/Enemy';
import { FlyingEnemy } from '@/game/entities/FlyingEnemy';
import { EnemyCombatDirector } from '@/game/systems/EnemyCombatDirector';

vi.hoisted(() => {
  HTMLCanvasElement.prototype.getContext = (() => ({
    fillStyle: '',
    fillRect: () => {},
    getImageData: () => ({ data: new Uint8ClampedArray(4) }),
    putImageData: () => {},
  })) as unknown as HTMLCanvasElement['getContext'];
});

describe('EnemyCombatDirector', () => {
  it('clears projectiles when an aerial enemy owns its death animation', () => {
    const clearFrom = vi.fn();
    const notifyEnemyDefeated = vi.fn();
    const enemy = Object.assign(Object.create(FlyingEnemy.prototype), {
      x: 320,
      y: 240,
      projectile: { kind: 'flying', muzzleOffset: 18 },
      defeat: vi.fn(),
    }) as Enemy;
    Object.defineProperty(enemy, 'playsOwnDeathAnimation', { value: true });
    const director = Object.assign(
      Object.create(EnemyCombatDirector.prototype),
      {
        options: { notifyEnemyDefeated },
        projectilePools: {
          flying: { clearFrom },
          ranged: { clearFrom: vi.fn() },
        },
      },
    ) as EnemyCombatDirector;

    (
      director as unknown as { defeatEnemy(defeatedEnemy: Enemy): void }
    ).defeatEnemy(enemy);

    expect(clearFrom).toHaveBeenCalledWith(enemy);
    expect(notifyEnemyDefeated).toHaveBeenCalledWith(enemy);
  });
});
