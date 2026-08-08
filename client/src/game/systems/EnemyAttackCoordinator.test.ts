import { describe, expect, it } from 'vitest';
import { EnemyAttackCoordinator } from '@/game/systems/EnemyAttackCoordinator';

describe('EnemyAttackCoordinator', () => {
  it('limits a room to two simultaneous stage four attacks', () => {
    const coordinator = new EnemyAttackCoordinator(2);
    const first = {};
    const second = {};
    const waiting = {};

    expect(coordinator.tryAcquire(first)).toBe(true);
    expect(coordinator.tryAcquire(second)).toBe(true);
    expect(coordinator.tryAcquire(waiting)).toBe(false);
    expect(coordinator.activeCount).toBe(2);

    coordinator.release(first);
    expect(coordinator.tryAcquire(waiting)).toBe(true);
    expect(coordinator.activeCount).toBe(2);
  });

  it('does not consume another slot when an owner reacquires', () => {
    const coordinator = new EnemyAttackCoordinator(2);
    const owner = {};

    expect(coordinator.tryAcquire(owner)).toBe(true);
    expect(coordinator.tryAcquire(owner)).toBe(true);
    expect(coordinator.activeCount).toBe(1);
  });
});
