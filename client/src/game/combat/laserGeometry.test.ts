import { describe, expect, it } from 'vitest';
import { isPointInsideLaser } from '@/game/combat/laserGeometry';

const start = { x: 100, y: 200 };

describe('isPointInsideLaser', () => {
  it('hits a target along the active beam', () => {
    expect(
      isPointInsideLaser(start, 0, 600, 30, { x: 500, y: 210 }, 8),
    ).toBe(true);
  });

  it('leaves room to dodge outside the beam width', () => {
    expect(
      isPointInsideLaser(start, 0, 600, 30, { x: 500, y: 240 }, 8),
    ).toBe(false);
  });

  it('does not hit beyond the configured range', () => {
    expect(
      isPointInsideLaser(start, 0, 600, 30, { x: 750, y: 200 }, 8),
    ).toBe(false);
  });
});
