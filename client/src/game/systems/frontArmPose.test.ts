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

/** Matches HAND_FROM_CENTRE in WeaponFeedback: where the grip hangs. */
type Anchor = { x: number; y: number };

const DEFAULT_GRIP: Anchor = { x: 5, y: -3 };
const DEFAULT_SHOULDER: Anchor = {
  x: FRONT_ARM.shoulderFromCentreX,
  y: FRONT_ARM.shoulderFromCentreY,
};

const PLAYER = { x: 400, y: 300 };

/**
 * Origin to the far edge of the drawn forearm in front-arm.png: the fist's
 * centre is at (7.43, 3.29) and the sleeve runs out at (1.0, 6.5).
 */
const FOREARM_LENGTH = Math.hypot(7.429 - 1, 3.286 - 6.5);

/** Every pose the rig has to hold, standing and airborne. */
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
  { grip = DEFAULT_GRIP, shoulder = DEFAULT_SHOULDER, recoil = 0 } = {},
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
    shoulderFromCentreX: shoulder.x,
    shoulderFromCentreY: shoulder.y,
  });
}

/** The forearm's world direction, hand back towards the elbow. */
function forearmDirection(
  degrees: number,
  mirrored: boolean,
  options?: Parameters<typeof poseAt>[2],
) {
  const pose = poseAt(degrees, mirrored, options);
  const local = FRONT_ARM.restAngle + Math.PI;
  return pose.rotation + (mirrored ? -local : local);
}

/** The far end of the drawn forearm, relative to the player's centre. */
function forearmEnd(
  degrees: number,
  mirrored: boolean,
  options?: Parameters<typeof poseAt>[2],
) {
  const pose = poseAt(degrees, mirrored, options);
  const direction = forearmDirection(degrees, mirrored, options);
  return {
    x: pose.handX + Math.cos(direction) * FOREARM_LENGTH - PLAYER.x,
    y: pose.handY + Math.sin(direction) * FOREARM_LENGTH - PLAYER.y,
  };
}

describe('front arm pose', () => {
  it('keeps the hand on the trigger, not on the sprite origin', () => {
    for (const degrees of [-90, -45, 0, 45, 90]) {
      for (const mirrored of [false, true]) {
        const rotation = mirrored
          ? Math.PI - (degrees * Math.PI) / 180
          : (degrees * Math.PI) / 180;
        const pose = poseAt(degrees, mirrored);
        const gripX =
          PLAYER.x + (mirrored ? -DEFAULT_GRIP.x : DEFAULT_GRIP.x);
        const gripY = PLAYER.y + DEFAULT_GRIP.y;

        // Split the offset into the weapon's own axes. Along the barrel it is
        // the trigger's setback; across it, the drop below the grip's top.
        const offsetX = pose.handX - gripX;
        const offsetY = pose.handY - gripY;
        const along = offsetX * Math.cos(rotation) + offsetY * Math.sin(rotation);
        const across =
          -offsetX * Math.sin(rotation) + offsetY * Math.cos(rotation);

        expect(along).toBeCloseTo(FRONT_ARM.holdAlong, 6);
        // Rise is measured upwards and flips with the weapon, exactly as the
        // muzzle's does, so aiming left must not push the hand through the grip.
        expect(across).toBeCloseTo(
          mirrored ? FRONT_ARM.holdRise : -FRONT_ARM.holdRise,
          6,
        );
      }
    }
  });

  it('buries the elbow end in the torso in every pose', () => {
    // The rig never draws an elbow: the sprite is a 7.2px forearm stub and the
    // shoulder is further off than that, so the difference has to disappear
    // behind the coat rather than be reached for. Measured over both poses,
    // both facings and the whole aim range, the stub's far end never gets more
    // than 4px from the sprite's centre — the middle of a torso that runs 11px
    // to the near side.
    for (const pose of POSES) {
      for (let degrees = -90; degrees <= 90; degrees += 5) {
        for (const mirrored of [false, true]) {
          const end = forearmEnd(degrees, mirrored, pose);
          const where = `${pose.name} at ${degrees}deg mirrored=${mirrored}`;

          expect(Math.abs(end.x), where).toBeLessThan(4);
          expect(end.y, where).toBeGreaterThan(-8);
          expect(end.y, where).toBeLessThan(14);
        }
      }
    }
  });

  it('slides with recoil rather than swinging out on it', () => {
    // Recoil drags the grip back along the aim vector and the hand goes with
    // it, so the stub can leave the silhouette while the kick lasts — up to
    // 2.3px of sleeve for the two heavy weapons, over the two frames it takes
    // the 55ms half-life to bring them back. That is the arm being pulled, and
    // it is fine. What would not be is the pose swinging the forearm out on its
    // own, so the far end may never travel further than the recoil moved it.
    for (const pose of POSES) {
      for (const weapon of WEAPON_CONFIGS) {
        const recoil = weapon.feedback.recoilDistance;
        for (let degrees = -90; degrees <= 90; degrees += 5) {
          for (const mirrored of [false, true]) {
            const rest = forearmEnd(degrees, mirrored, pose);
            const kicked = forearmEnd(degrees, mirrored, { ...pose, recoil });
            const travelled = Math.hypot(kicked.x - rest.x, kicked.y - rest.y);

            expect(
              travelled,
              `${pose.name} ${weapon.id} at ${degrees}deg mirrored=${mirrored}`,
            ).toBeLessThanOrEqual(recoil + 1e-6);
          }
        }
      }
    }
  });

  it('turns the wrist with the weapon without following it all the way', () => {
    // Both halves matter. A hand that ignores the gun meets the grip crossways;
    // one that copies it is the case above.
    for (const pose of POSES) {
      const low = forearmDirection(-90, false, pose);
      const high = forearmDirection(90, false, pose);
      const swing = Math.abs(high - low);
      // The weapon covers a half turn between straight up and straight down.
      const weaponSwing = Math.PI;

      expect(swing, pose.name).toBeGreaterThan(0.25);
      expect(swing, pose.name).toBeLessThan(weaponSwing * 0.6);
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
    // The airborne pose drops the grip 13px and the joint with it. Left on the
    // standing anchor the arm spans a distance the pose never intended, which
    // is the failure the back arm's per-frame table exists to avoid.
    const airborne = POSES[1];
    const withOwnAnchor = poseAt(0, false, airborne).reach;
    const withStandingAnchor = poseAt(0, false, {
      grip: airborne.grip,
      shoulder: DEFAULT_SHOULDER,
    }).reach;

    expect(withOwnAnchor).toBeLessThan(withStandingAnchor - 5);
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
