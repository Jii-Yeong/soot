import { describe, expect, it } from 'vitest';
import {
  clampPatternTarget,
  damageBeforeThreshold,
  getFanAngles,
  getRingAngles,
} from '@/game/combat/architectPattern';

describe('architect boss patterns', () => {
  it('opens a readable gap in a radial ring', () => {
    const angles = getRingAngles(18, 0, Math.PI / 2);

    expect(angles.length).toBeLessThan(18);
    expect(
      angles.every(
        (angle) => Math.min(angle, Math.PI * 2 - angle) > Math.PI / 4,
      ),
    ).toBe(true);
  });

  it('spreads a fan evenly around its center angle', () => {
    const angles = getFanAngles(Math.PI / 2, 7, Math.PI / 3);

    expect(angles).toHaveLength(7);
    expect(angles[0]).toBeCloseTo(Math.PI / 3);
    expect(angles.at(-1)).toBeCloseTo((Math.PI * 2) / 3);
  });

  it('keeps judgment targets inside the aerial play area', () => {
    expect(
      clampPatternTarget(-100, 900, {
        minX: 80,
        maxX: 1200,
        minY: 130,
        maxY: 600,
      }),
    ).toEqual({ x: 80, y: 600 });
  });

  it('prevents burst damage from skipping false salvation', () => {
    expect(damageBeforeThreshold(140, 1200, 0.1, 100)).toBe(20);
    expect(damageBeforeThreshold(120, 1200, 0.1, 100)).toBe(0);
  });
});
