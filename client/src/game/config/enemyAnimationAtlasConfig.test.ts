import { describe, expect, it } from 'vitest';
import { FLYING_ENEMY_ANIMATION_ATLASES } from '@/game/config/flyingEnemyAnimationConfig';
import { MELEE_ENEMY_ANIMATION_ATLASES } from '@/game/config/meleeEnemyAnimationConfig';
import { RANGED_ENEMY_ANIMATION_ATLASES } from '@/game/config/rangedEnemyAnimationConfig';

const atlases = [
  ...FLYING_ENEMY_ANIMATION_ATLASES,
  ...RANGED_ENEMY_ANIMATION_ATLASES,
  ...MELEE_ENEMY_ANIMATION_ATLASES,
];

describe('enemy animation atlases', () => {
  it('uses unique texture and animation keys', () => {
    const textureKeys = atlases.map(({ texture }) => texture);
    const animationKeys = atlases.flatMap(({ animations }) =>
      Object.values(animations),
    );

    expect(new Set(textureKeys).size).toBe(textureKeys.length);
    expect(new Set(animationKeys).size).toBe(animationKeys.length);
  });

  for (const atlas of atlases) {
    it(`pairs asset paths and tagged frames for ${atlas.texture}`, () => {
      expect(atlas.png).toBe(`/assets/enemies/${atlas.texture}.png`);
      expect(atlas.json).toBe(`/assets/enemies/${atlas.texture}.json`);

      const frames = Object.values(atlas.tagFrames).flat();
      expect(frames.length).toBeGreaterThan(0);
      expect(frames.every(({ frame }) => /^\d+$/.test(frame))).toBe(true);
      expect(frames.every(({ duration }) => duration > 0)).toBe(true);
    });
  }
});
