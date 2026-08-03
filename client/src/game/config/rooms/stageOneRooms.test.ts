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
import { CITY_ROOM_ONE, CITY_ROOM_TWO } from './stageOneRooms';

const CITY_COMBAT_ROOMS = [CITY_ROOM_ONE, CITY_ROOM_TWO];
const MAX_JUMP_HEIGHT =
  (PLAYER_COMBAT_CONFIG.jumpSpeed * PLAYER_COMBAT_CONFIG.jumpSpeed) / (2 * 1200);
const MAX_LOWER_TIER_HOP =
  PLAYER_COMBAT_CONFIG.moveSpeed *
  ((2 * PLAYER_COMBAT_CONFIG.jumpSpeed) / 1200) *
  0.95;

function activationX(spawn: EnemySpawnConfig) {
  switch (spawn.type) {
    case 'melee':
      return spawn.x - MELEE_ENEMY_COMBAT_CONFIG.aggroRadius;
    case 'ranged':
      return spawn.x - RANGED_ENEMY_COMBAT_CONFIG.aggroRadius;
    case 'flying': {
      const verticalDistance = Math.abs(spawn.y - (GAME_HEIGHT - 120));
      return (
        spawn.x -
        Math.sqrt(
          FLYING_ENEMY_COMBAT_CONFIG.aggroRadius ** 2 -
            verticalDistance ** 2,
        )
      );
    }
    case 'boss':
      throw new Error('stage 1 combat room does not contain a boss');
  }
}

describe('stage 1 room layout', () => {
  it('uses the ground and two sparse, jump-reachable platform tiers', () => {
    for (const room of CITY_COMBAT_ROOMS) {
      const platforms =
        room.terrain?.filter(({ type }) => type === 'platform') ?? [];
      const platformLevels = [...new Set(platforms.map(({ y }) => y))].sort(
        (a, b) => b - a,
      );
      const platformsPerLevel = platformLevels.map(
        (level) => platforms.filter(({ y }) => y === level).length,
      );

      expect(platforms).toHaveLength(5);
      expect(platformsPerLevel).toEqual([3, 2]);
      expect(platformLevels[0]! - platformLevels[1]!).toBe(120);
    }
  });

  it('keeps the first stage free of walls and pits', () => {
    for (const room of CITY_COMBAT_ROOMS) {
      const walls = room.terrain?.filter(({ type }) => type === 'wall') ?? [];
      expect(walls).toEqual([]);
      expect(room.pits).toBeUndefined();
    }
  });

  it('keeps lower-tier transfers within a normal jump', () => {
    for (const room of CITY_COMBAT_ROOMS) {
      const lowerTier = (room.terrain ?? [])
        .filter(({ type, y }) => type === 'platform' && y === GAME_HEIGHT - 180)
        .sort((first, second) => first.x - second.x);

      for (let index = 1; index < lowerTier.length; index += 1) {
        const previous = lowerTier[index - 1]!;
        const current = lowerTier[index]!;
        expect(current.x - (previous.x + previous.width)).toBeLessThanOrEqual(
          MAX_LOWER_TIER_HOP,
        );
      }
    }
  });

  it('keeps the opening melee beat clear of overhead terrain', () => {
    const firstEnemy = CITY_ROOM_ONE.enemySpawns[0]!;
    const firstPlatform = Math.min(
      ...(CITY_ROOM_ONE.terrain ?? []).map(({ x }) => x),
    );

    expect(firstPlatform).toBeGreaterThan(firstEnemy.x);
  });

  it('gives the first three room 01 beats room to activate one at a time', () => {
    const opening = CITY_ROOM_ONE.enemySpawns.slice(0, 3).map(activationX);

    expect(opening[1]! - opening[0]!).toBeGreaterThanOrEqual(500);
    expect(opening[2]! - opening[1]!).toBeGreaterThanOrEqual(500);
  });

  it('leaves a breather before room 02’s final combined encounter', () => {
    const quietSpawns = CITY_ROOM_TWO.enemySpawns.filter(
      ({ x }) => x > 1840 && x < 2700,
    );

    expect(quietSpawns).toEqual([]);
  });

  it('builds room 02 toward the boss door rather than away from it', () => {
    const midpoint = CITY_ROOM_TWO.worldWidth / 2;
    const spawns = CITY_ROOM_TWO.enemySpawns;
    const meanX =
      spawns.reduce((total, spawn) => total + spawn.x, 0) / spawns.length;

    expect(meanX).toBeGreaterThan(midpoint);

    for (const flier of spawns.filter(({ type }) => type === 'flying')) {
      expect(flier.x, `flier at x=${flier.x} sits in the opening half`).toBeGreaterThan(
        midpoint,
      );
    }

    const lastSpawn = Math.max(...spawns.map(({ x }) => x));
    expect(CITY_ROOM_TWO.exitX - lastSpawn).toBeGreaterThanOrEqual(400);
  });

  it('offers a reachable height option alongside every late flier', () => {
    const unreachable: string[] = [];

    for (const room of CITY_COMBAT_ROOMS) {
      const surfaces = [
        { top: FLOOR_SURFACE_Y, left: 0, right: room.worldWidth },
        ...(room.terrain ?? []).map((piece) => ({
          top: piece.y,
          left: piece.x,
          right: piece.x + piece.width,
        })),
      ];

      for (const spawn of room.enemySpawns) {
        if (spawn.type !== 'flying') continue;

        const climbs = surfaces
          .filter(
            ({ top, left, right }) =>
              left <= spawn.x && spawn.x <= right && top > spawn.y,
          )
          .map(({ top }) => top - spawn.y);
        const climb = climbs.length > 0 ? Math.min(...climbs) : Infinity;

        if (climb > MAX_JUMP_HEIGHT) {
          unreachable.push(
            `${room.id} flier at (${spawn.x}, ${spawn.y}) is ${climb.toFixed(0)}px above anything standable`,
          );
        }
      }
    }

    expect(unreachable).toEqual([]);
  });
});
