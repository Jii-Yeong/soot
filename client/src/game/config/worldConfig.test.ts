import { describe, expect, it } from 'vitest';
import {
  ROOM_LENGTH_UNITS,
  ROOM_WORLD_WIDTH,
  ROOMS_PER_STAGE,
  STAGE_LENGTH_UNITS,
  STAGE_WORLD_WIDTH,
  VIEWPORT_LENGTH_UNITS,
  getParallaxLayerWidth,
  getParallaxScrollFactor,
} from '@/game/config/worldConfig';

describe('getParallaxScrollFactor', () => {
  it('keeps a viewport-wide layer fixed to the screen', () => {
    expect(getParallaxScrollFactor(1280)).toBe(0);
  });

  it('moves a stage-wide layer at normal world speed', () => {
    expect(getParallaxScrollFactor(STAGE_WORLD_WIDTH)).toBe(1);
  });

  it('maps the layer and camera travel proportionally', () => {
    expect(getParallaxScrollFactor(1792, 2560, 1280)).toBe(0.4);
  });

  it('clamps layers wider than the room and handles a fixed camera', () => {
    expect(getParallaxScrollFactor(STAGE_WORLD_WIDTH + 500)).toBe(1);
    expect(getParallaxScrollFactor(1280, 1280, 1280)).toBe(0);
  });
});

describe('getParallaxLayerWidth', () => {
  it('returns the viewport and stage widths at the factor boundaries', () => {
    expect(getParallaxLayerWidth(0)).toBe(1280);
    expect(getParallaxLayerWidth(1)).toBe(STAGE_WORLD_WIDTH);
  });

  it('creates a layer whose travel matches the requested factor', () => {
    const layerWidth = getParallaxLayerWidth(0.25);

    expect(layerWidth).toBe(2331.75);
    expect(getParallaxScrollFactor(layerWidth)).toBe(0.25);
  });

  it('clamps factors outside the supported range', () => {
    expect(getParallaxLayerWidth(-1)).toBe(1280);
    expect(getParallaxLayerWidth(2)).toBe(STAGE_WORLD_WIDTH);
  });
});

describe('continuous stage dimensions', () => {
  it('maps three 100-unit rooms into one 300-unit stage', () => {
    expect(VIEWPORT_LENGTH_UNITS).toBe(70);
    expect(ROOM_LENGTH_UNITS).toBe(100);
    expect(STAGE_LENGTH_UNITS).toBe(300);
    expect(ROOMS_PER_STAGE).toBe(3);
    expect(STAGE_WORLD_WIDTH).toBe(ROOM_WORLD_WIDTH * 3);
  });
});
