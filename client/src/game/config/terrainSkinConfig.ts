/**
 * Horizontal 3-slice skins for level geometry: a left cap, a tiled middle,
 * and a right cap sized to any span. Floors and platform "stools" can each
 * supply their own stage-specific skin. Physics stays on the existing bodies;
 * these are purely the visual overlay.
 */
export type SliceImage = {
  key: string;
  path: string;
  width: number;
};

export type SliceSkinConfig = {
  left: SliceImage;
  middle: SliceImage;
  right: SliceImage;
  /** Full image height, in px. */
  height: number;
  /** Transparent padding above the drawn surface, so it lands on the platform top. */
  surfaceInset: number;
  /**
   * How the middle fills the span. 'stretch' scales one copy across the whole
   * span (no repeat seams — good for short platforms). 'tile' repeats it at
   * native size (sharp over long ground). Defaults to 'stretch'.
   */
  middleFit?: 'tile' | 'stretch';
  /**
   * Columns to crop off each side of the middle before tiling, so the repeat
   * butts together without a see-through gap or a baked-in edge line. Tiling only.
   */
  middleTrim?: { left: number; right: number };
  /**
   * When set, the middle is drawn ON TOP of the caps, inset by this many px from
   * each outer end — so the caps' finished ends still show but their inner joints
   * are hidden under the continuous middle (no seam). Omit to place the caps on
   * top of a full-width middle instead.
   */
  capInset?: { left: number; right: number };
};

const asset = (name: string, width: number): SliceImage => ({
  key: name,
  path: `/assets/terrain/${name}.png`,
  width,
});

export const STAGE_ONE_FLOOR_SKIN: SliceSkinConfig = {
  left: asset('stage-1-floor-left', 309),
  middle: asset('stage-1-floor-middle', 296),
  right: asset('stage-1-floor-right', 230),
  height: 100,
  surfaceInset: 4,
  // Wide ground: tile at native size (stretch would smear across the stage).
  // Only x[8,272] of the middle is horizontally uniform; the side edges carry
  // decorative borders that would repeat as seams, so crop to the flat interior.
  middleFit: 'tile',
  middleTrim: { left: 8, right: 23 },
  // Draw the middle over the caps' inner joints (the left cap has a dark inner
  // edge at ~x304); show just the caps' finished outer ends.
  capInset: { left: 36, right: 34 },
};

export const STAGE_ONE_STOOL_SKIN: SliceSkinConfig = {
  left: asset('stage-1-stool-left', 55),
  middle: asset('stage-1-stool-middle', 68),
  right: asset('stage-1-stool-right', 55),
  height: 35,
  surfaceInset: 3,
};

export const STAGE_TWO_STOOL_SKIN: SliceSkinConfig = {
  left: asset('stage-2-stool-left', 38),
  middle: asset('stage-2-stool-middle', 100),
  right: asset('stage-2-stool-right', 38),
  height: 35,
  surfaceInset: 3,
};

export const ALL_TERRAIN_SKINS = [
  STAGE_ONE_FLOOR_SKIN,
  STAGE_ONE_STOOL_SKIN,
  STAGE_TWO_STOOL_SKIN,
] as const;
