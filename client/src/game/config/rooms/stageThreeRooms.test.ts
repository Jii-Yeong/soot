import { describe, expect, it } from 'vitest';
import { PLAYER_COMBAT_CONFIG } from '@/game/config/combatConfig';
import { FLOOR_SURFACE_Y } from '@/game/systems/FloorBuilder';
import { UNDERGROUND_ROOM_ONE, UNDERGROUND_ROOM_TWO } from './stageThreeRooms';

const UNDERGROUND_COMBAT_ROOMS = [UNDERGROUND_ROOM_ONE, UNDERGROUND_ROOM_TWO];
const MINIMUM_DROP_LANE = 96;
const GROUND_SPAWN_CLEARANCE = 48;
const MAX_JUMP_HEIGHT =
  (PLAYER_COMBAT_CONFIG.jumpSpeed * PLAYER_COMBAT_CONFIG.jumpSpeed) / (2 * 1200);

describe('stage 3 room layout', () => {
  it('leaves ground enemies and drop lanes clear of catwalk cover', () => {
    for (const room of UNDERGROUND_COMBAT_ROOMS) {
      const catwalks = [...(room.terrain ?? [])]
        .filter(
          ({ type, y }) =>
            type === 'platform' && y === FLOOR_SURFACE_Y - 126,
        )
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
        ({ type, y }) => type === 'platform' && y === FLOOR_SURFACE_Y - 126,
      );

      expect(catwalks).toHaveLength(room.pits?.length ?? 0);
      expect(FLOOR_SURFACE_Y - catwalks[0]!.y).toBeLessThanOrEqual(
        MAX_JUMP_HEIGHT,
      );

      for (const pit of room.pits ?? []) {
        expect(
          catwalks.some(
            (catwalk) =>
              catwalk.x <= pit.x && catwalk.x + catwalk.width >= pit.x + pit.width,
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
    const upperLedges = roomTwoPlatforms?.filter(
      ({ y }) => y < FLOOR_SURFACE_Y - 126,
    );

    expect(roomOnePlatforms).toHaveLength(4);
    expect(roomTwoPlatforms).toHaveLength(6);
    expect(upperLedges).toHaveLength(2);

    // The extra height is a 100px step off the catwalk, not a precision jump.
    for (const ledge of upperLedges ?? []) {
      expect(FLOOR_SURFACE_Y - 126 - ledge.y).toBe(100);
    }

    for (const room of UNDERGROUND_COMBAT_ROOMS) {
      expect(room.terrain?.some(({ type }) => type === 'wall')).toBe(false);
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
