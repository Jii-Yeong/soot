import { describe, expect, it } from 'vitest';
import {
  canPlayerFireInRoom,
  canPlayerFireInPhase,
  type GamePhase,
} from '@/game/state/gamePhase';

describe('game phase', () => {
  it('allows firing with or without active enemies', () => {
    expect(canPlayerFireInPhase('playing')).toBe(true);
    expect(canPlayerFireInPhase('room-cleared')).toBe(true);
  });

  it('blocks firing outside active room play', () => {
    const blockedPhases: GamePhase[] = [
      'boot',
      'choosing-upgrade',
      'transitioning',
      'dead',
      'ending',
    ];

    for (const phase of blockedPhases) {
      expect(canPlayerFireInPhase(phase)).toBe(false);
    }
  });

  it('keeps a visible room non-interactive until its entrance locks', () => {
    expect(canPlayerFireInRoom('playing', 'idle')).toBe(false);
    expect(canPlayerFireInRoom('playing', 'locked')).toBe(true);
    expect(canPlayerFireInRoom('playing', 'cleared')).toBe(false);
    expect(canPlayerFireInRoom('room-cleared', 'idle')).toBe(false);
    expect(canPlayerFireInRoom('room-cleared', 'cleared')).toBe(true);
  });
});
