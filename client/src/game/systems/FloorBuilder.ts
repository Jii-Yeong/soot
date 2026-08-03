import Phaser from 'phaser';
import { GAME_HEIGHT } from '@/game/config/gameDimensions';
import type { RoomConfig } from '@/game/config/roomConfig';
import {
  placeRoomInStage,
  stageWorldWidth,
} from '@/game/config/roomPlacement';

export const FLOOR_TILE = 64;
export const FLOOR_SURFACE_Y = GAME_HEIGHT - FLOOR_TILE;
/** Behind characters (enemies 0, player 8) but in front of the backdrop (-10). */
const FLOOR_DEPTH = -9;

export type PitBounds = { start: number; end: number };

/**
 * Tiles a stage's floor as static bodies, leaving gaps where the stage's rooms
 * define pits, and stays the single source of truth for where those pits are.
 *
 * The floor group and its player collider persist across stages, so `build`
 * clears and re-tiles in place on every stage change — one stage's pits never
 * leak into the next.
 */
export class FloorBuilder {
  readonly group: Phaser.Physics.Arcade.StaticGroup;
  private pits: PitBounds[] = [];

  constructor(scene: Phaser.Scene) {
    this.group = scene.physics.add.staticGroup();
  }

  build(
    rooms: readonly RoomConfig[],
    backdropSuppliesGround: boolean,
    showFloor = false,
  ) {
    this.group.clear(true, true);
    this.pits = rooms.flatMap((_, index) =>
      (placeRoomInStage(rooms, index).pits ?? []).map((pit) => ({
        start: pit.x,
        end: pit.x + pit.width,
      })),
    );

    const width = stageWorldWidth(rooms);
    for (let x = 32; x < width; x += FLOOR_TILE) {
      if (this.isOverPit(x)) {
        continue;
      }
      const tile = this.group.create(
        x,
        FLOOR_SURFACE_Y + FLOOR_TILE / 2,
        'floor-placeholder',
      ) as Phaser.GameObjects.Image;
      // Sit behind characters so they stand on top of the band.
      tile.setDepth(FLOOR_DEPTH);
    }

    // Show the floor band when the stage opts in (a placeholder to skin with a
    // pixel tile). Otherwise the real backdrop art supplies the ground and the
    // tiles stay hidden — except a stage with pits needs them visible so the
    // gaps between them read as holes.
    this.group.setVisible(
      showFloor || !backdropSuppliesGround || this.pits.length > 0,
    );
  }

  private isOverPit(x: number) {
    return this.pits.some((pit) => x > pit.start && x < pit.end);
  }

  /** The pit the world-x sits over (within `tolerance` of its left edge), if any. */
  findPitAt(x: number, tolerance: number): PitBounds | undefined {
    return this.pits.find((pit) => x >= pit.start - tolerance && x <= pit.end);
  }
}
