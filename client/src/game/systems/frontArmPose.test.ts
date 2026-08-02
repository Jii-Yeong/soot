import { describe, expect, it } from 'vitest';
import { PLAYER_JUMP_FRAMES } from '@/game/config/playerAnimationConfig';
import {
  FRONT_ARM,
  FRONT_ARM_SHOULDER_BY_FRAME,
  WEAPON_GRIP_BY_FRAME,
} from '@/game/config/playerRigConfig';
import { PLAYER_STACK_DEPTH } from '@/game/config/renderDepth';
import { WEAPON_CONFIGS } from '@/game/config/weaponConfig';
import { solveFrontArmPose } from '@/game/systems/frontArmPose';

type Anchor = { x: number; y: number };

/** Matches HAND_FROM_CENTRE in WeaponFeedback: where the grip hangs. */
const DEFAULT_GRIP: Anchor = { x: 5, y: -3 };
const DEFAULT_SHOULDER: Anchor = {
  x: FRONT_ARM.shoulderFromCentreX,
  y: FRONT_ARM.shoulderFromCentreY,
};

const PLAYER = { x: 400, y: 300 };

/** Every pose the rig has to hold: the standing attitude, and the jump curl. */
const POSES = [
  { name: 'standing', grip: DEFAULT_GRIP, shoulder: DEFAULT_SHOULDER },
  {
    name: 'airborne',
    grip: WEAPON_GRIP_BY_FRAME[PLAYER_JUMP_FRAMES.airborne],
    shoulder: FRONT_ARM_SHOULDER_BY_FRAME[PLAYER_JUMP_FRAMES.airborne],
  },
];

function poseAt(
  degrees: number,
  mirrored: boolean,
  {
    grip = DEFAULT_GRIP,
    shoulder = DEFAULT_SHOULDER,
    recoil = 0,
    barrel = 24,
  } = {},
) {
  // Aiming left mirrors the rig rather than rotating past vertical, so the
  // weapon's own rotation is measured from the facing direction either way.
  const rotation = mirrored
    ? Math.PI - (degrees * Math.PI) / 180
    : (degrees * Math.PI) / 180;

  return solveFrontArmPose({
    playerX: PLAYER.x,
    playerY: PLAYER.y,
    gripX:
      PLAYER.x + (mirrored ? -grip.x : grip.x) - Math.cos(rotation) * recoil,
    gripY: PLAYER.y + grip.y - Math.sin(rotation) * recoil,
    rotation,
    mirrored,
    barrel,
    shoulderFromCentreX: shoulder.x,
    shoulderFromCentreY: shoulder.y,
  });
}

