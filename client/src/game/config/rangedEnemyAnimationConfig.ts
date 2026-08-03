/**
 * Real sprite atlas for the stage-1 ranged enemy.
 *
 * Frame names mirror the supplied Aseprite JSON (bare indices "0".."7") and the
 * tag ranges/durations are copied from its `frameTags`. Ranged enemies in later
 * stages keep the generated placeholder until they get their own art, so this is
 * attached per-stage via `StageConfig.rangedSprite`.
 */
const frameName = (index: number) => `${index}`;

export const STAGE_ONE_RANGED_ATLAS_KEY = 'stage-1-ranged';
export const STAGE_ONE_RANGED_ATLAS_PNG = '/assets/enemies/stage-1-ranged.png';
export const STAGE_ONE_RANGED_ATLAS_JSON = '/assets/enemies/stage-1-ranged.json';

export const STAGE_ONE_RANGED_ANIMATIONS = {
  idle: 'stage-1-ranged-idle',
  walk: 'stage-1-ranged-walk',
  attack: 'stage-1-ranged-attack',
  death: 'stage-1-ranged-death',
} as const;

type StageOneRangedTag = keyof typeof STAGE_ONE_RANGED_ANIMATIONS;

/** Frame ranges and frame times copied from the supplied atlas JSON. */
export const STAGE_ONE_RANGED_TAG_FRAMES: Record<
  StageOneRangedTag,
  readonly { frame: string; duration: number }[]
> = {
  idle: [0, 1].map((index) => ({ frame: frameName(index), duration: 100 })),
  walk: [2, 3].map((index) => ({ frame: frameName(index), duration: 180 })),
  attack: [4, 5].map((index) => ({ frame: frameName(index), duration: 100 })),
  death: [
    { frame: frameName(6), duration: 200 },
    { frame: frameName(7), duration: 100 },
  ],
};

export const STAGE_ONE_RANGED_LOOPING_TAGS = new Set<StageOneRangedTag>([
  'idle',
  'walk',
]);

/**
 * A ranged enemy's real-atlas rendering: the padded atlas frame is bigger than
 * the character, so the physics body is sized down to the shooter.
 */
export type RangedSpriteConfig = {
  texture: string;
  animations: typeof STAGE_ONE_RANGED_ANIMATIONS;
  scale: number;
  bodyWidth: number;
  bodyHeight: number;
  /** Body offset from the frame's top-left, bottom-aligned to the shooter's feet. */
  bodyOffsetX: number;
  bodyOffsetY: number;
};

// Atlas is trimmed: sourceSize 120x120, content placed at spriteSourceSize (18,17).
// Offsets are in source coords (Phaser body offset is untrimmed-relative): feet
// sit at source y ~112, centre at source x ~66, so the body bottom-aligns to the feet.
export const STAGE_ONE_RANGED_SPRITE: RangedSpriteConfig = {
  texture: STAGE_ONE_RANGED_ATLAS_KEY,
  animations: STAGE_ONE_RANGED_ANIMATIONS,
  scale: 1,
  bodyWidth: 44,
  bodyHeight: 86,
  bodyOffsetX: 44,
  bodyOffsetY: 26,
};
