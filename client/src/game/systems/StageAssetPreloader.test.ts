import type Phaser from 'phaser';
import { describe, expect, it, vi } from 'vitest';
import { STAGE_TWO_CONFIG } from '@/game/config/stageConfig';
import { StageAssetPreloader } from '@/game/systems/StageAssetPreloader';

type LoaderListener = (...args: never[]) => void;

function createScene(loadedKeys: readonly string[] = []) {
  const listeners = new Map<string, LoaderListener[]>();
  const addListener = (event: string, listener: LoaderListener) => {
    listeners.set(event, [...(listeners.get(event) ?? []), listener]);
  };
  const load = {
    atlas: vi.fn(),
    image: vi.fn(),
    isLoading: vi.fn(() => false),
    off: vi.fn((event: string, listener: LoaderListener) => {
      listeners.set(
        event,
        (listeners.get(event) ?? []).filter((candidate) => candidate !== listener),
      );
    }),
    on: vi.fn(addListener),
    once: vi.fn(addListener),
    start: vi.fn(),
  };
  const anims = { create: vi.fn(), exists: vi.fn(() => false) };
  const scene = {
    anims,
    load,
    textures: {
      exists: vi.fn((key: string) => loadedKeys.includes(key)),
    },
  } as unknown as Phaser.Scene;

  return { anims, listeners, load, scene };
}

describe('StageAssetPreloader', () => {
  it('queues one stage enemy and terrain art as a single idle-loader batch', () => {
    const { load, scene } = createScene();

    expect(new StageAssetPreloader(scene).preload(STAGE_TWO_CONFIG)).toBe(true);
    expect(load.atlas).toHaveBeenCalledTimes(3);
    expect(load.atlas).toHaveBeenCalledWith(
      'stage-2-neared',
      '/assets/enemies/stage-2-neared.png',
      '/assets/enemies/stage-2-neared.json',
    );
    expect(load.image).toHaveBeenCalledTimes(6);
    expect(load.start).toHaveBeenCalledOnce();
  });

  it('creates atlas animations on arrival and never recreates cached ones', () => {
    const pending = createScene();
    new StageAssetPreloader(pending.scene).preload(STAGE_TWO_CONFIG);

    for (const listener of
      pending.listeners.get('filecomplete-atlasjson-stage-2-flying') ?? []) {
      listener();
    }
    expect(pending.anims.create).toHaveBeenCalledTimes(4);
    expect(pending.anims.create).toHaveBeenCalledWith(
      expect.objectContaining({ key: 'stage-2-flying-death-fall' }),
    );

    const cached = createScene([
      'stage-2-flying',
      'stage-2-ranged',
      'stage-2-neared',
      'stage-2-floor-left',
      'stage-2-floor-middle',
      'stage-2-floor-right',
      'stage-2-stool-left',
      'stage-2-stool-middle',
      'stage-2-stool-right',
    ]);
    cached.anims.exists.mockReturnValue(true);

    expect(new StageAssetPreloader(cached.scene).preload(STAGE_TWO_CONFIG)).toBe(
      false,
    );
    expect(cached.load.atlas).not.toHaveBeenCalled();
    expect(cached.load.image).not.toHaveBeenCalled();
    expect(cached.anims.create).not.toHaveBeenCalled();
  });

  it('deduplicates pending files and permits retry after a failure', () => {
    const { listeners, load, scene } = createScene();
    const preloader = new StageAssetPreloader(scene);

    expect(preloader.preload(STAGE_TWO_CONFIG)).toBe(true);
    expect(preloader.preload(STAGE_TWO_CONFIG)).toBe(false);

    for (const listener of listeners.get('loaderror') ?? []) {
      listener({ key: 'stage-2-neared' } as never);
    }
    expect(preloader.preload(STAGE_TWO_CONFIG)).toBe(true);
    expect(load.atlas).toHaveBeenCalledTimes(4);
  });
});
