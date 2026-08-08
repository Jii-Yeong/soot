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
  | 'sfx-burst-rifle-fire'
  | 'sfx-rail-rifle-fire'
  | 'sfx-enemy-hit'
  | 'sfx-enemy-down'
  | 'sfx-player-hit'
  | 'sfx-player-dash'
  | 'sfx-player-death'
  | 'sfx-room-locked'
  | 'sfx-room-cleared'
  | 'sfx-shield-block-01'
  | 'sfx-shield-block-02'
  | 'sfx-shield-block-03'
  | 'sfx-shield-block-04'
  | 'sfx-boss-invulnerable-01'
  | 'sfx-boss-invulnerable-02'
  | 'sfx-boss-invulnerable-03'
  | 'sfx-boss-invulnerable-04'
  | 'sfx-stage1-footstep-01'
  | 'sfx-stage1-footstep-02'
  | 'sfx-stage1-footstep-03'
  | 'sfx-stage1-footstep-04'
  | 'sfx-stage2-footstep-01'
  | 'sfx-stage2-footstep-02'
  | 'sfx-stage2-footstep-03'
  | 'sfx-stage2-footstep-04'
  | 'sfx-stage3-footstep-01'
  | 'sfx-stage3-footstep-02'
  | 'sfx-stage3-footstep-03'
  | 'sfx-stage3-footstep-04'
  | 'sfx-stage4-footstep-01'
  | 'sfx-stage4-footstep-02'
  | 'sfx-stage4-footstep-03'
  | 'sfx-stage4-footstep-04';

export type AudioAssetKey = MusicKey | SfxKey;

export type SfxConfig = {
  /** Trim relative to the sfx bus. Cues that repeat fastest sit lowest. */
  volume: number;
  /** 원본보다 높고 짧게 들려줄 기준 재생률. */
  rate?: number;
  /** Playback rate is randomised by +/- this much so repeats do not phase. */
  rateJitter?: number;
  /** Drops repeats fired inside this window, e.g. shotgun pellets landing together. */
  minInterval?: number;
};

export type MusicConfig = {
  volume: number;
};

export type AudioMix = {
  master: number;
  music: number;
  sfx: number;
};

/** Three buses so the title screen can expose master/music/sfx separately. */
export const AUDIO_MIX_CONFIG: AudioMix = {
  master: 0.9,
  music: 0.45,
  sfx: 0.8,
};

export function clampAudioMixValue(value: number) {
  return Math.min(1, Math.max(0, value));
}

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

const PROJECTILE_BLOCK_SFX_CONFIG: SfxConfig = {
  volume: 0.45,
  rate: 1.1,
  rateJitter: 0.02,
  minInterval: 45,
};

