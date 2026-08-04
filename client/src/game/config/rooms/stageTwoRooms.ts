import { GAME_HEIGHT } from "@/game/config/gameDimensions";
import {
  defineBossRoom,
  defineRoom,
  type StageRooms,
} from "@/game/config/roomConfig";

// The back alleys: fire-escape perches and drainage gaps.
// Enemies are spread across the full room in three clusters so the doubled
// length is fought through, not walked past. Ground spawns stay clear of pits.
export const ALLEY_ROOM_ONE = defineRoom({
  id: "alley-01",
  label: "ROOM 01",
  intensity: 1.15,
  enemySpawns: [
    // Cluster A — the mouth of the alley.
    // The entry stays quiet for over a screen quarter before the first aggro.
    { type: "melee", x: 950, y: GAME_HEIGHT - 120 },
    { type: "ranged", x: 1400, y: GAME_HEIGHT - 120 },
    { type: "flying", x: 1650, y: GAME_HEIGHT - 300 },
    // Cluster B — mid, past the first gap.
    { type: "melee", x: 1950, y: GAME_HEIGHT - 120 },
    { type: "ranged", x: 2250, y: GAME_HEIGHT - 120 },
    { type: "flying", x: 2500, y: GAME_HEIGHT - 320 },
    // Cluster C — the far stretch before the exit.
    { type: "melee", x: 3050, y: GAME_HEIGHT - 120 },
    { type: "ranged", x: 3300, y: GAME_HEIGHT - 120 },
  ],
  terrain: [
    // Fire-escape perches (overhead — the ground stays runnable beneath).
    // 350 wide rather than 200, so the -260 perch is a step up from this one.
    { type: "platform", x: 650, y: GAME_HEIGHT - 190, width: 350, height: 22 },
    { type: "platform", x: 1150, y: GAME_HEIGHT - 260, width: 170, height: 22 },
    // Cluster B repeats cluster A's shape: a perch the floor can reach, then a
    // higher one off it. This one used to sit at -210, which is 146px above the
    // floor against a 130.7px jump — 15px short, and it stranded the -290 perch
    // with it because that one is only steppable from here.
    { type: "platform", x: 1900, y: GAME_HEIGHT - 190, width: 200, height: 22 },
    { type: "platform", x: 2250, y: GAME_HEIGHT - 290, width: 160, height: 22 },
    // Cluster C, same correction again: -200 is 136px up against a 130.7px
    // jump, so this perch also needed a lower approach.
    // The last perch moves 40px closer because the step between the two is
    // 170px against a 166px reach — under by four pixels is still under.
    { type: "platform", x: 2700, y: GAME_HEIGHT - 190, width: 210, height: 22 },
    { type: "platform", x: 3040, y: GAME_HEIGHT - 250, width: 170, height: 22 },
  ],
  // The first pit is a quiet, short crossing. It appears before the first
  // enemy's activation range, so stage 2 introduces falling without stacking
  // a shot or a pursuer onto the same jump. The later pit is the combat test.
  pits: [
    { x: 300, width: 120 },
    { x: 2450, width: 160 },
  ],
});

export const ALLEY_ROOM_TWO = defineRoom({
  id: "alley-02",
  label: "ROOM 02",
  intensity: 1.2,
  enemySpawns: [
    // Cluster A opens with one pursuer, then makes the first gap meaningful:
    // pressure the shooter before crossing under a flier.
    { type: "melee", x: 950, y: GAME_HEIGHT - 120 },
    { type: "ranged", x: 1400, y: GAME_HEIGHT - 120 },
    { type: "flying", x: 1650, y: GAME_HEIGHT - 320 },
    // Cluster B — mid, past the first gap.
    { type: "melee", x: 1900, y: GAME_HEIGHT - 120 },
    { type: "ranged", x: 2050, y: GAME_HEIGHT - 120 },
    { type: "flying", x: 2200, y: GAME_HEIGHT - 300 },
    // Cluster C — the far stretch.
    { type: "ranged", x: 2600, y: GAME_HEIGHT - 120 },
    { type: "melee", x: 3050, y: GAME_HEIGHT - 120 },
    // Keep the final flier far enough from the door that this remains the
    // room's last fight rather than spilling directly into the boss approach.
    { type: "flying", x: 3100, y: GAME_HEIGHT - 300 },
  ],
  terrain: [
    // Two-tier perches early, then ledges across the run.
    { type: "platform", x: 470, y: GAME_HEIGHT - 180, width: 200, height: 22 },
    { type: "platform", x: 820, y: GAME_HEIGHT - 270, width: 180, height: 22 },
    // Same correction as room 01, plus 50px of width. At -190 the step up to
    // the -290 perch is a 210px gap and the reach at that climb is 201px, so
    // without the extra width the second half of the climb needs a pixel-exact
    // dash to make a perch that is only ever optional.
    { type: "platform", x: 1600, y: GAME_HEIGHT - 190, width: 240, height: 22 },
    { type: "platform", x: 2000, y: GAME_HEIGHT - 290, width: 160, height: 22 },
    // Cluster C. The high perch used to be 400px from the low one and was
    // reached only after running past the whole cluster, then doubling back.
    // Moved to 240px earlier so it steps off the low perch, and
    // it now overlooks the last enemies instead of sitting among them.
    { type: "platform", x: 2450, y: GAME_HEIGHT - 190, width: 200, height: 22 },
    { type: "platform", x: 2790, y: GAME_HEIGHT - 250, width: 170, height: 22 },
  ],
  pits: [
    { x: 1450, width: 150 },
    { x: 2250, width: 160 },
  ],
});

export const ALLEY_BOSS_ROOM = defineBossRoom({
  id: "alley-boss",
  label: "ALLEY HUNTER",
  variant: "alley-hunter",
  intensity: 1.2,
});

export const ALLEY_ROOMS = [
  ALLEY_ROOM_ONE,
  ALLEY_ROOM_TWO,
  ALLEY_BOSS_ROOM,
] as const satisfies StageRooms;
