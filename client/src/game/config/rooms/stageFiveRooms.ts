import { GAME_HEIGHT } from '@/game/config/gameDimensions';
import {
  defineBossRoom,
  defineRoom,
  type StageRooms,
} from '@/game/config/roomConfig';

export const RETURN_ROOM_ONE = defineRoom({
  id: 'return-01',
  label: 'ROOM 01',
  intensity: 1.6,
  enemySpawns: [
    { type: 'melee', x: 410, y: GAME_HEIGHT - 120 },
    { type: 'melee', x: 650, y: GAME_HEIGHT - 120 },
    { type: 'ranged', x: 900, y: GAME_HEIGHT - 120 },
    { type: 'flying', x: 560, y: GAME_HEIGHT - 320 },
    { type: 'melee', x: 1400, y: GAME_HEIGHT - 120 },
    { type: 'ranged', x: 1750, y: GAME_HEIGHT - 120 },
    { type: 'flying', x: 2050, y: GAME_HEIGHT - 300 },
    { type: 'melee', x: 2200, y: GAME_HEIGHT - 120 },
    { type: 'melee', x: 2700, y: GAME_HEIGHT - 120 },
    { type: 'ranged', x: 3000, y: GAME_HEIGHT - 120 },
    { type: 'flying', x: 3250, y: GAME_HEIGHT - 280 },
  ],
});

export const RETURN_ROOM_TWO = defineRoom({
  id: 'return-02',
  label: 'ROOM 02',
  intensity: 1.7,
  enemySpawns: [
    { type: 'melee', x: 390, y: GAME_HEIGHT - 120 },
    { type: 'melee', x: 600, y: GAME_HEIGHT - 120 },
    { type: 'melee', x: 820, y: GAME_HEIGHT - 120 },
    { type: 'ranged', x: 1050, y: GAME_HEIGHT - 120 },
    { type: 'flying', x: 520, y: GAME_HEIGHT - 330 },
    { type: 'melee', x: 1450, y: GAME_HEIGHT - 120 },
    { type: 'ranged', x: 1750, y: GAME_HEIGHT - 120 },
    { type: 'flying', x: 2050, y: GAME_HEIGHT - 310 },
    { type: 'melee', x: 2250, y: GAME_HEIGHT - 120 },
    { type: 'melee', x: 2750, y: GAME_HEIGHT - 120 },
    { type: 'ranged', x: 3050, y: GAME_HEIGHT - 120 },
    { type: 'flying', x: 3280, y: GAME_HEIGHT - 290 },
  ],
});

export const RETURN_BOSS_ROOM = defineBossRoom({
  id: 'return-boss',
  label: 'THE RETURNING ARCHITECT',
  variant: 'returning-architect',
  intensity: 1.7,
});

export const RETURN_ROOMS = [
  RETURN_ROOM_ONE,
  RETURN_ROOM_TWO,
  RETURN_BOSS_ROOM,
] as const satisfies StageRooms;
