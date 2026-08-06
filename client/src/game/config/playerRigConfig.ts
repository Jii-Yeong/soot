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
 * One anchor for every frame works only while the torso holds one attitude, and
 * the airborne curl leans it forward. Measured by diffing this sprite against
 * the armed one it replaced: the pixels that disappeared are the front arm, and
 * where they met the torso is the shoulder. The value is then buried the same
 * 4px inside the silhouette as the standing anchor, so a pose moves the elbow
 * exactly as far as it moves the joint and no further.
 *
 * Ten of these twelve pixels are not the pose. The airborne frame is exported
 * 10px lower in its own 96x96 canvas than every other frame in the sheet, so
 * the whole character sits that far lower on screen while it is showing, and
 * every anchor here has to follow it down or the arm is left behind. Fixing
 * the export would remove the 10 from all three of these tables at once, but
 * that is the source .aseprite file, not this rig, and it stays as drawn.
 */
export const BACK_ARM_ELBOW_BY_FRAME: Record<
  string,
  { x: number; y: number }
> = {
  [PLAYER_JUMP_FRAMES.airborne]: { x: 6, y: 12 },
};

/**
 * Where the weapon rests, for the poses that move the hand holding it. The aim
 * swings it from here; see WEAPON_SWING_RATE.
 *
 * The gun has to move with the shoulder or the arm cannot span the two. That is
 * not a preference: with the grip fixed and the elbow on the airborne shoulder,
 * the forearm falls up to 7.3px short of the handguard across the aim range —
 * half its own length — and there is no elbow offset that fixes it, because the
 * gun is the end that is in the wrong place. Dropping both puts the reach error
 * back to zero.
 *
 * Ten of these pixels are the sheet's own offset for this frame rather than
 * the pose — see BACK_ARM_ELBOW_BY_FRAME — and the rest is the lean.
 *
 * Kept in step with FRONT_ARM_SHOULDER_BY_FRAME. The two have to move
 * together: three pixels of disagreement between hand and shoulder become an
 * angle, and the trigger arm rests at a visibly different attitude than it
 * does standing.
 */
export const WEAPON_GRIP_BY_FRAME: Record<
  string,
  { x: number; y: number }
> = {
  [PLAYER_JUMP_FRAMES.airborne]: { x: 6, y: 7 },
};

/**
 * The near arm — the one on the trigger.
 *
 * The body has no arms of its own any more, so both hands come from the rig,
 * and this is the second of them. Unlike the back arm this one is drawn whole,
 * shoulder cap included, so both of its ends are constrained: the shoulder has
 * to stay on the torso and the fist has to stay on the gun.
 *
 * That rules out pinning it to the grip. Recoil slides the weapon back up to
 * 16px, and an arm carried along with it puts its own shoulder that far off the
 * body — the arm tears off rather than absorbs the kick.
 *
 * So it hangs off the shoulder and holds the weapon the way the back arm does:
 * the hand slides along the weapon's axis to wherever an arm of exactly this
 * length reaches. At rest that point is a few pixels up the receiver from the
 * grip — see the burial note on the anchor below — and the art lines up with
 * the body pixel for pixel, because it was drawn on the body's own frame. Under
 * recoil the gun slides back through the hand instead of dragging it, which is
 * what a recoiling weapon does anyway. Measured over both poses, both facings,
 * all four weapons and the whole aim range, the forearm holds its drawn length
 * exactly — it never stretches and never falls short.
 *
 * Every number here was measured off front-arm.png and the armless body.
 */
