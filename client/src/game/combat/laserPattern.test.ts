import { describe, expect, it } from 'vitest';
import { BOSS_COMBAT_CONFIGS } from '@/game/config/bossConfig';
import {
  getLaserChargeWindow,
  getLaserPatternTuning,
} from '@/game/combat/laserPattern';

const pattern = BOSS_COMBAT_CONFIGS['city-warden'].pattern;

if (pattern.type !== 'laser-cannon') {
  throw new Error('City warden must use the laser cannon');
}

describe('laser pattern tuning', () => {
  it('uses the readable single-shot opening phase', () => {
    expect(getLaserPatternTuning(pattern, false)).toEqual({
      moveSpeed: 95,
      volleySize: 1,
      chargeDuration: 900,
      recoveryDuration: 1250,
    });
  });

  it('shortens the cycle and adds a second shot while enraged', () => {
    expect(getLaserPatternTuning(pattern, true)).toEqual({
      moveSpeed: 125,
      volleySize: 2,
      chargeDuration: 700,
      recoveryDuration: 950,
    });
  });

  it('keeps a shorter but readable lock window for the follow-up shot', () => {
    expect(getLaserChargeWindow(pattern, true, true)).toEqual({
      duration: 500,
      aimLockDuration: 200,
    });
  });
});
