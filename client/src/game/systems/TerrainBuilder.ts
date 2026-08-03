import Phaser from 'phaser';
import type { TerrainPiece } from '@/game/config/roomConfig';
import type { SliceSkinConfig } from '@/game/config/terrainSkinConfig';
import { drawSliceSkin } from '@/game/systems/SliceSkin';

const TERRAIN_DEPTH = 5;

const TERRAIN_STYLE = {
  platform: { fill: 0x9aa4ab, edge: 0xe8eef1 },
  wall: { fill: 0x707a81, edge: 0xc4ccd0 },
} as const;

/**
 * Builds a room's solid level geometry (platforms and walls) as static bodies.
 * The bodies live in one static group so a single persistent player collider
 * tracks them across rooms; `build` swaps the contents each room. When a stool
 * skin is supplied, platforms hide their placeholder block and show a 3-slice
 * pixel skin instead (the body still drives collision); walls keep the block.
 */
export class TerrainBuilder {
  readonly group: Phaser.Physics.Arcade.StaticGroup;
  private skinObjects: Phaser.GameObjects.GameObject[] = [];

  constructor(private readonly scene: Phaser.Scene) {
    this.group = scene.physics.add.staticGroup();
  }

  build(pieces: readonly TerrainPiece[] = [], stoolSkin?: SliceSkinConfig) {
    this.group.clear(true, true);
    this.clearSkin();

    for (const piece of pieces) {
      const style = TERRAIN_STYLE[piece.type];
      const block = this.scene.add
        .rectangle(
          piece.x + piece.width / 2,
          piece.y + piece.height / 2,
          piece.width,
          piece.height,
          style.fill,
        )
        .setStrokeStyle(2, style.edge, 0.9)
        .setDepth(TERRAIN_DEPTH);

      this.group.add(block);
      // A static body added to a shape isn't sized from the shape until it is
      // synced to the game object's current transform.
      (block.body as Phaser.Physics.Arcade.StaticBody).updateFromGameObject();

      if (stoolSkin && piece.type === 'platform') {
        // Keep the block as the physics body but hide it under the pixel skin.
        block.setVisible(false);
        this.skinObjects.push(
          ...drawSliceSkin(
            this.scene,
            stoolSkin,
            piece.x,
            piece.x + piece.width,
            piece.y,
            TERRAIN_DEPTH,
          ),
        );
      }
    }
  }

  private clearSkin() {
    for (const obj of this.skinObjects) {
      obj.destroy();
    }
    this.skinObjects = [];
  }
}
