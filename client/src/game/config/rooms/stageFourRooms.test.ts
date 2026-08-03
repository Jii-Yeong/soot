import { describe, expect, it } from 'vitest';
import {
  INFERNO_ROOM_ONE,
  INFERNO_ROOM_TWO,
} from '@/game/config/rooms/stageFourRooms';

const infernoRooms = [INFERNO_ROOM_ONE, INFERNO_ROOM_TWO];

describe('stage four barrier routes', () => {
  it('uses low barriers as part of both combat rooms', () => {
    const wallCounts = infernoRooms.map(
      (room) => room.terrain?.filter(({ type }) => type === 'wall').length ?? 0,
    );

    expect(wallCounts).toEqual([2, 3]);
  });

  it('keeps every barrier out of a pit', () => {
    for (const room of infernoRooms) {
      const walls = room.terrain?.filter(({ type }) => type === 'wall') ?? [];

      for (const wall of walls) {
        for (const pit of room.pits ?? []) {
          expect(wall.x + wall.width <= pit.x || wall.x >= pit.x + pit.width).toBe(
            true,
          );
        }
      }
    }
  });
});
