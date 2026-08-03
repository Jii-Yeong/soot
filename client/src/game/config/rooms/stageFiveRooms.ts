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

export const RETURN_ROOM_ONE = defineRoom({
  id: 'return-01',
  label: 'ROOM 01',
  intensity: 1.6,
  portal: AERIAL_ROOM_PORTAL,
  enemySpawns: [
    {
      type: 'flying',
      x: 460,
      y: GAME_HEIGHT - 300,
      movement: { mode: AerialMovementMode.HOVER },
    },
    {
      type: 'flying',
      x: 820,
      y: GAME_HEIGHT - 470,
      movement: { mode: AerialMovementMode.TRACK },
    },
    {
      type: 'flying',
      x: 1180,
      y: GAME_HEIGHT - 240,
      movement: {
        mode: AerialMovementMode.PATROL,
        rangeX: 170,
        rangeY: 55,
      },
    },
    {
      type: 'flying',
      x: 1620,
      y: GAME_HEIGHT - 410,
      movement: {
        mode: AerialMovementMode.ORBIT,
        rangeX: 130,
        rangeY: 85,
      },
    },
    {
      type: 'flying',
      x: 2080,
      y: GAME_HEIGHT - 270,
      movement: { mode: AerialMovementMode.TRACK },
    },
    {
      type: 'flying',
      x: 2520,
      y: GAME_HEIGHT - 460,
      movement: {
        mode: AerialMovementMode.PATROL,
        rangeX: 190,
        rangeY: 60,
      },
    },
    {
      type: 'flying',
      x: 2940,
      y: GAME_HEIGHT - 250,
      movement: { mode: AerialMovementMode.HOVER },
    },
    {
      type: 'flying',
      x: 3340,
      y: GAME_HEIGHT - 410,
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
  portal: AERIAL_ROOM_PORTAL,
  enemySpawns: [
    {
      type: 'flying',
      x: 420,
      y: GAME_HEIGHT - 430,
      movement: {
        mode: AerialMovementMode.ORBIT,
        rangeX: 120,
        rangeY: 80,
      },
    },
    {
      type: 'flying',
      x: 780,
      y: GAME_HEIGHT - 250,
      movement: { mode: AerialMovementMode.TRACK },
    },
    {
      type: 'flying',
      x: 1160,
      y: GAME_HEIGHT - 460,
      movement: {
        mode: AerialMovementMode.PATROL,
        rangeX: 180,
        rangeY: 65,
      },
    },
    {
      type: 'flying',
      x: 1540,
      y: GAME_HEIGHT - 280,
      movement: { mode: AerialMovementMode.HOVER },
    },
    {
      type: 'flying',
      x: 1940,
      y: GAME_HEIGHT - 450,
      movement: { mode: AerialMovementMode.TRACK },
    },
    {
      type: 'flying',
      x: 2340,
      y: GAME_HEIGHT - 240,
      movement: {
        mode: AerialMovementMode.ORBIT,
        rangeX: 150,
        rangeY: 95,
      },
    },
    {
      type: 'flying',
      x: 2740,
      y: GAME_HEIGHT - 420,
      movement: {
        mode: AerialMovementMode.PATROL,
        rangeX: 200,
        rangeY: 55,
      },
    },
    {
      type: 'flying',
      x: 3120,
      y: GAME_HEIGHT - 260,
      movement: { mode: AerialMovementMode.TRACK },
    },
    {
      type: 'flying',
      x: 3420,
      y: GAME_HEIGHT - 440,
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
  portal: AERIAL_ROOM_PORTAL,
});

export const RETURN_ROOMS = [
  RETURN_ROOM_ONE,
  RETURN_ROOM_TWO,
  RETURN_BOSS_ROOM,
] as const satisfies StageRooms;
