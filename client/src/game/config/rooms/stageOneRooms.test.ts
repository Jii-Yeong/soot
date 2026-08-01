import { describe, expect, it } from 'vitest';
import { CITY_ROOM_ONE, CITY_ROOM_TWO } from './stageOneRooms';

const CITY_COMBAT_ROOMS = [CITY_ROOM_ONE, CITY_ROOM_TWO];

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
});
