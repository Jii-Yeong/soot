import Phaser from 'phaser';
import type { TerrainPiece } from '@/game/config/roomConfig';

const TERRAIN_DEPTH = 5;

const TERRAIN_STYLE = {
  platform: { fill: 0x9aa4ab, edge: 0xe8eef1 },
  wall: { fill: 0x707a81, edge: 0xc4ccd0 },
} as const;

/**
 * Builds a room's solid level geometry (platforms and walls) as static bodies
 * with placeholder visuals. The bodies live in one static group so a single
 * persistent player collider tracks them across rooms; `build` swaps the
 * contents each room.
 */
export class TerrainBuilder {
  readonly group: Phaser.Physics.Arcade.StaticGroup;

  constructor(private readonly scene: Phaser.Scene) {
    this.group = scene.physics.add.staticGroup();
  }

  build(pieces: readonly TerrainPiece[] = []) {
    this.group.clear(true, true);

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
    }
  }
}
