import { GAME_HEIGHT } from '@/game/config/gameDimensions';
import {
  defineBossRoom,
  defineRoom,
  type StageRooms,
} from '@/game/config/roomConfig';

export const UNDERGROUND_ROOM_ONE = defineRoom({
  id: 'underground-01',
  label: 'ROOM 01',
  intensity: 1.25,
  enemySpawns: [
    { type: 'melee', x: 520, y: GAME_HEIGHT - 120 },
    { type: 'melee', x: 720, y: GAME_HEIGHT - 120 },
    { type: 'ranged', x: 980, y: GAME_HEIGHT - 120 },
    { type: 'flying', x: 840, y: GAME_HEIGHT - 300 },
  ],
});

export const UNDERGROUND_ROOM_TWO = defineRoom({
  id: 'underground-02',
  label: 'ROOM 02',
  intensity: 1.35,
  enemySpawns: [
    { type: 'melee', x: 440, y: GAME_HEIGHT - 120 },
    { type: 'melee', x: 640, y: GAME_HEIGHT - 120 },
    { type: 'melee', x: 860, y: GAME_HEIGHT - 120 },
    { type: 'ranged', x: 1060, y: GAME_HEIGHT - 120 },
    { type: 'flying', x: 560, y: GAME_HEIGHT - 320 },
    { type: 'flying', x: 980, y: GAME_HEIGHT - 280 },
  ],
});

export const UNDERGROUND_BOSS_ROOM = defineBossRoom({
  id: 'underground-boss',
  label: 'UNDERGROUND GUARDIAN',
  variant: 'underground-guardian',
  intensity: 1.35,
});

export const UNDERGROUND_ROOMS = [
  UNDERGROUND_ROOM_ONE,
  UNDERGROUND_ROOM_TWO,
  UNDERGROUND_BOSS_ROOM,
] as const satisfies StageRooms;
