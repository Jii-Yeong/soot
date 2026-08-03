import { describe, expect, it } from 'vitest';
import {
  PLAYER_IDLE_FRAMES,
  PLAYER_JUMP_FRAMES,
  PLAYER_RUN_FRAMES,
} from '@/game/config/playerAnimationConfig';
import {
  BACK_ARM,
  BACK_ARM_ELBOW_BY_FRAME,
  WEAPON_GRIP_BY_FRAME,
} from '@/game/config/playerRigConfig';
import { WEAPON_CONFIGS } from '@/game/config/weaponConfig';
import { solveBackArmPose } from '@/game/systems/backArmPose';

/** Matches HAND_FROM_CENTRE in WeaponFeedback: where the grip hangs. */
const GRIP_FROM_CENTRE_X = 5;
const GRIP_FROM_CENTRE_Y = -3;

const PLAYER = { x: 400, y: 300 };

function poseAt(
  degrees: number,
  mirrored: boolean,
  barrel: number,
  elbow: { x: number; y: number } = {
    x: BACK_ARM.elbowFromCentreX,
    y: BACK_ARM.elbowFromCentreY,
  },
  grip: { x: number; y: number } = {
    x: GRIP_FROM_CENTRE_X,
    y: GRIP_FROM_CENTRE_Y,
  },
) {
  // Aiming left mirrors the rig rather than rotating past vertical, so the
  // weapon's own rotation is measured from the facing direction either way.
  const rotation = mirrored
    ? Math.PI - (degrees * Math.PI) / 180
    : (degrees * Math.PI) / 180;

  return solveBackArmPose({
    playerX: PLAYER.x,
    playerY: PLAYER.y,
    gripX: PLAYER.x + (mirrored ? -grip.x : grip.x),
    gripY: PLAYER.y + grip.y,
    rotation,
    mirrored,
    barrel,
    elbowFromCentreX: elbow.x,
    elbowFromCentreY: elbow.y,
  });
}

