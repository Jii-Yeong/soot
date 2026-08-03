import { describe, expect, it } from 'vitest';
import { BURST_RIFLE_WEAPON_CONFIG } from '@/game/config/weaponConfig';
import { muzzlePoint } from '@/game/systems/muzzlePoint';

const GRIP = { gripX: 400, gripY: 300 };
const { muzzleOffset, muzzleRise } = BURST_RIFLE_WEAPON_CONFIG;

describe('muzzle point', () => {
  it('follows the shot, not the weapon sprite', () => {
    // The bug this guards: a burst fires three rounds 72ms apart, all locked to
    // the angle the trigger was pulled at, while the sprite keeps following the
    // mouse. Deriving the spawn from the sprite put rounds two and three out of
    // the side of the gun, travelling somewhere the barrel was not pointing.
    const level = muzzlePoint({
      ...GRIP,
      angle: 0,
      climb: 0,
      mirrored: false,
      offset: muzzleOffset,
      rise: muzzleRise,
    });
    const swungAway = muzzlePoint({
      ...GRIP,
      angle: Math.PI / 2,
      climb: 0,
      mirrored: false,
      offset: muzzleOffset,
      rise: muzzleRise,
    });

    expect(level.x).toBeCloseTo(GRIP.gripX + muzzleOffset, 6);
    expect(swungAway.y).toBeCloseTo(GRIP.gripY + muzzleOffset, 6);
    // Same weapon, same grip, different shot — different muzzle.
    expect(swungAway.x).not.toBeCloseTo(level.x, 1);
  });

  it('keeps the barrel above the grip whichever way it faces', () => {
    for (const angle of [0, Math.PI / 4, -Math.PI / 4]) {
      const right = muzzlePoint({
        ...GRIP,
        angle,
        climb: 0,
        mirrored: false,
        offset: muzzleOffset,
        rise: muzzleRise,
      });
      const left = muzzlePoint({
        ...GRIP,
        angle: Math.PI - angle,
        climb: 0,
        mirrored: true,
        offset: muzzleOffset,
        rise: muzzleRise,
      });

      // Mirrored through the grip's vertical axis, same height. A sign error on
      // the perpendicular lift shows up here as the muzzle dropping through the
      // shooter's fist when they turn around.
      expect(left.x - GRIP.gripX).toBeCloseTo(-(right.x - GRIP.gripX), 6);
      expect(left.y).toBeCloseTo(right.y, 6);
    }
  });

  it('lifts the muzzle when the barrel has kicked up', () => {
    const settled = muzzlePoint({
      ...GRIP,
      angle: 0,
      climb: 0,
      mirrored: false,
      offset: muzzleOffset,
      rise: muzzleRise,
    });
    const kicked = muzzlePoint({
      ...GRIP,
      angle: 0,
      climb: 0.3,
      mirrored: false,
      offset: muzzleOffset,
      rise: muzzleRise,
    });

    // Up is negative y. Climb has to raise the muzzle in both facings.
    expect(kicked.y).toBeLessThan(settled.y);

    const kickedLeft = muzzlePoint({
      ...GRIP,
      angle: Math.PI,
      climb: 0.3,
      mirrored: true,
      offset: muzzleOffset,
      rise: muzzleRise,
    });
    const settledLeft = muzzlePoint({
      ...GRIP,
      angle: Math.PI,
      climb: 0,
      mirrored: true,
      offset: muzzleOffset,
      rise: muzzleRise,
    });

    expect(kickedLeft.y).toBeLessThan(settledLeft.y);
  });
});
