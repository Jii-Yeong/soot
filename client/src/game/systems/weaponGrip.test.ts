import { describe, expect, it } from 'vitest';
import { PLAYER_JUMP_FRAMES } from '@/game/config/playerAnimationConfig';
import {
  FRONT_ARM,
  FRONT_ARM_SHOULDER_BY_FRAME,
  RIG_NUDGE,
  WEAPON_GRIP_BY_FRAME,
  WEAPON_SWING_RATE,
  rigAnchor,
} from '@/game/config/playerRigConfig';
import { weaponGripOffset } from '@/game/systems/weaponGrip';

type Anchor = { x: number; y: number };

/** Matches HAND_FROM_CENTRE / FRONT_ARM in the rig: the standing attitude. */
const STANDING = {
  name: 'standing',
  grip: { x: 5, y: -3 } as Anchor,
  shoulder: {
    x: FRONT_ARM.shoulderFromCentreX,
    y: FRONT_ARM.shoulderFromCentreY,
  } as Anchor,
};
const AIRBORNE = {
  name: 'airborne',
  grip: WEAPON_GRIP_BY_FRAME[PLAYER_JUMP_FRAMES.airborne],
  shoulder: FRONT_ARM_SHOULDER_BY_FRAME[PLAYER_JUMP_FRAMES.airborne],
};
const POSES = [STANDING, AIRBORNE];

/**
 * The world angle for an aim `degrees` above the horizon on a given facing.
 * Aiming left mirrors rather than rotating past vertical, so the left-facing
 * angles come back from Angle.Between in the second and third quadrants.
 */
function worldAim(degrees: number, mirrored: boolean) {
  const radians = (degrees * Math.PI) / 180;
  // Wrapped into (-PI, PI], which is the range Angle.Between produces.
  return mirrored
    ? radians <= 0
      ? -Math.PI - radians
      : Math.PI - radians
    : radians;
}

function offsetAt(degrees: number, mirrored: boolean, pose = STANDING) {
  return weaponGripOffset({
    shoulderX: pose.shoulder.x,
    shoulderY: pose.shoulder.y,
    restGripX: pose.grip.x,
    restGripY: pose.grip.y,
    aim: worldAim(degrees, mirrored),
    mirrored,
    rate: WEAPON_SWING_RATE,
  });
}

