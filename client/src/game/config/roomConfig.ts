import { GAME_HEIGHT } from '@/game/config/gameDimensions';

export type RangedEnemySpawn = {
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
  rangedEnemySpawns: RangedEnemySpawn[];
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
  rangedEnemySpawns: [
    { x: 900, y: GAME_HEIGHT - 120 },
    { x: 1080, y: GAME_HEIGHT - 120 },
  ],
};
