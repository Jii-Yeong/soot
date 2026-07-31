import { GAME_HEIGHT, GAME_WIDTH } from '@/game/config/gameDimensions';

export enum MovementMode {
  GROUND = 'GROUND',
  FLIGHT = 'FLIGHT',
}

/**
 * Screen-space centre bounds for flight. Horizontal values move with the
 * camera; vertical values reserve the HUD and visible floor margins.
 */
export const PLAYER_FLIGHT_BOUNDS = {
  minScreenX: 48,
  maxScreenX: GAME_WIDTH - 48,
  minY: 128,
  maxY: GAME_HEIGHT - 120,
} as const;

export type MutableVelocity = {
  x: number;
  y: number;
};

export function writeNormalizedVelocity(
  output: MutableVelocity,
  horizontal: number,
  vertical: number,
  speed: number,
) {
  const length = Math.hypot(horizontal, vertical);
  if (length === 0) {
    output.x = 0;
    output.y = 0;
    return output;
  }

  const scale = speed / length;
  output.x = horizontal * scale;
  output.y = vertical * scale;
  return output;
}
