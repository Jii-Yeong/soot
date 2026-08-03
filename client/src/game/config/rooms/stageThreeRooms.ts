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
    // Opening: a short ground fight before the first crossing.
    { type: 'melee', x: 460, y: GAME_HEIGHT - 120 },
    { type: 'ranged', x: 900, y: GAME_HEIGHT - 120 },
    // Middle: the first flying enemy joins after the player has chosen a
    // route once. The nearby catwalk gives the player a firing-angle and cover
    // choice.
    { type: 'flying', x: 1300, y: GAME_HEIGHT - 310 },
    { type: 'melee', x: 1600, y: GAME_HEIGHT - 120 },
    { type: 'ranged', x: 1950, y: GAME_HEIGHT - 120 },
    { type: 'flying', x: 2180, y: GAME_HEIGHT - 320 },
    // Final cluster, followed by a clear approach to the boss door.
    { type: 'melee', x: 2720, y: GAME_HEIGHT - 120 },
    { type: 'ranged', x: 3100, y: GAME_HEIGHT - 120 },
  ],
  terrain: [
    // Each catwalk covers its corresponding pit but begins early enough to be
    // reached from solid floor. The player can also ignore it and jump below.
    { type: 'platform', x: 760, y: CATWALK_Y, width: 640, height: 22 },
    { type: 'platform', x: 1430, y: CATWALK_Y, width: 420, height: 22 },
    { type: 'platform', x: 2030, y: CATWALK_Y, width: 430, height: 22 },
    { type: 'platform', x: 2640, y: CATWALK_Y, width: 410, height: 22 },
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
    // The room starts with a familiar low route rather than a trap at the door.
    { type: 'melee', x: 440, y: GAME_HEIGHT - 120 },
    { type: 'ranged', x: 850, y: GAME_HEIGHT - 120 },
    { type: 'flying', x: 780, y: GAME_HEIGHT - 310 },
    // The middle puts the route choice inside a mixed fight.
    { type: 'melee', x: 1480, y: GAME_HEIGHT - 120 },
    { type: 'ranged', x: 1640, y: GAME_HEIGHT - 120 },
    { type: 'flying', x: 1860, y: GAME_HEIGHT - 320 },
    // The final trio is the local peak. Nothing is spawned after it, leaving
    // the player time to finish the fight before entering the boss room.
    { type: 'melee', x: 2200, y: GAME_HEIGHT - 120 },
    { type: 'ranged', x: 2680, y: GAME_HEIGHT - 120 },
    { type: 'flying', x: 2840, y: GAME_HEIGHT - 300 },
  ],
  terrain: [
    { type: 'platform', x: 620, y: CATWALK_Y, width: 630, height: 22 },
    { type: 'platform', x: 1390, y: CATWALK_Y, width: 500, height: 22 },
    { type: 'platform', x: 1970, y: CATWALK_Y, width: 560, height: 22 },
    { type: 'platform', x: 2550, y: CATWALK_Y, width: 600, height: 22 },
    // Two short upper ledges add a voluntary second height during the denser
    // encounters. Both sit above a catwalk, so the climb is 100px and asks
    // for positioning rather than a long precision jump.
    { type: 'platform', x: 1440, y: HIGH_LEDGE_Y, width: 220, height: 22 },
    { type: 'platform', x: 2580, y: HIGH_LEDGE_Y, width: 220, height: 22 },
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
