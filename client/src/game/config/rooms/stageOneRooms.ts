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
    // A mid-arena ledge to perch on, ~116px up (one jump).
    { type: 'platform', x: 720, y: GAME_HEIGHT - 180, width: 240, height: 22 },
    // A barrier before the exit so the room can't be sprinted through —
    // low enough to clear with a running jump (jump reach ~130px).
    { type: 'wall', x: 1560, y: GAME_HEIGHT - 160, width: 44, height: 96 },
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
    // Two-tier ledges for vertical play.
    { type: 'platform', x: 470, y: GAME_HEIGHT - 172, width: 200, height: 22 },
    { type: 'platform', x: 860, y: GAME_HEIGHT - 272, width: 190, height: 22 },
    // Exit barrier — a running jump clears it.
    { type: 'wall', x: 1560, y: GAME_HEIGHT - 164, width: 44, height: 100 },
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
