import {
  MUSIC_CONFIG,
  SFX_CONFIG,
  type AudioAssetKey,
  type MusicKey,
  type SfxKey,
} from '@/game/config/audioConfig';

export type AudioAsset = {
  key: AudioAssetKey;
  url: string;
};

export type ResolvedAudioAssets = {
  assets: AudioAsset[];
  /** Cues that have no sound file yet. */
  missingKeys: AudioAssetKey[];
  /** Files that matched no cue, which almost always means a wrong name. */
  unusedFiles: string[];
};

/** Glob output shape: file path to resolved URL. */
export type AudioFileMap = Record<string, string>;

type DiscoveredFile = {
  name: string;
  folder: string;
  /** File name with the extension dropped and punctuation stripped. */
  stem: string;
  url: string;
};

/** The only folders a cue is ever answered from. */
const CUE_FOLDERS = ['music', 'sfx'];

/**
 * Vite resolves this at build time, so only files that really exist are listed
 * and a cue without a file is never requested. Dropping a sound into
 * `music/` or `sfx/` is therefore the whole install step — no code edit, no
 * fixed extension.
 *
 * The two folders are named rather than globbed with `*` so that sibling
 * folders stay out of the bundle. `candidates/` holds takes that lost the
 * comparison, and shipping those would put megabytes of unused audio in the
 * submission build.
 */
const audioFiles = import.meta.glob<string>(
  '../../assets/audio/{music,sfx}/*.{ogg,mp3,wav,m4a,webm}',
  { eager: true, query: '?url', import: 'default' },
);

const CUE_KEY_PREFIX = /^(bgm|sfx)-/;
const FILE_EXTENSION = /\.[^.]+$/;

function normalize(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]/g, '');
}

/** `bgm-city` lives in `music/`, every `sfx-*` cue lives in `sfx/`. */
function cueFolder(key: AudioAssetKey) {
  return key.startsWith('bgm-') ? 'music' : 'sfx';
}

function cueStem(key: AudioAssetKey) {
  return normalize(key.replace(CUE_KEY_PREFIX, ''));
}

function discoverFiles(files: AudioFileMap): DiscoveredFile[] {
  return Object.entries(files)
    .map(([filePath, url]) => {
      const segments = filePath.split('/');
      const name = segments[segments.length - 1];

      return {
        name,
        folder: segments[segments.length - 2],
        stem: normalize(name.replace(FILE_EXTENSION, '')),
        url,
      };
    })
    .filter((file) => CUE_FOLDERS.includes(file.folder));
}

/**
 * Matches each cue to a file whose name *starts with* the cue name, so
 * `smg-fire.ogg`, `smg_fire_01.wav` and `SMG Fire.mp3` all answer
 * `sfx-smg-fire`. The closest name wins when several files qualify.
 */
export function matchAudioAssets(fileMap: AudioFileMap): ResolvedAudioAssets {
  const files = discoverFiles(fileMap);
  const keys = [
    ...(Object.keys(MUSIC_CONFIG) as MusicKey[]),
    ...(Object.keys(SFX_CONFIG) as SfxKey[]),
  ];
  const assets: AudioAsset[] = [];
  const missingKeys: AudioAssetKey[] = [];
  const matchedNames = new Set<string>();

  for (const key of keys) {
    const folder = cueFolder(key);
    const stem = cueStem(key);
    const [match] = files
      .filter((file) => file.folder === folder && file.stem.startsWith(stem))
      .sort(
        (first, second) =>
          first.stem.length - second.stem.length ||
          first.name.localeCompare(second.name),
      );

    if (!match) {
      missingKeys.push(key);
      continue;
    }

    matchedNames.add(match.name);
    assets.push({ key, url: match.url });
  }

  return {
    assets,
    missingKeys,
    unusedFiles: files
      .filter((file) => !matchedNames.has(file.name))
      .map((file) => `${file.folder}/${file.name}`),
  };
}

export function resolveAudioAssets(): ResolvedAudioAssets {
  return matchAudioAssets(audioFiles);
}
