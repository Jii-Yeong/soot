import { GAME_HEIGHT } from '@/game/config/gameDimensions';

export type EnemySpawnConfig = {
  type: 'melee' | 'ranged';
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

export const FIRST_ROOM_CONFIG: RoomConfig = {
  id: 'city-01',
  label: 'ROOM 01',
  entranceX: 64,
  exitX: 1216,
  door: {
    y: GAME_HEIGHT - 154,
    width: 32,
    height: 180,
  },
  enemySpawns: [
    { type: 'melee', x: 640, y: GAME_HEIGHT - 120 },
    { type: 'ranged', x: 950, y: GAME_HEIGHT - 120 },
    { type: 'ranged', x: 1120, y: GAME_HEIGHT - 120 },
  ],
};
