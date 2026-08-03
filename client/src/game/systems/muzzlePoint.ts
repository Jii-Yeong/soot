export type MuzzleInput = {
  /** The weapon sprite's origin — its grip — in world space. */
  gripX: number;
  gripY: number;
  /** The direction *this shot* travels. Not the sprite's rotation. */
  angle: number;
  /** Recoil climb currently applied, in radians. */
  climb: number;
  /** Whether the weapon is drawn flipped, i.e. aiming left. */
  mirrored: boolean;
  /** Grip to barrel tip, along the barrel. */
  offset: number;
  /** How far the barrel sits above the grip, perpendicular to it. */
  rise: number;
};

/**
 * Where a round leaves the weapon.
 *
 * Built from the shot's own direction rather than the sprite's rotation. For a
 * single shot those agree; for a burst they do not. A burst's three rounds are
 * locked to the angle the trigger was pulled at while the sprite keeps
 * following the mouse, so reading the sprite spawns round three out of the side
 * of the gun and sends it somewhere else entirely.
 *
 * Climb still belongs in it, or a heavy weapon's rounds leave from under a
 * barrel that has visibly kicked up.
 */
export function muzzlePoint(input: MuzzleInput) {
  const { gripX, gripY, angle, climb, mirrored, offset, rise } = input;
  // Climb is away from the ground, so its sign follows the flip — as does the
  // perpendicular lift, or firing left would push the muzzle down through the
  // grip instead of up over it.
  const rotation = angle + (mirrored ? climb : -climb);
  const lift = mirrored ? rise : -rise;

  return {
    x: gripX + Math.cos(rotation) * offset - Math.sin(rotation) * lift,
    y: gripY + Math.sin(rotation) * offset + Math.cos(rotation) * lift,
    rotation,
  };
}
