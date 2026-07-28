import { describe, expect, it } from 'vitest';
import { STAGES, STAGE_TWO_CONFIG } from '@/game/config/stageConfig';

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
});
