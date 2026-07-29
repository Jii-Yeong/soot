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
    { type: 'melee', x: 620, y: GAME_HEIGHT - 120 },
    { type: 'ranged', x: 820, y: GAME_HEIGHT - 120 },
    { type: 'ranged', x: 1080, y: GAME_HEIGHT - 120 },
    { type: 'flying', x: 560, y: GAME_HEIGHT - 320 },
    { type: 'flying', x: 980, y: GAME_HEIGHT - 280 },
  ],
});

export const RETURN_ROOM_TWO = defineRoom({
  id: 'return-02',
  label: 'ROOM 02',
  intensity: 1.7,
  enemySpawns: [
    { type: 'melee', x: 390, y: GAME_HEIGHT - 120 },
    { type: 'melee', x: 570, y: GAME_HEIGHT - 120 },
    { type: 'melee', x: 760, y: GAME_HEIGHT - 120 },
    { type: 'ranged', x: 930, y: GAME_HEIGHT - 120 },
    { type: 'ranged', x: 1150, y: GAME_HEIGHT - 120 },
    { type: 'flying', x: 520, y: GAME_HEIGHT - 330 },
    { type: 'flying', x: 1020, y: GAME_HEIGHT - 310 },
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
