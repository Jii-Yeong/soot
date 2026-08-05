import { describe, expect, it } from 'vitest';
import {
  EXECUTIONER_DOLL_CONFIG,
  INFERNAL_HOUND_CONFIG,
  JUDGMENT_EYE_CONFIG,
} from '@/game/config/stageFourEnemyConfig';

describe('stage four enemy timing', () => {
  it('keeps the authored warnings and recovery windows readable', () => {
    expect(INFERNAL_HOUND_CONFIG).toMatchObject({
      warningDuration: 650,
      stunDuration: 700,
      trailLifetime: 1_000,
    });
    expect(EXECUTIONER_DOLL_CONFIG).toMatchObject({
      warningDuration: 700,
      recoveryDuration: 700,
    });
    expect(JUDGMENT_EYE_CONFIG).toMatchObject({
      trackingDuration: 600,
      orbLifetime: 1_000,
    });
  });

  it('makes stage four attacks faster than their ordinary approach', () => {
    expect(INFERNAL_HOUND_CONFIG.chargeSpeed).toBeGreaterThan(
      INFERNAL_HOUND_CONFIG.prowlSpeed * 4,
    );
    expect(EXECUTIONER_DOLL_CONFIG.slamSpeed).toBeGreaterThan(
      EXECUTIONER_DOLL_CONFIG.hoverSpeed * 4,
    );
    expect(JUDGMENT_EYE_CONFIG.bulletSpeed).toBeGreaterThan(
      JUDGMENT_EYE_CONFIG.moveSpeed,
    );
  });
});