describe('front arm pose', () => {
  it('hinges on the shoulder, which never leaves the body', () => {
    // The reason it is not pinned to the grip instead: recoil slides the weapon
    // up to 16px, and an arm carried with it takes its own shoulder that far
    // off the torso. This one is drawn whole, shoulder cap included, so that
    // end has to be the fixed one.
    for (const pose of POSES) {
      for (const weapon of WEAPON_CONFIGS) {
        for (const degrees of [-90, -45, 0, 45, 90]) {
          const solved = poseAt(degrees, false, {
            ...pose,
            recoil: weapon.feedback.recoilDistance,
            barrel: weapon.muzzleOffset,
          });

          expect(solved.shoulderX).toBeCloseTo(PLAYER.x + pose.shoulder.x, 6);
          expect(solved.shoulderY).toBeCloseTo(PLAYER.y + pose.shoulder.y, 6);
        }
      }
    }
  });

  it('keeps the forearm at its drawn length across the aim range', () => {
    // Nothing here stretches. The hand slides along the weapon instead, so the
    // solve has an exact answer at every angle rather than an approximate one.
    for (const pose of POSES) {
      for (const weapon of WEAPON_CONFIGS) {
        for (let degrees = -90; degrees <= 90; degrees += 5) {
          for (const mirrored of [false, true]) {
            for (const recoil of [0, weapon.feedback.recoilDistance]) {
              const { reach } = poseAt(degrees, mirrored, {
                ...pose,
                recoil,
                barrel: weapon.muzzleOffset,
              });

              // Not "close enough" — exact. Under a hundredth of a pixel over
              // both poses, both facings, all four weapons and every angle.
              expect(
                Math.abs(reach - FRONT_ARM.length),
                `${pose.name} ${weapon.id} at ${degrees}deg mirrored=${mirrored} recoil=${recoil}`,
              ).toBeLessThan(0.01);
            }
          }
        }
      }
    }
  });

  it('holds the grip itself while nothing is recoiling', () => {
    // The art was drawn on the body's own 96x96 frame, so at rest the hand is
    // on the grip and the sprite lines up with the body pixel for pixel. The
    // 3.3px of give is the aim range, not slop: pointed straight up or down the
    // weapon's axis crosses the arm's circle just past the grip. Anything more
    // means an anchor has drifted from the sprite it was measured off.
    for (const pose of POSES) {
      for (const weapon of WEAPON_CONFIGS) {
        for (let degrees = -90; degrees <= 90; degrees += 1) {
          for (const mirrored of [false, true]) {
            const { slide } = poseAt(degrees, mirrored, {
              ...pose,
              barrel: weapon.muzzleOffset,
            });

            expect(
              slide,
              `${pose.name} ${weapon.id} at ${degrees}deg mirrored=${mirrored}`,
            ).toBeLessThan(3.5);
          }
        }
      }
    }
  });

  it('lets the weapon slide through the hand rather than past it', () => {
    // Recoil is absorbed by the hand moving up the weapon, so the slide is
    // bounded by the kick that caused it, and it may never leave the gun: not
    // behind the grip, and no nearer the muzzle than the support hand goes.
    for (const pose of POSES) {
      for (const weapon of WEAPON_CONFIGS) {
        const recoil = weapon.feedback.recoilDistance;
        for (let degrees = -90; degrees <= 90; degrees += 5) {
          for (const mirrored of [false, true]) {
            const { slide } = poseAt(degrees, mirrored, {
              ...pose,
              recoil,
              barrel: weapon.muzzleOffset,
            });
            const where = `${pose.name} ${weapon.id} at ${degrees}deg mirrored=${mirrored}`;

            expect(slide, where).toBeGreaterThanOrEqual(FRONT_ARM.minSlide);
            expect(slide, where).toBeLessThanOrEqual(
              weapon.muzzleOffset - FRONT_ARM.muzzleClearance,
            );
            // The kick plus the same 3.3px the aim range accounts for above.
            expect(slide, where).toBeLessThanOrEqual(recoil + 3.5);
          }
        }
      }
    }
  });

  it('mirrors cleanly when the player turns around', () => {
    for (const pose of POSES) {
      for (let degrees = -90; degrees <= 90; degrees += 15) {
        const right = poseAt(degrees, false, pose);
        const left = poseAt(degrees, true, pose);

        // Same pose, reflected through the player's vertical axis.
        expect(left.handX - PLAYER.x).toBeCloseTo(-(right.handX - PLAYER.x), 6);
        expect(left.handY).toBeCloseTo(right.handY, 6);
        expect(left.reach).toBeCloseTo(right.reach, 6);
      }
    }
  });

  it('follows the pose that moves the shoulder', () => {
    // The airborne pose drops the hand 13px and the joint with it. Left on the
    // standing anchor the arm spans a distance the pose never intended, which
    // is the failure the back arm's per-frame table exists to avoid.
    const airborne = POSES[1];
    const onOwnAnchor = poseAt(0, false, airborne);
    const onStandingAnchor = poseAt(0, false, {
      grip: airborne.grip,
      shoulder: DEFAULT_SHOULDER,
    });

    expect(onOwnAnchor.reach).toBeCloseTo(FRONT_ARM.length, 2);
    // 5.4px short, on an arm 14.7px long. There is no slide that closes it:
    // the hand simply cannot reach the gun from the standing shoulder.
    expect(onStandingAnchor.reach - FRONT_ARM.length).toBeGreaterThan(5);
  });

  it('draws over the weapon it is holding', () => {
    expect(PLAYER_STACK_DEPTH.frontArm).toBeGreaterThan(
      PLAYER_STACK_DEPTH.weapon,
    );
    expect(PLAYER_STACK_DEPTH.weapon).toBeGreaterThan(
      PLAYER_STACK_DEPTH.backArm,
    );
  });
});
