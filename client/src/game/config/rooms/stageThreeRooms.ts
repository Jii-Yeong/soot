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
    { type: 'melee', x: 450, y: GAME_HEIGHT - 120 },
    { type: 'melee', x: 760, y: GAME_HEIGHT - 120 },
    { type: 'ranged', x: 1020, y: GAME_HEIGHT - 120 },
    { type: 'flying', x: 840, y: GAME_HEIGHT - 300 },
    { type: 'melee', x: 1600, y: GAME_HEIGHT - 120 },
    { type: 'ranged', x: 1950, y: GAME_HEIGHT - 120 },
    { type: 'flying', x: 2180, y: GAME_HEIGHT - 320 },
    { type: 'melee', x: 2820, y: GAME_HEIGHT - 120 },
    { type: 'ranged', x: 3180, y: GAME_HEIGHT - 120 },
  ],
});

export const UNDERGROUND_ROOM_TWO = defineRoom({
  id: 'underground-02',
  label: 'ROOM 02',
  intensity: 1.35,
  enemySpawns: [
    { type: 'melee', x: 440, y: GAME_HEIGHT - 120 },
    { type: 'melee', x: 680, y: GAME_HEIGHT - 120 },
    { type: 'ranged', x: 1020, y: GAME_HEIGHT - 120 },
    { type: 'flying', x: 580, y: GAME_HEIGHT - 320 },
    { type: 'melee', x: 1540, y: GAME_HEIGHT - 120 },
    { type: 'melee', x: 1840, y: GAME_HEIGHT - 120 },
    { type: 'flying', x: 2100, y: GAME_HEIGHT - 300 },
    { type: 'ranged', x: 2680, y: GAME_HEIGHT - 120 },
    { type: 'melee', x: 3000, y: GAME_HEIGHT - 120 },
    { type: 'flying', x: 3260, y: GAME_HEIGHT - 280 },
  ],
});

export const UNDERGROUND_BOSS_ROOM = defineBossRoom({
  id: 'underground-boss',
  label: '정화 집행기 // PURIFIER',
  variant: 'underground-guardian',
  intensity: 1.35,
  // The purifier is a large capture/crush boss: widen the arena so the grab
  // pull and the two floor shockwaves have room to be dodged.
  worldWidth: 2600,
});

export const UNDERGROUND_ROOMS = [
  UNDERGROUND_ROOM_ONE,
  UNDERGROUND_ROOM_TWO,
  UNDERGROUND_BOSS_ROOM,
] as const satisfies StageRooms;
