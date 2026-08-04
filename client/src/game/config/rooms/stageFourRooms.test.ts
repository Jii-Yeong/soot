import { describe, expect, it } from 'vitest';
import {
  FLYING_ENEMY_COMBAT_CONFIG,
  MELEE_ENEMY_COMBAT_CONFIG,
  RANGED_ENEMY_COMBAT_CONFIG,
} from '@/game/config/combatConfig';
import { GAME_HEIGHT } from '@/game/config/gameDimensions';
import type { EnemySpawnConfig, RoomConfig } from '@/game/config/roomConfig';
import {
  INFERNO_ROOM_ONE,
  INFERNO_ROOM_TWO,
} from '@/game/config/rooms/stageFourRooms';

const infernoRooms = [INFERNO_ROOM_ONE, INFERNO_ROOM_TWO];
const LOW_LEDGE_Y = GAME_HEIGHT - 180;
const MID_LEDGE_Y = GAME_HEIGHT - 280;
const HIGH_LEDGE_Y = GAME_HEIGHT - 380;
const GROUND_PLAYER_Y = GAME_HEIGHT - 120;

function activationX(spawn: EnemySpawnConfig) {
  switch (spawn.type) {
    case 'melee':
      return spawn.x - MELEE_ENEMY_COMBAT_CONFIG.aggroRadius;
    case 'ranged':
      return spawn.x - RANGED_ENEMY_COMBAT_CONFIG.aggroRadius;
    case 'flying': {
      const verticalDistance = Math.abs(spawn.y - GROUND_PLAYER_Y);
      return (
        spawn.x -
        (spawn.movement?.rangeX ?? 0) -
        Math.sqrt(
          FLYING_ENEMY_COMBAT_CONFIG.aggroRadius ** 2 - verticalDistance ** 2,
        )
      );
    }
    case 'boss':
      throw new Error('combat room does not contain a boss');
  }
}

function lowPlatformsOf(room: RoomConfig) {
  return (room.terrain ?? [])
    .filter(({ type, y }) => type === 'platform' && y === LOW_LEDGE_Y)
    .sort((first, second) => first.x - second.x);
}

function highPlatformsOf(room: RoomConfig) {
  return (room.terrain ?? []).filter(
    ({ type, y }) => type === 'platform' && y < LOW_LEDGE_Y,
  );
}

describe('stage four terrain', () => {
  it('uses only skinned platforms for authored terrain', () => {
    for (const room of infernoRooms) {
      expect(room.terrain?.some(({ type }) => type === 'wall')).toBe(false);
    }
  });

  it('breaks the repeated low-platform cadence in both rooms', () => {
    const expectedCounts = new Map([
      [INFERNO_ROOM_ONE.id, 4],
      [INFERNO_ROOM_TWO.id, 4],
    ]);

    for (const room of infernoRooms) {
      const platforms = lowPlatformsOf(room);
      const gaps = platforms
        .slice(1)
        .map(
          (platform, index) =>
            platform.x - (platforms[index]!.x + platforms[index]!.width),
        );

      expect(platforms, room.id).toHaveLength(expectedCounts.get(room.id)!);
      expect(
        new Set(gaps).size,
        `${room.id} repeats one platform gap`,
      ).toBeGreaterThan(1);
    }
  });

  it('separates room 01 cover islands from room 02 vertical fracture', () => {
    expect(
      highPlatformsOf(INFERNO_ROOM_ONE).filter(({ y }) => y === MID_LEDGE_Y),
    ).toHaveLength(2);
    expect(
      highPlatformsOf(INFERNO_ROOM_TWO).filter(({ y }) => y === MID_LEDGE_Y),
    ).toHaveLength(4);
    expect(
      highPlatformsOf(INFERNO_ROOM_TWO).filter(({ y }) => y === HIGH_LEDGE_Y),
    ).toHaveLength(1);
    expect(JSON.stringify(INFERNO_ROOM_ONE.terrain)).not.toBe(
      JSON.stringify(INFERNO_ROOM_TWO.terrain),
    );
  });

  it('places a short accessible cover beat beneath a flier in each room', () => {
    for (const room of infernoRooms) {
      const covers = lowPlatformsOf(room).filter(
        ({ width }) => width >= 180 && width <= 240,
      );

      expect(covers.length, `${room.id} has no short cover`).toBeGreaterThan(0);
      expect(
        room.enemySpawns.some(
          (spawn) =>
            spawn.type === 'flying' &&
            covers.some(
              (cover) => cover.x <= spawn.x && spawn.x <= cover.x + cover.width,
            ),
        ),
        `${room.id} has no flier demonstrating projectile cover`,
      ).toBe(true);
    }
  });

  it('keeps pressure below geometry overload', () => {
    expect(INFERNO_ROOM_ONE.enemySpawns).toHaveLength(11);
    expect(INFERNO_ROOM_TWO.enemySpawns).toHaveLength(13);

    for (const room of infernoRooms) {
      expect(
        Math.max(...(room.pits ?? []).map(({ width }) => width)),
      ).toBeLessThanOrEqual(200);
      const lastSpawn = Math.max(...room.enemySpawns.map(({ x }) => x));
      expect(
        room.exitX - lastSpawn,
        `${room.id} has no exit reset`,
      ).toBeGreaterThanOrEqual(400);
    }
  });

  it('keeps adjacent threats from spawning as one visual stack', () => {
    for (const room of infernoRooms) {
      const spawns = [...room.enemySpawns].sort(
        (first, second) => first.x - second.x,
      );

      for (let index = 1; index < spawns.length; index += 1) {
        expect(
          spawns[index]!.x - spawns[index - 1]!.x,
          `${room.id} stacks threats at x=${spawns[index - 1]!.x} and ${spawns[index]!.x}`,
        ).toBeGreaterThanOrEqual(100);
      }
    }
  });

  it('keeps four pressure groups active without merging or empty travel', () => {
    const cases = [
      [INFERNO_ROOM_ONE, [3, 3, 2, 3]],
      [INFERNO_ROOM_TWO, [3, 3, 3, 4]],
    ] as const;

    for (const [room, groupSizes] of cases) {
      const sorted = [...room.enemySpawns].sort(
        (first, second) => first.x - second.x,
      );
      let offset = 0;
      const groups = groupSizes.map((size) => {
        const group = sorted.slice(offset, offset + size);
        offset += size;
        return group;
      });

      expect(groups.map(({ length }) => length), room.id).toEqual(groupSizes);
      for (let index = 1; index < groups.length; index += 1) {
        const gap =
          Math.min(...groups[index]!.map(activationX)) -
          Math.max(...groups[index - 1]!.map(activationX));
        expect(
          gap,
          `${room.id} pressure group ${index + 1} gap`,
        ).toBeGreaterThanOrEqual(300);
        expect(
          gap,
          `${room.id} pressure group ${index + 1} gap`,
        ).toBeLessThanOrEqual(700);
      }
    }
  });
});
