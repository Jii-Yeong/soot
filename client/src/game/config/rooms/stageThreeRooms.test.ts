import { describe, expect, it } from 'vitest';
import { PLAYER_COMBAT_CONFIG } from '@/game/config/combatConfig';
import { FLOOR_SURFACE_Y } from '@/game/systems/FloorBuilder';
import { UNDERGROUND_ROOM_ONE, UNDERGROUND_ROOM_TWO } from './stageThreeRooms';

const UNDERGROUND_COMBAT_ROOMS = [UNDERGROUND_ROOM_ONE, UNDERGROUND_ROOM_TWO];
const MAX_JUMP_HEIGHT =
  (PLAYER_COMBAT_CONFIG.jumpSpeed * PLAYER_COMBAT_CONFIG.jumpSpeed) / (2 * 1200);

describe('stage 3 room layout', () => {
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

    // The extra height is a 100px step off the catwalk, not a precision jump
    // and not a shield from the shots that pass through both ledges.
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
