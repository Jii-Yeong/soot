const frameName = (index: number) =>
  `shoot-posture-refined ${index}.aseprite`;

export const PLAYER_ATLAS_KEY = 'player';

export const PLAYER_ANIMATIONS = {
  idle: 'player-idle',
  run: 'player-run',
} as const;

export const PLAYER_IDLE_FRAMES = [0, 1, 2, 3].map(frameName);
export const PLAYER_RUN_FRAMES = [7, 8, 9, 10, 11, 12].map(frameName);

export const PLAYER_JUMP_FRAMES = {
  airborne: frameName(6),
  apex: frameName(5),
  landing: frameName(4),
} as const;

export const PLAYER_INITIAL_FRAME = PLAYER_IDLE_FRAMES[0];
