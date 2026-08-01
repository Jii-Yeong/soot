import { AerialMovementMode } from '@/game/config/aerialMovementConfig';
import { GAME_HEIGHT } from '@/game/config/gameDimensions';
import {
  defineBossRoom,
  defineRoom,
  type StageRooms,
} from '@/game/config/roomConfig';

const AERIAL_ROOM_DOOR = {
  y: GAME_HEIGHT / 2,
  height: GAME_HEIGHT,
};

// The return is the only stage the player flies, so its level design is
// vertical placement and rhythm rather than geometry — there is no terrain
// here, and there should not be: the player cannot jump out of anywhere they
// get wedged.
//
// Two things were wrong with the first pass.
//
// The flight band is y 128~600, and every enemy sat between 250 and 480 — under
// half of it. The top and bottom hundred pixels were dead, so hugging either
// edge took the player out of the whole pattern. Placement now spans 180~560,
// about three quarters of the band, and each enemy's own movement range is kept
// inside the player's limits so nothing drifts out of reach.
//
// And the spacing was metronomic: even x gaps, alternating high and low, all
// the way through both rooms. There was no burst and no breather. Each room now
// reads as introduce → develop → rest → spike, with the last room closing on a
// tight trio at the boss door.

export const RETURN_ROOM_ONE = defineRoom({
  id: 'return-01',
  label: 'ROOM 01',
  intensity: 1.6,
  door: AERIAL_ROOM_DOOR,
  enemySpawns: [
    {
      type: 'flying',
      x: 460,
      y: 400,
      movement: { mode: AerialMovementMode.HOVER },
    },
    {
      type: 'flying',
      x: 900,
      y: 200,
      movement: { mode: AerialMovementMode.TRACK },
    },
    {
      type: 'flying',
      x: 1350,
      y: 520,
      movement: {
        mode: AerialMovementMode.PATROL,
        rangeX: 170,
        rangeY: 55,
      },
    },
    {
      type: 'flying',
      x: 1700,
      y: 230,
      movement: {
        mode: AerialMovementMode.ORBIT,
        rangeX: 130,
        rangeY: 85,
      },
    },
    {
      type: 'flying',
      x: 2250,
      y: 560,
      movement: { mode: AerialMovementMode.TRACK },
    },
    {
      type: 'flying',
      x: 2480,
      y: 200,
      movement: {
        mode: AerialMovementMode.PATROL,
        rangeX: 190,
        rangeY: 60,
      },
    },
    {
      type: 'flying',
      x: 2700,
      y: 430,
      movement: { mode: AerialMovementMode.HOVER },
    },
    {
      type: 'flying',
      x: 3300,
      y: 330,
      movement: {
        mode: AerialMovementMode.ORBIT,
        rangeX: 145,
        rangeY: 90,
      },
    },
  ],
});

export const RETURN_ROOM_TWO = defineRoom({
  id: 'return-02',
  label: 'ROOM 02',
  intensity: 1.7,
  door: AERIAL_ROOM_DOOR,
  enemySpawns: [
    {
      type: 'flying',
      x: 420,
      y: 230,
      movement: {
        mode: AerialMovementMode.ORBIT,
        rangeX: 120,
        rangeY: 80,
      },
    },
    {
      type: 'flying',
      x: 700,
      y: 540,
      movement: { mode: AerialMovementMode.TRACK },
    },
    {
      type: 'flying',
      x: 1100,
      y: 200,
      movement: {
        mode: AerialMovementMode.PATROL,
        rangeX: 180,
        rangeY: 65,
      },
    },
    {
      type: 'flying',
      x: 1600,
      y: 520,
      movement: { mode: AerialMovementMode.HOVER },
    },
    {
      type: 'flying',
      x: 1900,
      y: 180,
      movement: { mode: AerialMovementMode.TRACK },
    },
    {
      type: 'flying',
      x: 2150,
      y: 380,
      movement: {
        mode: AerialMovementMode.ORBIT,
        rangeX: 150,
        rangeY: 95,
      },
    },
    {
      type: 'flying',
      x: 2900,
      y: 250,
      movement: {
        mode: AerialMovementMode.PATROL,
        rangeX: 200,
        rangeY: 55,
      },
    },
    {
      type: 'flying',
      x: 3120,
      y: 470,
      movement: { mode: AerialMovementMode.TRACK },
    },
    {
      type: 'flying',
      x: 3350,
      y: 330,
      movement: { mode: AerialMovementMode.HOVER },
    },
  ],
});

export const RETURN_BOSS_ROOM = defineBossRoom({
  id: 'return-boss',
  label: 'THE RETURNING ARCHITECT',
  variant: 'returning-architect',
  intensity: 1.7,
  bossY: GAME_HEIGHT / 2,
  door: AERIAL_ROOM_DOOR,
});

export const RETURN_ROOMS = [
  RETURN_ROOM_ONE,
  RETURN_ROOM_TWO,
  RETURN_BOSS_ROOM,
] as const satisfies StageRooms;
