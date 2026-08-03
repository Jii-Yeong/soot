/**
 * Real sprite atlas for the stage-1 melee enemy.
 *
 * Frame names mirror the supplied Aseprite JSON (bare indices "0".."7") and the
 * tag ranges/durations are copied from its `frameTags`. Melee enemies in later
 * stages keep the generated placeholder + rod rectangle until they get their own
 * art, so this is attached per-stage via `StageConfig.meleeSprite`.
 */
const frameName = (index: number) => `${index}`;

export const STAGE_ONE_MELEE_ATLAS_KEY = 'stage-1-neared';
export const STAGE_ONE_MELEE_ATLAS_PNG = '/assets/enemies/stage-1-neared.png';
export const STAGE_ONE_MELEE_ATLAS_JSON = '/assets/enemies/stage-1-neared.json';

export const STAGE_ONE_MELEE_ANIMATIONS = {
  idle: 'stage-1-neared-idle',
  walk: 'stage-1-neared-walk',
  attack: 'stage-1-neared-attack',
  death: 'stage-1-neared-death',
} as const;

type StageOneMeleeTag = keyof typeof STAGE_ONE_MELEE_ANIMATIONS;

/** Frame ranges and frame times copied from the supplied atlas JSON. */
export const STAGE_ONE_MELEE_TAG_FRAMES: Record<
  StageOneMeleeTag,
  readonly { frame: string; duration: number }[]
> = {
  idle: [0, 1].map((index) => ({ frame: frameName(index), duration: 130 })),
  walk: [2, 3].map((index) => ({ frame: frameName(index), duration: 130 })),
  attack: [
    { frame: frameName(4), duration: 200 },
    { frame: frameName(5), duration: 100 },
  ],
  death: [
    { frame: frameName(6), duration: 200 },
    { frame: frameName(7), duration: 100 },
  ],
};

export const STAGE_ONE_MELEE_LOOPING_TAGS = new Set<StageOneMeleeTag>([
  'idle',
  'walk',
]);

/**
 * A melee enemy's real-atlas rendering: the padded atlas frame is bigger than
 * the character, so the physics body is sized down to the fighter. When present,
 * the swing is shown via the atlas `attack` animation plus a slash VFX rather
 * than the placeholder rod rectangle.
 */
export type MeleeSpriteConfig = {
  texture: string;
  animations: typeof STAGE_ONE_MELEE_ANIMATIONS;
  scale: number;
  bodyWidth: number;
  bodyHeight: number;
  /** Body offset from the frame's top-left, bottom-aligned to the fighter's feet. */
  bodyOffsetX: number;
  bodyOffsetY: number;
};

// Atlas is trimmed: sourceSize 160x160, content placed at spriteSourceSize (25,28).
// Offsets are in source coords (Phaser body offset is untrimmed-relative): feet
// sit at source y ~146, centre at source x ~89, so the body bottom-aligns to the feet.
export const STAGE_ONE_MELEE_SPRITE: MeleeSpriteConfig = {
  texture: STAGE_ONE_MELEE_ATLAS_KEY,
  animations: STAGE_ONE_MELEE_ANIMATIONS,
  scale: 1,
  bodyWidth: 46,
  bodyHeight: 96,
  bodyOffsetX: 66,
  bodyOffsetY: 50,
};
