import { AerialMovementMode } from '@/game/config/aerialMovementConfig';
import { GAME_HEIGHT } from '@/game/config/gameDimensions';
import {
  defineBossRoom,
  defineRoom,
  type StageRooms,
} from '@/game/config/roomConfig';

const AERIAL_ROOM_PORTAL = {
  y: GAME_HEIGHT / 2,
  height: GAME_HEIGHT,
};

// 귀환은 유일한 비행 스테이지이므로 기본 배치는 발판이 아니라 적 편대와 열린
// 공간으로 구성한다. 비행 중에는 점프로 빠져나올 수 없어 작은 벽도 추적 적과
// 결합하면 구석 함정이 된다. 두 전투방 모두 지형, 구덩이, 탄환 엄폐를 의도적으로
// 두지 않으며, 화면 전체 높이의 문만 단단한 경계로 사용한다.
//
// 사용 가능한 비행 범위는 y=128~600이다. 모든 기준점과 순찰 진폭은 이 안에
// 머물고, 각 방은 높이의 3분의 2 이상을 사용한다. 위나 아래에 머무는 행동은
// 일시적 회피일 뿐 영구적인 안전 지대가 아니다.
//
// 스테이지 흐름은 의도적으로 여유 있게 구성한다. 01방은 단독→단독→둘→둘의
// 순서로 비행에 적응할 시간을 주고, 02방은 이를 짧은 혼합 편대로 발전시켜
// 적 셋으로 구성된 편대 하나에서 정점을 만든다.
// 확장된 방의 마지막 편대까지 공중 이동을 쓰고, 보스방 앞 400px 이상은
// 위치를 다시 잡는 구간으로 남김.

export const RETURN_ROOM_ONE = defineRoom({
  id: 'return-01',
  label: 'ROOM 01',
  worldWidth: 4200,
  intensity: 1.6,
  portal: AERIAL_ROOM_PORTAL,
  enemySpawns: [
    // 비행 조작을 익힐 열린 공간을 충분히 지난 뒤 첫 교전이 시작되며,
    // 방 입구에서 사격할 수 있는 적은 없다.
    {
      type: 'flying',
      x: 1050,
      y: 360,
      movement: { mode: AerialMovementMode.HOVER },
    },
    // 높은 순찰 적으로 시작 지점의 제자리 비행과 섞지 않고 수직 범위를 사용하게 한다.
    {
      type: 'flying',
      x: 1650,
      y: 200,
      movement: {
        mode: AerialMovementMode.PATROL,
        rangeX: 150,
        rangeY: 55,
      },
    },
    // 첫 편대는 궤도 적 아래에 추적 적을 둔다. 두 적의 간격은 중앙에 명확한
    // 대각선 경로를 남기며, 어느 쪽도 엄폐물 역할을 하지 않는다.
    {
      type: 'flying',
      x: 2250,
      y: 500,
      movement: { mode: AerialMovementMode.TRACK },
    },
    {
      type: 'flying',
      x: 2480,
      y: 220,
      movement: {
        mode: AerialMovementMode.ORBIT,
        rangeX: 130,
        rangeY: 70,
      },
    },
    // 긴 열린 재정비 구간 뒤 01방의 마지막 둘을 배치한다. 같은 높이에 적을 늘어놓은
    // 벽이 아니라 낮고 높은 두 방향의 교차 사격을 만든다.
    {
      type: 'flying',
      x: 3400,
      y: 520,
      movement: { mode: AerialMovementMode.HOVER },
    },
    {
      type: 'flying',
      x: 3700,
      y: 250,
      movement: {
        mode: AerialMovementMode.PATROL,
        rangeX: 150,
        rangeY: 60,
      },
    },
  ],
});

export const RETURN_ROOM_TWO = defineRoom({
  id: 'return-02',
  label: 'ROOM 02',
  worldWidth: 4200,
  intensity: 1.7,
  portal: AERIAL_ROOM_PORTAL,
  enemySpawns: [
    // 02방도 짧은 진입로를 제공한 뒤 익숙한 두 높이 편대로 시작해 마지막 편대에서 조인다.
    {
      type: 'flying',
      x: 1050,
      y: 210,
      movement: {
        mode: AerialMovementMode.ORBIT,
        rangeX: 120,
        rangeY: 70,
      },
    },
    {
      type: 'flying',
      x: 1450,
      y: 540,
      movement: { mode: AerialMovementMode.TRACK },
    },
    {
      type: 'flying',
      x: 2100,
      y: 170,
      movement: {
        mode: AerialMovementMode.PATROL,
        rangeX: 160,
        rangeY: 35,
      },
    },
    {
      type: 'flying',
      x: 2400,
      y: 480,
      movement: { mode: AerialMovementMode.HOVER },
    },
    // 스테이지의 정점은 높은 궤도, 중앙 추적, 낮은 순찰 적이다. 세 기준점을
    // 수직으로 엇갈리게 두어 한 수평선으로 억지 돌파하지 않고 사이 경로를 읽게 한다.
    {
      type: 'flying',
      x: 3100,
      y: 250,
      movement: {
        mode: AerialMovementMode.ORBIT,
        rangeX: 135,
        rangeY: 85,
      },
    },
    {
      type: 'flying',
      x: 3400,
      y: 380,
      movement: { mode: AerialMovementMode.TRACK },
    },
    {
      type: 'flying',
      x: 3700,
      y: 500,
      movement: {
        mode: AerialMovementMode.PATROL,
        rangeX: 150,
        rangeY: 70,
      },
    },
    // 마지막 편대 뒤에는 전고 포탈과 보스 패턴을 읽을 여백을 남김.
  ],
});

export const RETURN_BOSS_ROOM = defineBossRoom({
  id: 'return-boss',
  label: 'THE RETURNING ARCHITECT',
  variant: 'returning-architect',
  intensity: 1.7,
  bossY: GAME_HEIGHT / 2,
  portal: AERIAL_ROOM_PORTAL,
});

export const RETURN_ROOMS = [
  RETURN_ROOM_ONE,
  RETURN_ROOM_TWO,
  RETURN_BOSS_ROOM,
] as const satisfies StageRooms;
