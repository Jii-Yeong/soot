import type { RoomConfig } from '@/game/config/roomConfig';

/** Total width of a stage whose rooms are laid out end to end. */
export function stageWorldWidth(rooms: readonly RoomConfig[]): number {
  return rooms.reduce((total, room) => total + room.worldWidth, 0);
}

/**
 * Converts a room's local doors, spawns, terrain, and pits into coordinates in
 * the continuous stage. The offset is the combined width of every room before
 * it, so rooms of differing widths still tile without gaps or overlaps.
 */
export function placeRoomInStage(
  rooms: readonly RoomConfig[],
  roomIndex: number,
): RoomConfig {
  const roomConfig = rooms[roomIndex];
  const offsetX = stageWorldWidth(rooms.slice(0, roomIndex));

  return {
    ...roomConfig,
    entranceX: roomConfig.entranceX + offsetX,
    exitX: roomConfig.exitX + offsetX,
    enemySpawns: roomConfig.enemySpawns.map((spawn) => ({
      ...spawn,
      x: spawn.x + offsetX,
    })),
    terrain: roomConfig.terrain?.map((piece) => ({
      ...piece,
      x: piece.x + offsetX,
    })),
    pits: roomConfig.pits?.map((pit) => ({
      ...pit,
      x: pit.x + offsetX,
    })),
  };
}
