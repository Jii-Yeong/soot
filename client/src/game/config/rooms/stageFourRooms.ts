import { GAME_HEIGHT } from '@/game/config/gameDimensions';
import {
  defineBossRoom,
  defineRoom,
  type StageRooms,
} from '@/game/config/roomConfig';

// 4스테이지는 캣워크 반복 대신 방마다 다른 붕괴 형태를 사용함. 01방은
// 넓은 바닥 위 고립된 엄폐 섬, 02방은 세 높이가 중앙에 겹치는 수직 균열로
// 구성함. 낮은 발판은 116px 높이라 압박 중에도 안정적으로 진입 가능함.
const LOW_LEDGE_Y = GAME_HEIGHT - 180;
const MID_LEDGE_Y = GAME_HEIGHT - 280;
const HIGH_LEDGE_Y = GAME_HEIGHT - 380;

export const INFERNO_ROOM_ONE = defineRoom({
  id: 'inferno-01',
  label: 'ROOM 01',
  worldWidth: 6000,
  intensity: 1.55,
  enemySpawns: [
    // 초반: 크게 예고된 돌진과 상단 내려찍기를 함께 익힘.
    { type: 'infernal-hound', x: 1_150, y: GAME_HEIGHT - 120 },
    { type: 'executioner-doll', x: 1_450, y: GAME_HEIGHT - 330 },
    // 중반: 방사 구체를 구석으로 유도하면서 두 돌진을 피함.
    { type: 'infernal-hound', x: 2_150, y: GAME_HEIGHT - 120 },
    { type: 'infernal-hound', x: 2_450, y: GAME_HEIGHT - 120 },
    { type: 'judgment-eye', x: 2_750, y: GAME_HEIGHT - 330 },
    // 후반: 세 패턴을 섞되 공격 조정기가 동시 공격을 두 기로 제한함.
    { type: 'executioner-doll', x: 3_900, y: GAME_HEIGHT - 340 },
    { type: 'judgment-eye', x: 4_550, y: GAME_HEIGHT - 320 },
    { type: 'infernal-hound', x: 4_800, y: GAME_HEIGHT - 120 },
  ],
  terrain: [
    { type: 'platform', x: 900, y: LOW_LEDGE_Y, width: 220, height: 22 },
    { type: 'platform', x: 2350, y: LOW_LEDGE_Y, width: 220, height: 22 },
    { type: 'platform', x: 3500, y: LOW_LEDGE_Y, width: 220, height: 22 },
    { type: 'platform', x: 4700, y: LOW_LEDGE_Y, width: 220, height: 22 },
    { type: 'platform', x: 3560, y: MID_LEDGE_Y, width: 180, height: 22 },
    { type: 'platform', x: 4760, y: MID_LEDGE_Y, width: 190, height: 22 },
  ],
  pits: [
    { x: 1600, width: 180 },
    { x: 3150, width: 200 },
    { x: 4150, width: 160 },
    { x: 5050, width: 180 },
  ],
});

export const INFERNO_ROOM_TWO = defineRoom({
  id: 'inferno-02',
  label: 'ROOM 02',
  worldWidth: 6000,
  intensity: 1.7,
  enemySpawns: [
    { type: 'infernal-hound', x: 1_150, y: GAME_HEIGHT - 120 },
    { type: 'executioner-doll', x: 1_460, y: GAME_HEIGHT - 340 },
    { type: 'infernal-hound', x: 2_150, y: GAME_HEIGHT - 120 },
    { type: 'infernal-hound', x: 2_450, y: GAME_HEIGHT - 120 },
    { type: 'judgment-eye', x: 2_750, y: GAME_HEIGHT - 350 },
    { type: 'executioner-doll', x: 3_850, y: GAME_HEIGHT - 350 },
    { type: 'judgment-eye', x: 4_500, y: GAME_HEIGHT - 330 },
    { type: 'infernal-hound', x: 4_800, y: GAME_HEIGHT - 120 },
  ],
  terrain: [
    { type: 'platform', x: 1000, y: LOW_LEDGE_Y, width: 220, height: 22 },
    { type: 'platform', x: 2150, y: LOW_LEDGE_Y, width: 200, height: 22 },
    { type: 'platform', x: 3250, y: LOW_LEDGE_Y, width: 220, height: 22 },
    { type: 'platform', x: 4350, y: LOW_LEDGE_Y, width: 220, height: 22 },
    { type: 'platform', x: 1080, y: MID_LEDGE_Y, width: 180, height: 22 },
    { type: 'platform', x: 2210, y: MID_LEDGE_Y, width: 180, height: 22 },
    { type: 'platform', x: 3330, y: MID_LEDGE_Y, width: 190, height: 22 },
    { type: 'platform', x: 4430, y: MID_LEDGE_Y, width: 190, height: 22 },
    { type: 'platform', x: 2270, y: HIGH_LEDGE_Y, width: 160, height: 22 },
  ],
  pits: [
    { x: 1600, width: 160 },
    { x: 3000, width: 190 },
    { x: 4100, width: 180 },
    { x: 5150, width: 180 },
  ],
});

export const INFERNO_BOSS_ROOM = defineBossRoom({
  id: 'inferno-boss',
  label: '연옥의 집행체 // INFERNAL EXECUTIONER',
  variant: 'infernal-executioner',
  intensity: 1.55,
  worldWidth: 2200,
});

export const INFERNO_ROOMS = [
  INFERNO_ROOM_ONE,
  INFERNO_ROOM_TWO,
  INFERNO_BOSS_ROOM,
] as const satisfies StageRooms;
