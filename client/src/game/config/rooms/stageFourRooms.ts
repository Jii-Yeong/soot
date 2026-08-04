import { GAME_HEIGHT } from '@/game/config/gameDimensions';
import { GROUND_STAGE_FLYING_PATROL } from '@/game/config/aerialMovementConfig';
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
    // 첫 비행 적의 탄환을 낮은 섬 아래에서 끊고 가장자리로 나와 반격함.
    {
      type: 'flying',
      x: 1050,
      y: GAME_HEIGHT - 310,
      movement: GROUND_STAGE_FLYING_PATROL,
    },
    { type: 'ranged', x: 1400, y: GAME_HEIGHT - 120 },
    { type: 'melee', x: 1900, y: GAME_HEIGHT - 120 },
    {
      type: 'flying',
      x: 2450,
      y: GAME_HEIGHT - 300,
      movement: GROUND_STAGE_FLYING_PATROL,
    },
    { type: 'ranged', x: 2700, y: GAME_HEIGHT - 120 },
    { type: 'melee', x: 3000, y: GAME_HEIGHT - 120 },
    {
      type: 'flying',
      x: 3600,
      y: GAME_HEIGHT - 300,
      movement: GROUND_STAGE_FLYING_PATROL,
    },
    { type: 'melee', x: 3900, y: GAME_HEIGHT - 120 },
    { type: 'ranged', x: 4550, y: GAME_HEIGHT - 120 },
    {
      type: 'flying',
      x: 4800,
      y: GAME_HEIGHT - 290,
      movement: GROUND_STAGE_FLYING_PATROL,
    },
    { type: 'melee', x: 5350, y: GAME_HEIGHT - 120 },
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
    {
      type: 'flying',
      x: 1050,
      y: GAME_HEIGHT - 320,
      movement: GROUND_STAGE_FLYING_PATROL,
    },
    { type: 'ranged', x: 1400, y: GAME_HEIGHT - 120 },
    { type: 'melee', x: 1850, y: GAME_HEIGHT - 120 },
    // 중앙 균열에서는 높이 셋을 빠르게 바꾸며 위·아래 탄환 차단을 선택함.
    {
      type: 'flying',
      x: 2300,
      y: GAME_HEIGHT - 480,
      movement: GROUND_STAGE_FLYING_PATROL,
    },
    { type: 'ranged', x: 2600, y: GAME_HEIGHT - 120 },
    { type: 'melee', x: 2800, y: GAME_HEIGHT - 120 },
    {
      type: 'flying',
      x: 3350,
      y: GAME_HEIGHT - 300,
      movement: GROUND_STAGE_FLYING_PATROL,
    },
    { type: 'ranged', x: 3600, y: GAME_HEIGHT - 120 },
    { type: 'melee', x: 3900, y: GAME_HEIGHT - 120 },
    {
      type: 'flying',
      x: 4450,
      y: GAME_HEIGHT - 300,
      movement: GROUND_STAGE_FLYING_PATROL,
    },
    { type: 'melee', x: 4700, y: GAME_HEIGHT - 120 },
    { type: 'ranged', x: 4950, y: GAME_HEIGHT - 120 },
    {
      type: 'flying',
      x: 5400,
      y: GAME_HEIGHT - 280,
      movement: GROUND_STAGE_FLYING_PATROL,
    },
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
