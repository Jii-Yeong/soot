import { GAME_HEIGHT } from "@/game/config/gameDimensions";
import {
  defineBossRoom,
  defineRoom,
  type StageRooms,
} from "@/game/config/roomConfig";

// The back alleys: fire-escape perches and drainage gaps.
// Enemies are spread across the full room in three clusters so the doubled
// length is fought through, not walked past. Ground spawns stay clear of pits.
export const ALLEY_ROOM_ONE = defineRoom({
  id: "alley-01",
  label: "ROOM 01",
  worldWidth: 4000,
  intensity: 1.15,
  enemySpawns: [
    // Cluster A — the mouth of the alley.
    // The entry stays quiet for over a screen quarter before the first aggro.
    { type: "melee", x: 950, y: GAME_HEIGHT - 120 },
    { type: "ranged", x: 1400, y: GAME_HEIGHT - 120 },
    { type: "flying", x: 1650, y: GAME_HEIGHT - 300 },
    // Cluster B — mid, past the first gap.
    { type: "melee", x: 1950, y: GAME_HEIGHT - 120 },
    { type: "ranged", x: 2250, y: GAME_HEIGHT - 120 },
    { type: "flying", x: 2500, y: GAME_HEIGHT - 320 },
    // Cluster C — the far stretch before the exit.
    { type: "melee", x: 3200, y: GAME_HEIGHT - 120 },
    { type: "ranged", x: 3500, y: GAME_HEIGHT - 120 },
  ],
  terrain: [
    // Fire-escape perches (overhead — the ground stays runnable beneath).
    // 낮은 발판의 끝점은 유지하되, 초반 순찰 적이 탄환 엄폐 안쪽으로
    // 사라지지 않도록 폭을 줄임.
    { type: "platform", x: 810, y: GAME_HEIGHT - 190, width: 190, height: 22 },
    { type: "platform", x: 1150, y: GAME_HEIGHT - 260, width: 170, height: 22 },
    // Cluster B repeats cluster A's shape: a perch the floor can reach, then a
    // higher one off it. This one used to sit at -210, which is 146px above the
    // floor against a 130.7px jump — 15px short, and it stranded the -290 perch
    // with it because that one is only steppable from here.
    { type: "platform", x: 1900, y: GAME_HEIGHT - 190, width: 190, height: 22 },
    { type: "platform", x: 2250, y: GAME_HEIGHT - 290, width: 160, height: 22 },
    // Cluster C, same correction again: -200 is 136px up against a 130.7px
    // jump, so this perch also needed a lower approach.
    // 두 단계 오르막은 유지하면서 주변 순찰 적이 엄폐 깊숙이 들어가지
    // 않도록 낮은 발판의 폭을 제한함.
    { type: "platform", x: 3000, y: GAME_HEIGHT - 190, width: 190, height: 22 },
    { type: "platform", x: 3340, y: GAME_HEIGHT - 250, width: 170, height: 22 },
  ],
  // The first pit is a quiet, short crossing. It appears before the first
  // enemy's activation range, so stage 2 introduces falling without stacking
  // a shot or a pursuer onto the same jump. The later pit is the combat test.
  pits: [
    { x: 300, width: 120 },
    { x: 2450, width: 160 },
  ],
});

export const ALLEY_ROOM_TWO = defineRoom({
  id: "alley-02",
  label: "ROOM 02",
  worldWidth: 4000,
  intensity: 1.2,
  enemySpawns: [
    // Cluster A opens with one pursuer, then makes the first gap meaningful:
    // pressure the shooter before crossing under a flier.
    { type: "melee", x: 950, y: GAME_HEIGHT - 120 },
    { type: "ranged", x: 1400, y: GAME_HEIGHT - 120 },
    { type: "flying", x: 1650, y: GAME_HEIGHT - 320 },
    // Cluster B — mid, past the first gap.
    { type: "melee", x: 1900, y: GAME_HEIGHT - 120 },
    { type: "ranged", x: 2050, y: GAME_HEIGHT - 120 },
    { type: "flying", x: 2200, y: GAME_HEIGHT - 300 },
    // Cluster C — the far stretch.
    { type: "ranged", x: 2600, y: GAME_HEIGHT - 120 },
    { type: "melee", x: 3300, y: GAME_HEIGHT - 120 },
    // 마지막 비행 적은 확장된 방 끝까지 전투를 이어 가되 보스방 진입
    // 여백을 침범하지 않음.
    { type: "flying", x: 3500, y: GAME_HEIGHT - 300 },
  ],
  terrain: [
    // Two-tier perches early, then ledges across the run.
    { type: "platform", x: 470, y: GAME_HEIGHT - 180, width: 200, height: 22 },
    { type: "platform", x: 820, y: GAME_HEIGHT - 270, width: 180, height: 22 },
    // Same correction as room 01, plus 50px of width. At -190 the step up to
    // the -290 perch is a 210px gap and the reach at that climb is 201px, so
    // without the extra width the second half of the climb needs a pixel-exact
    // dash to make a perch that is only ever optional.
    { type: "platform", x: 1600, y: GAME_HEIGHT - 190, width: 240, height: 22 },
    { type: "platform", x: 2000, y: GAME_HEIGHT - 290, width: 160, height: 22 },
    // 확장된 방의 마지막 적 무리를 따라 C 구간을 배치함. 높은 발판은
    // 낮은 진입 발판에서 편하게 한 번에 오를 수 있어, 적을 지나쳤다가
    // 되돌아올 필요가 없음.
    { type: "platform", x: 3000, y: GAME_HEIGHT - 190, width: 200, height: 22 },
    { type: "platform", x: 3340, y: GAME_HEIGHT - 250, width: 170, height: 22 },
  ],
  pits: [
    { x: 1450, width: 150 },
    { x: 2250, width: 160 },
  ],
});

export const ALLEY_BOSS_ROOM = defineBossRoom({
  id: "alley-boss",
  label: "ALLEY HUNTER",
  variant: "alley-hunter",
  intensity: 1.2,
});

export const ALLEY_ROOMS = [
  ALLEY_ROOM_ONE,
  ALLEY_ROOM_TWO,
  ALLEY_BOSS_ROOM,
] as const satisfies StageRooms;
