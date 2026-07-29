import Phaser from 'phaser';
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
  private musicKey?: MusicKey;

  constructor(private readonly game: Phaser.Game) {
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
    this.stopMusic();
    this.playedAt.clear();
  }

  private readonly handleSceneChanged = (scene: GameSceneKey) => {
    if (scene === 'title') {
      this.playMusic('bgm-title');
    }
  };

  private readonly handleStageChanged = (stageId: string) => {
    const stage = STAGES.find((candidate) => candidate.id === stageId);

    if (stage) {
      this.playMusic(stage.music);
    }
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
    if (this.musicKey === key || !this.isLoaded(key)) {
      return;
    }

    this.stopMusic();
    this.musicKey = key;
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

  /** Web Audio stays locked until the first gesture, which is the title ENTER. */
  private readonly handleUnlocked = () => {
    this.music?.play();
  };

  private stopMusic() {
    this.game.sound.off(Phaser.Sound.Events.UNLOCKED, this.handleUnlocked);
    this.music?.stop();
    this.music?.destroy();
    this.music = undefined;
    this.musicKey = undefined;
  }

  private isLoaded(key: AudioAssetKey) {
    return this.game.cache.audio.exists(key);
  }

  private jitteredRate(rateJitter = 0) {
    return rateJitter === 0 ? 1 : 1 + (Math.random() * 2 - 1) * rateJitter;
  }
}
