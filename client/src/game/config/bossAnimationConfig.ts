/**
 * Real sprite atlas for the stage-1 boss (city warden). Frames 0-3 are an idle
 * loop; frame 4 is the braced battle pose whose cannon fires the laser.
 */
const frameName = (index: number) => `stage-1-boss ${index}.aseprite`;

export const STAGE_ONE_BOSS_ATLAS_KEY = 'stage-1-boss';
export const STAGE_ONE_BOSS_ATLAS_PNG = '/assets/bosses/stage-1-boss.png';
export const STAGE_ONE_BOSS_ATLAS_JSON = '/assets/bosses/stage-1-boss.json';

export const STAGE_ONE_BOSS_ANIMATIONS = {
  idle: 'stage-1-boss-idle',
} as const;

export const STAGE_ONE_BOSS_IDLE_FRAMES = [0, 1, 2, 3].map(frameName);
export const STAGE_ONE_BOSS_BATTLE_FRAME = frameName(4);
export const STAGE_ONE_BOSS_INITIAL_FRAME = STAGE_ONE_BOSS_IDLE_FRAMES[0];
