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
// The raised route changes height and movement choices only. It is not a
// projectile shield: the one-way platforms are deliberately not used as cover.
const LEDGE_Y = GAME_HEIGHT - 190;
const HIGH_LEDGE_Y = GAME_HEIGHT - 290;

export const INFERNO_ROOM_ONE = defineRoom({
  id: 'inferno-01',
  label: 'ROOM 01',
  intensity: 1.45,
  enemySpawns: [
    // The floor remains the straightforward route through the pits. The
    // elevated route repeats familiar combat with tighter jump timing.
    { type: 'melee', x: 420, y: GAME_HEIGHT - 120 },
    { type: 'melee', x: 700, y: GAME_HEIGHT - 120 },
    // Moved out of what is now a pit, and onto the floor beneath a span.
    { type: 'ranged', x: 1180, y: GAME_HEIGHT - 120 },
    { type: 'flying', x: 620, y: GAME_HEIGHT - 310 },
    { type: 'melee', x: 1650, y: GAME_HEIGHT - 120 },
    { type: 'ranged', x: 1850, y: GAME_HEIGHT - 120 },
    { type: 'flying', x: 2100, y: GAME_HEIGHT - 300 },
    { type: 'melee', x: 2700, y: GAME_HEIGHT - 120 },
    { type: 'ranged', x: 2880, y: GAME_HEIGHT - 120 },
    { type: 'flying', x: 3120, y: GAME_HEIGHT - 280 },
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
    { x: 880, width: 200 },
    { x: 1390, width: 200 },
    { x: 1900, width: 200 },
    { x: 2410, width: 200 },
    { x: 2920, width: 200 },
  ],
});

export const INFERNO_ROOM_TWO = defineRoom({
  id: 'inferno-02',
  label: 'ROOM 02',
  intensity: 1.55,
  enemySpawns: [
    // Room two is a denser version of the same route, with walls as the only
    // dependable cover and two optional high positions.
    { type: 'melee', x: 400, y: GAME_HEIGHT - 120 },
    { type: 'melee', x: 650, y: GAME_HEIGHT - 120 },
    { type: 'ranged', x: 1150, y: GAME_HEIGHT - 120 },
    { type: 'flying', x: 540, y: GAME_HEIGHT - 320 },
    { type: 'melee', x: 1600, y: GAME_HEIGHT - 120 },
    { type: 'melee', x: 1750, y: GAME_HEIGHT - 120 },
    { type: 'ranged', x: 2050, y: GAME_HEIGHT - 120 },
    { type: 'flying', x: 2150, y: GAME_HEIGHT - 300 },
    { type: 'melee', x: 2700, y: GAME_HEIGHT - 120 },
    { type: 'ranged', x: 3100, y: GAME_HEIGHT - 120 },
    // The final pair is the room's last spike. Moving this flier back leaves
    // more than 400px clear before the door, so the boss is entered after the
    // fight rather than while its last shots are still on screen.
    { type: 'flying', x: 3120, y: GAME_HEIGHT - 280 },
  ],
  terrain: [
    { type: 'platform', x: 540, y: LEDGE_Y, width: 280, height: 22 },
    { type: 'platform', x: 1050, y: LEDGE_Y, width: 260, height: 22 },
    { type: 'platform', x: 1540, y: LEDGE_Y, width: 260, height: 22 },
    { type: 'platform', x: 2030, y: LEDGE_Y, width: 260, height: 22 },
    { type: 'platform', x: 2520, y: LEDGE_Y, width: 260, height: 22 },
    { type: 'platform', x: 3010, y: LEDGE_Y, width: 300, height: 22 },
    // Two high perches, both sitting on a span so the climb costs no gap. They
    // change firing angles and movement choices; they are not bullet shields.
    { type: 'platform', x: 1120, y: HIGH_LEDGE_Y, width: 200, height: 22 },
    { type: 'platform', x: 2600, y: HIGH_LEDGE_Y, width: 200, height: 22 },
    // Barriers on the landing side of a pit. The two pits beside them are 50px
    // shorter to make the room: a barrier under a span would put the player's
    // head into its underside on the way over, and one inside a pit is not a
    // barrier at all.
    { type: 'wall', x: 1000, y: GAME_HEIGHT - 140, width: 44, height: 76 },
    { type: 'wall', x: 2470, y: GAME_HEIGHT - 140, width: 44, height: 76 },
  ],
  pits: [
    { x: 840, width: 150 },
    { x: 1330, width: 200 },
    { x: 1820, width: 200 },
    { x: 2310, width: 150 },
    { x: 2800, width: 200 },
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
