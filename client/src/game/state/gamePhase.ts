import type { RoomState } from '@/game/state/roomState';

export type GamePhase =
  | 'boot'
  | 'playing'
  | 'room-cleared'
  | 'choosing-upgrade'
  | 'transitioning'
  | 'dead'
  | 'ending';

/** 탐색, 전투, 정리된 방에서 퇴장하는 동안 사격을 허용한다. */
export function canPlayerFireInPhase(phase: GamePhase) {
  return phase === 'playing' || phase === 'room-cleared';
}

/**
 * 잠긴 교전 중에만 피해를 활성화한다. 정리된 방에서는 다음 방으로 이동하는
 * 동안 자유롭게 사격할 수 있다.
 */
export function canPlayerFireInRoom(phase: GamePhase, roomState: RoomState) {
  return (
    (phase === 'playing' && roomState === 'locked') ||
    (phase === 'room-cleared' && roomState === 'cleared')
  );
}
