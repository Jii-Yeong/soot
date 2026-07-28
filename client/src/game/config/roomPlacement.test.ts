import { describe, expect, it } from 'vitest';
import { placeRoomInStage } from '@/game/config/roomPlacement';
import {
  CITY_BOSS_ROOM,
  CITY_ROOM_ONE,
} from '@/game/config/rooms/stageOneRooms';
import { ROOM_WORLD_WIDTH } from '@/game/config/worldConfig';

describe('placeRoomInStage', () => {
  it('keeps the first room in local coordinates', () => {
    expect(placeRoomInStage(CITY_ROOM_ONE, 0)).toEqual(CITY_ROOM_ONE);
  });

  it('offsets doors and every spawn by the room segment width', () => {
    const placed = placeRoomInStage(CITY_ROOM_ONE, 2);
    const offsetX = ROOM_WORLD_WIDTH * 2;

    expect(placed.entranceX).toBe(CITY_ROOM_ONE.entranceX + offsetX);
    expect(placed.exitX).toBe(CITY_ROOM_ONE.exitX + offsetX);
    expect(placed.enemySpawns.map(({ x }) => x)).toEqual(
      CITY_ROOM_ONE.enemySpawns.map(({ x }) => x + offsetX),
    );
  });

  it('preserves boss variant data without mutating the source room', () => {
    const placed = placeRoomInStage(CITY_BOSS_ROOM, 1);

    expect(placed.enemySpawns[0]).toMatchObject({
      type: 'boss',
      variant: 'city-warden',
    });
    expect(CITY_BOSS_ROOM.enemySpawns[0]?.x).toBe(ROOM_WORLD_WIDTH - 760);
  });
});
