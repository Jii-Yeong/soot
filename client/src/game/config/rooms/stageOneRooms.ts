import { GAME_HEIGHT } from '@/game/config/gameDimensions';
import { GROUND_STAGE_FLYING_PATROL } from '@/game/config/aerialMovementConfig';
import {
  defineBossRoom,
  defineRoom,
  type StageRooms,
} from '@/game/config/roomConfig';

const SECOND_FLOOR_Y = GAME_HEIGHT - 180;
const THIRD_FLOOR_Y = GAME_HEIGHT - 300;

export const CITY_ROOM_ONE = defineRoom({
  id: 'city-01',
  label: 'ROOM 01',
  // 첫 방은 다음 적이 합류하기 전에 각 위협을 파악할 활성 거리를 제공한다.
  // 후반의 지상 적 둘만 의도적으로 가까이 두어 조합 교전을 만든다.
  enemySpawns: [
    // 처음 만나는 적의 위쪽은 열린 공간이다.
    { type: 'melee', x: 680, y: GAME_HEIGHT - 120 },
    // 거리를 둔 두 번째 근접 적으로 기본 대응을 반복한다.
    { type: 'melee', x: 1250, y: GAME_HEIGHT - 120 },
    // 첫 원거리 적은 근접 교전 두 번 뒤에 등장한다.
    { type: 'ranged', x: 1850, y: GAME_HEIGHT - 120 },
    // 후반의 두 적은 처음으로 의도한 혼합 교전이다.
    { type: 'melee', x: 2250, y: GAME_HEIGHT - 120 },
    { type: 'ranged', x: 2480, y: GAME_HEIGHT - 120 },
    // 두 높이 경로를 모두 사용할 수 있는 상태에서 높은 비행 적 하나로 마무리한다.
    {
      type: 'flying',
      x: 3150,
      y: GAME_HEIGHT - 360,
      movement: GROUND_STAGE_FLYING_PATROL,
    },
  ],
  terrain: [
    // 짧은 높이 구간은 대응하는 지상 교전 뒤에 시작함. 상단 경로를 골라도
    // 다음 기본 적이 탄환을 막는 발판 아래에 가려지지 않음.
    { type: 'platform', x: 1350, y: SECOND_FLOOR_Y, width: 350, height: 22 },
    { type: 'platform', x: 1950, y: SECOND_FLOOR_Y, width: 200, height: 22 },
    { type: 'platform', x: 2800, y: SECOND_FLOOR_Y, width: 400, height: 22 },
    // 각 상단 구간을 하단 구간과 겹쳐 이동 경로를 쉽게 읽게 한다.
    { type: 'platform', x: 1450, y: THIRD_FLOOR_Y, width: 250, height: 22 },
    { type: 'platform', x: 2950, y: THIRD_FLOOR_Y, width: 250, height: 22 },
  ],
});

export const CITY_ROOM_TWO = defineRoom({
  id: 'city-02',
  label: 'ROOM 02',
  // 02방은 기본 교전을 더 빠르게 반복한 뒤, 보스 진입 전 세 유형의 마지막
  // 조합 교전으로 높이를 올린다.
  enemySpawns: [
    { type: 'melee', x: 700, y: GAME_HEIGHT - 120 },
    { type: 'ranged', x: 1370, y: GAME_HEIGHT - 120 },
    { type: 'melee', x: 1840, y: GAME_HEIGHT - 120 },
    // 마지막 세 적은 공중 적부터 지상 적 순서로 합류한다.
    {
      type: 'flying',
      x: 2700,
      y: GAME_HEIGHT - 360,
      movement: GROUND_STAGE_FLYING_PATROL,
    },
    { type: 'ranged', x: 2930, y: GAME_HEIGHT - 120 },
    { type: 'melee', x: 3180, y: GAME_HEIGHT - 120 },
    // 문 앞 마지막 413px는 보스 전 숨 고르기를 위해 비워 둔다.
  ],
  terrain: [
    // 앞의 두 높이 구간은 지상 적 사이에 배치함. 마지막 구간은 비행 적에게
    // 속하며 최종 원거리·근거리 조합이 등장하기 전에 끝남.
    { type: 'platform', x: 1500, y: SECOND_FLOOR_Y, width: 200, height: 22 },
    { type: 'platform', x: 1950, y: SECOND_FLOOR_Y, width: 400, height: 22 },
    { type: 'platform', x: 2550, y: SECOND_FLOOR_Y, width: 240, height: 22 },
    { type: 'platform', x: 1550, y: THIRD_FLOOR_Y, width: 200, height: 22 },
    { type: 'platform', x: 2600, y: THIRD_FLOOR_Y, width: 200, height: 22 },
  ],
});

export const CITY_BOSS_ROOM = defineBossRoom({
  id: 'city-boss',
  label: 'CITY WARDEN',
  variant: 'city-warden',
});

export const CITY_ROOMS = [
  CITY_ROOM_ONE,
  CITY_ROOM_TWO,
  CITY_BOSS_ROOM,
] as const satisfies StageRooms;
