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

  it('gives the alley hunter a searchlight hound pattern', () => {
    const { pattern } = BOSS_COMBAT_CONFIGS['alley-hunter'];

    expect(pattern.type).toBe('hound');
    if (pattern.type !== 'hound') {
      throw new Error('Alley hunter must use the hound pattern');
    }

    // The lock-on must resolve before the beam fires, and the beam must reach
    // across the arena.
    expect(pattern.lance.chargeDuration).toBeGreaterThan(
      pattern.lance.aimLockDuration,
    );
    expect(pattern.beam.range).toBeGreaterThanOrEqual(1280);
    expect(pattern.sweep.arcDegrees).toBeGreaterThan(0);
  });

  it('keeps the deeper bosses on the charge pattern', () => {
    const chargePatterns = Object.entries(BOSS_COMBAT_CONFIGS)
      .filter(
        ([variant]) => variant !== 'city-warden' && variant !== 'alley-hunter',
      )
      .map(([, config]) => config.pattern.type);

    expect(chargePatterns).toEqual(['charge', 'charge', 'charge']);
  });
});
