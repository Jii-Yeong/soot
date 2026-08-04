import { GAME_HEIGHT } from '@/game/config/gameDimensions';
import {
  defineBossRoom,
  defineRoom,
  type StageRooms,
} from '@/game/config/roomConfig';

export const UNDERGROUND_ROOM_ONE = defineRoom({
  id: 'underground-01',
  label: 'ROOM 01',
  intensity: 1.25,
  enemySpawns: [
    { type: 'ceiling-maintainer', pipeId: 'u1-west', x: 720 },
    { type: 'captor', x: 980, y: GAME_HEIGHT - 120 },
    { type: 'blocker', x: 1450, y: GAME_HEIGHT - 130 },
    { type: 'ceiling-maintainer', pipeId: 'u1-east', x: 2150 },
    { type: 'captor', x: 2460, y: GAME_HEIGHT - 120 },
    { type: 'blocker', x: 3120, y: GAME_HEIGHT - 130 },
  ],
  ceilingPipes: [
    { id: 'u1-west', x: 280, y: 76, width: 1160 },
    { id: 'u1-east', x: 1760, y: 92, width: 1120 },
  ],
  terrain: [
    { type: 'wall', x: 1260, y: GAME_HEIGHT - 174, width: 54, height: 110 },
    { type: 'platform', x: 1570, y: GAME_HEIGHT - 210, width: 260, height: 24 },
    { type: 'wall', x: 2740, y: GAME_HEIGHT - 154, width: 48, height: 90 },
    { type: 'platform', x: 2980, y: GAME_HEIGHT - 230, width: 280, height: 24 },
  ],
});

export const UNDERGROUND_ROOM_TWO = defineRoom({
  id: 'underground-02',
  label: 'ROOM 02',
  intensity: 1.35,
  enemySpawns: [
    { type: 'ceiling-maintainer', pipeId: 'u2-west', x: 560 },
    { type: 'captor', x: 780, y: GAME_HEIGHT - 120 },
    { type: 'blocker', x: 1200, y: GAME_HEIGHT - 130 },
    { type: 'captor', x: 1760, y: GAME_HEIGHT - 120 },
    { type: 'ceiling-maintainer', pipeId: 'u2-mid', x: 2100 },
    { type: 'blocker', x: 2520, y: GAME_HEIGHT - 130 },
    { type: 'ceiling-maintainer', pipeId: 'u2-east', x: 3160 },
  ],
  ceilingPipes: [
    { id: 'u2-west', x: 220, y: 92, width: 980 },
    { id: 'u2-mid', x: 1500, y: 70, width: 1040 },
    { id: 'u2-east', x: 2800, y: 100, width: 620 },
  ],
  terrain: [
    { type: 'platform', x: 520, y: GAME_HEIGHT - 220, width: 250, height: 24 },
    { type: 'wall', x: 1380, y: GAME_HEIGHT - 184, width: 58, height: 120 },
    { type: 'platform', x: 1840, y: GAME_HEIGHT - 250, width: 300, height: 24 },
    { type: 'wall', x: 2650, y: GAME_HEIGHT - 164, width: 52, height: 100 },
    { type: 'platform', x: 3000, y: GAME_HEIGHT - 210, width: 250, height: 24 },
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
