import { describe, expect, it, vi } from 'vitest';
import { CleanupRegistry } from '@/game/systems/CleanupRegistry';

describe('CleanupRegistry', () => {
  it('runs every registered cleanup once', () => {
    const registry = new CleanupRegistry();
    const first = vi.fn();
    const second = vi.fn();
    registry.add(first);
    registry.add(second);

    registry.clear();
    registry.clear();

    expect(first).toHaveBeenCalledTimes(1);
    expect(second).toHaveBeenCalledTimes(1);
  });

  it('does not run a deleted cleanup', () => {
    const registry = new CleanupRegistry();
    const cleanup = vi.fn();
    registry.add(cleanup);
    registry.delete(cleanup);

    registry.clear();

    expect(cleanup).not.toHaveBeenCalled();
  });
});
