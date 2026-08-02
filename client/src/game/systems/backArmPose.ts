import { BACK_ARM } from '@/game/config/playerRigConfig';

export type BackArmInput = {
  playerX: number;
  playerY: number;
  /** The weapon sprite's origin — its grip — in world space. */
  gripX: number;
  gripY: number;
  /** The weapon's drawn rotation, recoil climb included. */
  rotation: number;
  /** Whether the weapon is drawn flipped, i.e. the player is aiming left. */
  mirrored: boolean;
  /** Grip to muzzle, so the hand knows where the handguard runs out. */
  barrel: number;
  /**
   * Where the shoulder is in the pose being drawn, as an offset from the
   * sprite's centre. The caller resolves it per frame because the torso does
   * not hold one attitude across the animation.
   */
  elbowFromCentreX: number;
  elbowFromCentreY: number;
};

export type BackArmPose = {
  elbowX: number;
  elbowY: number;
  handX: number;
  handY: number;
  /** What to pass to setRotation, given `flipY`. */
  rotation: number;
  flipY: boolean;
  /** Elbow to hand. Equals BACK_ARM.length unless the barrel forced a clamp. */
  reach: number;
};

const clamp = (value: number, low: number, high: number) =>
  Math.min(high, Math.max(low, value));

/**
 * Where the support arm has to be for its hand to sit on the weapon.
 *
 * The hand is not pinned to a fixed spot on the gun. A hand on a handguard
 * slides, so this solves for the point along the barrel that an arm of exactly
 * the right length reaches — which has a solution at nearly every angle, where
 * reaching a fixed point would not.
 *
 * Kept apart from the sprite so the geometry can be checked without a renderer.
 */
export function solveBackArmPose(input: BackArmInput): BackArmPose {
  const {
    playerX,
    playerY,
    gripX,
    gripY,
    rotation,
    mirrored,
    barrel,
    elbowFromCentreX,
    elbowFromCentreY,
  } = input;
  const cos = Math.cos(rotation);
  const sin = Math.sin(rotation);

  const elbowX = playerX + (mirrored ? -elbowFromCentreX : elbowFromCentreX);
  const elbowY = playerY + elbowFromCentreY;

  // The barrel line lifted to the handguard, measured from the elbow. The lift
  // flips with the weapon for the same reason the muzzle does: aiming left
  // would otherwise put the handguard under the barrel.
  const lift = mirrored ? BACK_ARM.handguardRise : -BACK_ARM.handguardRise;
  const fromElbowX = gripX - sin * lift - elbowX;
  const fromElbowY = gripY + cos * lift - elbowY;

  const along = fromElbowX * cos + fromElbowY * sin;
  const square = fromElbowX * fromElbowX + fromElbowY * fromElbowY;
  const discriminant = along * along - square + BACK_ARM.length ** 2;
  // A negative discriminant means no point on that line is an arm's length
  // away; the nearest approach is the best the arm can do.
  const wanted = discriminant < 0 ? -along : -along + Math.sqrt(discriminant);
  const held = clamp(
    wanted,
    BACK_ARM.minReach,
    Math.max(BACK_ARM.minReach, barrel - BACK_ARM.muzzleClearance),
  );

  const reachX = fromElbowX + held * cos;
  const reachY = fromElbowY + held * sin;
  const aim = Math.atan2(reachY, reachX);

  return {
    elbowX,
    elbowY,
    handX: elbowX + reachX,
    handY: elbowY + reachY,
    // Mirroring negates the art's own local angles before the rotation is
    // applied, so the rest angle changes sign with the flip.
    rotation: mirrored ? aim + BACK_ARM.restAngle : aim - BACK_ARM.restAngle,
    flipY: mirrored,
    reach: Math.hypot(reachX, reachY),
  };
}
