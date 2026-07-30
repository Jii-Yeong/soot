import { describe, expect, it } from 'vitest';
import { matchAudioAssets } from '@/game/config/audioAssets';

const AUDIO_ROOT = '../../assets/audio';

function fileMap(...names: string[]) {
  return Object.fromEntries(
    names.map((name) => [`${AUDIO_ROOT}/${name}`, `/dist/${name}`]),
  );
}

describe('matchAudioAssets', () => {
  it('matches a cue regardless of extension, case or suffix', () => {
    const { assets } = matchAudioAssets(
      fileMap('sfx/SMG Fire_01.wav', 'music/city.mp3'),
    );

    expect(assets).toEqual([
      { key: 'bgm-city', url: '/dist/music/city.mp3' },
      { key: 'sfx-smg-fire', url: '/dist/sfx/SMG Fire_01.wav' },
    ]);
  });

  it('prefers the closest name when several files qualify', () => {
    const { assets } = matchAudioAssets(
      fileMap('sfx/enemy-hit-heavy-variant.ogg', 'sfx/enemy-hit.ogg'),
    );

    expect(assets).toContainEqual({
      key: 'sfx-enemy-hit',
      url: '/dist/sfx/enemy-hit.ogg',
    });
  });

  it('keeps music and sfx cues inside their own folder', () => {
    const { assets, missingKeys } = matchAudioAssets(fileMap('sfx/city.ogg'));

    expect(assets).toEqual([]);
    expect(missingKeys).toContain('bgm-city');
  });

  it('reports every cue as missing when no file exists', () => {
    const { assets, missingKeys, unusedFiles } = matchAudioAssets({});

    expect(assets).toEqual([]);
    // 6 music cues + 9 sfx cues.
    expect(missingKeys).toHaveLength(15);
    expect(unusedFiles).toEqual([]);
  });

  it('ignores folders that hold no cue, such as rejected takes', () => {
    const { assets, unusedFiles } = matchAudioAssets(
      fileMap('candidates/city_other-take.mp3', 'music/city.ogg'),
    );

    expect(assets).toEqual([{ key: 'bgm-city', url: '/dist/music/city.ogg' }]);
    expect(unusedFiles).toEqual([]);
  });

  it('flags files that answer no cue so the name can be fixed', () => {
    const { unusedFiles } = matchAudioAssets(
      fileMap('sfx/gunshot.wav', 'sfx/player-dash.ogg'),
    );

    expect(unusedFiles).toEqual(['sfx/gunshot.wav']);
  });
});
