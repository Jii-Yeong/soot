import type { RoomConfig } from '@/game/config/roomConfig';
import { ROOM_WORLD_WIDTH } from '@/game/config/worldConfig';

/** Converts room-local doors and spawns into coordinates in a continuous stage. */
export function placeRoomInStage(
  roomConfig: RoomConfig,
  roomIndex: number,
): RoomConfig {
  const offsetX = roomIndex * ROOM_WORLD_WIDTH;

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
