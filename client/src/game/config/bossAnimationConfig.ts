/**
 * Real sprite atlas for the stage-1 boss (city warden).
 *
 * These names intentionally mirror the supplied Aseprite JSON `frameTags`.
 * The atlas is the source of truth for pose names and frame ranges.
 */
const frameName = (index: number) => `stage-1-boss ${index}.aseprite`;

export const STAGE_ONE_BOSS_ATLAS_KEY = 'stage-1-boss';
export const STAGE_ONE_BOSS_ATLAS_PNG = '/assets/bosses/stage-1-boss.png';
export const STAGE_ONE_BOSS_ATLAS_JSON = '/assets/bosses/stage-1-boss.json';

export const STAGE_ONE_BOSS_LASER_ASSETS = {
  back: {
    key: 'stage-1-boss-laser-back',
    url: '/assets/bosses/stage-1-laser/stage-1-boss-laser-back.png',
    /** X coordinate of the bright emitter centre in the trimmed 123px image. */
    muzzleAnchorX: 47,
  },
  middle: {
    key: 'stage-1-boss-laser-middle',
    url: '/assets/bosses/stage-1-laser/stage-1-boss-laser-middle.png',
  },
  front: {
    key: 'stage-1-boss-laser-front',
    url: '/assets/bosses/stage-1-laser/stage-1-boss-laser-front.png',
  },
} as const;

export const STAGE_ONE_BOSS_TAGS = {
  idle: 'idle',
  walk: 'walk',
  charge: 'charge',
  fire: 'fire',
  recoil: 'recoil',
  death: 'death',
} as const;

export const STAGE_ONE_BOSS_ANIMATIONS = {
  idle: 'stage-1-boss-idle',
  walk: 'stage-1-boss-walk',
  charge: 'stage-1-boss-charge',
  fire: 'stage-1-boss-fire',
  recoil: 'stage-1-boss-recoil',
  death: 'stage-1-boss-death',
} as const;

type StageOneBossTag = keyof typeof STAGE_ONE_BOSS_TAGS;

/** Frame ranges and frame times copied from the supplied atlas JSON. */
export const STAGE_ONE_BOSS_TAG_FRAMES: Record<
  StageOneBossTag,
  readonly { frame: string; duration: number }[]
> = {
  idle: [0, 1, 2, 3].map((index) => ({
    frame: frameName(index),
    duration: [180, 240, 180, 240][index],
  })),
  walk: [4, 5].map((index) => ({ frame: frameName(index), duration: 350 })),
  charge: [7, 8, 9].map((index) => ({ frame: frameName(index), duration: 120 })),
  fire: [
    { frame: frameName(10), duration: 90 },
    { frame: frameName(11), duration: 60 },
  ],
  recoil: [
    { frame: frameName(12), duration: 100 },
    { frame: frameName(13), duration: 180 },
  ],
  death: [
    { frame: frameName(14), duration: 100 },
    { frame: frameName(15), duration: 180 },
  ],
};

export const STAGE_ONE_BOSS_LOOPING_TAGS = new Set<StageOneBossTag>([
  'idle',
  'walk',
  'fire',
]);
