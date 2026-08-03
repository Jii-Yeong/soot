import Phaser from 'phaser';
import type { SliceSkinConfig } from '@/game/config/terrainSkinConfig';

/**
 * Draws a horizontal 3-slice skin (left cap + tiled middle + right cap) across
 * [startX, endX], with its surface aligned to `surfaceY`. Returns the created
 * game objects so the caller can destroy them on rebuild. Physics is unaffected.
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

  const left = scene.add
    .image(startX, topY, skin.left.key)
    .setOrigin(0, 0)
    .setDisplaySize(capWidth, skin.height);
  add(left);

  const right = scene.add
    .image(endX - rightWidth, topY, skin.right.key)
    .setOrigin(0, 0)
    .setDisplaySize(rightWidth, skin.height);
  add(right);

  const middleWidth = span - capWidth - rightWidth;
  if (middleWidth > 0) {
    const middle = scene.add
      .tileSprite(
        startX + capWidth,
        topY,
        middleWidth,
        skin.height,
        skin.middle.key,
      )
      .setOrigin(0, 0);
    add(middle);
  }

  return created;
}