export const SFX_CONFIG: Record<SfxKey, SfxConfig> = {
  'sfx-smg-fire': { volume: 0.35, rateJitter: 0.08 },
  'sfx-shotgun-fire': { volume: 0.6, rateJitter: 0.04 },
  // Three rounds land inside 144ms, so the jitter is wide enough that a burst
  // does not read as one sound played three times.
  'sfx-burst-rifle-fire': { volume: 0.42, rateJitter: 0.1 },
  'sfx-rail-rifle-fire': { volume: 0.7, rateJitter: 0.03 },
  'sfx-enemy-hit': { volume: 0.45, rateJitter: 0.12, minInterval: 45 },
  'sfx-enemy-down': { volume: 0.7, rateJitter: 0.05 },
  'sfx-player-hit': { volume: 0.8 },
  'sfx-player-dash': { volume: 0.5, rateJitter: 0.06 },
  'sfx-player-death': { volume: 0.9 },
  // Both fire once per room, so they are trimmed below the combat cues: a
  // sound heard on every transition wears out faster than one heard mid-fight.
  'sfx-room-locked': { volume: 0.6 },
  'sfx-room-cleared': { volume: 0.45 },
  'sfx-shield-block-01': PROJECTILE_BLOCK_SFX_CONFIG,
  'sfx-shield-block-02': PROJECTILE_BLOCK_SFX_CONFIG,
  'sfx-shield-block-03': PROJECTILE_BLOCK_SFX_CONFIG,
  'sfx-shield-block-04': PROJECTILE_BLOCK_SFX_CONFIG,
  'sfx-boss-invulnerable-01': PROJECTILE_BLOCK_SFX_CONFIG,
  'sfx-boss-invulnerable-02': PROJECTILE_BLOCK_SFX_CONFIG,
  'sfx-boss-invulnerable-03': PROJECTILE_BLOCK_SFX_CONFIG,
  'sfx-boss-invulnerable-04': PROJECTILE_BLOCK_SFX_CONFIG,
  'sfx-stage1-footstep-01': { volume: 1, rateJitter: 0.03 },
  'sfx-stage1-footstep-02': { volume: 1, rateJitter: 0.03 },
  'sfx-stage1-footstep-03': { volume: 1, rateJitter: 0.03 },
  'sfx-stage1-footstep-04': { volume: 1, rateJitter: 0.03 },
  'sfx-stage2-footstep-01': { volume: 1, rateJitter: 0.03 },
  'sfx-stage2-footstep-02': { volume: 1, rateJitter: 0.03 },
  'sfx-stage2-footstep-03': { volume: 1, rateJitter: 0.03 },
  'sfx-stage2-footstep-04': { volume: 1, rateJitter: 0.03 },
  'sfx-stage3-footstep-01': { volume: 1, rateJitter: 0.03 },
  'sfx-stage3-footstep-02': { volume: 1, rateJitter: 0.03 },
  'sfx-stage3-footstep-03': { volume: 1, rateJitter: 0.03 },
  'sfx-stage3-footstep-04': { volume: 1, rateJitter: 0.03 },
  'sfx-stage4-footstep-01': { volume: 1, rateJitter: 0.03 },
  'sfx-stage4-footstep-02': { volume: 1, rateJitter: 0.03 },
  'sfx-stage4-footstep-03': { volume: 1, rateJitter: 0.03 },
  'sfx-stage4-footstep-04': { volume: 1, rateJitter: 0.03 },
};

export const PROJECTILE_BLOCK_SFX_BY_KIND = {
  shield: [
    'sfx-shield-block-01',
    'sfx-shield-block-02',
    'sfx-shield-block-03',
    'sfx-shield-block-04',
  ],
  boss: [
    'sfx-boss-invulnerable-01',
    'sfx-boss-invulnerable-02',
    'sfx-boss-invulnerable-03',
    'sfx-boss-invulnerable-04',
  ],
} as const satisfies Record<'shield' | 'boss', readonly SfxKey[]>;

export type FootstepStageId =
  | 'stage-01'
  | 'stage-02'
  | 'stage-03'
  | 'stage-04';

export const FOOTSTEP_SFX_BY_STAGE: Readonly<
  Record<FootstepStageId, readonly SfxKey[]>
> = {
  'stage-01': [
    'sfx-stage1-footstep-01',
    'sfx-stage1-footstep-02',
    'sfx-stage1-footstep-03',
    'sfx-stage1-footstep-04',
  ],
  'stage-02': [
    'sfx-stage2-footstep-01',
    'sfx-stage2-footstep-02',
    'sfx-stage2-footstep-03',
    'sfx-stage2-footstep-04',
  ],
  'stage-03': [
    'sfx-stage3-footstep-01',
    'sfx-stage3-footstep-02',
    'sfx-stage3-footstep-03',
    'sfx-stage3-footstep-04',
  ],
  'stage-04': [
    'sfx-stage4-footstep-01',
    'sfx-stage4-footstep-02',
    'sfx-stage4-footstep-03',
    'sfx-stage4-footstep-04',
  ],
};

/**
 * Weapon ids come from WeaponConfig.id. The mapping lives here rather than on
 * WeaponConfig so combat balance and sound design stay separately owned.
 */
export const WEAPON_FIRE_SFX: Record<string, SfxKey | undefined> = {
  smg: 'sfx-smg-fire',
  shotgun: 'sfx-shotgun-fire',
  'burst-rifle': 'sfx-burst-rifle-fire',
  'rail-rifle': 'sfx-rail-rifle-fire',
};
