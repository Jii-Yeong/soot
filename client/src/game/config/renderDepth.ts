/**
 * The draw order of everything stacked on the player.
 *
 * These used to be bare numbers written at each call site, and the ordering
 * that resulted was accidental: rounds and the player body were both on 8, so
 * which one covered the other came down to creation order, and shot traces sat
 * on 9 alongside the weapon — meaning the rail rifle's 190px trace was drawn
 * over the gun that fired it.
 *
 * Fractions are deliberate. The surrounding scene numbers its layers in whole
 * steps and this stack has to slot between two of them without renumbering
 * anything else.
 */
export const PLAYER_STACK_DEPTH = {
  /** The character. */
  body: 8,
  /** Rounds in flight: over the body, under everything the player holds. */
  projectile: 8.2,
  /** Fading streaks left by a shot. Same reason, and they last longer. */
  shotTrace: 8.3,
  /** The support arm: over the torso it hinges on, under the gun it holds. */
  backArm: 8.5,
  /** The weapon, which is the topmost part of the character. */
  weapon: 9,
} as const;
