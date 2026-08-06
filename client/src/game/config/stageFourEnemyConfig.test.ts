import { describe, expect, it } from 'vitest';
import {
  EXECUTIONER_DOLL_ANIMATION_ATLASES,
  EXECUTIONER_DOLL_CONFIG,
  INFERNAL_HOUND_CONFIG,
  JUDGMENT_EYE_CONFIG,
} from '@/game/config/stageFourEnemyConfig';

describe('stage four enemy timing', () => {
  it('maps the executioner doll atlas to its combat poses', () => {
    expect(EXECUTIONER_DOLL_CONFIG).toMatchObject({
      texture: 'stage-4-takedown',
      animations: {
        idle: 'stage-4-takedown-idle',
        fly: 'stage-4-takedown-fly',
        takeDown: 'stage-4-takedown-take-down',
        slam: 'stage-4-takedown-slam',
        land: 'stage-4-takedown-land',
        death: 'stage-4-takedown-death',
      },
    });
    expect(EXECUTIONER_DOLL_ANIMATION_ATLASES[0]?.tagFrames).toMatchObject({
      takeDown: [{ frame: '4', duration: 1_000 }],
      slam: [{ frame: '5', duration: 1_000 }],
      land: [{ frame: '6', duration: 1_000 }],
    });
  });

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
