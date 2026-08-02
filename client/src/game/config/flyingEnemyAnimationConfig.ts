/**
 * Real sprite atlas for the stage-1 flying enemy.
 *
 * Frame names mirror the supplied Aseprite JSON (bare indices "0".."5") and the
 * tag ranges/durations are copied from its `frameTags`. Flying enemies in later
 * stages keep the generated placeholder until they get their own art, so this is
 * attached per-stage via `StageConfig.flyingSprite`.
 */
const frameName = (index: number) => `${index}`;

export const STAGE_ONE_FLYING_ATLAS_KEY = 'stage-1-flying';
export const STAGE_ONE_FLYING_ATLAS_PNG = '/assets/enemies/stage-1-flying.png';
export const STAGE_ONE_FLYING_ATLAS_JSON = '/assets/enemies/stage-1-flying.json';

export const STAGE_ONE_FLYING_ANIMATIONS = {
  idle: 'stage-1-flying-idle',
  hit: 'stage-1-flying-hit',
  /** First death frame, held while the wreck plummets to the floor. */
  deathFall: 'stage-1-flying-death-fall',
  /** Crumple frames that play once the wreck hits the ground. */
  deathLand: 'stage-1-flying-death-land',
} as const;

type StageOneFlyingTag = keyof typeof STAGE_ONE_FLYING_ANIMATIONS;

/**
 * Frame ranges and frame times from the supplied atlas JSON. The atlas `death`
 * tag (frames 3-5) is split into a fall pose (3) and a ground crumple (4-5) so
 * a downed flyer drops before it breaks apart.
 */
export const STAGE_ONE_FLYING_TAG_FRAMES: Record<
  StageOneFlyingTag,
  readonly { frame: string; duration: number }[]
> = {
  idle: [0, 1].map((index) => ({ frame: frameName(index), duration: 180 })),
  hit: [{ frame: frameName(2), duration: 100 }],
  deathFall: [{ frame: frameName(3), duration: 500 }],
  deathLand: [
    { frame: frameName(4), duration: 180 },
    { frame: frameName(5), duration: 100 },
  ],
};

export const STAGE_ONE_FLYING_LOOPING_TAGS = new Set<StageOneFlyingTag>([
  'idle',
]);

/**
 * A flying enemy's real-atlas rendering: the padded atlas frame is bigger than
 * the character, so the physics body is sized down to the drone itself.
 */
export type FlyingSpriteConfig = {
  texture: string;
  animations: typeof STAGE_ONE_FLYING_ANIMATIONS;
  scale: number;
  bodyWidth: number;
  bodyHeight: number;
};

export const STAGE_ONE_FLYING_SPRITE: FlyingSpriteConfig = {
  texture: STAGE_ONE_FLYING_ATLAS_KEY,
  animations: STAGE_ONE_FLYING_ANIMATIONS,
  scale: 1,
  bodyWidth: 50,
  bodyHeight: 42,
};
