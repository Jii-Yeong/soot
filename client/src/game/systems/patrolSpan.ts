export type PatrolBounds = { left: number; right: number };

export type PatrolSpanInput = {
  /** Where the enemy was placed. Its patrol is measured from here. */
  spawnX: number;
  /** How far either side it would walk if the room let it. */
  range: number;
  /** The room's walkable span, so nobody paces into a doorway. */
  left: number;
  right: number;
  pits?: readonly { x: number; width: number }[];
  /** Held between a turn and a pit edge so the body never overhangs it. */
  edgeMargin: number;
  /** Under this a patrol reads as twitching in place; hold position instead. */
  minimumSpan: number;
};

/**
 * How far an enemy may pace from where it was placed.
 *
 * Cut to the ground that is actually there rather than checked while walking.
 * An enemy that strolls into a pit falls out of the level — that is what
 * happens to anything below the floor line now — so the hole has to be taken
 * out of its range before it ever takes a step, not noticed at the edge.
 *
 * Returns null when there is not enough floor to be worth pacing on, which the
 * caller reads as "stand still".
 */
export function patrolSpan(input: PatrolSpanInput): PatrolBounds | null {
  const { spawnX, range, edgeMargin } = input;

  let left = Math.max(input.left, spawnX - range);
  let right = Math.min(input.right, spawnX + range);

  for (const pit of input.pits ?? []) {
    const pitLeft = pit.x - edgeMargin;
    const pitRight = pit.x + pit.width + edgeMargin;

    // Placed on a hole, or close enough to one that a single step is a fall.
    // Nothing here is safe to pace, and the placement itself is the bug.
    if (spawnX > pitLeft && spawnX < pitRight) {
      return null;
    }

    if (pitRight <= spawnX) {
      left = Math.max(left, pitRight);
    } else {
      right = Math.min(right, pitLeft);
    }
  }

  return right - left >= input.minimumSpan ? { left, right } : null;
}
