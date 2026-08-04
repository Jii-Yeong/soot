import Phaser from "phaser";
import type { TerrainPiece } from "@/game/config/roomConfig";
import type { SliceSkinConfig } from "@/game/config/terrainSkinConfig";
import { drawSliceSkin } from "@/game/systems/SliceSkin";

const TERRAIN_DEPTH = 5;
const TERRAIN_TYPE_DATA_KEY = "terrain-type";

const TERRAIN_STYLE = {
  platform: { fill: 0x9aa4ab, edge: 0xe8eef1 },
  wall: { fill: 0x707a81, edge: 0xc4ccd0 },
} as const;

/**
 * Which faces of a terrain piece stop character physics.
 *
 * Platforms are one-way: you rise through them and land on top. There is one
 * jump speed in this game, so a player clearing a gap climbs 130.7px whether
 * they need it or not, and a solid underside turned every ordinary hop taken
 * beneath a ledge into a headbutt. The level data had been bending around that
 * — stage 1 carries no pits at all because every open stretch there has a ledge
 * overhead — which is a lot of layout spent on a collision face nobody wants.
 *
 * Walls stay solid on every face. A wall is the thing you are meant to go over.
 */
export const terrainCollisionFaces = (type: TerrainPiece["type"]) =>
  type === "wall"
    ? { up: true, down: true, left: true, right: true }
    : { up: true, down: false, left: false, right: false };

/** Projectile geometry is solid from every direction, including platform undersides. */
export const projectileCollisionFaces = {
  up: true,
  down: true,
  left: true,
  right: true,
};

/** Every terrain piece is solid to player and enemy projectiles. */
export const terrainBlocksProjectiles = (_type: TerrainPiece["type"]) => true;

export const isProjectileBlocker = (terrain: Phaser.GameObjects.GameObject) =>
  terrainBlocksProjectiles(
    terrain.getData(TERRAIN_TYPE_DATA_KEY) as TerrainPiece["type"],
  );

/**
 * Builds a room's solid level geometry (platforms and walls) as static bodies
 * with placeholder visuals. The bodies live in one static group so a single
 * persistent player collider tracks them across rooms; `build` swaps the
 * contents each room.
 */
export class TerrainBuilder {
  readonly group: Phaser.Physics.Arcade.StaticGroup;
  readonly projectileGroup: Phaser.Physics.Arcade.StaticGroup;
  private skinObjects: Phaser.GameObjects.GameObject[] = [];

  constructor(private readonly scene: Phaser.Scene) {
    this.group = scene.physics.add.staticGroup();
    this.projectileGroup = scene.physics.add.staticGroup();
  }

  build(pieces: readonly TerrainPiece[] = [], stoolSkin?: SliceSkinConfig) {
    this.group.clear(true, true);
    this.projectileGroup.clear(true, true);
    this.clearSkin();

    for (const piece of pieces) {
      const style = TERRAIN_STYLE[piece.type];
      const skinned = Boolean(stoolSkin) && piece.type === "platform";
      // 스킨된 발판은 아트의 두께를 따라, 충돌이 픽셀 판과 일치하게 함.
      // 상단 표면(piece.y)은 어느 쪽이든 변하지 않음.
      const height = skinned ? stoolSkin!.height : piece.height;
      const block = this.scene.add
        .rectangle(
          piece.x + piece.width / 2,
          piece.y + height / 2,
          piece.width,
          height,
          style.fill,
        )
        .setStrokeStyle(2, style.edge, 0.9)
        .setDepth(TERRAIN_DEPTH);

      block.setData(TERRAIN_TYPE_DATA_KEY, piece.type);

      this.group.add(block);
      // A static body added to a shape isn't sized from the shape until it is
      // synced to the game object's current transform.
      const body = block.body as Phaser.Physics.Arcade.StaticBody;
      body.updateFromGameObject();
      Object.assign(body.checkCollision, terrainCollisionFaces(piece.type));

      // Player movement keeps platforms one-way. Projectiles instead use a
      // separate, invisible body so every face of the same visual geometry is
      // solid without turning a jump into a headbutt.
      const projectileBlocker = this.scene.add
        .rectangle(
          piece.x + piece.width / 2,
          piece.y + piece.height / 2,
          piece.width,
          piece.height,
          0,
          0,
        )
        .setVisible(false);
      projectileBlocker.setData(TERRAIN_TYPE_DATA_KEY, piece.type);
      this.projectileGroup.add(projectileBlocker);
      const projectileBody =
        projectileBlocker.body as Phaser.Physics.Arcade.StaticBody;
      projectileBody.updateFromGameObject();
      Object.assign(projectileBody.checkCollision, projectileCollisionFaces);

      if (skinned) {
        // 블록은 물리 바디로 유지하되 픽셀 스킨 아래에 숨김.
        block.setVisible(false);
        this.skinObjects.push(
          ...drawSliceSkin(
            this.scene,
            stoolSkin!,
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
