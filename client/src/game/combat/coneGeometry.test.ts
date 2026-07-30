import { describe, expect, it } from 'vitest';
import { isPointInsideCone } from '@/game/combat/coneGeometry';

const apex = { x: 0, y: 0 };
const halfAngle = Math.PI / 4; // 45°
const range = 100;

describe('isPointInsideCone', () => {
  it('catches a point straight along the centre line within range', () => {
    expect(isPointInsideCone(apex, 0, halfAngle, range, { x: 60, y: 0 })).toBe(
      true,
    );
  });

  it('rejects a point beyond the range', () => {
    expect(isPointInsideCone(apex, 0, halfAngle, range, { x: 140, y: 0 })).toBe(
      false,
    );
  });

  it('rejects a point outside the angular spread', () => {
    // Straight down (90°) is outside a ±45° fan aimed along +x.
    expect(isPointInsideCone(apex, 0, halfAngle, range, { x: 0, y: 60 })).toBe(
      false,
    );
  });

  it('catches a point just inside the fan edge', () => {
    // ~44° down-right, just inside the ±45° fan.
    expect(isPointInsideCone(apex, 0, halfAngle, range, { x: 42, y: 40 })).toBe(
      true,
    );
  });

  it('widens the angular tolerance for a larger target radius', () => {
    const justOutside = { x: 60, y: 62 }; // ~46° down-right, past the 45° edge
    expect(isPointInsideCone(apex, 0, halfAngle, range, justOutside)).toBe(
      false,
    );
    expect(isPointInsideCone(apex, 0, halfAngle, range, justOutside, 24)).toBe(
      true,
    );
  });
});
