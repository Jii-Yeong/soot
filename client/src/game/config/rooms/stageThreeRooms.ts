import { GAME_HEIGHT } from '@/game/config/gameDimensions';
import {
  defineBossRoom,
  defineRoom,
  type StageRooms,
} from '@/game/config/roomConfig';

// Stage 3 turns the pit into a repeated route choice. Every gap has a low
// catwalk over it: stay on the floor and jump the gap directly, or climb onto
// the catwalk early and cross above it. The catwalk is deliberately 126px above
// the floor, inside the 130.7px jump, so either choice remains available.
//
// Catwalks also block shots. The high route therefore changes height, distance,
// shot angle, and available cover. There are no walls here because this stage
// is about keeping footing rather than forcing full-body obstacles.
const CATWALK_Y = GAME_HEIGHT - 190;
const HIGH_LEDGE_Y = GAME_HEIGHT - 290;

export const UNDERGROUND_ROOM_ONE = defineRoom({
  id: 'underground-01',
  label: 'ROOM 01',
  intensity: 1.25,
  enemySpawns: [
    // The entry is a quiet approach to the first catwalk. The player meets a
    // pursuer only after seeing the upper route that crosses the first gap.
    { type: 'melee', x: 950, y: GAME_HEIGHT - 120 },
    // The shooter waits beyond that crossing. This makes the catwalk a route
    // choice, rather than putting an unavoidable shot in the doorway.
    { type: 'ranged', x: 1450, y: GAME_HEIGHT - 120 },
    { type: 'flying', x: 1800, y: GAME_HEIGHT - 310 },
    // Once the route has been used twice, the same three roles combine around
    // the next crossings.
    { type: 'melee', x: 2050, y: GAME_HEIGHT - 120 },
    { type: 'ranged', x: 2600, y: GAME_HEIGHT - 120 },
    { type: 'flying', x: 2800, y: GAME_HEIGHT - 320 },
    // Final pair, then a clear approach to the boss door.
    { type: 'ranged', x: 3100, y: GAME_HEIGHT - 120 },
    { type: 'melee', x: 3150, y: GAME_HEIGHT - 120 },
  ],
  terrain: [
    // 각 캣워크는 피트 하나만 덮고 지상 교전 전에 끝남. 발판이 탄환을
    // 막으므로 상단 경로에서도 아래의 적과 싸우기 전에 바닥으로 복귀할 수
    // 있도록 넓은 하강 통로를 의도적으로 둠.
    { type: 'platform', x: 1000, y: CATWALK_Y, width: 350, height: 22 },
    { type: 'platform', x: 1550, y: CATWALK_Y, width: 400, height: 22 },
    { type: 'platform', x: 2150, y: CATWALK_Y, width: 400, height: 22 },
    { type: 'platform', x: 2800, y: CATWALK_Y, width: 250, height: 22 },
  ],
  pits: [
    { x: 1100, width: 150 },
    { x: 1700, width: 150 },
    { x: 2300, width: 160 },
    { x: 2900, width: 150 },
  ],
});

export const UNDERGROUND_ROOM_TWO = defineRoom({
  id: 'underground-02',
  label: 'ROOM 02',
  intensity: 1.35,
  enemySpawns: [
    // Repeat the readable first crossing before mixing the same roles more
    // tightly than room 01.
    { type: 'melee', x: 950, y: GAME_HEIGHT - 120 },
    { type: 'ranged', x: 1450, y: GAME_HEIGHT - 120 },
    { type: 'flying', x: 1800, y: GAME_HEIGHT - 310 },
    // The middle puts the route choice inside a mixed fight. The upper ledges
    // give an optional angle, not a required detour.
    { type: 'melee', x: 2100, y: GAME_HEIGHT - 120 },
    { type: 'ranged', x: 2600, y: GAME_HEIGHT - 120 },
    { type: 'flying', x: 2750, y: GAME_HEIGHT - 320 },
    // Final trio is the local peak. Nothing follows it, leaving time to reset
    // before entering the boss room.
    { type: 'melee', x: 2800, y: GAME_HEIGHT - 120 },
    { type: 'ranged', x: 2950, y: GAME_HEIGHT - 120 },
    { type: 'flying', x: 3150, y: GAME_HEIGHT - 300 },
  ],
  terrain: [
    // 02방도 네 피트 횡단은 유지하되 다리는 피트를 덮는 길이로만 제한함.
    // 다리 사이의 열린 바닥이 지상 교전으로 돌아오는 경로이며, 다리가
    // 탄환을 막는 긴 천장이 되어서는 안 됨.
    { type: 'platform', x: 1050, y: CATWALK_Y, width: 200, height: 22 },
    { type: 'platform', x: 1690, y: CATWALK_Y, width: 200, height: 22 },
    { type: 'platform', x: 2320, y: CATWALK_Y, width: 230, height: 22 },
    { type: 'platform', x: 3000, y: CATWALK_Y, width: 150, height: 22 },
    // Two short upper ledges add a voluntary second height during the denser
    // encounters. Both sit above a catwalk, so the climb is 100px and asks
    // for positioning rather than a long precision jump.
    { type: 'platform', x: 1700, y: HIGH_LEDGE_Y, width: 180, height: 22 },
    { type: 'platform', x: 2330, y: HIGH_LEDGE_Y, width: 200, height: 22 },
  ],
  pits: [
    { x: 1100, width: 150 },
    { x: 1740, width: 150 },
    { x: 2370, width: 160 },
    { x: 3000, width: 150 },
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
