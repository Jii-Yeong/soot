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
  (PLAYER_COMBAT_CONFIG.jumpSpeed * PLAYER_COMBAT_CONFIG.jumpSpeed) / (2 * 1200);

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
      ({ y }) => y < CATWALK_Y,
    );

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

      expect(covers.length, `${room.id} has no solid-ground cover beat`).toBeGreaterThan(
        0,
      );
      expect(
        room.enemySpawns.some(
          (spawn) =>
            spawn.type === 'flying' &&
            covers.some(
              (cover) =>
                cover.x <= spawn.x && spawn.x <= cover.x + cover.width,
            ),
        ),
        `${room.id} never demonstrates cover against a flying shot`,
      ).toBe(true);
    }
  });

  it('separates the room 02 late peak into readable threats', () => {
    const sorted = [...UNDERGROUND_ROOM_TWO.enemySpawns].sort(
      (first, second) => first.x - second.x,
    );
    const opening = sorted.slice(0, 4);
    const latePeak = sorted.slice(4);

    expect(latePeak).toHaveLength(5);
    const recovery =
      Math.min(...latePeak.map(activationX)) -
      Math.max(...opening.map(activationX));
    expect(recovery).toBeGreaterThanOrEqual(300);
    expect(recovery).toBeLessThanOrEqual(400);

    for (let index = 1; index < latePeak.length; index += 1) {
      expect(latePeak[index]!.x - latePeak[index - 1]!.x).toBeGreaterThanOrEqual(
        140,
      );
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
