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
  ],
  terrain: [
    // Fire-escape perches (overhead — the ground stays runnable beneath).
    { type: 'platform', x: 650, y: GAME_HEIGHT - 190, width: 200, height: 22 },
    { type: 'platform', x: 1150, y: GAME_HEIGHT - 260, width: 170, height: 22 },
    { type: 'platform', x: 1900, y: GAME_HEIGHT - 210, width: 200, height: 22 },
    { type: 'platform', x: 2250, y: GAME_HEIGHT - 290, width: 160, height: 22 },
    { type: 'platform', x: 2700, y: GAME_HEIGHT - 200, width: 210, height: 22 },
    { type: 'platform', x: 3080, y: GAME_HEIGHT - 250, width: 170, height: 22 },
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
  ],
  terrain: [
    // Two-tier perches early, then ledges across the run.
    { type: 'platform', x: 470, y: GAME_HEIGHT - 180, width: 200, height: 22 },
    { type: 'platform', x: 820, y: GAME_HEIGHT - 270, width: 180, height: 22 },
    { type: 'platform', x: 1600, y: GAME_HEIGHT - 210, width: 190, height: 22 },
    { type: 'platform', x: 2000, y: GAME_HEIGHT - 290, width: 160, height: 22 },
    { type: 'platform', x: 2450, y: GAME_HEIGHT - 200, width: 200, height: 22 },
    { type: 'platform', x: 3050, y: GAME_HEIGHT - 250, width: 170, height: 22 },
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
