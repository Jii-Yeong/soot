import { GAME_HEIGHT } from '@/game/config/gameDimensions';
import {
  defineBossRoom,
  defineRoom,
  type StageRooms,
} from '@/game/config/roomConfig';

// The reference map's ground floor is supplied by FloorBuilder. The two
// overhead tiers stay one jump apart, with fewer pieces on the third floor so
// stage 1 gains vertical routes without becoming a dense platforming course.
const SECOND_FLOOR_Y = GAME_HEIGHT - 180;
const THIRD_FLOOR_Y = GAME_HEIGHT - 300;

export const CITY_ROOM_ONE = defineRoom({
  id: 'city-01',
  label: 'ROOM 01',
  // The first room is the lesson plan: one enemy type at a time, each met alone
  // before it is met alongside anything else. All three used to appear inside
  // the first 500px, which teaches nothing — the player learns that enemies
  // exist, not what any one of them does.
  enemySpawns: [
    // Introduce melee: walks at you, hurts on contact. Nothing else to read.
    { type: 'melee', x: 640, y: GAME_HEIGHT - 120 },
    { type: 'melee', x: 1020, y: GAME_HEIGHT - 120 },
    // Introduce ranged beneath the second-floor run at 1280~1900. The ledge
    // offers a height choice, but does not block either side's shots.
    { type: 'ranged', x: 1620, y: GAME_HEIGHT - 120 },
    { type: 'ranged', x: 2150, y: GAME_HEIGHT - 120 },
    // Combine the two that are now known.
    { type: 'melee', x: 2400, y: GAME_HEIGHT - 120 },
    // Introduce flying last. The nearby ledges offer a different height and
    // firing angle, rather than acting as protection from its shots.
    { type: 'flying', x: 2900, y: GAME_HEIGHT - 260 },
    { type: 'flying', x: 3250, y: GAME_HEIGHT - 360 },
  ],
  terrain: [
    // Three broad second-floor runs echo the lower half of the reference map.
    // Their wide gaps keep the ground route open and the screen uncluttered.
    { type: 'platform', x: 380, y: SECOND_FLOOR_Y, width: 560, height: 22 },
    { type: 'platform', x: 1280, y: SECOND_FLOOR_Y, width: 620, height: 22 },
    { type: 'platform', x: 2380, y: SECOND_FLOOR_Y, width: 600, height: 22 },
    // Sparse third-floor bridges begin beyond the lower ledge edges, leaving
    // enough horizontal run-up to clear their solid undersides.
    { type: 'platform', x: 1080, y: THIRD_FLOOR_Y, width: 420, height: 22 },
    // The second bridge carries the high flier. It used to sit at x2060, ahead
    // of both fliers, which left the one at x3250 with no ledge at all: 296px
    // over the floor against a 130.7px jump. Here it puts the player 60px under
    // it, and still stops short of the low flier at x2900 so that one is fought
    // off the second floor rather than from beneath a bridge.
    { type: 'platform', x: 3060, y: THIRD_FLOOR_Y, width: 420, height: 22 },
  ],
});

export const CITY_ROOM_TWO = defineRoom({
  id: 'city-02',
  label: 'ROOM 02',
  // The room used to open on its own peak: five of these eight stood inside
  // x560~1160, both fliers among them, and the density then fell away all the
  // way to the door. That put the hardest moment of the stage one step past the
  // room that introduced the types one at a time, and let the walk up to the
  // boss get easier the closer it came. The same eight now climb toward the
  // door instead, so the stage peaks at its climax and not at its entrance.
  enemySpawns: [
    // Open with what room 01 taught, on the ground, far enough apart to be
    // fought one at a time by anyone who wants to.
    { type: 'melee', x: 620, y: GAME_HEIGHT - 120 },
    { type: 'melee', x: 1000, y: GAME_HEIGHT - 120 },
    // Develop: ranged under the 1400~1960 ledge, which changes the attack
    // angle without shielding either combatant.
    { type: 'ranged', x: 1520, y: GAME_HEIGHT - 120 },
    { type: 'melee', x: 1760, y: GAME_HEIGHT - 120 },
    // Then a quiet stretch. The barrier at x2000 is the beat here — the first
    // one in the game, and it is met with nothing else asking for attention.
    // Nothing spawns between 1760 and 2500 for that reason.
    { type: 'flying', x: 2500, y: GAME_HEIGHT - 260 },
    { type: 'ranged', x: 2620, y: GAME_HEIGHT - 120 },
    { type: 'flying', x: 2900, y: GAME_HEIGHT - 360 },
    { type: 'melee', x: 3080, y: GAME_HEIGHT - 120 },
    // The last 513px to the door are empty: a breather before the boss.
  ],
  terrain: [
    // Stagger the same three-piece rhythm so the second room feels related
    // without repeating the first room's silhouette exactly.
    { type: 'platform', x: 260, y: SECOND_FLOOR_Y, width: 640, height: 22 },
    { type: 'platform', x: 1400, y: SECOND_FLOOR_Y, width: 560, height: 22 },
    { type: 'platform', x: 2320, y: SECOND_FLOOR_Y, width: 680, height: 22 },
    { type: 'platform', x: 1060, y: THIRD_FLOOR_Y, width: 420, height: 22 },
    // Moved forward off the barrier's quiet stretch, where nothing was asking
    // for a second storey, and onto the peak that is. It carries the high flier
    // at x2900 — 180px over the second floor, which a jump does not close —
    // and clears x2500 so that flier is not drawn through the bridge it hovers
    // under (flyers render at depth 6, terrain at 5).
    { type: 'platform', x: 2700, y: THIRD_FLOOR_Y, width: 420, height: 22 },
    // The first barrier in the game, and the only one in stage 1. Stage 2 opens
    // with three of them beside eight enemies, so the player has to have met one
    // somewhere quiet first. x2000 sits in the only stretch of this room with
    // both no enemy and no ledge overhead — a jump that clears it needs the sky.
    { type: 'wall', x: 2000, y: GAME_HEIGHT - 140, width: 44, height: 76 },
  ],
});

export const CITY_BOSS_ROOM = defineBossRoom({
  id: 'city-boss',
  label: 'CITY WARDEN',
  variant: 'city-warden',
});

export const CITY_ROOMS = [
  CITY_ROOM_ONE,
  CITY_ROOM_TWO,
  CITY_BOSS_ROOM,
] as const satisfies StageRooms;
