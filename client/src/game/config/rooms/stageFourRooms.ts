import { GAME_HEIGHT } from '@/game/config/gameDimensions';
import {
  defineBossRoom,
  defineRoom,
  type StageRooms,
} from '@/game/config/roomConfig';

export const INFERNO_ROOM_ONE = defineRoom({
  id: 'inferno-01',
  label: 'ROOM 01',
  intensity: 1.45,
  enemySpawns: [
    { type: 'melee', x: 420, y: GAME_HEIGHT - 120 },
    { type: 'melee', x: 660, y: GAME_HEIGHT - 120 },
    { type: 'ranged', x: 900, y: GAME_HEIGHT - 120 },
    { type: 'flying', x: 620, y: GAME_HEIGHT - 310 },
    { type: 'flying', x: 1080, y: GAME_HEIGHT - 270 },
  ],
});

export const INFERNO_ROOM_TWO = defineRoom({
  id: 'inferno-02',
  label: 'ROOM 02',
  intensity: 1.55,
  enemySpawns: [
    { type: 'melee', x: 400, y: GAME_HEIGHT - 120 },
    { type: 'melee', x: 610, y: GAME_HEIGHT - 120 },
    { type: 'melee', x: 820, y: GAME_HEIGHT - 120 },
    { type: 'ranged', x: 1020, y: GAME_HEIGHT - 120 },
    { type: 'flying', x: 540, y: GAME_HEIGHT - 320 },
    { type: 'flying', x: 980, y: GAME_HEIGHT - 300 },
  ],
});

export const INFERNO_BOSS_ROOM = defineBossRoom({
  id: 'inferno-boss',
  label: 'INFERNAL EXECUTIONER',
  variant: 'infernal-executioner',
  intensity: 1.55,
});

export const INFERNO_ROOMS = [
  INFERNO_ROOM_ONE,
  INFERNO_ROOM_TWO,
  INFERNO_BOSS_ROOM,
] as const satisfies StageRooms;
