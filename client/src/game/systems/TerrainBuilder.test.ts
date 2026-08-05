import { describe, expect, it } from 'vitest';
import { terrainBlocksProjectiles } from '@/game/systems/TerrainBuilder';

describe('terrain projectile rules', () => {
  it('makes both platforms and walls block projectiles', () => {
    expect(terrainBlocksProjectiles('platform')).toBe(true);
    expect(terrainBlocksProjectiles('wall')).toBe(true);
  });
});
