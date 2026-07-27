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
