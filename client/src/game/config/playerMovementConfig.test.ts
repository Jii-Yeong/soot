import { describe, expect, it } from 'vitest';
import {
  MovementMode,
  PLAYER_FLIGHT_BOUNDS,
  writeNormalizedVelocity,
} from '@/game/config/playerMovementConfig';

describe('player movement modes', () => {
  it('keeps ground and flight as explicit modes', () => {
    expect(MovementMode.GROUND).toBe('GROUND');
    expect(MovementMode.FLIGHT).toBe('FLIGHT');
  });

  it('normalizes diagonal flight input to the configured speed', () => {
    const velocity = { x: 0, y: 0 };

    writeNormalizedVelocity(velocity, 1, -1, 300);

    expect(Math.hypot(velocity.x, velocity.y)).toBeCloseTo(300);
    expect(velocity.x).toBeCloseTo(-velocity.y);
  });

  it('stops immediately when flight input is released', () => {
    const velocity = { x: 100, y: -100 };

    writeNormalizedVelocity(velocity, 0, 0, 300);

    expect(velocity).toEqual({ x: 0, y: 0 });
  });

  it('reserves vertical space for the HUD and floor', () => {
    expect(PLAYER_FLIGHT_BOUNDS.minY).toBeGreaterThan(0);
    expect(PLAYER_FLIGHT_BOUNDS.maxY).toBeLessThan(720);
    expect(PLAYER_FLIGHT_BOUNDS.maxY).toBeGreaterThan(
      PLAYER_FLIGHT_BOUNDS.minY,
    );
  });
});
