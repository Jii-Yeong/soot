import { describe, expect, it } from 'vitest';
import {
  FLYING_ENEMY_COMBAT_CONFIG,
  MELEE_ENEMY_COMBAT_CONFIG,
  PLAYER_COMBAT_CONFIG,
  RANGED_ENEMY_COMBAT_CONFIG,
} from '@/game/config/combatConfig';
import { GAME_HEIGHT } from '@/game/config/gameDimensions';
import type { EnemySpawnConfig } from '@/game/config/roomConfig';
import { FLOOR_SURFACE_Y } from '@/game/systems/FloorBuilder';
import { UNDERGROUND_ROOM_ONE, UNDERGROUND_ROOM_TWO } from './stageThreeRooms';

const UNDERGROUND_COMBAT_ROOMS = [UNDERGROUND_ROOM_ONE, UNDERGROUND_ROOM_TWO];
const MINIMUM_DROP_LANE = 96;
const GROUND_SPAWN_CLEARANCE = 48;
const GROUND_PLAYER_Y = GAME_HEIGHT - 120;
const CATWALK_Y = FLOOR_SURFACE_Y - 116;
const MAX_JUMP_HEIGHT =
  (PLAYER_COMBAT_CONFIG.jumpSpeed * PLAYER_COMBAT_CONFIG.jumpSpeed) /
  (2 * 1200);

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

describe('stage 3 room layout', () => {
  it('leaves ground enemies and drop lanes clear of catwalk cover', () => {
    for (const room of UNDERGROUND_COMBAT_ROOMS) {
      const catwalks = [...(room.terrain ?? [])]
        .filter(({ type, y }) => type === 'platform' && y === CATWALK_Y)
        .sort((first, second) => first.x - second.x);
      const groundSpawns = room.enemySpawns.filter(
        ({ type }) => type === 'melee' || type === 'ranged',
      );

      for (const spawn of groundSpawns) {
        expect(
          catwalks.some(
            (catwalk) =>
              spawn.x >= catwalk.x - GROUND_SPAWN_CLEARANCE &&
              spawn.x <= catwalk.x + catwalk.width + GROUND_SPAWN_CLEARANCE,
          ),
          `${room.id} ${spawn.type} at x=${spawn.x} is trapped beneath projectile cover`,
        ).toBe(false);
      }

      for (let index = 1; index < catwalks.length; index += 1) {
        const previous = catwalks[index - 1]!;
        const current = catwalks[index]!;
        expect(
          current.x - (previous.x + previous.width),
          `${room.id} catwalks leave no usable drop lane`,
        ).toBeGreaterThanOrEqual(MINIMUM_DROP_LANE);
      }
    }
  });

  it('puts every pit beneath a jump-reachable catwalk route', () => {
    for (const room of UNDERGROUND_COMBAT_ROOMS) {
      const catwalks = (room.terrain ?? []).filter(
        ({ type, y }) => type === 'platform' && y === CATWALK_Y,
      );

      expect(catwalks.length).toBeGreaterThanOrEqual(room.pits?.length ?? 0);
      expect(FLOOR_SURFACE_Y - catwalks[0]!.y).toBeLessThanOrEqual(
        MAX_JUMP_HEIGHT,
      );

      for (const pit of room.pits ?? []) {
        expect(
          catwalks.some(
            (catwalk) =>
              catwalk.x <= pit.x &&
              catwalk.x + catwalk.width >= pit.x + pit.width,
          ),
          `${room.id} pit ${pit.x}~${pit.x + pit.width} has no route above it`,
        ).toBe(true);
      }
    }
  });

  it('raises the second room without turning platforms into cover', () => {
    const roomOnePlatforms = UNDERGROUND_ROOM_ONE.terrain?.filter(
      ({ type }) => type === 'platform',
    );
    const roomTwoPlatforms = UNDERGROUND_ROOM_TWO.terrain?.filter(
      ({ type }) => type === 'platform',
    );
    const upperLedges = roomTwoPlatforms?.filter(({ y }) => y < CATWALK_Y);

    expect(roomOnePlatforms).toHaveLength(5);
    expect(roomTwoPlatforms).toHaveLength(7);
    expect(upperLedges).toHaveLength(2);

    // The extra height is a 100px step off the catwalk, not a precision jump.
    for (const ledge of upperLedges ?? []) {
      expect(CATWALK_Y - ledge.y).toBe(100);
    }

    for (const room of UNDERGROUND_COMBAT_ROOMS) {
      expect(room.terrain?.some(({ type }) => type === 'wall')).toBe(false);
    }
  });

  it('uses a solid-ground catwalk as a short projectile-cover beat', () => {
    for (const room of UNDERGROUND_COMBAT_ROOMS) {
      const covers = (room.terrain ?? []).filter((platform) => {
        if (
          platform.type !== 'platform' ||
          platform.y !== CATWALK_Y ||
          platform.width < 180 ||
          platform.width > 240
        ) {
          return false;
        }

        return !(room.pits ?? []).some(
          (pit) =>
            platform.x < pit.x + pit.width &&
            platform.x + platform.width > pit.x,
        );
      });

      expect(
        covers.length,
        `${room.id} has no solid-ground cover beat`,
      ).toBeGreaterThan(0);
      expect(
        room.enemySpawns.some(
          (spawn) =>
            spawn.type === 'flying' &&
            covers.some(
              (cover) => cover.x <= spawn.x && spawn.x <= cover.x + cover.width,
            ),
        ),
        `${room.id} never demonstrates cover against a flying shot`,
      ).toBe(true);
    }
  });

  it('paces both rooms as three readable combat cycles', () => {
    const cases = [
      [UNDERGROUND_ROOM_ONE, [4, 3, 2]],
      [UNDERGROUND_ROOM_TWO, [4, 4, 3]],
    ] as const;

    for (const [room, cycleSizes] of cases) {
      const sorted = [...room.enemySpawns].sort(
        (first, second) => first.x - second.x,
      );
      let offset = 0;
      const cycles = cycleSizes.map((size) => {
        const cycle = sorted.slice(offset, offset + size);
        offset += size;
        return cycle;
      });

      expect(cycles.map(({ length }) => length), room.id).toEqual(cycleSizes);
      for (let index = 1; index < cycles.length; index += 1) {
        const gap =
          Math.min(...cycles[index]!.map(activationX)) -
          Math.max(...cycles[index - 1]!.map(activationX));
        expect(gap, `${room.id} cycle ${index + 1} gap`).toBeGreaterThanOrEqual(
          300,
        );
        expect(gap, `${room.id} cycle ${index + 1} gap`).toBeLessThanOrEqual(
          700,
        );
      }

      for (const cycle of cycles) {
        for (let index = 1; index < cycle.length; index += 1) {
          expect(cycle[index]!.x - cycle[index - 1]!.x).toBeGreaterThanOrEqual(
            140,
          );
        }
      }
    }
  });

  it('builds room 02 to a local peak, then leaves the boss approach clear', () => {
    expect(UNDERGROUND_ROOM_TWO.intensity).toBeGreaterThan(
      UNDERGROUND_ROOM_ONE.intensity!,
    );
    expect(UNDERGROUND_ROOM_TWO.enemySpawns.length).toBeGreaterThan(
      UNDERGROUND_ROOM_ONE.enemySpawns.length,
    );

    for (const room of UNDERGROUND_COMBAT_ROOMS) {
      const lastSpawn = Math.max(...room.enemySpawns.map(({ x }) => x));
      expect(
        room.exitX - lastSpawn,
        `${room.id} leaves the boss door mid-fight`,
      ).toBeGreaterThanOrEqual(400);
    }
  });
});