describe('weapon grip arc', () => {
  it('leaves the resting pose exactly where it was', () => {
    // The arc has to pass through the anchor it was built from, or every number
    // downstream — the muzzle, both arms, the frame overrides — shifts with it.
    for (const pose of POSES) {
      const level = offsetAt(0, false, pose);
      expect(level.x).toBeCloseTo(pose.grip.x, 6);
      expect(level.y).toBeCloseTo(pose.grip.y, 6);
    }
  });

  it('keeps the grip on the circle the arm can reach', () => {
    // Radius equal to the arm's length, centred on the shoulder. That is the
    // whole point of the arc: the hand lands on the grip with no slide at every
    // angle, so the arm turns instead of stretching.
    for (const pose of POSES) {
      const radius = Math.hypot(
        pose.grip.x - pose.shoulder.x,
        pose.grip.y - pose.shoulder.y,
      );
      for (let degrees = -90; degrees <= 90; degrees += 5) {
        for (const mirrored of [false, true]) {
          const { x, y } = offsetAt(degrees, mirrored, pose);
          const distance = Math.hypot(
            (mirrored ? -x : x) - pose.shoulder.x,
            y - pose.shoulder.y,
          );
          expect(
            distance,
            `${pose.name} at ${degrees}deg mirrored=${mirrored}`,
          ).toBeCloseTo(radius, 6);
        }
      }
    }
  });

  it('mirrors, rather than swinging the arc through the body', () => {
    // The regression this exists for. Aiming up and to the left reaches here as
    // -140 degrees, and PI minus that is 320, not -40. Cosine cannot tell those
    // apart but the swing scales the angle before the cosine sees it, so an
    // unwrapped angle threw the weapon somewhere the player was not aiming.
    for (const pose of POSES) {
      for (let degrees = -90; degrees <= 90; degrees += 5) {
        const right = offsetAt(degrees, false, pose);
        const left = offsetAt(degrees, true, pose);
        const where = `${pose.name} at ${degrees}deg`;

        expect(left.x, where).toBeCloseTo(-right.x, 6);
        expect(left.y, where).toBeCloseTo(right.y, 6);
      }
    }
  });

  it('lifts the weapon when the aim rises and drops it when it falls', () => {
    // Monotonic, both facings. A wrapping mistake shows up here as the grip
    // reversing direction partway up the arc.
    for (const mirrored of [false, true]) {
      let previous = -Infinity;
      for (let degrees = -90; degrees <= 90; degrees += 5) {
        const { y } = offsetAt(degrees, mirrored);
        expect(y, `mirrored=${mirrored} at ${degrees}deg`).toBeGreaterThan(
          previous - 1e-9,
        );
        previous = y;
      }
    }
  });

  it('spans the shoulder and the grip with the arm that was drawn', () => {
    // The arc's radius is shoulder-to-grip, and the arm has to be that long,
    // because the artist drew it that way: on the 96x96 canvas the arm was
    // authored on, its shoulder sits at the shoulder and its hand lands on the
    // grip. Half a pixel of give is the rounding between the two.
    //
    // Revisions that solved for the shoulder instead of measuring it opened
    // this to 3-5px and the arm sat on the ribs. Anything above a pixel here is
    // an anchor that has stopped agreeing with the drawing.
    for (const pose of POSES) {
      const span = Math.hypot(
        pose.grip.x - pose.shoulder.x,
        pose.grip.y - pose.shoulder.y,
      );

      expect(Math.abs(FRONT_ARM.length - span), pose.name).toBeLessThan(1);
    }
  });

  it('holds one attitude in every pose', () => {
    // A pose moves the shoulder and the weapon together, so the arm between
    // them keeps the angle it was drawn at. It did not: the airborne override
    // dropped the hand 13px against the body's 10, and the arm rested 15.9
    // degrees lower in flight than on the ground. Anything above a rounding
    // error here is that tilt coming back.
    const attitude = (pose: (typeof POSES)[number]) => ({
      radius: Math.hypot(
        pose.grip.x - pose.shoulder.x,
        pose.grip.y - pose.shoulder.y,
      ),
      angle: Math.atan2(
        pose.grip.y - pose.shoulder.y,
        pose.grip.x - pose.shoulder.x,
      ),
    });

    const standing = attitude(STANDING);
    for (const pose of POSES) {
      const own = attitude(pose);
      expect(own.radius, pose.name).toBeCloseTo(standing.radius, 6);
      expect(own.angle, pose.name).toBeCloseTo(standing.angle, 6);
    }
  });

  it('moves the whole assembly together when nudged', () => {
    // RIG_NUDGE exists so the gun can be slid around on the body without
    // touching the six anchors that hold the arm together. That only works if
    // it is the same translation for all of them: shift the shoulder without
    // the grip and the arm stretches, shift the grip without the far elbow and
    // the support hand leaves the handguard.
    const frame = PLAYER_JUMP_FRAMES.airborne;
    const zero = { x: 0, y: 0 };

    const moved = [
      rigAnchor(zero, {}, 'no override'),
      rigAnchor(zero, { [frame]: zero }, frame),
      rigAnchor(STANDING.shoulder, {}, 'no override'),
      rigAnchor(STANDING.grip, {}, 'no override'),
    ];

    expect(moved[0]).toEqual(RIG_NUDGE);
    expect(moved[1]).toEqual(RIG_NUDGE);
    expect(moved[2].x - STANDING.shoulder.x).toBe(RIG_NUDGE.x);
    expect(moved[2].y - STANDING.shoulder.y).toBe(RIG_NUDGE.y);
    expect(moved[3].x - STANDING.grip.x).toBe(RIG_NUDGE.x);
    expect(moved[3].y - STANDING.grip.y).toBe(RIG_NUDGE.y);
  });

  it('swings far enough to be worth having', () => {
    // This is the grip's own travel along the arc, which is the aim range times
    // the rate — 39.6 degrees. The arm turns further than that, 49, because the
    // hand also slides along the weapon as the angle changes.
    //
    // Pinned, the trigger arm managed 12.9 degrees over the whole aim range,
    // which is what the arc exists to fix. Anything under a sixth of a turn is
    // back to a limb that does not read as moving.
    const angles = [];
    for (let degrees = -90; degrees <= 90; degrees += 5) {
      const { x, y } = offsetAt(degrees, false);
      angles.push(
        Math.atan2(y - STANDING.shoulder.y, x - STANDING.shoulder.x),
      );
    }
    const swing = ((Math.max(...angles) - Math.min(...angles)) * 180) / Math.PI;
    expect(swing).toBeGreaterThan(30);
  });
});
