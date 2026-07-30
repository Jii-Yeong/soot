import type Phaser from 'phaser';
import { describe, expect, it, vi } from 'vitest';
import { STAGE_TWO_CONFIG } from '@/game/config/stageConfig';
import { StageBackgroundPreloader } from '@/game/systems/StageBackgroundPreloader';

type LoaderListener = (...args: unknown[]) => void;

function createScene({ loaded = false, loading = false } = {}) {
  const listeners = new Map<string, LoaderListener>();
  const load = {
    image: vi.fn(),
    isLoading: vi.fn(() => loading),
    off: vi.fn(),
    on: vi.fn((event: string, listener: LoaderListener) => {
      listeners.set(event, listener);
    }),
    once: vi.fn((event: string, listener: LoaderListener) => {
      listeners.set(event, listener);
    }),
    start: vi.fn(),
  };
  const scene = {
    load,
    textures: { exists: vi.fn(() => loaded) },
  } as unknown as Phaser.Scene;

  return { listeners, load, scene };
}

describe('StageBackgroundPreloader', () => {
  it('queues an unloaded stage image and starts an idle loader', () => {
    const { load, scene } = createScene();
    const preloader = new StageBackgroundPreloader(scene, vi.fn());

    expect(preloader.preload(STAGE_TWO_CONFIG)).toBe(true);
    expect(load.image).toHaveBeenCalledWith(
      'stage-02-bg',
      '/assets/backgrounds/stage-02.png',
    );
    expect(load.start).toHaveBeenCalledOnce();
  });

  it('does not duplicate cached, pending, or already-running loads', () => {
    const running = createScene({ loading: true });
    const preloader = new StageBackgroundPreloader(running.scene, vi.fn());

    expect(preloader.preload(STAGE_TWO_CONFIG)).toBe(true);
    expect(preloader.preload(STAGE_TWO_CONFIG)).toBe(false);
    expect(running.load.start).not.toHaveBeenCalled();

    const cached = createScene({ loaded: true });
    expect(
      new StageBackgroundPreloader(cached.scene, vi.fn()).preload(
        STAGE_TWO_CONFIG,
      ),
    ).toBe(false);
    expect(cached.load.image).not.toHaveBeenCalled();
  });

  it('announces the stage after its image enters the texture cache', () => {
    const onStageReady = vi.fn();
    const { listeners, scene } = createScene();
    const preloader = new StageBackgroundPreloader(scene, onStageReady);

    preloader.preload(STAGE_TWO_CONFIG);
    listeners.get('filecomplete-image-stage-02-bg')?.();

    expect(onStageReady).toHaveBeenCalledWith(STAGE_TWO_CONFIG);
  });

  it('clears a failed request so the next stage entry can retry it', () => {
    const { listeners, load, scene } = createScene();
    const preloader = new StageBackgroundPreloader(scene, vi.fn());

    preloader.preload(STAGE_TWO_CONFIG);
    listeners.get('loaderror')?.({ key: 'stage-02-bg' });

    expect(preloader.preload(STAGE_TWO_CONFIG)).toBe(true);
    expect(load.image).toHaveBeenCalledTimes(2);
  });
});
