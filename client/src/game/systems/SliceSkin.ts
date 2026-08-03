import Phaser from 'phaser';
import type { SliceSkinConfig } from '@/game/config/terrainSkinConfig';

/**
 * A cropped frame of the middle image (its side padding/edge line removed) so
 * tiling it repeats cleanly. Created once per texture and reused.
 */
function tileableMiddleFrame(
  scene: Phaser.Scene,
  skin: SliceSkinConfig,
): string {
  const trim = skin.middleTrim ?? { left: 0, right: 0 };
  const frameName = `${skin.middle.key}__tile`;
  const texture = scene.textures.get(skin.middle.key);
  if (!texture.has(frameName)) {
    const source = texture.getSourceImage() as { height: number };
    texture.add(
      frameName,
      0,
      trim.left,
      0,
      skin.middle.width - trim.left - trim.right,
      source.height,
    );
  }
  return frameName;
}

/**
 * Draws a horizontal 3-slice skin across [startX, endX] with its surface aligned
 * to `surfaceY`: the middle covers the whole span (stretched for short platforms,
 * or tiled at native size for long ground) and the caps sit on top of its ends,
 * so there are no gaps or repeat-seams. Returns the created objects so the caller
 * can destroy them on rebuild.
 */
export function drawSliceSkin(
  scene: Phaser.Scene,
  skin: SliceSkinConfig,
  startX: number,
  endX: number,
  surfaceY: number,
  depth: number,
): Phaser.GameObjects.GameObject[] {
  const topY = surfaceY - skin.surfaceInset;
  const span = endX - startX;
  const created: Phaser.GameObjects.GameObject[] = [];

  const add = (obj: Phaser.GameObjects.Components.Depth) => {
    obj.setDepth(depth);
    created.push(obj as unknown as Phaser.GameObjects.GameObject);
    return obj;
  };

  // Caps shrink to fit if the span is too narrow to hold both at full width.
  const capWidth = Math.min(
    skin.left.width,
    Math.max(0, span - skin.right.width),
  );
  const rightWidth = Math.min(skin.right.width, Math.max(0, span - capWidth));

  const drawCaps = () => {
    add(
      scene.add
        .image(startX, topY, skin.left.key)
        .setOrigin(0, 0)
        .setDisplaySize(capWidth, skin.height),
    );
    add(
      scene.add
        .image(endX - rightWidth, topY, skin.right.key)
        .setOrigin(0, 0)
        .setDisplaySize(rightWidth, skin.height),
    );
  };

  const drawMiddle = (x0: number, x1: number) => {
    const width = x1 - x0;
    if (width <= 0) {
      return;
    }
    if (skin.middleFit === 'tile') {
      // Tile only the middle's uniform interior (decorative side edges cropped),
      // so repeats butt together with no seam — sharp at native size.
      add(
        scene.add
          .tileSprite(
            x0,
            topY,
            width,
            skin.height,
            skin.middle.key,
            tileableMiddleFrame(scene, skin),
          )
          .setOrigin(0, 0),
      );
    } else {
      add(
        scene.add
          .image(x0, topY, skin.middle.key)
          .setOrigin(0, 0)
          .setDisplaySize(width, skin.height),
      );
    }
  };

  if (skin.capInset) {
    // Caps behind, then the middle over their inner joints (their outer ends
    // still show), so there's no cap→middle seam.
    drawCaps();
    drawMiddle(startX + skin.capInset.left, endX - skin.capInset.right);
  } else {
    // Middle behind spanning the full width, caps laid on top of its ends.
    drawMiddle(startX, endX);
    drawCaps();
  }

  return created;
}
