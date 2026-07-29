import { describe, expect, it, vi } from 'vitest';
import { PlayerHealthState } from '@/game/state/playerHealthState';

describe('PlayerHealthState', () => {
  it('fully restores health when a stage supplies a new maximum', () => {
    const onChanged = vi.fn();
    const health = new PlayerHealthState(onChanged);

    health.restore(100);
    health.takeDamage(40);
    health.restore(150);

    expect(onChanged).toHaveBeenLastCalledWith(150, 150);
  });

  it('clamps damage at zero and reports a depleted state', () => {
    const onChanged = vi.fn();
    const health = new PlayerHealthState(onChanged);

    health.restore(115);

    expect(health.takeDamage(200)).toBe(true);
    expect(onChanged).toHaveBeenLastCalledWith(0, 115);
  });

  it('does not treat negative damage as healing', () => {
    const onChanged = vi.fn();
    const health = new PlayerHealthState(onChanged);

    health.restore(100);
    health.takeDamage(20);
    health.takeDamage(-30);

    expect(onChanged).toHaveBeenLastCalledWith(80, 100);
  });

  it('rejects an invalid stage maximum', () => {
    const health = new PlayerHealthState(vi.fn());

    expect(() => health.restore(0)).toThrow(RangeError);
  });
});
