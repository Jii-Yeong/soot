// @vitest-environment jsdom

import { describe, expect, it, vi } from 'vitest';
import { CEILING_MAINTAINER_CONFIG } from '@/game/config/stageThreeEnemyConfig';
import { CeilingMaintainerEnemy } from '@/game/entities/CeilingMaintainerEnemy';

vi.hoisted(() => {
  HTMLCanvasElement.prototype.getContext = (() => ({
    fillStyle: '',
    fillRect: () => {},
    getImageData: () => ({ data: new Uint8ClampedArray(4) }),
    putImageData: () => {},
  })) as unknown as HTMLCanvasElement['getContext'];
});

describe('CeilingMaintainerEnemy health phases', () => {
  it('drops with refilled health before the second lethal hit defeats it', () => {
    const dropFromPipe = vi.fn();
    const enemy = Object.assign(
      Object.create(CeilingMaintainerEnemy.prototype),
      {
        active: true,
        health: CEILING_MAINTAINER_CONFIG.maxHealth,
        maxHealth: CEILING_MAINTAINER_CONFIG.maxHealth,
        healthPhase: 1,
        maintainerState: 'crawl',
        groundDashStarted: false,
        dropFromPipe,
      },
    ) as CeilingMaintainerEnemy;

    expect(
      enemy.takeProjectileDamage(
        CEILING_MAINTAINER_CONFIG.maxHealth,
        0,
        0,
      ),
    ).toEqual({ applied: true, defeated: false });
    expect(enemy.phase).toBe(2);
    expect(enemy.currentHealth).toBe(CEILING_MAINTAINER_CONFIG.maxHealth);
    expect(dropFromPipe).toHaveBeenCalledOnce();

    expect(enemy.takeProjectileDamage(1, 0, 0)).toEqual({
      applied: false,
      defeated: false,
    });
    Object.assign(enemy, {
      groundDashStarted: true,
      maintainerState: 'ground-dash',
    });
    expect(
      enemy.takeProjectileDamage(
        CEILING_MAINTAINER_CONFIG.maxHealth,
        0,
        0,
      ),
    ).toEqual({ applied: true, defeated: true });
    expect(enemy.currentHealth).toBe(0);
  });
});
