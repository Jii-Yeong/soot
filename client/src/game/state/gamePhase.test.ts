import { describe, expect, it } from 'vitest';
import {
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
});
