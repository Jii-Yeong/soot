import { describe, expect, it } from 'vitest';
import { STAGES } from '@/game/config/stageConfig';
import { getStageExitPlan } from '@/game/config/stageProgression';

describe('getStageExitPlan', () => {
  it('advances directly between ordinary stages', () => {
    expect(getStageExitPlan(STAGES, 0)).toEqual({
      event: undefined,
      nextStageIndex: 1,
    });
  });

  it('runs the stage 3 siege before entering stage 4', () => {
    expect(getStageExitPlan(STAGES, 2)).toEqual({
      event: 'siege',
      nextStageIndex: 3,
    });
  });

  it('finishes the run after the final stage', () => {
    expect(getStageExitPlan(STAGES, 3)).toEqual({
      event: undefined,
      nextStageIndex: null,
    });
  });

  it('rejects an invalid stage index', () => {
    expect(() => getStageExitPlan(STAGES, 99)).toThrow(RangeError);
  });
});