export const FRONT_ARM = {
  texture: 'player-front-arm',
  url: '/assets/player/front-arm.png',

  /**
   * 25x12 sprite, cropped out of a 96x96 canvas drawn in register with the body
   * frames. The shoulder cap's centre of mass — its leftmost four columns — is
   * pixel (2.41, 5.65) of the crop, and that is the joint it turns on.
   */
  originX: 2.412 / 25,
  originY: 5.647 / 12,

  /**
   * The near shoulder's offset from the player sprite's centre, for the poses
   * that keep the standing attitude. Mirrors when facing left.
   *
   * Read off the art, not derived from the weapon. front-arm.png was cropped
   * out of a 96x96 canvas drawn in register with the body frames, and the crop
   * came from (36, 41) of it — so the pivot sits at (38.41, 46.65) of that
   * canvas, which is this. The artist put the shoulder on the shoulder; the rig
   * only has to leave it there.
   *
   * That also settles the far end for free. From here the drawn hand lands at
   * (5.50, -2.50), within 0.7px of the grip the weapon hangs from — the arm was
   * drawn to span exactly that gap.
   *
   * Earlier revisions solved for this instead of measuring it, taking the grip
   * and stepping back one arm length, then burying the result 4.5px to tuck the
   * shoulder cap inside the silhouette. Both moved it forward of where it was
   * drawn, and the arm sat on the ribs instead of the shoulder. The cap does
   * overhang the torso a little here, and that is the drawing, not a defect.
   */
  shoulderFromCentreX: -9.09,
  shoulderFromCentreY: -0.85,

  /** Shoulder to hand, and the direction the art already points at rest. */
  length: 14.6809,
  restAngle: -0.1124,

  /**
   * Where along the weapon the hand may sit, measured from the grip.
   *
   * It never goes behind the grip — there is no gun back there to hold — and it
   * stops the same 4px short of the muzzle the support hand does. At rest it
   * stays within 3.3px of the grip; peak recoil on the rail rifle carries it
   * 19px forward, and the 55ms half-life brings it back inside two frames.
   */
  minSlide: 0,
  muzzleClearance: 4,
} as const;

/**
 * The near shoulder for the poses that move it, the same way
 * BACK_ARM_ELBOW_BY_FRAME covers the far one.
 *
 * The frame's own 10px offset plus the lean, exactly as WEAPON_GRIP_BY_FRAME
 * carries them — the two are one rigid piece and have to move as one.
 *
 * Verified against the pose rather than assumed: the arm holds the same
 * attitude in flight that it holds standing, to six decimals.
 */
export const FRONT_ARM_SHOULDER_BY_FRAME: Record<
  string,
  { x: number; y: number }
> = {
  [PLAYER_JUMP_FRAMES.airborne]: { x: -8.09, y: 9.15 },
};

/**
 * How much of the aim the shoulder takes, with the wrist taking the rest.
 *
 * The weapon used to pivot on a grip nailed to one spot. That reads fine on the
 * gun and is wrong on the arm holding it: with the shoulder on the torso and the
 * hand on a fixed point, the limb between them cannot turn, and it did not — 0.0
 * degrees of swing measured across the whole aim range. So the grip travels an
 * arc, and the trigger arm turns with it.
 *
 * Why not the whole way. At rate 1 the arm follows the crosshair exactly and the
 * gun swings a full circle of the arm's own length, which the far arm cannot
 * follow: its elbow is pinned in the torso and its reach falls 13.8px short of
 * the handguard — most of its own length. The far arm is what caps this.
 *
 * 0.22 is where its shortfall reaches exactly zero across every weapon, every
 * angle and full recoil. Past that it starts paying: 0.64px at 0.25, 1.68 at
 * 0.30. It buys 49 degrees of trigger-arm swing, against the 12.9 a pinned grip
 * managed.
 */
export const WEAPON_SWING_RATE = 0.22;

/**
 * Moves the whole held assembly — near shoulder, grip and far elbow — as one.
 *
 * There are six anchors between the three tables and they are not independent:
 * the arm is rigid, so shoulder-to-grip has to stay one arm length, and the far
 * elbow has to keep its reach to the handguard. Nudging them one at a time
 * breaks those relationships and the tests start failing for reasons that have
 * nothing to do with the change.
 *
 * Applied before mirroring, so x is 'forward, facing right' and turning around
 * takes it the other way by itself.
 *
 * This is the knob to reach for when the gun simply sits in the wrong place on
 * the body. Reach for the anchors themselves only to change the arm's angle or
 * how far it spans.
 */
export const RIG_NUDGE = { x: 5, y: -2 } as const;

/** The anchor for a frame, nudged. Every rig lookup goes through this. */
export function rigAnchor(
  base: { x: number; y: number },
  byFrame: Record<string, { x: number; y: number }>,
  frameName: string,
) {
  const anchor = byFrame[frameName] ?? base;
  return { x: anchor.x + RIG_NUDGE.x, y: anchor.y + RIG_NUDGE.y };
}
