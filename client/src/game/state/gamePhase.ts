import type { RoomState } from '@/game/state/roomState';

export type GamePhase =
  | 'boot'
  | 'playing'
  | 'room-cleared'
  | 'choosing-upgrade'
  | 'transitioning'
  | 'dead'
  | 'ending';

/** Shooting stays available while exploring, fighting, and leaving a cleared room. */
export function canPlayerFireInPhase(phase: GamePhase) {
  return phase === 'playing' || phase === 'room-cleared';
}

/**
 * A combat room may be visible before its entrance trigger is crossed, but it
 * is not interactive yet. Cleared rooms keep free firing while the player
 * walks to the next entrance.
 */
export function canPlayerFireInRoom(phase: GamePhase, roomState: RoomState) {
  return (
    (phase === 'playing' && roomState === 'locked') ||
    (phase === 'room-cleared' && roomState === 'cleared')
  );
}
