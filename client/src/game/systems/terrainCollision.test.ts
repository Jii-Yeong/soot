import { describe, expect, it } from 'vitest';
import {
  terrainBlocksProjectiles,
  terrainCollisionFaces,
} from '@/game/systems/TerrainBuilder';

describe('terrain collision faces', () => {
  it('lets a platform be entered from below and stood on from above', () => {
    // The whole point: a jump taken under a ledge passes through it instead of
    // stopping dead against its underside.
    expect(terrainCollisionFaces('platform')).toEqual({
      up: true,
      down: false,
      left: false,
      right: false,
    });
  });

  it('keeps a wall solid on every face', () => {
    // A wall is the obstacle, not the floor of the storey above it. Opening its
    // underside would let the player rise through the thing they are supposed
    // to go over.
    expect(terrainCollisionFaces('wall')).toEqual({
      up: true,
      down: true,
      left: true,
      right: true,
    });
  });

  it('lets regular projectiles pass through platforms but not walls', () => {
    expect(terrainBlocksProjectiles('platform')).toBe(false);
    expect(terrainBlocksProjectiles('wall')).toBe(true);
  });
});
