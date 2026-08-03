import { describe, expect, it } from 'vitest';
import { BACK_ARM, FRONT_ARM } from '@/game/config/playerRigConfig';
import { mirrorScaleY } from '@/game/config/renderDepth';

/**
 * Where the origin texel lands, in the sprite's own local space, under each way
 * of mirroring a sprite vertically. Lifted from Phaser's TransformerImage:
 *
 *   y = -displayOriginY + frameY
 *   if (flipY && !customPivot) { y += -frame.realHeight + displayOriginY * 2 }
 *   scaleY *= flipY ? -1 : 1
 *
 * The quad runs from `y` to `y + height` and the matrix applies the scale, so
 * texture row `t` renders at `(y + t) * scale`.
 */
function originLandsAt(
  originY: number,
  height: number,
  method: 'flipY' | 'scale',
) {
  const displayOriginY = originY * height;
  const start =
    method === 'flipY' ? -displayOriginY + (-height + displayOriginY * 2) : -displayOriginY;

  return (start + displayOriginY) * -1;
}

/** Every sprite the rig turns around when the player faces left. */
const MIRRORED = [
  { name: 'weapon', originY: 14 / 24, height: 24 },
  { name: 'back arm', originY: BACK_ARM.originY, height: 14 },
  { name: 'front arm', originY: FRONT_ARM.originY, height: 12 },
];

describe('mirroring the rig', () => {
  it('turns each sprite about its own origin', () => {
    // The whole point. The rig positions every piece by its origin — the grip,
    // the elbow, the shoulder — so a mirror that moves the origin moves the
    // joint, and the arm comes off the body the moment the player turns.
    for (const sprite of MIRRORED) {
      expect(
        originLandsAt(sprite.originY, sprite.height, 'scale'),
        sprite.name,
      ).toBeCloseTo(0, 9);
    }
  });

  it('is why setFlipY cannot be used here', () => {
    // Phaser's flip preserves the bounding box instead, which is the same thing
    // only for a centred origin. None of these are centred, so each one drifts
    // by 2 * (originY - 0.5) * height. Those pixels are what put the gun and the
    // far arm at the wrong height facing left while the trigger arm, whose
    // origin is nearly centred, looked fine and hid the cause.
    const drift = Object.fromEntries(
      MIRRORED.map((sprite) => [
        sprite.name,
        Math.abs(originLandsAt(sprite.originY, sprite.height, 'flipY')),
      ]),
    );

    expect(drift.weapon).toBeCloseTo(4, 6);
    expect(drift['back arm']).toBeCloseTo(7, 6);
    // Under a pixel, and that near miss is exactly what made this hard to see.
    expect(drift['front arm']).toBeLessThan(1);
  });

  it('mirrors only when the player faces left', () => {
    expect(mirrorScaleY(false)).toBe(1);
    expect(mirrorScaleY(true)).toBe(-1);
  });
});
