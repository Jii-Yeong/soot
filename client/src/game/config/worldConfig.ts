import { GAME_WIDTH } from '@/game/config/gameDimensions';

export const VIEWPORT_LENGTH_UNITS = 70;
export const ROOM_LENGTH_UNITS = 100;
export const STAGE_LENGTH_UNITS = 300;
export const ROOMS_PER_STAGE = STAGE_LENGTH_UNITS / ROOM_LENGTH_UNITS;

/**
 * A 100-unit room is roughly 1.43 screens wide when the 1280px viewport
 * represents 70 units. Three adjacent rooms form one continuous stage.
 */
export const ROOM_WORLD_WIDTH = Math.round(
  GAME_WIDTH * (ROOM_LENGTH_UNITS / VIEWPORT_LENGTH_UNITS),
);
export const STAGE_WORLD_WIDTH = ROOM_WORLD_WIDTH * ROOMS_PER_STAGE;
export const ROOM_CAMERA_FOLLOW_LERP_X = 0.12;

/**
 * Maps the camera's available travel to a backdrop layer's available travel.
 *
 * A viewport-wide layer returns 0 (screen-fixed), while a world-wide layer
 * returns 1 (normal world scrolling). Intermediate widths produce parallax.
 */
export function getParallaxScrollFactor(
  layerWidth: number,
  worldWidth = STAGE_WORLD_WIDTH,
  viewportWidth = GAME_WIDTH,
) {
  const cameraTravel = Math.max(0, worldWidth - viewportWidth);

  if (cameraTravel === 0) {
    return 0;
  }

  const layerTravel = Math.max(0, layerWidth - viewportWidth);
  return clamp(layerTravel / cameraTravel, 0, 1);
}

/** Returns the minimum layer width needed to cover the camera at a factor. */
export function getParallaxLayerWidth(
  scrollFactor: number,
  worldWidth = STAGE_WORLD_WIDTH,
  viewportWidth = GAME_WIDTH,
) {
  const cameraTravel = Math.max(0, worldWidth - viewportWidth);
  return viewportWidth + cameraTravel * clamp(scrollFactor, 0, 1);
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}
