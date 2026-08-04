export const FLIGHT_ENTRY_JUMP_RISE_DURATION = 280;
export const FLIGHT_ENTRY_JUMP_FALL_DURATION = 220;

type FlightEntryJump = {
  startY: number;
  targetY: number;
  apexY: number;
};

/** 포탈 출발점에서 정점을 지나 착지점으로 가는 점프 궤적의 y 좌표. */
export function getFlightEntryJumpY(
  { startY, targetY, apexY }: FlightEntryJump,
  elapsed: number,
) {
  if (elapsed <= FLIGHT_ENTRY_JUMP_RISE_DURATION) {
    const progress = Math.max(
      0,
      Math.min(1, elapsed / FLIGHT_ENTRY_JUMP_RISE_DURATION),
    );
    return startY + (apexY - startY) * (1 - (1 - progress) ** 2);
  }

  const progress = Math.max(
    0,
    Math.min(
      1,
      (elapsed - FLIGHT_ENTRY_JUMP_RISE_DURATION) /
        FLIGHT_ENTRY_JUMP_FALL_DURATION,
    ),
  );
  return apexY + (targetY - apexY) * progress ** 2;
}
