import { GAME_HEIGHT } from '@/game/config/gameDimensions';
import {
  defineBossRoom,
  defineRoom,
  type StageRooms,
} from '@/game/config/roomConfig';

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
    // Overhead perches at varied heights (the ground stays runnable beneath
    // them) spanning the room; a single exit barrier gates the far door.
    { type: 'platform', x: 700, y: GAME_HEIGHT - 180, width: 240, height: 22 },
    { type: 'platform', x: 1500, y: GAME_HEIGHT - 190, width: 200, height: 22 },
    { type: 'platform', x: 1820, y: GAME_HEIGHT - 260, width: 170, height: 22 },
    { type: 'platform', x: 2200, y: GAME_HEIGHT - 200, width: 220, height: 22 },
    { type: 'platform', x: 2560, y: GAME_HEIGHT - 280, width: 160, height: 22 },
    { type: 'platform', x: 2900, y: GAME_HEIGHT - 210, width: 200, height: 22 },
    // Exit barrier — a running jump clears it.
    { type: 'wall', x: 3380, y: GAME_HEIGHT - 140, width: 44, height: 76 },
  ],
  // Floor gaps past the combat zone: jump across, or drop in and take damage.
  // Each sits beneath an overhead platform that doubles as a crossing route.
  pits: [
    { x: 1640, width: 150 },
    { x: 2380, width: 168 },
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
    // Two-tier combat perches, then overhead ledges with two jump-over walls
    // for obstacle variety before the exit barrier.
    { type: 'platform', x: 470, y: GAME_HEIGHT - 180, width: 200, height: 22 },
    { type: 'platform', x: 860, y: GAME_HEIGHT - 272, width: 190, height: 22 },
    { type: 'platform', x: 1560, y: GAME_HEIGHT - 210, width: 180, height: 22 },
    { type: 'platform', x: 1900, y: GAME_HEIGHT - 290, width: 160, height: 22 },
    { type: 'wall', x: 2250, y: GAME_HEIGHT - 140, width: 44, height: 76 },
    { type: 'platform', x: 2480, y: GAME_HEIGHT - 200, width: 210, height: 22 },
    { type: 'platform', x: 2850, y: GAME_HEIGHT - 270, width: 170, height: 22 },
    // Exit barrier — a running jump clears it.
    { type: 'wall', x: 3400, y: GAME_HEIGHT - 140, width: 44, height: 76 },
  ],
  // Two gaps before the exit wall; the second lands just shy of the barrier.
  pits: [
    { x: 1250, width: 150 },
    { x: 2040, width: 160 },
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
