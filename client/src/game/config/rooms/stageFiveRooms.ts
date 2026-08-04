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

// The return is the only flight stage. Its basic layout is therefore made of
// enemy formations and open space, not platforms: flight has no jump-out
// fallback, so even a harmless-looking wall can turn a tracking enemy into a
// corner trap. There is intentionally no terrain, pit, or projectile cover in
// either combat room. The full-height doors are the only hard boundaries.
//
// The usable flight band is y=128~600. Every anchor and patrol swing remains
// inside it, while each room uses more than two thirds of its height. Staying
// at the top or bottom is a temporary dodge, not a permanent safe lane.
//
// The stage rhythm is deliberately roomy: room 01 gives the player time to
// settle into flight (single -> single -> pair -> pair); room 02 turns those
// motions into short mixed formations and peaks at one three-enemy formation.
// Its last ~1,000px are empty once the formation is cleared, so the boss is
// entered after a reset rather than straight out of a chase.

export const RETURN_ROOM_ONE = defineRoom({
  id: 'return-01',
  label: 'ROOM 01',
  intensity: 1.6,
  portal: AERIAL_ROOM_PORTAL,
  enemySpawns: [
    // First contact comes after enough open air to establish the flight
    // controls. No enemy can fire from the room entrance.
    {
      type: 'flying',
      x: 1050,
      y: 360,
      movement: { mode: AerialMovementMode.HOVER },
    },
    // A high patrol makes the player use the vertical band without mixing it
    // with the opening hover.
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
    // First formation: a tracker below an orbiting target. Their offset leaves
    // a clear diagonal route through the middle; neither is a piece of cover.
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
    // Final room-01 pair after a long open reset. It is a low/high crossfire,
    // not a wall of bodies across the same altitude.
    {
      type: 'flying',
      x: 3000,
      y: 520,
      movement: { mode: AerialMovementMode.HOVER },
    },
    {
      type: 'flying',
      x: 3260,
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
  intensity: 1.7,
  portal: AERIAL_ROOM_PORTAL,
  enemySpawns: [
    // Room 02 also gives a short entry lane, then starts from the familiar
    // two-height formation before tightening into the final group.
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
      x: 1950,
      y: 170,
      movement: {
        mode: AerialMovementMode.PATROL,
        rangeX: 160,
        rangeY: 35,
      },
    },
    {
      type: 'flying',
      x: 2250,
      y: 480,
      movement: { mode: AerialMovementMode.HOVER },
    },
    // The stage's peak: high orbit, centre tracker, and low patrol. The three
    // anchors are vertically staggered so the player can read a route between
    // them rather than being forced to brute-force a single horizontal lane.
    {
      type: 'flying',
      x: 2600,
      y: 250,
      movement: {
        mode: AerialMovementMode.ORBIT,
        rangeX: 135,
        rangeY: 85,
      },
    },
    {
      type: 'flying',
      x: 2850,
      y: 380,
      movement: { mode: AerialMovementMode.TRACK },
    },
    {
      type: 'flying',
      x: 3100,
      y: 500,
      movement: {
        mode: AerialMovementMode.PATROL,
        rangeX: 150,
        rangeY: 70,
      },
    },
    // No spawns after x=3100. The cleared formation leaves nearly 500px to
    // the full-height boss door: enough room to reset position and read the
    // arena transition before the Architect starts its bullet patterns.
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
