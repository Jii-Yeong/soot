/**
 * Audio asset keys are a shared contract: gameplay code emits semantic events
 * and only this file decides which sound answers them. Renaming a key here is
 * the single edit needed when an asset is replaced.
 */
export type MusicKey =
  | 'bgm-title'
  | 'bgm-city'
  | 'bgm-alley'
  | 'bgm-underground'
  | 'bgm-inferno'
  | 'bgm-return';

export type SfxKey =
  | 'sfx-smg-fire'
  | 'sfx-shotgun-fire'
  | 'sfx-enemy-hit'
  | 'sfx-enemy-down'
  | 'sfx-player-hit'
  | 'sfx-player-dash'
  | 'sfx-player-death'
  | 'sfx-room-locked'
  | 'sfx-room-cleared';

export type AudioAssetKey = MusicKey | SfxKey;

export type SfxConfig = {
  /** Trim relative to the sfx bus. Cues that repeat fastest sit lowest. */
  volume: number;
  /** Playback rate is randomised by +/- this much so repeats do not phase. */
  rateJitter?: number;
  /** Drops repeats fired inside this window, e.g. shotgun pellets landing together. */
  minInterval?: number;
};

export type MusicConfig = {
  volume: number;
};

/** Three buses so the title screen can expose master/music/sfx separately. */
export const AUDIO_MIX_CONFIG = {
  master: 0.9,
  music: 0.45,
  sfx: 0.8,
} as const;

export const MUSIC_CONFIG: Record<MusicKey, MusicConfig> = {
  'bgm-title': { volume: 0.7 },
  'bgm-city': { volume: 0.6 },
  'bgm-alley': { volume: 0.65 },
  // Stages 3-5 have their own BGM slot; the files are not produced yet, so
  // AudioDirector skips them silently until they land in assets/audio/music/.
  'bgm-underground': { volume: 0.6 },
  'bgm-inferno': { volume: 0.6 },
  'bgm-return': { volume: 0.6 },
};

export const SFX_CONFIG: Record<SfxKey, SfxConfig> = {
  'sfx-smg-fire': { volume: 0.35, rateJitter: 0.08 },
  'sfx-shotgun-fire': { volume: 0.6, rateJitter: 0.04 },
  'sfx-enemy-hit': { volume: 0.45, rateJitter: 0.12, minInterval: 45 },
  'sfx-enemy-down': { volume: 0.7, rateJitter: 0.05 },
  'sfx-player-hit': { volume: 0.8 },
  'sfx-player-dash': { volume: 0.5, rateJitter: 0.06 },
  'sfx-player-death': { volume: 0.9 },
  // Both fire once per room, so they are trimmed below the combat cues: a
  // sound heard on every transition wears out faster than one heard mid-fight.
  'sfx-room-locked': { volume: 0.6 },
  'sfx-room-cleared': { volume: 0.45 },
};

/**
 * Weapon ids come from WeaponConfig.id. The mapping lives here rather than on
 * WeaponConfig so combat balance and sound design stay separately owned.
 */
export const WEAPON_FIRE_SFX: Record<string, SfxKey | undefined> = {
  smg: 'sfx-smg-fire',
  shotgun: 'sfx-shotgun-fire',
};
