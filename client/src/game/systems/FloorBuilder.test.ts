import { describe, expect, it } from 'vitest';
import { enemyPitBarrierXs } from '@/game/systems/FloorBuilder';

describe('enemy pit barriers', () => {
  it('places an enemy-only boundary on both sides of every pit', () => {
    expect(
      enemyPitBarrierXs([
        { start: 400, end: 550 },
        { start: 900, end: 1060 },
      ]),
    ).toEqual([400, 550, 900, 1060]);
  });
});
