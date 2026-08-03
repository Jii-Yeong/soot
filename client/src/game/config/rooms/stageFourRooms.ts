import { GAME_HEIGHT } from '@/game/config/gameDimensions';
import {
  defineBossRoom,
  defineRoom,
  type StageRooms,
} from '@/game/config/roomConfig';

// Hell is the test, not a new lesson. Same three pieces the player has been
// taught — walkway, pit, barrier — with the margins taken out of them. The
// spans narrow from 420px to 280, the gaps widen from 190 to 230 against a
// 196px safe gap, and the pits go from 150 to 200. Nothing here is past the
// 266px limit or needs a dash; it is the same jump the player has made a
// hundred times, with less room to be sloppy about it.
// The raised route changes height, movement, and line of fire. Platforms block
// both sides' shots, but their short spans make temporary cover, not a safe
// route the player can camp on.
const LEDGE_Y = GAME_HEIGHT - 190;
const HIGH_LEDGE_Y = GAME_HEIGHT - 290;

export const INFERNO_ROOM_ONE = defineRoom({
  id: 'inferno-01',
  label: 'ROOM 01',
  intensity: 1.45,
  enemySpawns: [
    // A readable first crossing: pursuer, shooter, then a flier over the next
    // gap. The player reaches the first enemy after choosing a route, not on
    // the frame the room appears.
    { type: 'melee', x: 950, y: GAME_HEIGHT - 120 },
    { type: 'ranged', x: 1350, y: GAME_HEIGHT - 120 },
    { type: 'flying', x: 1700, y: GAME_HEIGHT - 310 },
    // Same beats under tighter recovery windows.
    { type: 'melee', x: 1950, y: GAME_HEIGHT - 120 },
    { type: 'ranged', x: 2400, y: GAME_HEIGHT - 120 },
    { type: 'flying', x: 2700, y: GAME_HEIGHT - 300 },
    // Last pair, followed by a full boss approach.
    { type: 'melee', x: 2950, y: GAME_HEIGHT - 120 },
    { type: 'ranged', x: 3000, y: GAME_HEIGHT - 120 },
  ],
  terrain: [
    { type: 'platform', x: 560, y: LEDGE_Y, width: 300, height: 22 },
    { type: 'platform', x: 1090, y: LEDGE_Y, width: 280, height: 22 },
    { type: 'platform', x: 1600, y: LEDGE_Y, width: 280, height: 22 },
    { type: 'platform', x: 2110, y: LEDGE_Y, width: 280, height: 22 },
    { type: 'platform', x: 2620, y: LEDGE_Y, width: 280, height: 22 },
    { type: 'platform', x: 3130, y: LEDGE_Y, width: 300, height: 22 },
  ],
  pits: [
    { x: 1050, width: 200 },
    { x: 1560, width: 200 },
    { x: 2070, width: 200 },
    { x: 2580, width: 200 },
    { x: 3090, width: 200 },
  ],
});

export const INFERNO_ROOM_TWO = defineRoom({
  id: 'inferno-02',
  label: 'ROOM 02',
  intensity: 1.55,
  enemySpawns: [
    // The first set is still readable. The second melee arrives only after the
    // shooter has made the first crossing active.
    { type: 'melee', x: 950, y: GAME_HEIGHT - 120 },
    { type: 'ranged', x: 1300, y: GAME_HEIGHT - 120 },
    { type: 'melee', x: 1400, y: GAME_HEIGHT - 120 },
    { type: 'flying', x: 1600, y: GAME_HEIGHT - 320 },
    // The middle is the room's sustained peak: two pursuers force movement
    // while the shooter and flier cover different heights.
    { type: 'melee', x: 1850, y: GAME_HEIGHT - 120 },
    { type: 'melee', x: 1950, y: GAME_HEIGHT - 120 },
    { type: 'ranged', x: 2300, y: GAME_HEIGHT - 120 },
    { type: 'flying', x: 2550, y: GAME_HEIGHT - 300 },
    // Final trio, then enough empty runway to read the boss door.
    { type: 'melee', x: 2800, y: GAME_HEIGHT - 120 },
    { type: 'ranged', x: 2850, y: GAME_HEIGHT - 120 },
    { type: 'flying', x: 3150, y: GAME_HEIGHT - 280 },
  ],
  terrain: [
    { type: 'platform', x: 540, y: LEDGE_Y, width: 280, height: 22 },
    { type: 'platform', x: 1050, y: LEDGE_Y, width: 260, height: 22 },
    { type: 'platform', x: 1540, y: LEDGE_Y, width: 260, height: 22 },
    { type: 'platform', x: 2030, y: LEDGE_Y, width: 260, height: 22 },
    { type: 'platform', x: 2520, y: LEDGE_Y, width: 260, height: 22 },
    { type: 'platform', x: 3010, y: LEDGE_Y, width: 300, height: 22 },
    // Two high perches, both sitting on a span so the climb costs no gap. They
    // create a voluntary firing angle during the room's dense middle.
    { type: 'platform', x: 1120, y: HIGH_LEDGE_Y, width: 200, height: 22 },
    { type: 'platform', x: 2600, y: HIGH_LEDGE_Y, width: 200, height: 22 },
  ],
  pits: [
    { x: 1000, width: 150 },
    { x: 1490, width: 200 },
    { x: 1980, width: 200 },
    { x: 2470, width: 150 },
    { x: 2960, width: 200 },
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
