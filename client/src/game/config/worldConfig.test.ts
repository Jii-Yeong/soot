import { describe, expect, it } from 'vitest';
import {
  ROOM_WORLD_WIDTH,
  getParallaxLayerWidth,
  getParallaxScrollFactor,
} from '@/game/config/worldConfig';

describe('getParallaxScrollFactor', () => {
  it('keeps a viewport-wide layer fixed to the screen', () => {
    expect(getParallaxScrollFactor(1280)).toBe(0);
  });

  it('moves a room-wide layer at normal world speed', () => {
    expect(getParallaxScrollFactor(ROOM_WORLD_WIDTH)).toBe(1);
  });

  it('maps the layer and camera travel proportionally', () => {
    expect(getParallaxScrollFactor(1792, 2560, 1280)).toBe(0.4);
  });

  it('clamps layers wider than the room and handles a fixed camera', () => {
    expect(getParallaxScrollFactor(4000)).toBe(1);
    expect(getParallaxScrollFactor(1280, 1280, 1280)).toBe(0);
  });
});

describe('getParallaxLayerWidth', () => {
  it('returns the viewport and room widths at the factor boundaries', () => {
    expect(getParallaxLayerWidth(0)).toBe(1280);
    expect(getParallaxLayerWidth(1)).toBe(ROOM_WORLD_WIDTH);
  });

  it('creates a layer whose travel matches the requested factor', () => {
    const layerWidth = getParallaxLayerWidth(0.25);

    expect(layerWidth).toBe(1600);
    expect(getParallaxScrollFactor(layerWidth)).toBe(0.25);
  });

  it('clamps factors outside the supported range', () => {
    expect(getParallaxLayerWidth(-1)).toBe(1280);
    expect(getParallaxLayerWidth(2)).toBe(ROOM_WORLD_WIDTH);
  });
});
