import { describe, expect, it } from 'vitest';
import { formatStageLabel } from '@/game/config/stageLabel';

describe('formatStageLabel', () => {
  it('formats every stage label separator', () => {
    expect(formatStageLabel('STAGE 5 // THE RETURN // CORE')).toBe(
      'STAGE 5 | THE RETURN | CORE',
    );
  });
});
