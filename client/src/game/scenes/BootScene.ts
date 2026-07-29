import Phaser from 'phaser';
import { resolveAudioAssets } from '@/game/config/audioAssets';
import { BOSS_COMBAT_CONFIGS } from '@/game/config/bossConfig';
import {
  PLAYER_ANIMATIONS,
  PLAYER_ATLAS_KEY,
  PLAYER_IDLE_FRAMES,
  PLAYER_RUN_FRAMES,
} from '@/game/config/playerAnimationConfig';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('boot');
  }

  preload() {
    this.load.atlas(
      PLAYER_ATLAS_KEY,
      '/assets/player/player.png',
      '/assets/player/player.json',
    );

    const { assets, missingKeys, unusedFiles } = resolveAudioAssets();

    for (const asset of assets) {
      this.load.audio(asset.key, asset.url);
    }

    this.reportAudioGaps(missingKeys, unusedFiles);
  }

  create() {
    this.createRuntimeTextures();
    this.createAnimations();
    this.scene.start('title');
  }

  /**
   * Sound files arrive one at a time and a cue without a file simply stays
   * quiet, so the run always plays end to end. This reports what is still
   * open: cues with no sound, and files whose name matched no cue.
   */
  private reportAudioGaps(missingKeys: string[], unusedFiles: string[]) {
    if (!import.meta.env.DEV) {
      return;
    }

    if (missingKeys.length > 0) {
      console.warn(
        `[audio] ${missingKeys.length} cue(s) still have no file: ${missingKeys.join(', ')}`,
      );
    }

    if (unusedFiles.length > 0) {
      console.warn(
        `[audio] file(s) matched no cue, check the name: ${unusedFiles.join(', ')}`,
      );
    }
  }

  private createRuntimeTextures() {
    const graphics = this.make.graphics({ x: 0, y: 0 }, false);
    const createWeaponPlaceholder = (
      key: string,
      width: number,
      accent: number,
      options: { longBarrel?: boolean; wideMuzzle?: boolean } = {},
    ) => {
      graphics.clear();
      graphics.fillStyle(0x161b1d);
      graphics.fillRect(2, 3, width - 7, 7);
      graphics.fillStyle(0x3a454a);
      graphics.fillRect(5, 1, Math.floor(width * 0.42), 4);
      graphics.fillStyle(accent);
      graphics.fillRect(8, 4, Math.floor(width * 0.38), 2);
      graphics.fillStyle(0x0b0d0e);
      graphics.fillRect(10, 10, 6, 4);
      graphics.fillRect(0, 5, 6, 5);
      graphics.fillStyle(0x79878d);
      graphics.fillRect(
        width - (options.longBarrel ? 9 : 7),
        options.wideMuzzle ? 3 : 5,
        options.longBarrel ? 9 : 7,
        options.wideMuzzle ? 6 : 3,
      );
      graphics.generateTexture(key, width, 14);
    };

    graphics.fillStyle(0xf4c66d);
    graphics.fillRect(0, 0, 16, 4);
    graphics.fillStyle(0xfff4c7);
    graphics.fillRect(12, 0, 4, 4);
    graphics.generateTexture('bullet-placeholder', 16, 4);

    graphics.clear();
    graphics.fillStyle(0xe45d68);
    graphics.fillRect(0, 0, 38, 52);
    graphics.fillStyle(0x621f2a);
    graphics.fillRect(5, 7, 28, 9);
    graphics.fillStyle(0xffd4d7);
    graphics.fillRect(8, 10, 22, 3);
    graphics.fillStyle(0x9f3544);
    graphics.fillRect(30, 24, 14, 7);
    graphics.generateTexture('enemy-placeholder', 44, 52);

    graphics.clear();
    graphics.fillStyle(0xf08b52);
    graphics.fillRect(0, 8, 48, 44);
    graphics.fillStyle(0x6b2c20);
    graphics.fillRect(5, 14, 38, 11);
    graphics.fillStyle(0xffd29f);
    graphics.fillTriangle(8, 14, 16, 2, 20, 14);
    graphics.fillTriangle(28, 14, 32, 2, 40, 14);
    graphics.fillStyle(0xffe0ba);
    graphics.fillRect(9, 18, 30, 3);
    graphics.generateTexture('melee-enemy-placeholder', 48, 52);

    graphics.clear();
    graphics.fillStyle(0xff5263);
    graphics.fillRect(0, 0, 14, 5);
    graphics.fillStyle(0xffd0d5);
    graphics.fillRect(0, 1, 4, 3);
    graphics.generateTexture('enemy-bullet-placeholder', 14, 5);

    graphics.clear();
    graphics.fillStyle(0x6a4bb0);
    graphics.fillEllipse(24, 20, 44, 20);
    graphics.fillStyle(0xb884ff);
    graphics.fillCircle(24, 14, 9);
    graphics.fillStyle(0x2c1f4d);
    graphics.fillRect(4, 18, 40, 4);
    graphics.generateTexture('flying-enemy-placeholder', 48, 40);

    graphics.clear();
    graphics.fillStyle(0xb884ff);
    graphics.fillCircle(5, 5, 5);
    graphics.fillStyle(0xe6d6ff);
    graphics.fillCircle(5, 5, 2);
    graphics.generateTexture('flying-enemy-bullet-placeholder', 10, 10);

    const createBossPlaceholder = (
      key: string,
      bodyColor: number,
      accentColor: number,
    ) => {
      graphics.clear();
      graphics.fillStyle(0x111719);
      graphics.fillRect(8, 18, 80, 78);
      graphics.fillStyle(bodyColor);
      graphics.fillRect(13, 23, 70, 66);
      graphics.fillStyle(0x070a0b);
      graphics.fillRect(23, 35, 50, 18);
      graphics.fillStyle(accentColor);
      graphics.fillRect(28, 40, 40, 7);
      graphics.fillTriangle(8, 31, 8, 70, 0, 55);
      graphics.fillTriangle(88, 31, 88, 70, 96, 55);
      graphics.fillStyle(0xdbe8ec);
      graphics.fillRect(18, 89, 22, 15);
      graphics.fillRect(56, 89, 22, 15);
      graphics.generateTexture(key, 96, 104);
    };

    for (const config of Object.values(BOSS_COMBAT_CONFIGS)) {
      createBossPlaceholder(
        config.texture,
        config.placeholder.bodyColor,
        config.placeholder.accentColor,
      );
    }

    graphics.clear();
    graphics.fillStyle(0xffe1a8);
    graphics.fillCircle(4, 4, 4);
    graphics.generateTexture('shotgun-pellet-placeholder', 8, 8);

    graphics.clear();
    graphics.fillStyle(0xd5a8ff);
    graphics.fillRect(0, 1, 20, 3);
    graphics.fillStyle(0xffffff);
    graphics.fillRect(14, 0, 6, 5);
    graphics.generateTexture('rail-bolt-placeholder', 20, 5);

    createWeaponPlaceholder('weapon-smg-placeholder', 34, 0xb6ffe4);
    createWeaponPlaceholder('weapon-shotgun-placeholder', 42, 0xf0a35b, {
      wideMuzzle: true,
    });
    createWeaponPlaceholder('weapon-burst-placeholder', 39, 0x8fb8ff, {
      longBarrel: true,
    });
    createWeaponPlaceholder('weapon-rail-placeholder', 48, 0xd5a8ff, {
      longBarrel: true,
    });
    graphics.clear();
    graphics.fillStyle(0x202629);
    graphics.fillRect(0, 0, 64, 64);
    graphics.lineStyle(2, 0x445056);
    graphics.strokeRect(0, 0, 64, 64);
    graphics.generateTexture('floor-placeholder', 64, 64);

    graphics.destroy();
  }

  private createAnimations() {
    this.anims.create({
      key: PLAYER_ANIMATIONS.idle,
      frames: PLAYER_IDLE_FRAMES.map((frame) => ({
        key: PLAYER_ATLAS_KEY,
        frame,
      })),
      duration: 1500,
      repeat: -1,
    });
    this.anims.create({
      key: PLAYER_ANIMATIONS.run,
      frames: PLAYER_RUN_FRAMES.map((frame) => ({
        key: PLAYER_ATLAS_KEY,
        frame,
      })),
      duration: 480,
      repeat: -1,
    });
  }
}
