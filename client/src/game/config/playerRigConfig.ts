import { PLAYER_JUMP_FRAMES } from '@/game/config/playerAnimationConfig';

/**
 * How the player is assembled from layers.
 *
 * The back arm is its own sprite rather than part of the weapon canvas. Welding
 * it to the gun made the pair rotate as one piece, which is wrong the moment the
 * body animates: the body owns the shoulder, and an arm bolted to the gun does
 * not follow it. Splitting them also removes the joint gap outright — the elbow
 * is now the pivot, so the end that has to stay on the torso is the end that
 * does not move.
 *
 * Every number here was measured off back_arm.png rather than chosen.
 */
export const BACK_ARM = {
  texture: 'player-back-arm',
  url: '/assets/player/back-arm.png',

  /** 19x14 sprite; the elbow is pixel (0, 10) of it. */
  originX: 0.5 / 19,
  originY: 10.5 / 14,

  /**
   * The elbow's offset from the player sprite's centre. Mirrors when facing
   * left. Poses that carry the shoulder somewhere else override it below.
   *
   * Buried 4px inside the torso rather than set on the silhouette's edge. The
   * arm this hinges is the far one, so its shoulder belongs behind the body,
   * and the art tapers to a point at the pivot — 1px at the elbow, full 8px of
   * limb only by its fifth column. Pinned to the edge, every angle the arm
   * turned to opened a wedge between that taper and the torso. 4px is what the
   * standing frames have to spare: the body runs 4px further right at the elbow
   * row in all of them, 2px in the one run frame that leans away.
   */
  elbowFromCentreX: 4,
  elbowFromCentreY: 1,

  /** Elbow to hand, and the direction the art already points at rest. */
  length: 15.92,
  restAngle: -0.4173,

  /**
   * How far above the barrel line the support hand sits — it grips the
   * handguard, not the bore.
   */
  handguardRise: 2.4,

  /**
   * Where along the barrel the hand may slide.
   *
   * The hand is not pinned to one spot: a hand on a handguard slides, so rather
   * than asking whether the arm can reach a fixed point, the rig solves for the
   * point along the barrel that an arm of exactly the right length reaches. That
   * has a solution at nearly every angle. Measured over -90..90 degrees, both
   * facings and all four weapons, the hand sits between 11.6 and 19.6px out and
   * never reaches either stop, so the forearm holds its drawn length exactly.
   * That is a consequence of seating the elbow deeper: at the old edge anchor
   * the SMG clamped on 22 of those 296 angles and fell 0.8px short at worst.
   */
  minReach: 7,
  muzzleClearance: 4,
} as const;

/**
 * Poses that carry the shoulder somewhere the default anchor does not follow.
 *
 * One anchor for every frame works only while the torso holds one attitude. It
 * does not: in the airborne pose the body curls forward and the shoulder drops
 * to y=57.5 of the 96x96 frame, 11.5px below where it sits in every other pose.
 * Pinned to the standing anchor the arm hangs off the chest instead of the
 * shoulder, which is what reads as wrong on the way down from a jump.
 *
 * Measured by diffing this sprite against the armed one it replaced: the pixels
 * that disappeared are the front arm, and where they met the torso is the
 * shoulder. Each value is then buried the same 4px inside the silhouette as the
 * standing anchor, so a pose moves the elbow exactly as far as it moves the
 * joint and no further.
 */
export const BACK_ARM_ELBOW_BY_FRAME: Record<
  string,
  { x: number; y: number }
> = {
  [PLAYER_JUMP_FRAMES.airborne]: { x: 6, y: 12 },
};

/**
 * Where the weapon hangs, for the poses that move the hand holding it.
 *
 * The gun has to move with the shoulder or the arm cannot span the two. That is
 * not a preference: with the grip fixed and the elbow on the airborne shoulder,
 * the forearm falls up to 7.3px short of the handguard across the aim range —
 * half its own length — and there is no elbow offset that fixes it, because the
 * gun is the end that is in the wrong place. Dropping both puts the reach error
 * back to zero.
 *
 * The same diff that located the shoulder locates the hand: the airborne pose
 * carries it 13px down and 2px forward from where it rests standing.
 */
export const WEAPON_GRIP_BY_FRAME: Record<
  string,
  { x: number; y: number }
> = {
  [PLAYER_JUMP_FRAMES.airborne]: { x: 7, y: 10 },
};
