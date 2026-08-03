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

    expect(wallCounts).toEqual([2, 2]);
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

  it('puts each barrier between completed and upcoming combat pockets', () => {
    for (const room of infernoRooms) {
      const walls = room.terrain?.filter(({ type }) => type === 'wall') ?? [];
      const spawns = [...room.enemySpawns].sort((first, second) => first.x - second.x);

      for (const wall of walls) {
        const before = spawns.filter(({ x }) => x < wall.x).at(-1);
        const after = spawns.find(({ x }) => x > wall.x + wall.width);

        // The barrier follows a flier, which cannot be trapped by it, and the
        // next ground encounter starts beyond it. A ground enemy is therefore
        // never authored across the wall from the player during its own beat.
        expect(before?.type).toBe('flying');
        expect(after?.type).toBe('melee');
      }
    }
  });
});
