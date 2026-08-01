import { GAME_HEIGHT } from '@/game/config/gameDimensions';
import {
  defineBossRoom,
  defineRoom,
  type StageRooms,
} from '@/game/config/roomConfig';

// The underground turns the lesson of the first two stages over. Up there a
// ledge was somewhere to climb for a better shot and the floor was always
// there; down here the floor is the unreliable part. A service walkway runs the
// length of both rooms and the ground has fallen away under every gap in it, so
// "stay up or run the floor" is a real choice rather than a detour.
//
// Every ledge sits 126px above the floor — inside the 130.7px jump — and the
// gaps between them are 190px against a 196px safe gap. Nothing here needs the
// dash, and missing a gap drops the player into a pit that costs health and
// puts them out the far side, so the walkway is a risk worth taking rather than
// a trap.
const WALKWAY_Y = GAME_HEIGHT - 190;
const UPPER_LEDGE_Y = GAME_HEIGHT - 290;

export const UNDERGROUND_ROOM_ONE = defineRoom({
  id: 'underground-01',
  label: 'ROOM 01',
  intensity: 1.25,
  enemySpawns: [
    { type: 'melee', x: 450, y: GAME_HEIGHT - 120 },
    { type: 'melee', x: 760, y: GAME_HEIGHT - 120 },
    { type: 'ranged', x: 1020, y: GAME_HEIGHT - 120 },
    { type: 'flying', x: 840, y: GAME_HEIGHT - 300 },
    { type: 'melee', x: 1600, y: GAME_HEIGHT - 120 },
    { type: 'ranged', x: 1950, y: GAME_HEIGHT - 120 },
    { type: 'flying', x: 2180, y: GAME_HEIGHT - 320 },
    { type: 'melee', x: 2820, y: GAME_HEIGHT - 120 },
    { type: 'ranged', x: 3180, y: GAME_HEIGHT - 120 },
  ],
  terrain: [
    // The walkway. Five spans, 190px apart, running the whole room.
    { type: 'platform', x: 620, y: WALKWAY_Y, width: 420, height: 22 },
    { type: 'platform', x: 1230, y: WALKWAY_Y, width: 400, height: 22 },
    { type: 'platform', x: 1820, y: WALKWAY_Y, width: 420, height: 22 },
    { type: 'platform', x: 2430, y: WALKWAY_Y, width: 420, height: 22 },
    { type: 'platform', x: 3040, y: WALKWAY_Y, width: 400, height: 22 },
  ],
  // One under each gap, and only under the gaps: a full jump rises 130.7px
  // whether it needs to or not, so a pit with a ledge over it is a headbutt.
  pits: [
    { x: 1060, width: 150 },
    { x: 1650, width: 150 },
    { x: 2260, width: 160 },
    { x: 2870, width: 150 },
  ],
});

export const UNDERGROUND_ROOM_TWO = defineRoom({
  id: 'underground-02',
  label: 'ROOM 02',
  intensity: 1.35,
  enemySpawns: [
    { type: 'melee', x: 440, y: GAME_HEIGHT - 120 },
    { type: 'melee', x: 680, y: GAME_HEIGHT - 120 },
    // 920 rather than 1020: the walkway gap here is a pit now.
    { type: 'ranged', x: 920, y: GAME_HEIGHT - 120 },
    { type: 'flying', x: 580, y: GAME_HEIGHT - 320 },
    { type: 'melee', x: 1540, y: GAME_HEIGHT - 120 },
    { type: 'melee', x: 1840, y: GAME_HEIGHT - 120 },
    { type: 'flying', x: 2100, y: GAME_HEIGHT - 300 },
    { type: 'ranged', x: 2680, y: GAME_HEIGHT - 120 },
    { type: 'melee', x: 3000, y: GAME_HEIGHT - 120 },
    { type: 'flying', x: 3260, y: GAME_HEIGHT - 280 },
  ],
  terrain: [
    { type: 'platform', x: 600, y: WALKWAY_Y, width: 380, height: 22 },
    { type: 'platform', x: 1170, y: WALKWAY_Y, width: 380, height: 22 },
    { type: 'platform', x: 1740, y: WALKWAY_Y, width: 380, height: 22 },
    { type: 'platform', x: 2310, y: WALKWAY_Y, width: 380, height: 22 },
    { type: 'platform', x: 2880, y: WALKWAY_Y, width: 400, height: 22 },
    // A third level, only twice. Both sit directly over a walkway span so the
    // step up is 100px with no gap to clear — the height is the reward, not the
    // jump. This is where the room answers its own fliers.
    { type: 'platform', x: 1290, y: UPPER_LEDGE_Y, width: 220, height: 22 },
    { type: 'platform', x: 2400, y: UPPER_LEDGE_Y, width: 220, height: 22 },
  ],
  pits: [
    { x: 1000, width: 150 },
    { x: 1570, width: 150 },
    { x: 2140, width: 160 },
    { x: 2710, width: 150 },
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
