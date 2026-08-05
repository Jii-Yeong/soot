// @vitest-environment jsdom

import type Phaser from 'phaser';
import { describe, expect, it, vi } from 'vitest';
import { BLOCKER_CONFIG } from '@/game/config/stageThreeEnemyConfig';
import { BlockerEnemy } from '@/game/entities/BlockerEnemy';

vi.hoisted(() => {
  HTMLCanvasElement.prototype.getContext = (() => ({
    fillStyle: '',
    fillRect: () => {},
    getImageData: () => ({ data: new Uint8ClampedArray(4) }),
    putImageData: () => {},
  })) as unknown as HTMLCanvasElement['getContext'];
});

function createEnemy() {
  const setVelocityX = vi.fn();
  const enemy = Object.assign(Object.create(BlockerEnemy.prototype), {
    x: 500,
    aggroRadius: BLOCKER_CONFIG.aggroRadius,
    blockerState: 'patrol',
    stateEndsAt: 0,
    nextSlamAt: 0,
    chargeStartedAt: 0,
    patrolDirection: 1,
    patrolCenterX: 500,
    body: { blocked: { left: false, right: false } },
    rig: { play: vi.fn() },
    setFlipX: vi.fn(),
    setVelocityX,
    slam: vi.fn(),
  }) as BlockerEnemy;

  return { enemy, setVelocityX };
}

describe('BlockerEnemy charge combo', () => {
  it('patrols until it detects the player, then charges faster', () => {
    const { enemy, setVelocityX } = createEnemy();

    expect(
      enemy.updateCombat(
        0,
        { x: 1100 } as Phaser.Physics.Arcade.Sprite,
        vi.fn(),
      ),
    ).toBe(false);
    expect(setVelocityX).toHaveBeenLastCalledWith(BLOCKER_CONFIG.moveSpeed);

    enemy.updateCombat(
      100,
      { x: 900 } as Phaser.Physics.Arcade.Sprite,
      vi.fn(),
    );
    expect(setVelocityX).toHaveBeenLastCalledWith(BLOCKER_CONFIG.chargeSpeed);
  });

  it('chains a close charge into the existing slam', () => {
    const { enemy, setVelocityX } = createEnemy();
    const target = { x: 650 } as Phaser.Physics.Arcade.Sprite;

    enemy.updateCombat(100, target, vi.fn());
    expect(setVelocityX).toHaveBeenLastCalledWith(BLOCKER_CONFIG.chargeSpeed);

    enemy.updateCombat(
      100 + BLOCKER_CONFIG.minimumChargeDuration,
      target,
      vi.fn(),
    );
    expect(setVelocityX).toHaveBeenLastCalledWith(0);

    enemy.updateCombat(
      100 +
        BLOCKER_CONFIG.minimumChargeDuration +
        BLOCKER_CONFIG.slamWarningDuration,
      target,
      vi.fn(),
    );
    expect(
      (enemy as unknown as { slam: ReturnType<typeof vi.fn> }).slam,
    ).toHaveBeenCalledWith(target);
  });
});
