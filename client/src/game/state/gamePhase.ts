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
 * Damage is only enabled during a locked encounter. Cleared rooms keep free
 * firing while the player walks to the next room.
 */
export function canPlayerFireInRoom(phase: GamePhase, roomState: RoomState) {
  return (
    (phase === 'playing' && roomState === 'locked') ||
    (phase === 'room-cleared' && roomState === 'cleared')
  );
}
