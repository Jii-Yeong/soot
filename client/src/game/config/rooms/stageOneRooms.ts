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
