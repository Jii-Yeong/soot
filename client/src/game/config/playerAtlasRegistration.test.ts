import { describe, expect, it } from 'vitest';
// The shipped atlas itself, not a copy of its numbers. A copy would go stale
// against the very file this guards.
import ATLAS from '../../../public/assets/player/player.json';

/**
 * Where the drawn pixels start inside each frame's 96x96 canvas.
 *
 * Phaser centres that canvas on the player's position, so this offset is the
 * character's height on screen. Two frames that disagree about it put the same
 * character in two different places.
 */
const heads = Object.entries(ATLAS.frames).map(([name, frame]) => ({
  name,
  top: frame.spriteSourceSize.y,
  bottom: frame.spriteSourceSize.y + frame.spriteSourceSize.h,
}));

describe('player atlas registration', () => {
  it('draws every frame at the same height in its canvas', () => {
    // The bug this exists for, and it cost three rounds of chasing the arm
    // before anyone looked at the body: the airborne frame was exported 10px
    // low. Phaser centres the canvas, so the whole character sank 10px the
    // moment a jump started, popped back up at the apex, sank again on the way
    // down and popped on landing. Every per-frame anchor in the rig was busy
    // paying for it, and none of them could fix it, because the arm was
    // faithfully following a body that was itself jumping around.
    //
    // Poses legitimately differ — a tuck lifts the feet, a crouch lowers the
    // head a pixel or two — so this bounds the spread rather than demanding
    // they match. Ten pixels is not a pose.
    const tops = heads.map((frame) => frame.top);
    const spread = Math.max(...tops) - Math.min(...tops);
    const worst = heads.reduce((a, b) => (a.top > b.top ? a : b));

    expect(
      spread,
      `${worst.name} starts at y=${worst.top}, against y=${Math.min(...tops)} elsewhere`,
    ).toBeLessThanOrEqual(5);
  });

  it('keeps every frame inside the canvas it declares', () => {
    for (const frame of Object.values(ATLAS.frames)) {
      expect(frame.spriteSourceSize.y).toBeGreaterThanOrEqual(0);
      expect(
        frame.spriteSourceSize.y + frame.spriteSourceSize.h,
      ).toBeLessThanOrEqual(frame.sourceSize.h);
      expect(
        frame.spriteSourceSize.x + frame.spriteSourceSize.w,
      ).toBeLessThanOrEqual(frame.sourceSize.w);
    }
  });
});
