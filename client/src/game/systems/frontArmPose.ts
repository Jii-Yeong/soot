import { FRONT_ARM } from '@/game/config/playerRigConfig';

export type FrontArmInput = {
  playerX: number;
  playerY: number;
  /** The weapon sprite's origin — the top of its grip — in world space. */
  gripX: number;
  gripY: number;
  /** The weapon's drawn rotation, recoil climb included. */
  rotation: number;
  /** Whether the weapon is drawn flipped, i.e. the player is aiming left. */
  mirrored: boolean;
  /**
   * Where the near shoulder is in the pose being drawn, as an offset from the
   * sprite's centre. The caller resolves it per frame because the torso does
   * not hold one attitude across the animation.
   */
  shoulderFromCentreX: number;
  shoulderFromCentreY: number;
};

export type FrontArmPose = {
  /** Where the sprite's origin goes: the fist, on the trigger. */
  handX: number;
  handY: number;
  /** What to pass to setRotation, given `flipY`. */
  rotation: number;
  flipY: boolean;
  /** Shoulder to hand. Longer than the drawn forearm, and meant to be. */
  reach: number;
};

const TWO_PI = Math.PI * 2;

/** Shortest signed turn from `from` to `to`. */
function shortestTurn(from: number, to: number) {
  let delta = (to - from) % TWO_PI;
  if (delta > Math.PI) {
    delta -= TWO_PI;
  }
  if (delta < -Math.PI) {
    delta += TWO_PI;
  }
  return delta;
}

/**
 * Where the trigger arm has to be for its hand to sit on the grip.
 *
 * The hand is pinned rather than solved for: the grip does not move with the
 * aim, only with recoil and the pose, so there is no reach problem here. The
 * one real decision is the forearm's angle, and it is a blend — mostly pointing
 * back at the shoulder so the far end stays behind the coat, partly following
 * the weapon so the wrist reads as attached to what it is holding.
 *
 * Mirroring is done in the weapon's own frame so left and right come out exact
 * reflections; blending the world angles instead bends the wrong way past
 * vertical.
 *
 * Kept apart from the sprite so the geometry can be checked without a renderer.
 */
export function solveFrontArmPose(input: FrontArmInput): FrontArmPose {
  const {
    playerX,
    playerY,
    gripX,
    gripY,
    rotation,
    mirrored,
    shoulderFromCentreX,
    shoulderFromCentreY,
  } = input;
  const cos = Math.cos(rotation);
  const sin = Math.sin(rotation);

  const lift = mirrored ? FRONT_ARM.holdRise : -FRONT_ARM.holdRise;
  const handX = gripX + cos * FRONT_ARM.holdAlong - sin * lift;
  const handY = gripY + sin * FRONT_ARM.holdAlong + cos * lift;

  const shoulderX =
    playerX + (mirrored ? -shoulderFromCentreX : shoulderFromCentreX);
  const shoulderY = playerY + shoulderFromCentreY;

  const toward = Math.atan2(handY - shoulderY, handX - shoulderX);
  const local = mirrored ? Math.PI - rotation : rotation;
  const localToward = mirrored ? Math.PI - toward : toward;
  const aimLocal =
    localToward + shortestTurn(localToward, local) * FRONT_ARM.wristFollow;
  const aim = mirrored ? Math.PI - aimLocal : aimLocal;

  return {
    handX,
    handY,
    // Mirroring negates the art's own local angles before the rotation is
    // applied, so the rest angle changes sign with the flip.
    rotation: mirrored ? aim + FRONT_ARM.restAngle : aim - FRONT_ARM.restAngle,
    flipY: mirrored,
    reach: Math.hypot(handX - shoulderX, handY - shoulderY),
  };
}
