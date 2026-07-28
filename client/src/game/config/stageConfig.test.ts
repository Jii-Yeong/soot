import { describe, expect, it } from 'vitest';
import {
  STAGES,
  STAGE_FIVE_CONFIG,
  STAGE_FOUR_CONFIG,
  STAGE_THREE_CONFIG,
  STAGE_TWO_CONFIG,
} from '@/game/config/stageConfig';

describe('stage room progression', () => {
  it('ends every stage with one dedicated boss room', () => {
    for (const stage of STAGES) {
      expect(stage.rooms).toHaveLength(3);

      const finalRoom = stage.rooms.at(-1);
      expect(finalRoom?.kind).toBe('boss');
      expect(finalRoom?.enemySpawns).toHaveLength(1);
      expect(finalRoom?.enemySpawns[0]?.type).toBe('boss');
    }
  });

  it('loads the supplied stage 2 background', () => {
    expect(STAGE_TWO_CONFIG.background).toEqual({
      key: 'stage-02-bg',
      path: '/assets/backgrounds/stage-02.png',
    });
  });

  it('loads the supplied stage 3 background with the same structure', () => {
    expect(STAGE_THREE_CONFIG.background).toEqual({
      key: 'stage-03-bg',
      path: '/assets/backgrounds/stage-03.png',
    });
  });

  it('continues from the stage 3 siege into a three-room hell stage', () => {
    expect(STAGES).toHaveLength(5);
    expect(STAGE_THREE_CONFIG.endEvent).toBe('siege');
    expect(STAGE_FOUR_CONFIG).toMatchObject({
      id: 'stage-04',
      label: 'STAGE 4 // HELL',
      background: {
        key: 'stage-04-bg',
        path: '/assets/backgrounds/stage-04.png',
      },
    });
    expect(STAGE_FOUR_CONFIG.rooms.at(-1)?.enemySpawns[0]).toMatchObject({
      type: 'boss',
      variant: 'infernal-executioner',
    });
  });

  it('ends with a three-room return stage and final boss', () => {
    expect(STAGE_FIVE_CONFIG).toMatchObject({
      id: 'stage-05',
      label: 'STAGE 5 // THE RETURN',
      background: {
        key: 'stage-05-bg',
        path: '/assets/backgrounds/stage-05.png',
      },
    });
    expect(STAGE_FIVE_CONFIG.rooms.at(-1)?.enemySpawns[0]).toMatchObject({
      type: 'boss',
      variant: 'returning-architect',
    });
  });
});
