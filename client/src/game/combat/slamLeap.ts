export type SlamLeapVelocity = {
  velocityX: number;
  velocityY: number;
  flightDurationMs: number;
};

type SlamLeapOptions = {
  originX: number;
  targetX: number;
  launchSpeedY: number;
  gravityY: number;
  maxTravelSpeedX: number;
};

/**
 * Calculates a symmetric ballistic leap that returns to its launch height and
 * always lands on the marked spot. Horizontal speed stays capped at
 * `maxTravelSpeedX` so the leap reads clearly; a target too far to reach within
 * the base arc extends the flight time (a higher, longer jump) instead of
 * falling short of the warned landing spot.
 */
export function getSlamLeapVelocity({
  originX,
  targetX,
  launchSpeedY,
  gravityY,
  maxTravelSpeedX,
}: SlamLeapOptions): SlamLeapVelocity {
  const baseFlightSeconds = (launchSpeedY * 2) / gravityY;
  const distance = Math.abs(targetX - originX);
  // Stretch the arc when the capped horizontal speed can't cover the distance
  // in the base flight time, so the boss reaches the marker rather than
  // landing short.
  const requiredSeconds =
    maxTravelSpeedX > 0 ? distance / maxTravelSpeedX : baseFlightSeconds;
  const flightSeconds = Math.max(baseFlightSeconds, requiredSeconds);

  return {
    velocityX: (targetX - originX) / flightSeconds,
    velocityY: -(gravityY * flightSeconds) / 2,
    flightDurationMs: flightSeconds * 1000,
  };
}
