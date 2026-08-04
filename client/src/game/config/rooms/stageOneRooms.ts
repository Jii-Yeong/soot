import { GAME_HEIGHT } from '@/game/config/gameDimensions';
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
  // The first room gives each threat enough activation distance to be read
  // before the next one joins. Only the late ground pair is intentionally
  // close enough to form a combined encounter.
  enemySpawns: [
    // The first contact enemy has open ground above it.
    { type: 'melee', x: 680, y: GAME_HEIGHT - 120 },
    // A second, spaced melee lets the player repeat the simple answer.
    { type: 'melee', x: 1250, y: GAME_HEIGHT - 120 },
    // The first ranged enemy appears after the first two melee beats.
    { type: 'ranged', x: 1850, y: GAME_HEIGHT - 120 },
    // The late pair is the first intentional mixed encounter.
    { type: 'melee', x: 2250, y: GAME_HEIGHT - 120 },
    { type: 'ranged', x: 2480, y: GAME_HEIGHT - 120 },
    // One high flier closes the room, with both height tiers available.
    { type: 'flying', x: 3150, y: GAME_HEIGHT - 360 },
  ],
  terrain: [
    // 짧은 높이 구간은 대응하는 지상 교전 뒤에 시작함. 상단 경로를 골라도
    // 다음 기본 적이 탄환을 막는 발판 아래에 가려지지 않음.
    { type: 'platform', x: 1350, y: SECOND_FLOOR_Y, width: 350, height: 22 },
    { type: 'platform', x: 1950, y: SECOND_FLOOR_Y, width: 200, height: 22 },
    { type: 'platform', x: 2800, y: SECOND_FLOOR_Y, width: 400, height: 22 },
    // Each upper run overlaps a lower one, keeping the route legible.
    { type: 'platform', x: 1450, y: THIRD_FLOOR_Y, width: 250, height: 22 },
    { type: 'platform', x: 2950, y: THIRD_FLOOR_Y, width: 250, height: 22 },
  ],
});

export const CITY_ROOM_TWO = defineRoom({
  id: 'city-02',
  label: 'ROOM 02',
  // Room 02 repeats the basics more quickly, then rises through one final
  // three-type encounter before the boss approach.
  enemySpawns: [
    { type: 'melee', x: 700, y: GAME_HEIGHT - 120 },
    { type: 'ranged', x: 1370, y: GAME_HEIGHT - 120 },
    { type: 'melee', x: 1840, y: GAME_HEIGHT - 120 },
    // The final trio ramps in from the air, then the ground.
    { type: 'flying', x: 2700, y: GAME_HEIGHT - 360 },
    { type: 'ranged', x: 2930, y: GAME_HEIGHT - 120 },
    { type: 'melee', x: 3180, y: GAME_HEIGHT - 120 },
    // The last 413px to the door are empty: a breather before the boss.
  ],
  terrain: [
    // 앞의 두 높이 구간은 지상 적 사이에 배치함. 마지막 구간은 비행 적에게
    // 속하며 최종 원거리·근거리 조합이 등장하기 전에 끝남.
    { type: 'platform', x: 1500, y: SECOND_FLOOR_Y, width: 200, height: 22 },
    { type: 'platform', x: 1950, y: SECOND_FLOOR_Y, width: 400, height: 22 },
    { type: 'platform', x: 2550, y: SECOND_FLOOR_Y, width: 250, height: 22 },
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
