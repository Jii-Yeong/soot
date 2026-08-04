import type Phaser from 'phaser';
import { describe, expect, it, vi } from 'vitest';
import {
  STAGE_THREE_CONFIG,
  STAGE_TWO_CONFIG,
} from '@/game/config/stageConfig';
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

  it('queues the stage three ceiling crawler and captor atlases', () => {
    const { load, scene } = createScene();

    expect(new StageAssetPreloader(scene).preload(STAGE_THREE_CONFIG)).toBe(
      true,
    );
    expect(load.atlas).toHaveBeenCalledTimes(2);
    expect(load.atlas).toHaveBeenCalledWith(
      'stage-3-flying',
      '/assets/enemies/stage-3-flying.png',
      '/assets/enemies/stage-3-flying.json',
    );
    expect(load.atlas).toHaveBeenCalledWith(
      'stage-3-ranged',
      '/assets/enemies/stage-3-ranged.png',
      '/assets/enemies/stage-3-ranged.json',
    );
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

  it('runs onReady once every awaited texture has arrived', () => {
    const { listeners, scene } = createScene();
    const onReady = vi.fn();

    new StageAssetPreloader(scene).preload(STAGE_TWO_CONFIG, onReady);

    const awaited = [
      'stage-2-flying',
      'stage-2-ranged',
      'stage-2-neared',
      'stage-2-floor-left',
      'stage-2-floor-middle',
      'stage-2-floor-right',
      'stage-2-stool-left',
      'stage-2-stool-middle',
      'stage-2-stool-right',
    ];
    const complete = listeners.get('filecomplete') ?? [];
    for (const key of awaited.slice(0, -1)) {
      for (const listener of complete) {
        listener(key as never);
      }
    }
    expect(onReady).not.toHaveBeenCalled();

    for (const listener of complete) {
      listener(awaited.at(-1) as never);
    }
    expect(onReady).toHaveBeenCalledOnce();
  });

  it('skips onReady entirely when the stage is already warm', () => {
    const warm = createScene([
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
    warm.anims.exists.mockReturnValue(true);
    const onReady = vi.fn();

    new StageAssetPreloader(warm.scene).preload(STAGE_TWO_CONFIG, onReady);

    expect(onReady).not.toHaveBeenCalled();
    expect(warm.listeners.get('filecomplete') ?? []).toHaveLength(0);
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
