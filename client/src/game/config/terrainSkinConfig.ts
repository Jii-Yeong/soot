/**
 * Horizontal 3-slice skins for stage-1 level geometry: a left cap, a tiled
 * middle, and a right cap sized to any span. The floor (1층) and the platform
 * "stools" (2·3층 발판) each get one. Physics stays on the existing bodies; these
 * are purely the visual overlay.
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
};

export const STAGE_ONE_STOOL_SKIN: SliceSkinConfig = {
  left: asset('stage-1-stool-left', 55),
  middle: asset('stage-1-stool-middle', 68),
  right: asset('stage-1-stool-right', 55),
  height: 35,
  surfaceInset: 3,
};

export const ALL_TERRAIN_SKINS = [
  STAGE_ONE_FLOOR_SKIN,
  STAGE_ONE_STOOL_SKIN,
] as const;
