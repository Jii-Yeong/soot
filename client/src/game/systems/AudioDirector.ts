import Phaser from 'phaser';
import { resolveAudioAssets } from '@/game/config/audioAssets';
import {
  AUDIO_MIX_CONFIG,
  MUSIC_CONFIG,
  SFX_CONFIG,
  WEAPON_FIRE_SFX,
  type AudioAssetKey,
  type MusicKey,
  type SfxKey,
} from '@/game/config/audioConfig';
import { STAGES } from '@/game/config/stageConfig';
import { gameEvents } from '@/game/events/gameEvents';
import type { GamePhase } from '@/game/state/gamePhase';
import type { GameSceneKey } from '@/game/state/gameSceneKey';
import type { RoomState } from '@/game/state/roomState';

export type AudioMix = {
  master: number;
  music: number;
  sfx: number;
};

/**
 * `decodeAudio` lives on the Web Audio manager only. The HTML5 and no-audio
 * managers do not expose it, so deferred music is skipped there rather than
 * crashing — the same silent degradation every cue already has.
 */
type DecodingSoundManager = Phaser.Sound.BaseSoundManager & {
  decodeAudio(key: string, data: ArrayBuffer): void;
};

function canDecode(
  manager: Phaser.Sound.BaseSoundManager,
): manager is DecodingSoundManager {
  return 'decodeAudio' in manager && typeof manager.decodeAudio === 'function';
}

/**
 * Owns every sound in the game. It is bound to the Phaser.Game rather than a
 * Scene so music survives scene.restart() and the title-to-game handover, and
 * it only listens to gameEvents so no gameplay system has to know audio exists.
 *
 * Cues whose asset has not been produced yet are skipped silently: sound design
 * can land one file at a time without touching gameplay code.
 */
export class AudioDirector {
  private readonly mix: AudioMix = { ...AUDIO_MIX_CONFIG };
  private readonly playedAt = new Map<SfxKey, number>();
  private music?: Phaser.Sound.BaseSound;
  /** What should be playing, whether or not its file has arrived yet. */
  private wantedMusic?: MusicKey;
  /** Tracks already fetched, so a revisited stage does not download twice. */
  private readonly requested = new Set<MusicKey>();

  constructor(private readonly game: Phaser.Game) {
    this.game.sound.on(Phaser.Sound.Events.DECODED, this.handleDecoded);

    gameEvents.on('scene-changed', this.handleSceneChanged);
    gameEvents.on('stage-changed', this.handleStageChanged);
    gameEvents.on('phase-changed', this.handlePhaseChanged);
    gameEvents.on('room-state-changed', this.handleRoomStateChanged);
    gameEvents.on('weapon-fired', this.handleWeaponFired);
    gameEvents.on('player-damaged', this.handlePlayerDamaged);
    gameEvents.on('player-dashed', this.handlePlayerDashed);
    gameEvents.on('enemy-damaged', this.handleEnemyDamaged);
    gameEvents.on('enemy-defeated', this.handleEnemyDefeated);
  }

  destroy() {
    gameEvents.off('scene-changed', this.handleSceneChanged);
    gameEvents.off('stage-changed', this.handleStageChanged);
    gameEvents.off('phase-changed', this.handlePhaseChanged);
    gameEvents.off('room-state-changed', this.handleRoomStateChanged);
    gameEvents.off('weapon-fired', this.handleWeaponFired);
    gameEvents.off('player-damaged', this.handlePlayerDamaged);
    gameEvents.off('player-dashed', this.handlePlayerDashed);
    gameEvents.off('enemy-damaged', this.handleEnemyDamaged);
    gameEvents.off('enemy-defeated', this.handleEnemyDefeated);
    this.game.sound.off(Phaser.Sound.Events.DECODED, this.handleDecoded);
    this.stopMusic();
    this.playedAt.clear();
  }

  /** Built once; the glob behind it is resolved at build time. */
  private musicUrls?: Map<string, string>;

  private urlFor(key: MusicKey) {
    if (!this.musicUrls) {
      this.musicUrls = new Map(
        resolveAudioAssets()
          .assets.filter((asset) => asset.key in MUSIC_CONFIG)
          .map((asset) => [asset.key, asset.url]),
      );
    }

    return this.musicUrls.get(key);
  }