describe('back arm pose', () => {
  it('hinges on the elbow, which never leaves the body', () => {
    // The whole reason the arm was split off the weapon: welded to the gun it
    // pivoted on the grip, so the elbow orbited and tore off the torso.
    for (const degrees of [-90, -45, 0, 45, 90]) {
      const pose = poseAt(degrees, false, 24);
      expect(pose.elbowX).toBeCloseTo(PLAYER.x + BACK_ARM.elbowFromCentreX, 6);
      expect(pose.elbowY).toBeCloseTo(PLAYER.y + BACK_ARM.elbowFromCentreY, 6);
    }
  });

  it('keeps the forearm at its drawn length across the aim range', () => {
    for (const weapon of WEAPON_CONFIGS) {
      for (let degrees = -90; degrees <= 90; degrees += 5) {
        for (const mirrored of [false, true]) {
          const { reach } = poseAt(degrees, mirrored, weapon.muzzleOffset);
          // Under a pixel of give. Only the SMG ever clamps — its barrel ends
          // at 20px of usable handguard — and it falls 0.8px short at worst.
          expect(
            Math.abs(reach - BACK_ARM.length),
            `${weapon.id} at ${degrees}deg mirrored=${mirrored}`,
          ).toBeLessThan(1);
        }
      }
    }
  });

  it('puts the hand on the barrel rather than beside it', () => {
    for (const weapon of WEAPON_CONFIGS) {
      for (let degrees = -90; degrees <= 90; degrees += 15) {
        const rotation = (degrees * Math.PI) / 180;
        const pose = poseAt(degrees, false, weapon.muzzleOffset);
        const gripX = PLAYER.x + GRIP_FROM_CENTRE_X;
        const gripY = PLAYER.y + GRIP_FROM_CENTRE_Y;

        // Distance from the hand to the barrel line, perpendicular. It should
        // be exactly the handguard rise: the hand grips over the bore.
        const offsetX = pose.handX - gripX;
        const offsetY = pose.handY - gripY;
        const perpendicular =
          -offsetX * Math.sin(rotation) + offsetY * Math.cos(rotation);
        const along = offsetX * Math.cos(rotation) + offsetY * Math.sin(rotation);

        expect(perpendicular).toBeCloseTo(-BACK_ARM.handguardRise, 6);
        expect(along).toBeGreaterThanOrEqual(BACK_ARM.minReach - 1e-6);
        expect(along).toBeLessThanOrEqual(weapon.muzzleOffset);
      }
    }
  });

  it('follows the shoulder into the airborne lean', () => {
    // The falling body curls forward and carries the shoulder with it, so the
    // elbow has to go too — anchored to the standing offset the arm hung off
    // the chest.
    //
    // The offset is small now, and that is the point. It used to drop 11px,
    // ten of which were not the pose: the airborne frame sat 10px low in its
    // own canvas and every table in this rig was quietly paying for it. The
    // atlas carries that correction now, so what is left here is the lean.
    const airborne = BACK_ARM_ELBOW_BY_FRAME[PLAYER_JUMP_FRAMES.airborne];

    expect(airborne).toBeDefined();
    expect(
      Math.hypot(
        airborne.x - BACK_ARM.elbowFromCentreX,
        airborne.y - BACK_ARM.elbowFromCentreY,
      ),
    ).toBeLessThan(4);

    const standing = poseAt(0, false, 24);
    const falling = poseAt(0, false, 24, airborne);
    expect(falling.elbowY - standing.elbowY).toBeCloseTo(
      airborne.y - BACK_ARM.elbowFromCentreY,
      6,
    );
  });

  it('keeps the forearm honest from the airborne anchor too', () => {
    // The two overrides only work as a pair. Drop the shoulder and leave the
    // gun standing and the forearm falls up to 7.3px short of the handguard —
    // no elbow offset recovers that, because the gun is the end in the wrong
    // place. This is the check that caught it.
    const airborne = BACK_ARM_ELBOW_BY_FRAME[PLAYER_JUMP_FRAMES.airborne];
    const airborneGrip = WEAPON_GRIP_BY_FRAME[PLAYER_JUMP_FRAMES.airborne];

    expect(airborneGrip).toBeDefined();

    for (const weapon of WEAPON_CONFIGS) {
      for (let degrees = -90; degrees <= 90; degrees += 5) {
        for (const mirrored of [false, true]) {
          const { reach } = poseAt(
            degrees,
            mirrored,
            weapon.muzzleOffset,
            airborne,
            airborneGrip,
          );
          expect(
            Math.abs(reach - BACK_ARM.length),
            `${weapon.id} at ${degrees}deg mirrored=${mirrored}`,
          ).toBeLessThan(1);
        }
      }
    }
  });

  it('overrides only frames the player actually plays', () => {
    // A typo here is silent: the lookup falls back to the default and the pose
    // simply stays wrong.
    const played = new Set<string>([
      ...PLAYER_IDLE_FRAMES,
      ...PLAYER_RUN_FRAMES,
      ...Object.values(PLAYER_JUMP_FRAMES),
    ]);

    for (const frame of [
      ...Object.keys(BACK_ARM_ELBOW_BY_FRAME),
      ...Object.keys(WEAPON_GRIP_BY_FRAME),
    ]) {
      expect(played, `${frame} is not a frame the player plays`).toContain(
        frame,
      );
    }
  });

  it('mirrors cleanly when the player turns around', () => {
    for (let degrees = -90; degrees <= 90; degrees += 15) {
      const right = poseAt(degrees, false, 47);
      const left = poseAt(degrees, true, 47);

      // Same pose, reflected through the player's vertical axis.
      expect(left.handX - PLAYER.x).toBeCloseTo(-(right.handX - PLAYER.x), 6);
      expect(left.handY).toBeCloseTo(right.handY, 6);
      expect(left.reach).toBeCloseTo(right.reach, 6);
    }
  });
});
