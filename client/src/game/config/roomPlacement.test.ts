import { describe, expect, it } from 'vitest';
import {
  placeRoomInStage,
  stageWorldWidth,
} from '@/game/config/roomPlacement';
import { defineRoom, type RoomConfig } from '@/game/config/roomConfig';
import {
  CITY_ROOMS,
  CITY_ROOM_ONE,
  CITY_ROOM_TWO,
} from '@/game/config/rooms/stageOneRooms';
import {
  BOSS_ROOM_WORLD_WIDTH,
  ROOM_WORLD_WIDTH,
} from '@/game/config/worldConfig';

describe('stageWorldWidth', () => {
  it('sums the rooms it is given, whatever their widths', () => {
    expect(stageWorldWidth(CITY_ROOMS)).toBe(
      ROOM_WORLD_WIDTH * 2 + BOSS_ROOM_WORLD_WIDTH,
    );
  });
});

describe('placeRoomInStage', () => {
  it('keeps the first room in local coordinates', () => {
    expect(placeRoomInStage(CITY_ROOMS, 0)).toEqual(CITY_ROOM_ONE);
  });

  it('offsets doors and every spawn by the preceding rooms width', () => {
    const placed = placeRoomInStage(CITY_ROOMS, 1);
    const offsetX = CITY_ROOM_ONE.worldWidth;

    expect(placed.entranceX).toBe(CITY_ROOM_TWO.entranceX + offsetX);
    expect(placed.exitX).toBe(CITY_ROOM_TWO.exitX + offsetX);
    expect(placed.enemySpawns.map(({ x }) => x)).toEqual(
      CITY_ROOM_TWO.enemySpawns.map(({ x }) => x + offsetX),
    );
    expect(placed.pits?.map(({ x }) => x)).toEqual(
      CITY_ROOM_TWO.pits?.map(({ x }) => x + offsetX),
    );
  });

  it('accumulates offsets from rooms of differing widths', () => {
    const rooms: RoomConfig[] = [
      defineRoom({ id: 'a', label: 'A', worldWidth: 900, enemySpawns: [] }),
      defineRoom({ id: 'b', label: 'B', worldWidth: 1500, enemySpawns: [] }),
      defineRoom({
        id: 'c',
        label: 'C',
        enemySpawns: [{ type: 'melee', x: 100, y: 0 }],
      }),
    ];

    // The third room starts after the first two: 900 + 1500 = 2400.
    expect(placeRoomInStage(rooms, 2).enemySpawns[0]?.x).toBe(2400 + 100);
  });

  it('preserves boss variant data without mutating the source room', () => {
    const placed = placeRoomInStage(CITY_ROOMS, 2);

    expect(placed.enemySpawns[0]).toMatchObject({
      type: 'boss',
      variant: 'city-warden',
    });
    expect(CITY_ROOMS[2].enemySpawns[0]?.x).toBe(BOSS_ROOM_WORLD_WIDTH - 760);
  });
});
