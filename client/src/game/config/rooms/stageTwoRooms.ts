import { GAME_HEIGHT } from '@/game/config/gameDimensions';
import {
  defineBossRoom,
  defineRoom,
  type StageRooms,
} from '@/game/config/roomConfig';

// The back alleys: fire-escape perches, dumpster barriers, and drainage gaps.
// Enemies are spread across the full room in three clusters so the doubled
// length is fought through, not walked past. Ground spawns stay clear of pits.
export const ALLEY_ROOM_ONE = defineRoom({
  id: 'alley-01',
  label: 'ROOM 01',
  intensity: 1.15,
  enemySpawns: [
    // Cluster A — the mouth of the alley.
    { type: 'melee', x: 450, y: GAME_HEIGHT - 120 },
    { type: 'ranged', x: 900, y: GAME_HEIGHT - 120 },
    { type: 'flying', x: 1150, y: GAME_HEIGHT - 300 },
    // Cluster B — mid, past the first gap.
    { type: 'melee', x: 1950, y: GAME_HEIGHT - 120 },
    { type: 'ranged', x: 2250, y: GAME_HEIGHT - 120 },
    { type: 'flying', x: 2500, y: GAME_HEIGHT - 320 },
    // Cluster C — the far stretch before the exit barrier.
    { type: 'melee', x: 3050, y: GAME_HEIGHT - 120 },
    { type: 'ranged', x: 3300, y: GAME_HEIGHT - 120 },
  ],
  terrain: [
    // Fire-escape perches (overhead — the ground stays runnable beneath).
    // 350 wide rather than 200, so the -260 perch is a step up from this one.
    // At 200 the gap to it was 300px against a 174px reach, and the only way up
    // was the dumpster at x1500 — 350px past the perch, so the route ran
    // forward, up, then backward. Dumpsters are barriers to clear, not stairs.
    { type: 'platform', x: 650, y: GAME_HEIGHT - 190, width: 350, height: 22 },
    { type: 'platform', x: 1150, y: GAME_HEIGHT - 260, width: 170, height: 22 },
    // Cluster B repeats cluster A's shape: a perch the floor can reach, then a
    // higher one off it. This one used to sit at -210, which is 146px above the
    // floor against a 130.7px jump — 15px short, and it stranded the -290 perch
    // with it because that one is only steppable from here.
    { type: 'platform', x: 1900, y: GAME_HEIGHT - 190, width: 200, height: 22 },
    { type: 'platform', x: 2250, y: GAME_HEIGHT - 290, width: 160, height: 22 },
    // Cluster C, same correction again: -200 is 136px up against a 130.7px
    // jump, so this perch was also only reachable off the dumpster beside it.
    // The last perch moves 40px closer because the step between the two is
    // 170px against a 166px reach — under by four pixels is still under.
    { type: 'platform', x: 2700, y: GAME_HEIGHT - 190, width: 210, height: 22 },
    { type: 'platform', x: 3040, y: GAME_HEIGHT - 250, width: 170, height: 22 },
    // Dumpster barriers — a running jump clears them.
    { type: 'wall', x: 1500, y: GAME_HEIGHT - 140, width: 44, height: 76 },
    { type: 'wall', x: 2950, y: GAME_HEIGHT - 140, width: 44, height: 76 },
    // Exit barrier at the far door.
    { type: 'wall', x: 3380, y: GAME_HEIGHT - 140, width: 44, height: 76 },
  ],
  // Drainage gaps between clusters — jump across, or drop in and take damage.
  pits: [
    { x: 1650, width: 150 },
    { x: 2450, width: 160 },
  ],
});

export const ALLEY_ROOM_TWO = defineRoom({
  id: 'alley-02',
  label: 'ROOM 02',
  intensity: 1.2,
  enemySpawns: [
    // Cluster A — a tight ambush at the entrance.
    { type: 'melee', x: 450, y: GAME_HEIGHT - 120 },
    { type: 'melee', x: 700, y: GAME_HEIGHT - 120 },
    { type: 'flying', x: 600, y: GAME_HEIGHT - 320 },
    { type: 'ranged', x: 1050, y: GAME_HEIGHT - 120 },
    // Cluster B — mid, past the first gap.
    { type: 'melee', x: 1750, y: GAME_HEIGHT - 120 },
    { type: 'flying', x: 2100, y: GAME_HEIGHT - 300 },
    // Cluster C — the far stretch.
    { type: 'ranged', x: 2600, y: GAME_HEIGHT - 120 },
    { type: 'melee', x: 3050, y: GAME_HEIGHT - 120 },
    { type: 'flying', x: 3220, y: GAME_HEIGHT - 300 },
  ],
  terrain: [
    // Two-tier perches early, then ledges across the run.
    { type: 'platform', x: 470, y: GAME_HEIGHT - 180, width: 200, height: 22 },
    { type: 'platform', x: 820, y: GAME_HEIGHT - 270, width: 180, height: 22 },
    // Same correction as room 01, plus 50px of width. At -190 the step up to
    // the -290 perch is a 210px gap and the reach at that climb is 201px, so
    // without the extra width the second half of the climb needs a pixel-exact
    // dash to make a perch that is only ever optional.
    { type: 'platform', x: 1600, y: GAME_HEIGHT - 190, width: 240, height: 22 },
    { type: 'platform', x: 2000, y: GAME_HEIGHT - 290, width: 160, height: 22 },
    // Cluster C. The high perch used to be 400px from the low one and was
    // reached off the *exit barrier* at x3400 — forward past the whole cluster,
    // up, then back. Moved to 240px earlier so it steps off the low perch, and
    // it now overlooks the last enemies instead of sitting among them.
    { type: 'platform', x: 2450, y: GAME_HEIGHT - 190, width: 200, height: 22 },
    { type: 'platform', x: 2790, y: GAME_HEIGHT - 250, width: 170, height: 22 },
    // Dumpster barriers.
    { type: 'wall', x: 1250, y: GAME_HEIGHT - 140, width: 44, height: 76 },
    { type: 'wall', x: 2750, y: GAME_HEIGHT - 140, width: 44, height: 76 },
    // Exit barrier at the far door.
    { type: 'wall', x: 3400, y: GAME_HEIGHT - 140, width: 44, height: 76 },
  ],
  pits: [
    { x: 1450, width: 150 },
    { x: 2250, width: 160 },
  ],
});

export const ALLEY_BOSS_ROOM = defineBossRoom({
  id: 'alley-boss',
  label: 'ALLEY HUNTER',
  variant: 'alley-hunter',
  intensity: 1.2,
});

export const ALLEY_ROOMS = [
  ALLEY_ROOM_ONE,
  ALLEY_ROOM_TWO,
  ALLEY_BOSS_ROOM,
] as const satisfies StageRooms;
