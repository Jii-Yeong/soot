const frameName = (index: number) =>
  `shoot-posture-hand ${index}.aseprite`;

export const PLAYER_ATLAS_KEY = 'player';

export const PLAYER_ANIMATIONS = {
  idle: 'player-idle',
  run: 'player-run',
  flyIdle: 'player_fly_idle',
  flyMove: 'player_fly_move',
  flyDash: 'player_fly_dash',
} as const;

export type PlayerAnimationSet = {
  [K in keyof typeof PLAYER_ANIMATIONS]: string;
};

export type PlayerSpriteConfig = {
  texture: string;
  png: string;
  json: string;
  animations: PlayerAnimationSet;
  flyFrames?: readonly string[];
};

export const PLAYER_SPRITE_CONFIG: PlayerSpriteConfig = {
  texture: PLAYER_ATLAS_KEY,
  png: '/assets/player/player.png',
  json: '/assets/player/player.json',
  animations: PLAYER_ANIMATIONS,
};

export const STAGE_FOUR_PLAYER_SPRITE: PlayerSpriteConfig = {
  texture: 'stage-4-player',
  png: '/assets/player/stage-4-player.png',
  json: '/assets/player/stage-4-player.json',
  animations: {
    ...PLAYER_ANIMATIONS,
    idle: 'stage-4-player-idle',
    run: 'stage-4-player-run',
  },
};

export const STAGE_FIVE_PLAYER_SPRITE: PlayerSpriteConfig = {
  texture: 'stage-5-player',
  png: '/assets/player/stage-5-player.png',
  json: '/assets/player/stage-5-player.json',
  animations: {
    ...PLAYER_ANIMATIONS,
    idle: 'stage-5-player-idle',
    run: 'stage-5-player-run',
    flyIdle: 'stage-5-player-fly',
    flyMove: 'stage-5-player-fly',
    flyDash: 'stage-5-player-fly',
  },
  flyFrames: [13, 14].map(frameName),
};

export const PLAYER_IDLE_FRAMES = [0, 1, 2, 3].map(frameName);
export const PLAYER_RUN_FRAMES = [7, 8, 9, 10, 11, 12].map(frameName);

export const PLAYER_JUMP_FRAMES = {
  airborne: frameName(6),
  apex: frameName(5),
  landing: frameName(4),
} as const;

export const PLAYER_INITIAL_FRAME = PLAYER_IDLE_FRAMES[0];
