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
