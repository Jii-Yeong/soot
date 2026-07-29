import { GAME_WIDTH } from '@/game/config/gameDimensions';

export const VIEWPORT_LENGTH_UNITS = 70;
export const ROOM_LENGTH_UNITS = 200;
export const BOSS_ROOM_LENGTH_UNITS = 100;
/** Each stage is this many full combat rooms followed by one shorter boss room. */
export const COMBAT_ROOMS_PER_STAGE = 2;
export const ROOMS_PER_STAGE = COMBAT_ROOMS_PER_STAGE + 1;
export const STAGE_LENGTH_UNITS =
  ROOM_LENGTH_UNITS * COMBAT_ROOMS_PER_STAGE + BOSS_ROOM_LENGTH_UNITS;

const toWorldWidth = (units: number) =>
  Math.round(GAME_WIDTH * (units / VIEWPORT_LENGTH_UNITS));

/**
 * A 200-unit combat room is ~2.86 screens wide (70 units = the 1280px viewport).
 * A stage is two combat rooms plus a shorter 100-unit boss room, so the boss
 * comes into view soon after entering it.
 */
export const ROOM_WORLD_WIDTH = toWorldWidth(ROOM_LENGTH_UNITS);
export const BOSS_ROOM_WORLD_WIDTH = toWorldWidth(BOSS_ROOM_LENGTH_UNITS);
export const STAGE_WORLD_WIDTH =
  ROOM_WORLD_WIDTH * COMBAT_ROOMS_PER_STAGE + BOSS_ROOM_WORLD_WIDTH;
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