  /**
   * Stage music is fetched after boot rather than during it. The title track
   * is the exception: BootScene preloads it so title playback can be attempted
   * as soon as the player passes the browser's start prompt. Sound effects
   * total 113KB while one track is over a megabyte.
   *
   * Only the track that is about to be needed is fetched, plus the one for the
   * stage after it. Fetching every track up front would mean a player who
   * quits during stage 1 still pays for the stage 5 music, and that download
   * would compete with the stage 1 background the player is actually waiting
   * on. The one-stage lead is 2~3 minutes of play against roughly a second of
   * transfer, which is what keeps the handover silent-gap free.
   *
   * Decoding goes through the sound manager instead of a Scene loader because
   * no Scene outlives the boot to title to game handover; a loader started in
   * one is torn down with it.
   */
  private requestMusic(key: MusicKey | undefined) {
    const manager = this.game.sound;

    // BootScene preloads the title track so it can start as soon as the title
    // appears. Do not fetch and decode that same file a second time.
    if (
      !key ||
      this.isLoaded(key) ||
      this.requested.has(key) ||
      !canDecode(manager)
    ) {
      return;
    }

    const url = this.urlFor(key);

    if (!url) {
      return;
    }

    this.requested.add(key);

    // A track that fails to arrive leaves its cue silent, which is the same
    // outcome as a cue whose file was never produced.
    void fetch(url)
      .then((response) => response.arrayBuffer())
      .then((data) => manager.decodeAudio(key, data))
      .catch(() => undefined);
  }

  private readonly handleDecoded = (key: string) => {
    if (key === this.wantedMusic) {
      this.startMusic();
    }
  };

  private readonly handleSceneChanged = (scene: GameSceneKey) => {
    if (scene !== 'title') {
      return;
    }

    this.requestMusic('bgm-title');
    // The title is where the player reads and presses ENTER, which is the only
    // free moment stage one's track ever gets.
    this.requestMusic(STAGES[0]?.music);
    this.playMusic('bgm-title');
  };

  private readonly handleStageChanged = (stageId: string) => {
    const index = STAGES.findIndex((candidate) => candidate.id === stageId);

    if (index < 0) {
      return;
    }

    this.requestMusic(STAGES[index].music);
    this.requestMusic(STAGES[index + 1]?.music);
    this.playMusic(STAGES[index].music);
  };

  private readonly handlePhaseChanged = (phase: GamePhase) => {
    if (phase === 'dead') {
      this.playSfx('sfx-player-death');
    }
  };

  private readonly handleRoomStateChanged = (state: RoomState) => {
    if (state === 'locked') {
      this.playSfx('sfx-room-locked');
      return;
    }

    if (state === 'cleared') {
      this.playSfx('sfx-room-cleared');
    }
  };

  private readonly handleWeaponFired = (weaponId: string) => {
    const key = WEAPON_FIRE_SFX[weaponId];

    if (key) {
      this.playSfx(key);
    }
  };

  private readonly handlePlayerDamaged = () => {
    this.playSfx('sfx-player-hit');
  };

  private readonly handlePlayerDashed = () => {
    this.playSfx('sfx-player-dash');
  };

  private readonly handleEnemyDamaged = () => {
    this.playSfx('sfx-enemy-hit');
  };

  private readonly handleEnemyDefeated = () => {
    this.playSfx('sfx-enemy-down');
  };

  private playSfx(key: SfxKey) {
    const config = SFX_CONFIG[key];
    const now = Date.now();
    const playedAt = this.playedAt.get(key);

    if (
      config.minInterval !== undefined &&
      playedAt !== undefined &&
      now - playedAt < config.minInterval
    ) {
      return;
    }

    // Cues are momentary, so anything triggered before the browser grants audio
    // is dropped rather than queued — a delayed gunshot reads as a bug.
    if (!this.isLoaded(key) || this.game.sound.locked) {
      return;
    }

    this.playedAt.set(key, now);
    this.game.sound.play(key, {
      volume: config.volume * this.mix.sfx * this.mix.master,
      rate: this.jitteredRate(config.rateJitter),
    });
  }

  private playMusic(key: MusicKey) {
    if (this.wantedMusic === key) {
      return;
    }

    this.stopMusic();
    this.wantedMusic = key;
    this.startMusic();
  }

  /**
   * Runs when music is requested and again when a deferred track finishes
   * decoding, so a stage entered before its file arrived still gets scored.
   */
  private startMusic() {
    const key = this.wantedMusic;

    if (!key || this.music || !this.isLoaded(key)) {
      return;
    }

    this.music = this.game.sound.add(key, {
      loop: true,
      volume: MUSIC_CONFIG[key].volume * this.mix.music * this.mix.master,
    });

    if (this.game.sound.locked) {
      this.game.sound.once(Phaser.Sound.Events.UNLOCKED, this.handleUnlocked);
      return;
    }

    this.music.play();
  }

  /** Web Audio stays locked until the player clicks the start prompt. */
  private readonly handleUnlocked = () => {
    this.music?.play();
  };

  private stopMusic() {
    this.game.sound.off(Phaser.Sound.Events.UNLOCKED, this.handleUnlocked);
    this.music?.stop();
    this.music?.destroy();
    this.music = undefined;
    this.wantedMusic = undefined;
  }

  private isLoaded(key: AudioAssetKey) {
    return this.game.cache.audio.exists(key);
  }

  private jitteredRate(rateJitter = 0) {
    return rateJitter === 0 ? 1 : 1 + (Math.random() * 2 - 1) * rateJitter;
  }
}
