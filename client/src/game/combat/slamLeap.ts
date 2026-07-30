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
 * Calculates a symmetric ballistic leap that returns to its launch height.
 * Horizontal speed is capped so an unusually distant target cannot make the
 * boss cross the whole arena at an unreadable speed.
 */
export function getSlamLeapVelocity({
  originX,
  targetX,
  launchSpeedY,
  gravityY,
  maxTravelSpeedX,
}: SlamLeapOptions): SlamLeapVelocity {
  const flightDurationSeconds = (launchSpeedY * 2) / gravityY;
  const desiredVelocityX =
    (targetX - originX) / flightDurationSeconds;

  return {
    velocityX: Math.max(
      -maxTravelSpeedX,
      Math.min(maxTravelSpeedX, desiredVelocityX),
    ),
    velocityY: -launchSpeedY,
    flightDurationMs: flightDurationSeconds * 1000,
  };
}
