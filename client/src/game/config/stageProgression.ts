import type { StageConfig, StageEndEvent } from '@/game/config/stageConfig';

export type StageExitPlan = {
  event?: StageEndEvent;
  nextStageIndex: number | null;
};

/** Describes what should happen after the current stage's final exit. */
export function getStageExitPlan(
  stages: readonly StageConfig[],
  currentStageIndex: number,
): StageExitPlan {
  const stage = stages[currentStageIndex];

  if (!stage) {
    throw new RangeError(`Unknown stage index: ${currentStageIndex}`);
  }

  const nextStageIndex = currentStageIndex + 1;

  return {
    event: stage.endEvent,
    nextStageIndex: nextStageIndex < stages.length ? nextStageIndex : null,
  };
}
