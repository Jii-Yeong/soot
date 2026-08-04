import { GAME_HEIGHT } from '@/game/config/gameDimensions';
import {
  defineBossRoom,
  defineRoom,
  type StageRooms,
} from '@/game/config/roomConfig';

// 3스테이지는 피트 위 캣워크와 단단한 바닥 위 엄폐 캣워크를 구분함.
// 캣워크는 바닥에서 116px 높이라 최대 점프에 여유가 있으며, 짧은 엄폐
// 구간에서는 비행 적의 탄환을 아래에서 막고 가장자리에서 반격할 수 있음.
const CATWALK_Y = GAME_HEIGHT - 180;
const HIGH_LEDGE_Y = GAME_HEIGHT - 280;

export const UNDERGROUND_ROOM_ONE = defineRoom({
  id: 'underground-01',
  label: 'ROOM 01',
  worldWidth: 4300,
  intensity: 1.25,
  enemySpawns: [
    { type: 'melee', x: 950, y: GAME_HEIGHT - 120 },
    { type: 'ranged', x: 1450, y: GAME_HEIGHT - 120 },
    { type: 'flying', x: 1900, y: GAME_HEIGHT - 310 },
    { type: 'melee', x: 2100, y: GAME_HEIGHT - 120 },
    // 단단한 바닥 위의 짧은 캣워크 아래에서 비행 탄을 끊어 처음으로
    // 엄폐 후 가장자리 반격을 연습함.
    { type: 'flying', x: 2320, y: GAME_HEIGHT - 320 },
    { type: 'ranged', x: 2900, y: GAME_HEIGHT - 120 },
    { type: 'melee', x: 3200, y: GAME_HEIGHT - 120 },
    { type: 'ranged', x: 3750, y: GAME_HEIGHT - 120 },
  ],
  terrain: [
    { type: 'platform', x: 1050, y: CATWALK_Y, width: 250, height: 22 },
    { type: 'platform', x: 1800, y: CATWALK_Y, width: 250, height: 22 },
    { type: 'platform', x: 2200, y: CATWALK_Y, width: 220, height: 22 },
    { type: 'platform', x: 2550, y: CATWALK_Y, width: 260, height: 22 },
    { type: 'platform', x: 3300, y: CATWALK_Y, width: 250, height: 22 },
  ],
  pits: [
    { x: 1100, width: 150 },
    { x: 1850, width: 150 },
    { x: 2600, width: 160 },
    { x: 3350, width: 150 },
  ],
});

export const UNDERGROUND_ROOM_TWO = defineRoom({
  id: 'underground-02',
  label: 'ROOM 02',
  worldWidth: 4300,
  intensity: 1.35,
  enemySpawns: [
    { type: 'melee', x: 950, y: GAME_HEIGHT - 120 },
    { type: 'ranged', x: 1500, y: GAME_HEIGHT - 120 },
    { type: 'flying', x: 2050, y: GAME_HEIGHT - 310 },
    { type: 'melee', x: 2250, y: GAME_HEIGHT - 120 },
    // 첫 혼합전 이후 400px의 실제 활성 간격을 두고 짧은 엄폐 비트로 전환함.
    { type: 'flying', x: 2750, y: GAME_HEIGHT - 320 },
    { type: 'ranged', x: 3310, y: GAME_HEIGHT - 120 },
    { type: 'melee', x: 3450, y: GAME_HEIGHT - 120 },
    { type: 'ranged', x: 3590, y: GAME_HEIGHT - 120 },
    { type: 'flying', x: 3800, y: GAME_HEIGHT - 300 },
  ],
  terrain: [
    { type: 'platform', x: 1100, y: CATWALK_Y, width: 250, height: 22 },
    { type: 'platform', x: 1950, y: CATWALK_Y, width: 250, height: 22 },
    { type: 'platform', x: 2650, y: CATWALK_Y, width: 220, height: 22 },
    { type: 'platform', x: 3000, y: CATWALK_Y, width: 260, height: 22 },
    { type: 'platform', x: 3650, y: CATWALK_Y, width: 250, height: 22 },
    { type: 'platform', x: 1980, y: HIGH_LEDGE_Y, width: 180, height: 22 },
    { type: 'platform', x: 3030, y: HIGH_LEDGE_Y, width: 200, height: 22 },
  ],
  pits: [
    { x: 1150, width: 150 },
    { x: 2000, width: 150 },
    { x: 3050, width: 160 },
    { x: 3700, width: 150 },
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
