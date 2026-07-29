// @vitest-environment jsdom
// Phaser touches `window` on import, so only this file pays for a DOM.
import type Phaser from 'phaser';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { AudioAssetKey } from '@/game/config/audioConfig';
import { gameEvents } from '@/game/events/gameEvents';
import { AudioDirector } from '@/game/systems/AudioDirector';

vi.hoisted(() => {
  // jsdom ships no canvas backend, and Phaser probes a 2D context while it is
  // being imported. Only the few calls made by that probe need to answer.
  HTMLCanvasElement.prototype.getContext = (() => ({
    fillStyle: '',
    fillRect: () => {},
    getImageData: () => ({ data: new Uint8ClampedArray(4) }),
    putImageData: () => {},
  })) as unknown as HTMLCanvasElement['getContext'];
});

type PlayedSfx = {
  key: string;
  config: Phaser.Types.Sound.SoundConfig;
};

type AddedMusic = {
  key: string;
  config: Phaser.Types.Sound.SoundConfig;
  playCount: number;
  stopped: boolean;
};

function createFakeGame(
  options: { loaded?: AudioAssetKey[]; locked?: boolean } = {},
) {
  const loaded = new Set<string>(options.loaded ?? []);
  const played: PlayedSfx[] = [];
  const added: AddedMusic[] = [];
  let unlockListener: (() => void) | undefined;
  const decodedListeners = new Set<(key: string) => void>();

  const game = {
    cache: {
      audio: { exists: (key: string) => loaded.has(key) },
    },
    sound: {
      locked: options.locked ?? false,
      play: (key: string, config: Phaser.Types.Sound.SoundConfig) => {
        played.push({ key, config });
        return true;
      },
      add: (key: string, config: Phaser.Types.Sound.SoundConfig) => {
        const music: AddedMusic = { key, config, playCount: 0, stopped: false };
        added.push(music);

        return {
          play: () => {
            music.playCount += 1;
            return true;
          },
          stop: () => {
            music.stopped = true;
            return true;
          },
          destroy: () => {},
        };
      },
      once: (_event: string, listener: () => void) => {
        unlockListener = listener;
      },
      // The fake deliberately omits decodeAudio, which is how the director
      // detects a manager that cannot take deferred music. Nothing is fetched.
      on: (_event: string, listener: (key: string) => void) => {
        decodedListeners.add(listener);
      },
      off: (_event: string, listener: (key: string) => void) => {
        if (unlockListener === listener) {
          unlockListener = undefined;
        }

        decodedListeners.delete(listener);
      },
    },
  };

  return {
    game: game as unknown as Phaser.Game,
    played,
    added,
    unlock: () => unlockListener?.(),
    /** Mimics a background track arriving after the game already asked for it. */
    finishDecoding: (key: string) => {
      loaded.add(key);
      for (const listener of decodedListeners) {
        listener(key);
      }
    },
  };
}

describe('AudioDirector', () => {
  let director: AudioDirector | undefined;

  afterEach(() => {
    director?.destroy();
    director = undefined;
  });

  it('stays silent for cues whose asset has not been produced yet', () => {
    const { game, played } = createFakeGame();
    director = new AudioDirector(game);

    gameEvents.emit('weapon-fired', 'smg', 0, 0);
    gameEvents.emit('player-damaged', 0, 0);
    gameEvents.emit('enemy-defeated', 0, 0);

    expect(played).toEqual([]);
  });

  it('plays the sfx mapped to the weapon that fired', () => {
    const { game, played } = createFakeGame({ loaded: ['sfx-smg-fire'] });
    director = new AudioDirector(game);

    gameEvents.emit('weapon-fired', 'smg', 0, 0);
    gameEvents.emit('weapon-fired', 'unmapped-weapon', 0, 0);

    expect(played).toHaveLength(1);
    expect(played[0].key).toBe('sfx-smg-fire');
    expect(played[0].config.volume).toBeGreaterThan(0);
  });

  it('drops repeated hit cues that land inside the same throttle window', () => {
    const { game, played } = createFakeGame({ loaded: ['sfx-enemy-hit'] });
    director = new AudioDirector(game);

    for (let pellet = 0; pellet < 5; pellet += 1) {
      gameEvents.emit('enemy-damaged', 0, 0);
    }

    expect(played).toHaveLength(1);
  });

  it('loops stage music once and keeps it across repeated stage events', () => {
    const { game, added } = createFakeGame({ loaded: ['bgm-city'] });
    director = new AudioDirector(game);

    gameEvents.emit('stage-changed', 'stage-01');
    gameEvents.emit('stage-changed', 'stage-01');

    expect(added).toHaveLength(1);
    expect(added[0]).toMatchObject({ key: 'bgm-city', playCount: 1 });
    expect(added[0].config.loop).toBe(true);
  });

  it('starts a stage track that was still downloading when the stage began', () => {
    const { game, added, finishDecoding } = createFakeGame();
    director = new AudioDirector(game);

    gameEvents.emit('stage-changed', 'stage-01');
    expect(added).toEqual([]);

    finishDecoding('bgm-city');

    expect(added).toHaveLength(1);
    expect(added[0]).toMatchObject({ key: 'bgm-city', playCount: 1 });
  });

  it('ignores a track that finished downloading after the stage moved on', () => {
    const { game, added, finishDecoding } = createFakeGame();
    director = new AudioDirector(game);

    gameEvents.emit('stage-changed', 'stage-01');
    gameEvents.emit('stage-changed', 'stage-02');
    finishDecoding('bgm-city');

    expect(added).toEqual([]);
  });

  it('defers music until the browser unlocks audio', () => {
    const { game, added, unlock } = createFakeGame({
      loaded: ['bgm-title'],
      locked: true,
    });
    director = new AudioDirector(game);

    gameEvents.emit('scene-changed', 'title');
    expect(added[0].playCount).toBe(0);

    unlock();
    expect(added[0].playCount).toBe(1);
  });

  it('stops responding to cues once destroyed', () => {
    const { game, played } = createFakeGame({ loaded: ['sfx-player-hit'] });
    director = new AudioDirector(game);
    director.destroy();
    director = undefined;

    gameEvents.emit('player-damaged', 0, 0);

    expect(played).toEqual([]);
  });
});
