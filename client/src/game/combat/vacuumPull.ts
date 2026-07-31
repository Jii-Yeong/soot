type VacuumPullOptions = {
  playerX: number;
  sourceX: number;
  currentVelocityX: number;
  pullSpeed: number;
};

/**
 * Adds suction to the player's input-driven velocity. Because the pull is
 * weaker than normal run speed, holding away from the source still makes slow
 * outward progress while releasing the key draws the player inward.
 */
export function getVacuumVelocityX({
  playerX,
  sourceX,
  currentVelocityX,
  pullSpeed,
}: VacuumPullOptions) {
  const directionToSource = Math.sign(sourceX - playerX);
  return currentVelocityX + directionToSource * pullSpeed;
}
