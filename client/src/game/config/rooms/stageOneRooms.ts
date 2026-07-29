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
  enemySpawns: [
    { type: 'melee', x: 640, y: GAME_HEIGHT - 120 },
    { type: 'ranged', x: 950, y: GAME_HEIGHT - 120 },
    { type: 'ranged', x: 1120, y: GAME_HEIGHT - 120 },
    { type: 'flying', x: 820, y: GAME_HEIGHT - 260 },
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
    { type: 'platform', x: 2060, y: THIRD_FLOOR_Y, width: 420, height: 22 },
  ],
});

export const CITY_ROOM_TWO = defineRoom({
  id: 'city-02',
  label: 'ROOM 02',
  enemySpawns: [
    { type: 'melee', x: 560, y: GAME_HEIGHT - 120 },
    { type: 'melee', x: 940, y: GAME_HEIGHT - 120 },
    { type: 'flying', x: 750, y: GAME_HEIGHT - 260 },
    { type: 'flying', x: 1050, y: GAME_HEIGHT - 300 },
    { type: 'ranged', x: 1160, y: GAME_HEIGHT - 120 },
  ],
  terrain: [
    // Stagger the same three-piece rhythm so the second room feels related
    // without repeating the first room's silhouette exactly.
    { type: 'platform', x: 260, y: SECOND_FLOOR_Y, width: 640, height: 22 },
    { type: 'platform', x: 1400, y: SECOND_FLOOR_Y, width: 560, height: 22 },
    { type: 'platform', x: 2320, y: SECOND_FLOOR_Y, width: 680, height: 22 },
    { type: 'platform', x: 1060, y: THIRD_FLOOR_Y, width: 420, height: 22 },
    { type: 'platform', x: 2120, y: THIRD_FLOOR_Y, width: 420, height: 22 },
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
