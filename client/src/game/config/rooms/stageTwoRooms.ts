import { GAME_HEIGHT } from '@/game/config/gameDimensions';
import { GROUND_STAGE_FLYING_PATROL } from '@/game/config/aerialMovementConfig';
import {
  defineBossRoom,
  defineRoom,
  type StageRooms,
} from '@/game/config/roomConfig';

// 뒷골목은 비상계단 발판과 배수로 틈으로 구성한다. 늘어난 길이를 그냥 지나치지 않고
// 전투하도록 방 전체에 적을 세 무리로 나누며, 지상 적은 구덩이와 떨어뜨려 배치한다.
export const ALLEY_ROOM_ONE = defineRoom({
  id: 'alley-01',
  label: 'ROOM 01',
  worldWidth: 4000,
  intensity: 1.15,
  enemySpawns: [
    // A 무리 — 골목 입구. 첫 감지 전 화면 너비의 4분의 1 이상을 조용히 유지한다.
    { type: 'melee', x: 950, y: GAME_HEIGHT - 120 },
    { type: 'ranged', x: 1400, y: GAME_HEIGHT - 120 },
    {
      type: 'flying',
      x: 1650,
      y: GAME_HEIGHT - 300,
      movement: GROUND_STAGE_FLYING_PATROL,
    },
    // B 무리 — 첫 틈을 지난 중간 구간.
    { type: 'melee', x: 1950, y: GAME_HEIGHT - 120 },
    { type: 'ranged', x: 2250, y: GAME_HEIGHT - 120 },
    {
      type: 'flying',
      x: 2500,
      y: GAME_HEIGHT - 320,
      movement: GROUND_STAGE_FLYING_PATROL,
    },
    // C 무리 — 출구 전 먼 구간.
    { type: 'melee', x: 3200, y: GAME_HEIGHT - 120 },
    { type: 'ranged', x: 3500, y: GAME_HEIGHT - 120 },
  ],
  terrain: [
    // 비상계단 발판 아래의 지상 경로는 계속 달릴 수 있다.
    // 낮은 발판의 끝점은 유지하되, 초반 순찰 적이 탄환 엄폐 안쪽으로
    // 사라지지 않도록 폭을 줄임.
    { type: 'platform', x: 810, y: GAME_HEIGHT - 190, width: 190, height: 22 },
    { type: 'platform', x: 1150, y: GAME_HEIGHT - 260, width: 170, height: 22 },
    // B 무리는 바닥에서 닿는 발판과 그 위의 높은 발판으로 A 무리의 형태를 반복한다.
    // 기존 -210 위치는 바닥보다 146px 높아 최대 점프 130.7px로 15px 부족했고,
    // 여기서만 오를 수 있는 -290 발판까지 도달할 수 없게 만들었다.
    { type: 'platform', x: 1900, y: GAME_HEIGHT - 190, width: 190, height: 22 },
    { type: 'platform', x: 2250, y: GAME_HEIGHT - 290, width: 160, height: 22 },
    // C 무리도 같은 이유로 수정한다. -200은 바닥보다 136px 높아 최대 점프
    // 130.7px로 닿지 않으므로 더 낮은 진입 발판이 필요하다.
    // 두 단계 오르막은 유지하면서 주변 순찰 적이 엄폐 깊숙이 들어가지
    // 않도록 낮은 발판의 폭을 제한함.
    { type: 'platform', x: 3000, y: GAME_HEIGHT - 190, width: 190, height: 22 },
    { type: 'platform', x: 3340, y: GAME_HEIGHT - 250, width: 170, height: 22 },
  ],
  // 첫 구덩이는 짧고 조용한 횡단 구간이며 첫 적의 활성 범위보다 앞에 둔다.
  // 사격이나 추적과 겹치지 않은 점프로 추락을 먼저 소개하고, 후반 구덩이에서
  // 전투와 결합해 시험한다.
  pits: [
    { x: 300, width: 120 },
    { x: 2450, width: 160 },
  ],
});

export const ALLEY_ROOM_TWO = defineRoom({
  id: 'alley-02',
  label: 'ROOM 02',
  worldWidth: 4000,
  intensity: 1.2,
  enemySpawns: [
    // A 무리는 추적 적 하나로 시작한 뒤, 비행 적 아래를 건너기 전에 원거리 적을
    // 압박하게 하여 첫 틈에 의미를 부여한다.
    { type: 'melee', x: 950, y: GAME_HEIGHT - 120 },
    { type: 'ranged', x: 1400, y: GAME_HEIGHT - 120 },
    {
      type: 'flying',
      x: 1650,
      y: GAME_HEIGHT - 320,
      movement: GROUND_STAGE_FLYING_PATROL,
    },
    // B 무리 — 첫 틈을 지난 중간 구간.
    { type: 'melee', x: 1900, y: GAME_HEIGHT - 120 },
    { type: 'ranged', x: 2050, y: GAME_HEIGHT - 120 },
    {
      type: 'flying',
      x: 2200,
      y: GAME_HEIGHT - 300,
      movement: GROUND_STAGE_FLYING_PATROL,
    },
    // C 무리 — 먼 구간.
    { type: 'ranged', x: 2600, y: GAME_HEIGHT - 120 },
    { type: 'melee', x: 3300, y: GAME_HEIGHT - 120 },
    // 마지막 비행 적은 확장된 방 끝까지 전투를 이어 가되 보스방 진입
    // 여백을 침범하지 않음.
    {
      type: 'flying',
      x: 3500,
      y: GAME_HEIGHT - 300,
      movement: GROUND_STAGE_FLYING_PATROL,
    },
  ],
  terrain: [
    // 초반에는 2단 발판을 두고 이후 이동 구간을 따라 발판을 배치한다.
    { type: 'platform', x: 470, y: GAME_HEIGHT - 180, width: 200, height: 22 },
    { type: 'platform', x: 820, y: GAME_HEIGHT - 270, width: 180, height: 22 },
    // 01방과 같은 수정에 너비 50px를 더한다. -190에서 -290 발판으로 오르는 간격은
    // 210px지만 해당 높이에서 도달 거리는 201px라, 너비를 50px 늘리지 않으면
    // 선택 발판을 오르기 위해 픽셀 단위로 정확한 대시가 필요하다.
    { type: 'platform', x: 1600, y: GAME_HEIGHT - 190, width: 240, height: 22 },
    { type: 'platform', x: 2000, y: GAME_HEIGHT - 290, width: 160, height: 22 },
    // 확장된 방의 마지막 적 무리를 따라 C 구간을 배치함. 높은 발판은
    // 낮은 진입 발판에서 편하게 한 번에 오를 수 있어, 적을 지나쳤다가
    // 되돌아올 필요가 없음.
    { type: 'platform', x: 3000, y: GAME_HEIGHT - 190, width: 200, height: 22 },
    { type: 'platform', x: 3340, y: GAME_HEIGHT - 250, width: 170, height: 22 },
  ],
  pits: [
    { x: 1450, width: 150 },
    { x: 2250, width: 160 },
  ],
});

export const ALLEY_BOSS_ROOM = defineBossRoom({
  id: 'alley-boss',
  label: 'ALLEY HUNTER',
  variant: 'alley-hunter',
  intensity: 1.2,
});

export const ALLEY_ROOMS = [
  ALLEY_ROOM_ONE,
  ALLEY_ROOM_TWO,
  ALLEY_BOSS_ROOM,
] as const satisfies StageRooms;
