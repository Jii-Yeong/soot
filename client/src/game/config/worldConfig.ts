import { GAME_WIDTH } from '@/game/config/gameDimensions';

/** Each combat room spans two 1280px viewports horizontally. */
export const ROOM_WORLD_WIDTH = GAME_WIDTH * 2;
export const ROOM_CAMERA_FOLLOW_LERP_X = 0.12;

/**
 * Maps the camera's available travel to a backdrop layer's available travel.
 *
 * A viewport-wide layer returns 0 (screen-fixed), while a world-wide layer
 * returns 1 (normal world scrolling). Intermediate widths produce parallax.
 */
export function getParallaxScrollFactor(
  layerWidth: number,
  worldWidth = ROOM_WORLD_WIDTH,
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
  worldWidth = ROOM_WORLD_WIDTH,
  viewportWidth = GAME_WIDTH,
) {
  const cameraTravel = Math.max(0, worldWidth - viewportWidth);
  return viewportWidth + cameraTravel * clamp(scrollFactor, 0, 1);
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}
