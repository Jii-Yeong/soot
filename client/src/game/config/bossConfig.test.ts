import { describe, expect, it } from 'vitest';
import { BOSS_COMBAT_CONFIGS } from '@/game/config/bossConfig';
import { PLAYER_COMBAT_CONFIG } from '@/game/config/combatConfig';

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

    // A wide detection fan that reaches at least to the player's stand-off
    // distance, then a dodgeable orb that fires quicker once enraged.
    expect(pattern.cone.halfAngleDegrees).toBeGreaterThan(0);
    expect(pattern.cone.range).toBeGreaterThanOrEqual(pattern.preferredDistance);
    expect(pattern.orb.enragedLockDuration).toBeLessThan(
      pattern.orb.lockDuration,
    );
    expect(pattern.orb.damage).toBeGreaterThan(0);
  });

  it('gives the underground purifier a capture + crush kit', () => {
    const { pattern } = BOSS_COMBAT_CONFIGS['underground-guardian'];

    expect(pattern.type).toBe('purifier');
    if (pattern.type !== 'purifier') {
      throw new Error('Underground boss must use the purifier pattern');
    }

    // A grab, a targeted leap, and a full-arena vacuum that can be resisted.
    expect(pattern.grab.reach).toBeGreaterThan(0);
    expect(pattern.grab.damage).toBeGreaterThan(0);
    expect(pattern.slam.launchSpeedY).toBeGreaterThan(0);
    expect(pattern.slam.maxTravelSpeedX).toBeGreaterThan(
      pattern.enragedMoveSpeed,
    );
    expect(pattern.slam.landingRadius).toBeGreaterThan(0);
    expect(pattern.slam.shockwaveSpeed).toBeGreaterThan(0);
    expect(pattern.slam.shockwaveDamage).toBeGreaterThan(0);
    expect(pattern.vacuum.duration).toBeGreaterThan(
      pattern.vacuum.warnDuration,
    );
    expect(pattern.vacuum.pullSpeed).toBeLessThan(
      PLAYER_COMBAT_CONFIG.moveSpeed,
    );
    expect(pattern.vacuum.enragedPullSpeed).toBeGreaterThan(
      pattern.vacuum.pullSpeed,
    );
  });

  it('gives the infernal executioner three distinct magma patterns', () => {
    const { pattern } = BOSS_COMBAT_CONFIGS['infernal-executioner'];

    expect(pattern.type).toBe('infernal');
    if (pattern.type !== 'infernal') {
      throw new Error('Infernal executioner must use the infernal pattern');
    }

    expect(pattern.enrageHealthRatio).toBe(0.5);
    expect(pattern.rupture.count).toBe(3);
    expect(pattern.rupture.warnDuration).toBe(700);
    expect(pattern.charge.staggerDuration).toBeGreaterThan(
      pattern.charge.duration,
    );
    expect(pattern.charge.coreDamageMultiplier).toBeGreaterThan(1);
    expect(pattern.charge.enragedSpeedMultiplier).toBeCloseTo(1.15);
    expect(pattern.shards.laneCount).toBe(4);
    expect(pattern.shards.magmaDuration).toBeGreaterThan(
      pattern.shards.warnDuration,
    );
  });

  it('keeps the final boss on the charge pattern', () => {
    expect(BOSS_COMBAT_CONFIGS['returning-architect'].pattern.type).toBe(
      'charge',
    );
  });
});
