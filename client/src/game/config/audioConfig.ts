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
  | 'sfx-room-cleared'
  | 'sfx-monitor-beep';

export type AudioAssetKey = MusicKey | SfxKey;

/**
 * A cue played on top of another one. The layer keeps its own entry in
 * SFX_CONFIG, so its level and throttle are edited in the same place as every
 * other cue rather than being buried in the parent.
 */
export type SfxLayerConfig = {
  key: SfxKey;
  /** Stage ids that hear this layer. Absent means every stage does. */
  stages?: readonly string[];
};

export type SfxConfig = {
  /** Trim relative to the sfx bus. Cues that repeat fastest sit lowest. */
  volume: number;
  /** Playback rate is randomised by +/- this much so repeats do not phase. */
  rateJitter?: number;
  /** Drops repeats fired inside this window, e.g. shotgun pellets landing together. */
  minInterval?: number;
  /** Sounded together with this cue. See SfxLayerConfig. */
  layer?: SfxLayerConfig;
};

/**
 * Stages 1-3 are where the player is still being told a story about a city.
 * Written as literals rather than read from stageConfig because that module
 * already imports this one for MusicKey, and pulling STAGES back the other way
 * would close the cycle.
 */
const MONITOR_MOTIF_STAGES = ['stage-01', 'stage-02', 'stage-03'] as const;

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
  // The monitor beep under this cue is the audio half of the foreshadowing in
  // the design doc: the player is in a hospital bed, and every hit registers on
  // a machine somewhere. One hit, one beat.
  'sfx-player-hit': {
    volume: 0.8,
    layer: { key: 'sfx-monitor-beep', stages: MONITOR_MOTIF_STAGES },
  },
  'sfx-player-dash': { volume: 0.5, rateJitter: 0.06 },
  'sfx-player-death': { volume: 0.9 },
  // Both fire once per room, so they are trimmed below the combat cues: a
  // sound heard on every transition wears out faster than one heard mid-fight.
  'sfx-room-locked': { volume: 0.6 },
  'sfx-room-cleared': { volume: 0.45 },
  // A hint has to be heard to work and has to stay under the hit to remain a
  // hint. The file is a sustained tone and so reads far louder than its RMS
  // against a transient — this is the one value here that wants an ear, not a
  // meter. No jitter: a monitor that drifts in pitch is a broken monitor.
  'sfx-monitor-beep': { volume: 0.12 },
};

/**
 * Weapon ids come from WeaponConfig.id. The mapping lives here rather than on
 * WeaponConfig so combat balance and sound design stay separately owned.
 */
export const WEAPON_FIRE_SFX: Record<string, SfxKey | undefined> = {
  smg: 'sfx-smg-fire',
  shotgun: 'sfx-shotgun-fire',
};
