type Point = {
  x: number;
  y: number;
};

/** Wraps an angle to (-PI, PI]. */
const wrapAngle = (angle: number) => {
  const twoPi = Math.PI * 2;
  return ((((angle + Math.PI) % twoPi) + twoPi) % twoPi) - Math.PI;
};

/**
 * Whether `point` (optionally a circle of `pointRadius`) lies inside a fan that
 * starts at `apex`, is centred on `centerAngle`, spans `±halfAngle`, and reaches
 * out to `range`. Angles are in radians.
 *
 * A wider target near the apex is easier to catch, so its radius widens the
 * angular tolerance rather than only the distance check.
 */
export const isPointInsideCone = (
  apex: Point,
  centerAngle: number,
  halfAngle: number,
  range: number,
  point: Point,
  pointRadius = 0,
) => {
  const dx = point.x - apex.x;
  const dy = point.y - apex.y;
  const distance = Math.hypot(dx, dy);

  if (distance > range + pointRadius) {
    return false;
  }
  if (distance <= pointRadius) {
    return true;
  }

  const delta = Math.abs(wrapAngle(Math.atan2(dy, dx) - centerAngle));
  const angularSlack = Math.asin(Math.min(1, pointRadius / distance));
  return delta <= halfAngle + angularSlack;
};
