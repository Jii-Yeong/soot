export type WeaponGripInput = {
  /** The near shoulder, as an offset from the player sprite's centre. */
  shoulderX: number;
  shoulderY: number;
  /** Where the grip hangs when the weapon is level, same frame of reference. */
  restGripX: number;
  restGripY: number;
  /** The aim in world space, straight from Angle.Between. */
  aim: number;
  /** Whether the rig is drawn flipped, i.e. the player is aiming left. */
  mirrored: boolean;
  /** How much of the aim the shoulder takes. See WEAPON_SWING_RATE. */
  rate: number;
};

/** Into (-PI, PI]. */
const wrap = (angle: number) =>
  angle - Math.PI * 2 * Math.floor((angle + Math.PI) / (Math.PI * 2));

/**
 * Where the grip sits for a given aim, as an offset from the player's centre.
 *
 * The trigger hand has to travel for the trigger arm to turn. With the grip
 * pinned to one spot and the shoulder pinned to the torso, the arm between them
 * is fixed by construction — it measured 0.0 degrees of swing over the entire
 * aim range, which is the bug this exists to fix.
 *
 * So the grip rides an arc instead, and specifically the one arc the arm can
 * follow without stretching: radius equal to the arm's own length, centred on
 * the shoulder. Anywhere on that circle the hand reaches the grip exactly, at
 * every angle, with no slide — the arm simply turns to point at it. Both the
 * radius and the resting angle are read off the two anchors rather than tuned,
 * so a pose that moves the shoulder and the hand together keeps its geometry.
 *
 * Aiming left mirrors the rig rather than swinging it past vertical, so the arc
 * is solved facing right and the result reflected. Mirroring the x of a vector
 * turned by t lands it exactly where turning it by PI - t would, which is what
 * makes the two equivalent.
 *
 * Kept apart from the sprite so the geometry can be checked without a renderer.
 */
export function weaponGripOffset(input: WeaponGripInput) {
  const { shoulderX, shoulderY, restGripX, restGripY, aim, mirrored, rate } =
    input;

  // Wrapped, and it has to be. Everything else downstream of an angle goes
  // through cos and sin, which do not care about a turn either way — but the
  // swing scales the angle first, and a scaled angle is not periodic. Aiming up
  // and to the left arrives as -140 degrees, so PI minus it is 320, and three
  // tenths of 320 points the weapon somewhere the player is not aiming.
  const facing = mirrored ? wrap(Math.PI - aim) : aim;

  const reachX = restGripX - shoulderX;
  const reachY = restGripY - shoulderY;
  const radius = Math.hypot(reachX, reachY);
  const swung = Math.atan2(reachY, reachX) + rate * facing;

  const x = shoulderX + radius * Math.cos(swung);
  const y = shoulderY + radius * Math.sin(swung);

  return { x: mirrored ? -x : x, y };
}
