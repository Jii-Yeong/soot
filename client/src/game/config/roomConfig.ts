import { GAME_HEIGHT } from '@/game/config/gameDimensions';

export type EnemySpawnConfig = {
  type: 'melee' | 'ranged' | 'flying';
  x: number;
  y: number;
};

export type RoomConfig = {
  id: string;
  label: string;
  entranceX: number;
  exitX: number;
  door: {
    y: number;
    width: number;
    height: number;
  };
  enemySpawns: EnemySpawnConfig[];
  /** Multiplies enemy move speed and divides fire interval. 1 = baseline pace. */
  intensity?: number;
};

const ROOM_DOOR = {
  y: GAME_HEIGHT - 154,
  width: 32,
  height: 180,
};

export const CITY_ROOM_ONE: RoomConfig = {
  id: 'city-01',
  label: 'ROOM 01',
  entranceX: 64,
  exitX: 1216,
  door: ROOM_DOOR,
  enemySpawns: [
    { type: 'melee', x: 640, y: GAME_HEIGHT - 120 },
    { type: 'ranged', x: 950, y: GAME_HEIGHT - 120 },
    { type: 'ranged', x: 1120, y: GAME_HEIGHT - 120 },
    { type: 'flying', x: 820, y: GAME_HEIGHT - 260 },
  ],
};

export const CITY_ROOM_TWO: RoomConfig = {
  id: 'city-02',
  label: 'ROOM 02',
  entranceX: 64,
  exitX: 1216,
  door: ROOM_DOOR,
  enemySpawns: [
    { type: 'melee', x: 560, y: GAME_HEIGHT - 120 },
    { type: 'melee', x: 940, y: GAME_HEIGHT - 120 },
    { type: 'flying', x: 750, y: GAME_HEIGHT - 260 },
    { type: 'flying', x: 1050, y: GAME_HEIGHT - 300 },
    { type: 'ranged', x: 1160, y: GAME_HEIGHT - 120 },
  ],
};

// Stage 2 reuses the same enemy AI but leans on ambush placement near the
// entrance and a higher intensity (speed/fire-rate) to raise the felt
// difficulty, per the concept doc's "뒷골목" design note.
export const ALLEY_ROOM_ONE: RoomConfig = {
  id: 'alley-01',
  label: 'ROOM 01',
  entranceX: 64,
  exitX: 1216,
  door: ROOM_DOOR,
  intensity: 1.15,
  enemySpawns: [
    // Close enough to still read as an ambush (both are inside their own
    // aggro radius from the post-door spawn point) but far enough that the
    // player has a beat to react before the first hit lands — they used to
    // spawn at x=200/300, only ~50px from the entrance, which put them at
    // point-blank contact range the instant the door unlocked.
    { type: 'melee', x: 420, y: GAME_HEIGHT - 120 },
    { type: 'melee', x: 520, y: GAME_HEIGHT - 120 },
    { type: 'ranged', x: 750, y: GAME_HEIGHT - 120 },
    { type: 'flying', x: 950, y: GAME_HEIGHT - 280 },
  ],
};

export const ALLEY_ROOM_TWO: RoomConfig = {
  id: 'alley-02',
  label: 'ROOM 02',
  entranceX: 64,
  exitX: 1216,
  door: ROOM_DOOR,
  intensity: 1.2,
  enemySpawns: [
    { type: 'melee', x: 450, y: GAME_HEIGHT - 120 },
    { type: 'melee', x: 700, y: GAME_HEIGHT - 120 },
    { type: 'melee', x: 950, y: GAME_HEIGHT - 120 },
    { type: 'flying', x: 600, y: GAME_HEIGHT - 320 },
    { type: 'ranged', x: 1100, y: GAME_HEIGHT - 120 },
  ],
};
