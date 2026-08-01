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

  /** The elbow's offset from the player sprite's centre. Mirrors when facing left. */
  elbowFromCentreX: 8,
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
   * has a solution at nearly every angle. Measured over -90..90 degrees the hand
   * wants to sit between 11 and 21px out; the shotgun, burst and rail rifles
   * need no stretch at all, and only the SMG clamps — its barrel ends at 20px —
   * for a worst-case shortfall of 0.8px, which is under one pixel of art.
   */
  minReach: 7,
  muzzleClearance: 4,
} as const;
