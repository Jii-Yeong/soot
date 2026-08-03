import Phaser from 'phaser';
import type { SliceSkinConfig } from '@/game/config/terrainSkinConfig';

/**
 * Draws a horizontal 3-slice skin across [startX, endX] with its surface aligned
 * to `surfaceY`: one middle image stretched across the whole span (so there are
 * no repeat seams), with the left/right caps laid on top of its ends. Returns
 * the created objects so the caller can destroy them on rebuild.
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

  // Middle first, spanning the full width so nothing shows between the pieces.
  add(
    scene.add
      .image(startX, topY, skin.middle.key)
      .setOrigin(0, 0)
      .setDisplaySize(span, skin.height),
  );

  // Caps shrink to fit if the span is too narrow to hold both at full width.
  const capWidth = Math.min(
    skin.left.width,
    Math.max(0, span - skin.right.width),
  );
  const rightWidth = Math.min(skin.right.width, Math.max(0, span - capWidth));

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

  return created;
}
