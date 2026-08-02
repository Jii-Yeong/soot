import { describe, expect, it } from 'vitest';
import { PLAYER_COMBAT_CONFIG } from '@/game/config/combatConfig';
import { FLOOR_SURFACE_Y } from '@/game/systems/FloorBuilder';
import { CITY_ROOM_ONE, CITY_ROOM_TWO } from './stageOneRooms';

const CITY_COMBAT_ROOMS = [CITY_ROOM_ONE, CITY_ROOM_TWO];

/** Same derivation reachability.test.ts uses: v^2 / 2g against world gravity. */
const MAX_JUMP_HEIGHT =
  (PLAYER_COMBAT_CONFIG.jumpSpeed * PLAYER_COMBAT_CONFIG.jumpSpeed) / (2 * 1200);

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

  it('teaches the barrier once and never digs a pit', () => {
    // This rule used to be "stage 1 has no walls at all", which read as
    // simplicity but cost the player their only safe meeting with a barrier:
    // stage 2 opens with three of them beside eight enemies and two pits.
    // One barrier, in the second room, in a quiet stretch — enough to learn
    // the shape without turning the stage into a platforming course.
    const walls = CITY_COMBAT_ROOMS.map(
      (room) => room.terrain?.filter(({ type }) => type === 'wall').length ?? 0,
    );

    expect(walls).toEqual([0, 1]);

    // Pits stay out of stage 1 entirely. Every open stretch here has a ledge
    // overhead, and a full jump would put the player into its underside — see
    // the sky-clearance rule in reachability.test.ts.
    for (const room of CITY_COMBAT_ROOMS) {
      expect(room.pits).toBeUndefined();
    }
  });

  it('meets the barrier with nothing else asking for attention', () => {
    // A first barrier standing next to an enemy is not a lesson, it is one more
    // thing happening. Whatever else moves in this room, the stretch around
    // x2000 stays empty on both sides.
    const QUIET_MARGIN = 200;
    const wall = (CITY_ROOM_TWO.terrain ?? []).find(
      ({ type }) => type === 'wall',
    );
    if (!wall) {
      throw new Error('stage 1 room 02 has no barrier to keep quiet');
    }

    for (const spawn of CITY_ROOM_TWO.enemySpawns) {
      const distance =
        spawn.x < wall.x
          ? wall.x - spawn.x
          : spawn.x - (wall.x + wall.width);
      expect(
        distance,
        `${spawn.type} at x=${spawn.x} crowds the barrier at x=${wall.x}`,
      ).toBeGreaterThanOrEqual(QUIET_MARGIN);
    }
  });

  it('builds room 02 toward the boss door rather than away from it', () => {
    // The room used to open on its own peak — five of eight inside x560~1160,
    // both fliers among them — and then thin out all the way to the door, so
    // the stage got easier as the boss got closer. Weight past the midpoint is
    // the cheap way to state "the climax is at the end", and it is the exact
    // check the old layout failed: its spawns averaged x1425 against a 1828
    // midpoint.
    const midpoint = CITY_ROOM_TWO.worldWidth / 2;
    const spawns = CITY_ROOM_TWO.enemySpawns;
    const meanX =
      spawns.reduce((total, spawn) => total + spawn.x, 0) / spawns.length;

    expect(meanX).toBeGreaterThan(midpoint);

    // And the fliers — the type the ground cannot answer — belong to the peak,
    // not to the doorway the player walks in through.
    for (const flier of spawns.filter(({ type }) => type === 'flying')) {
      expect(
        flier.x,
        `flier at x=${flier.x} sits in the room's opening half`,
      ).toBeGreaterThan(midpoint);
    }

    // The run up to the door stays clear, so the boss is not entered mid-fight.
    const lastSpawn = Math.max(...spawns.map(({ x }) => x));
    expect(CITY_ROOM_TWO.exitX - lastSpawn).toBeGreaterThanOrEqual(400);
  });

  it('puts a ledge under every flier the ground cannot answer', () => {
    // Room 01 states the rule in its own comments — the flier is the one enemy
    // the ground cannot answer, and the ledge beneath it is the answer. It only
    // holds while a ledge is actually there. Both rooms used to break it: the
    // high fliers sat past the last third-floor bridge, 296px and 180px over
    // anything standable against a 130.7px jump, leaving the player to shoot up
    // and nothing else.
    //
    // Scoped to stage 1 on purpose. Stages 2~4 have five fliers that fail this
    // today, and stage 5 is flown rather than jumped, so its band coverage rule
    // in reachability.test.ts is the one that applies there.
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
