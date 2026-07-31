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
    { type: 'melee', x: 700, y: GAME_HEIGHT - 120 },
    { type: 'ranged', x: 980, y: GAME_HEIGHT - 120 },
    { type: 'flying', x: 620, y: GAME_HEIGHT - 310 },
    { type: 'melee', x: 1500, y: GAME_HEIGHT - 120 },
    { type: 'ranged', x: 1850, y: GAME_HEIGHT - 120 },
    { type: 'flying', x: 2100, y: GAME_HEIGHT - 300 },
    { type: 'melee', x: 2700, y: GAME_HEIGHT - 120 },
    { type: 'ranged', x: 3050, y: GAME_HEIGHT - 120 },
    { type: 'flying', x: 3260, y: GAME_HEIGHT - 280 },
  ],
});

export const INFERNO_ROOM_TWO = defineRoom({
  id: 'inferno-02',
  label: 'ROOM 02',
  intensity: 1.55,
  enemySpawns: [
    { type: 'melee', x: 400, y: GAME_HEIGHT - 120 },
    { type: 'melee', x: 650, y: GAME_HEIGHT - 120 },
    { type: 'ranged', x: 950, y: GAME_HEIGHT - 120 },
    { type: 'flying', x: 540, y: GAME_HEIGHT - 320 },
    { type: 'melee', x: 1450, y: GAME_HEIGHT - 120 },
    { type: 'melee', x: 1750, y: GAME_HEIGHT - 120 },
    { type: 'ranged', x: 2050, y: GAME_HEIGHT - 120 },
    { type: 'flying', x: 2150, y: GAME_HEIGHT - 300 },
    { type: 'melee', x: 2700, y: GAME_HEIGHT - 120 },
    { type: 'ranged', x: 3000, y: GAME_HEIGHT - 120 },
    { type: 'flying', x: 3250, y: GAME_HEIGHT - 280 },
  ],
});

export const INFERNO_BOSS_ROOM = defineBossRoom({
  id: 'inferno-boss',
  label: '연옥의 집행체 // INFERNAL EXECUTIONER',
  variant: 'infernal-executioner',
  intensity: 1.55,
  worldWidth: 2200,
});

export const INFERNO_ROOMS = [
  INFERNO_ROOM_ONE,
  INFERNO_ROOM_TWO,
  INFERNO_BOSS_ROOM,
] as const satisfies StageRooms;
