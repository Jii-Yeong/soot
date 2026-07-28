import { GAME_HEIGHT } from '@/game/config/gameDimensions';
import {
  defineBossRoom,
  defineRoom,
  type StageRooms,
} from '@/game/config/roomConfig';

// Ambush placements and a higher intensity distinguish the back alleys.
export const ALLEY_ROOM_ONE = defineRoom({
  id: 'alley-01',
  label: 'ROOM 01',
  intensity: 1.15,
  enemySpawns: [
    { type: 'melee', x: 420, y: GAME_HEIGHT - 120 },
    { type: 'melee', x: 520, y: GAME_HEIGHT - 120 },
    { type: 'ranged', x: 750, y: GAME_HEIGHT - 120 },
    { type: 'flying', x: 950, y: GAME_HEIGHT - 280 },
  ],
});

export const ALLEY_ROOM_TWO = defineRoom({
  id: 'alley-02',
  label: 'ROOM 02',
  intensity: 1.2,
  enemySpawns: [
    { type: 'melee', x: 450, y: GAME_HEIGHT - 120 },
    { type: 'melee', x: 700, y: GAME_HEIGHT - 120 },
    { type: 'melee', x: 950, y: GAME_HEIGHT - 120 },
    { type: 'flying', x: 600, y: GAME_HEIGHT - 320 },
    { type: 'ranged', x: 1100, y: GAME_HEIGHT - 120 },
  ],
});

export const ALLEY_BOSS_ROOM = defineBossRoom({
  id: 'alley-boss',
  label: 'ALLEY HUNTER',
  variant: 'alley-hunter',
  intensity: 1.2,
});

export const ALLEY_ROOMS = [
  ALLEY_ROOM_ONE,
  ALLEY_ROOM_TWO,
  ALLEY_BOSS_ROOM,
] as const satisfies StageRooms;
