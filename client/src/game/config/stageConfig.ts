import { CITY_ROOM_ONE, CITY_ROOM_TWO, type RoomConfig } from '@/game/config/roomConfig';

export type StageConfig = {
  id: string;
  label: string;
  rooms: RoomConfig[];
};

export const STAGE_ONE_CONFIG: StageConfig = {
  id: 'stage-01',
  label: 'STAGE 1 // THE CITY',
  rooms: [CITY_ROOM_ONE, CITY_ROOM_TWO],
};
