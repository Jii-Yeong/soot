import { describe, expect, it } from 'vitest';
import {
  RETURN_ROOM_ONE,
  RETURN_ROOM_TWO,
} from '@/game/config/rooms/stageFiveRooms';
import {
  CHOIR_SUPPORTER_ANIMATION_ATLASES,
  CELESTIAL_ORACLE_CONFIG,
  CHOIR_SUPPORTER_CONFIG,
  SANCTUM_ENFORCER_CONFIG,
} from '@/game/config/stageFiveEnemyConfig';

describe('stage five bullet formations', () => {
  it('maps the supporter atlas tags to its combat poses', () => {
    expect(CHOIR_SUPPORTER_CONFIG).toMatchObject({
      texture: 'stage-5-supporter',
      animations: {
        idle: 'stage-5-supporter-idle',
        fly: 'stage-5-supporter-fly',
        crossShot: 'stage-5-supporter-cross-shot',
        homingPair: 'stage-5-supporter-homing-pair',
        noteWave: 'stage-5-supporter-note-wave',
        deathFall: 'stage-5-supporter-death-fall',
        deathLand: 'stage-5-supporter-death-land',
      },
    });
    expect(CHOIR_SUPPORTER_CONFIG.scale * 78).toBe(72);
    expect(CHOIR_SUPPORTER_ANIMATION_ATLASES[0]?.tagFrames).toMatchObject({
      crossShot: [{ frame: '4' }],
      homingPair: [{ frame: '5' }],
      noteWave: [{ frame: '6' }],
    });
  });

  it('builds the authored learning waves and boss approach', () => {
    expect(RETURN_ROOM_ONE.enemySpawns.map(({ type }) => type)).toEqual([
      'choir-supporter',
      'choir-supporter',
      'sanctum-enforcer',
      'choir-supporter',
      'celestial-oracle',
    ]);
    expect(
      RETURN_ROOM_TWO.enemySpawns.slice(-2).map(({ type }) => type),
    ).toEqual(['celestial-oracle', 'choir-supporter']);
  });

  it('keeps warnings readable and supporter health lowest', () => {
    expect(CHOIR_SUPPORTER_CONFIG.warningDuration).toBe(500);
    expect(SANCTUM_ENFORCER_CONFIG.warningDuration).toBe(450);
    expect(CELESTIAL_ORACLE_CONFIG.warningDuration).toBeGreaterThanOrEqual(500);
    expect(CHOIR_SUPPORTER_CONFIG.maxHealth).toBeLessThan(
      SANCTUM_ENFORCER_CONFIG.maxHealth,
    );
    expect(SANCTUM_ENFORCER_CONFIG.maxHealth).toBeLessThan(
      CELESTIAL_ORACLE_CONFIG.maxHealth,
    );
  });
});
