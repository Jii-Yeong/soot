import { describe, expect, it } from 'vitest';
import { BOSS_COMBAT_CONFIGS } from '@/game/config/bossConfig';

describe('boss combat configuration', () => {
  it('gives the city warden a readable laser-cannon pattern', () => {
    const { pattern } = BOSS_COMBAT_CONFIGS['city-warden'];

    expect(pattern.type).toBe('laser-cannon');
    if (pattern.type !== 'laser-cannon') {
      throw new Error('City warden must use the laser cannon');
    }

    expect(pattern.chargeDuration).toBeGreaterThan(pattern.aimLockDuration);
    expect(pattern.range).toBeGreaterThanOrEqual(1280);
    expect(pattern.damage).toBe(20);
  });

  it('keeps the remaining bosses on their existing charge pattern', () => {
    const remainingPatterns = Object.entries(BOSS_COMBAT_CONFIGS)
      .filter(([variant]) => variant !== 'city-warden')
      .map(([, config]) => config.pattern.type);

    expect(remainingPatterns).toEqual([
      'charge',
      'charge',
      'charge',
      'charge',
    ]);
  });
});
