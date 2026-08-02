import { FRONT_ARM } from '@/game/config/playerRigConfig';

export type FrontArmInput = {
  playerX: number;
  playerY: number;
  /** The weapon sprite's origin — its grip — in world space. */
  gripX: number;
  gripY: number;
  /** The weapon's drawn rotation, recoil climb included. */
  rotation: number;
  /** Whether the weapon is drawn flipped, i.e. the player is aiming left. */
  mirrored: boolean;
  /** Grip to muzzle, so the hand knows where the weapon runs out. */
  barrel: number;
  /**
   * Where the near shoulder is in the pose being drawn, as an offset from the
   * sprite's centre. The caller resolves it per frame because the torso does
   * not hold one attitude across the animation.
   */
  shoulderFromCentreX: number;
  shoulderFromCentreY: number;
};

export type FrontArmPose = {
  shoulderX: number;
  shoulderY: number;
  handX: number;
  handY: number;
  /** What to pass to setRotation, given `flipY`. */
  rotation: number;
  flipY: boolean;
  /** Shoulder to hand. Equals FRONT_ARM.length unless a stop forced a clamp. */
  reach: number;
  /** How far forward of the grip the hand ended up. Zero unless recoiling. */
  slide: number;
};

const clamp = (value: number, low: number, high: number) =>
  Math.min(high, Math.max(low, value));

/**
 * Where the trigger arm has to be for its hand to sit on the weapon.
 *
 * The same construction as the back arm, and for the same reason: an arm with
 * both ends pinned cannot absorb 16px of recoil, so one end is given somewhere
 * to slide. Here it is the hand, which holds the weapon's axis rather than one
 * fixed point on it — at rest that is the grip exactly, and while a shot
 * settles the gun slides back through the hand instead of dragging the shoulder
 * off the body with it.
 *
 * Deliberately not shared with solveBackArmPose. The algebra is the same but
 * the two arms disagree about everything around it: the support hand grips over
 * the bore and may not come nearer than 7px, this one grips on the axis and may
 * not go behind the grip at all.
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
    barrel,
    shoulderFromCentreX,
    shoulderFromCentreY,
  } = input;
  const cos = Math.cos(rotation);
  const sin = Math.sin(rotation);

  const shoulderX =
    playerX + (mirrored ? -shoulderFromCentreX : shoulderFromCentreX);
  const shoulderY = playerY + shoulderFromCentreY;

  // The weapon's axis, measured from the shoulder.
  const fromShoulderX = gripX - shoulderX;
  const fromShoulderY = gripY - shoulderY;

  const along = fromShoulderX * cos + fromShoulderY * sin;
  const square = fromShoulderX * fromShoulderX + fromShoulderY * fromShoulderY;
  const discriminant = along * along - square + FRONT_ARM.length ** 2;
  // A negative discriminant means no point on that line is an arm's length
  // away; the nearest approach is the best the arm can do.
  const wanted = discriminant < 0 ? -along : -along + Math.sqrt(discriminant);
  const slide = clamp(
    wanted,
    FRONT_ARM.minSlide,
    Math.max(FRONT_ARM.minSlide, barrel - FRONT_ARM.muzzleClearance),
  );

  const reachX = fromShoulderX + slide * cos;
  const reachY = fromShoulderY + slide * sin;
  const aim = Math.atan2(reachY, reachX);

  return {
    shoulderX,
    shoulderY,
    handX: shoulderX + reachX,
    handY: shoulderY + reachY,
    // Mirroring negates the art's own local angles before the rotation is
    // applied, so the rest angle changes sign with the flip.
    rotation: mirrored ? aim + FRONT_ARM.restAngle : aim - FRONT_ARM.restAngle,
    flipY: mirrored,
    reach: Math.hypot(reachX, reachY),
    slide,
  };
}
