import type { MusicKey } from '@/game/config/audioConfig';
import {
  ALLEY_ROOM_ONE,
  ALLEY_ROOM_TWO,
  CITY_ROOM_ONE,
  CITY_ROOM_TWO,
  UNDERGROUND_ROOM_ONE,
  UNDERGROUND_ROOM_TWO,
  type RoomConfig,
} from '@/game/config/roomConfig';

export type StagePalette = {
  backgroundTop: number;
  backgroundBottom: number;
  gridLine: number;
  accentPrimary: number;
  accentSecondary: number;
  /** Randomly dims the secondary accent line to read as a failing neon sign. */
  neonFlicker?: boolean;
};

/**
 * A scripted beat that plays instead of a normal exit when the stage's final
 * room is cleared. 'siege' = androids close in, blackout, fall (act 3 → hell).
 * Future stages will add their own ('crack', 'return', …).
 */
export type StageEndEvent = 'siege';

export type StageConfig = {
  id: string;
  label: string;
  palette: StagePalette;
  music: MusicKey;
  rooms: readonly RoomConfig[];
  endEvent?: StageEndEvent;
};

export const STAGE_ONE_CONFIG: StageConfig = {
  id: 'stage-01',
  label: 'STAGE 1 // THE CITY',
  palette: {
    backgroundTop: 0x111719,
    backgroundBottom: 0x080a0b,
    gridLine: 0x243036,
    accentPrimary: 0xf0a35b,
    accentSecondary: 0xb6ffe4,
  },
  music: 'bgm-city',
  rooms: [CITY_ROOM_ONE, CITY_ROOM_TWO],
};

export const STAGE_TWO_CONFIG: StageConfig = {
  id: 'stage-02',
  label: 'STAGE 2 // THE BACK ALLEYS',
  palette: {
    backgroundTop: 0x1a1310,
    backgroundBottom: 0x0c0908,
    gridLine: 0x3a2c20,
    accentPrimary: 0xd97a3a,
    accentSecondary: 0x3b4a6b,
    neonFlicker: true,
  },
  music: 'bgm-alley',
  rooms: [ALLEY_ROOM_ONE, ALLEY_ROOM_TWO],
};

export const STAGE_THREE_CONFIG: StageConfig = {
  id: 'stage-03',
  label: 'STAGE 3 // THE UNDERGROUND',
  palette: {
    backgroundTop: 0x10180f,
    backgroundBottom: 0x070a06,
    gridLine: 0x263620,
    accentPrimary: 0x6f8f3f,
    accentSecondary: 0xa8b84a,
    neonFlicker: true,
  },
  rooms: [UNDERGROUND_ROOM_ONE, UNDERGROUND_ROOM_TWO],
  endEvent: 'siege',
};

export const STAGES: readonly StageConfig[] = [
  STAGE_ONE_CONFIG,
  STAGE_TWO_CONFIG,
  STAGE_THREE_CONFIG,
];
