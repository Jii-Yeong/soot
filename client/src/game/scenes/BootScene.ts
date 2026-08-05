import Phaser from 'phaser';
import { resolveAudioAssets } from '@/game/config/audioAssets';
import { MUSIC_CONFIG } from '@/game/config/audioConfig';
import {
  STAGE_ONE_BOSS_ANIMATIONS,
  STAGE_ONE_BOSS_ATLAS_JSON,
  STAGE_ONE_BOSS_ATLAS_KEY,
  STAGE_ONE_BOSS_ATLAS_PNG,
  STAGE_ONE_BOSS_LOOPING_TAGS,
  STAGE_ONE_BOSS_LASER_ASSETS,
  STAGE_ONE_BOSS_TAG_FRAMES,
  STAGE_TWO_BOSS_ANIMATIONS,
  STAGE_TWO_BOSS_ATLAS_JSON,
  STAGE_TWO_BOSS_ATLAS_KEY,
  STAGE_TWO_BOSS_ATLAS_PNG,
  STAGE_TWO_BOSS_LOOPING_TAGS,
  STAGE_TWO_BOSS_TAG_FRAMES,
  STAGE_THREE_BOSS_ANIMATIONS,
  STAGE_THREE_BOSS_ATLAS_JSON,
  STAGE_THREE_BOSS_ATLAS_KEY,
  STAGE_THREE_BOSS_ATLAS_PNG,
  STAGE_THREE_BOSS_LOOPING_TAGS,
  STAGE_THREE_BOSS_TAG_FRAMES,
} from '@/game/config/bossAnimationConfig';
import { BOSS_COMBAT_CONFIGS } from '@/game/config/bossConfig';
import {
  PLAYER_ANIMATIONS,
  PLAYER_ATLAS_KEY,
  PLAYER_IDLE_FRAMES,
  PLAYER_RUN_FRAMES,
} from '@/game/config/playerAnimationConfig';
import { BACK_ARM, FRONT_ARM } from '@/game/config/playerRigConfig';
import {
  ROOM_PORTAL_ANIMATION,
  ROOM_PORTAL_TEXTURE,
} from '@/game/config/portalConfig';
import { UI_PANEL_TEXTURES } from '@/game/config/uiAssetConfig';
import { WEAPON_CONFIGS } from '@/game/config/weaponConfig';

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
    this.load.atlas(
      STAGE_ONE_BOSS_ATLAS_KEY,
      STAGE_ONE_BOSS_ATLAS_PNG,
      STAGE_ONE_BOSS_ATLAS_JSON,
    );
    this.load.atlas(
      STAGE_TWO_BOSS_ATLAS_KEY,
      STAGE_TWO_BOSS_ATLAS_PNG,
      STAGE_TWO_BOSS_ATLAS_JSON,
    );
    this.load.atlas(
      STAGE_THREE_BOSS_ATLAS_KEY,
      STAGE_THREE_BOSS_ATLAS_PNG,
      STAGE_THREE_BOSS_ATLAS_JSON,
    );
    for (const asset of Object.values(STAGE_ONE_BOSS_LASER_ASSETS)) {
      this.load.image(asset.key, asset.url);
    }
    // Four small PNGs, a kilobyte each. They load with the boot batch rather
    // than in the background because the player is holding one the instant the
    // stage starts.
    for (const weapon of WEAPON_CONFIGS) {
      this.load.image(weapon.displayTexture, `/assets/weapons/${weapon.id}.png`);
    }
    for (const panel of Object.values(UI_PANEL_TEXTURES)) {
      this.load.image(panel.key, panel.path);
    }
    this.load.spritesheet(ROOM_PORTAL_TEXTURE.key, ROOM_PORTAL_TEXTURE.path, {
      frameWidth: ROOM_PORTAL_TEXTURE.frameWidth,
      frameHeight: ROOM_PORTAL_TEXTURE.frameHeight,
    });
    this.load.image(BACK_ARM.texture, BACK_ARM.url);
    this.load.image(FRONT_ARM.texture, FRONT_ARM.url);

    const { assets, missingKeys, unusedFiles } = resolveAudioAssets();

    for (const asset of assets) {
      // 타이틀 곡은 후반 스테이지용 선택 자원이 아니라 타이틀 화면의 일부이므로,
      // 타이틀 진입 즉시 재생을 시도할 수 있도록 미리 불러온다. 나머지 음악은
      // AudioDirector에서 지연 로드해 초기 다운로드를 첫 화면과 작은 효과음으로 제한한다.
      if (asset.key in MUSIC_CONFIG && asset.key !== 'bgm-title') {
        continue;
      }

      this.load.audio(asset.key, asset.url);
    }

    this.reportAudioGaps(missingKeys, unusedFiles);
  }

  create() {
    this.createRuntimeTextures();
    this.createAnimations();
    this.scene.start('start');
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

    // One round per weapon, drawn from that weapon's own identity colour. The
    // four weapons used to share three textures, so an SMG burst and a burst
    // rifle volley were indistinguishable in flight.
    for (const weapon of WEAPON_CONFIGS) {
      const { color, tipColor, length, thickness, round } = weapon.projectile;
      graphics.clear();
      if (round) {
        const radius = thickness / 2;
        graphics.fillStyle(color);
        graphics.fillCircle(radius, radius, radius);
        // Lit on the leading side, so a pellet still reads as travelling.
        graphics.fillStyle(tipColor);
        graphics.fillCircle(radius + radius * 0.35, radius, radius * 0.45);
      } else {
        graphics.fillStyle(color);
        graphics.fillRect(0, 0, length, thickness);
        graphics.fillStyle(tipColor);
        graphics.fillRect(length - Math.ceil(length * 0.3), 0, Math.ceil(length * 0.3), thickness);
      }
      graphics.generateTexture(
        weapon.texture,
        round ? thickness : length,
        thickness,
      );
    }

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

    // 4스테이지 사냥개: 악마의 붉은 균열 사이로 민트색 회로가 노출됨.
    graphics.clear();
    graphics.fillStyle(0x160d10);
    graphics.fillEllipse(42, 27, 70, 34);
    graphics.fillTriangle(10, 25, 2, 42, 24, 34);
    graphics.fillTriangle(65, 20, 82, 9, 76, 33);
    graphics.fillStyle(0xd12632);
    graphics.fillRect(24, 22, 34, 4);
    graphics.fillStyle(0x8fffe0);
    graphics.fillRect(36, 21, 12, 2);
    graphics.fillCircle(68, 20, 3);
    graphics.fillStyle(0x312027);
    graphics.fillRect(14, 35, 10, 13);
    graphics.fillRect(58, 35, 10, 13);
    graphics.generateTexture('infernal-hound-placeholder', 84, 48);

    // 처형인형: 찢어진 금속 날개와 뿔 아래 산업용 관절이 남아 있음.
    graphics.clear();
    graphics.fillStyle(0x191116);
    graphics.fillTriangle(20, 34, 0, 52, 22, 70);
    graphics.fillTriangle(52, 34, 72, 52, 50, 70);
    graphics.fillRoundedRect(20, 20, 32, 68, 8);
    graphics.fillTriangle(22, 23, 18, 3, 30, 20);
    graphics.fillTriangle(50, 23, 54, 3, 42, 20);
    graphics.fillStyle(0xc72b36);
    graphics.fillRect(27, 30, 18, 34);
    graphics.fillStyle(0x8fffe0);
    graphics.fillRect(33, 33, 6, 22);
    graphics.fillCircle(36, 26, 3);
    graphics.fillStyle(0x34383b);
    graphics.fillRect(22, 82, 11, 14);
    graphics.fillRect(41, 82, 11, 14);
    graphics.generateTexture('executioner-doll-placeholder', 72, 96);

    // 심판의 눈: 검붉은 후광 안쪽에 카메라 렌즈와 정비 회로가 보임.
    graphics.clear();
    graphics.lineStyle(7, 0x53131b, 0.95);
    graphics.strokeCircle(36, 36, 27);
    graphics.fillStyle(0x171116);
    graphics.fillCircle(36, 36, 23);
    graphics.fillStyle(0xc92b39);
    graphics.fillEllipse(36, 36, 34, 16);
    graphics.fillStyle(0x07090a);
    graphics.fillCircle(36, 36, 8);
    graphics.fillStyle(0x8fffe0);
    graphics.fillCircle(36, 36, 3);
    graphics.fillRect(14, 15, 12, 2);
    graphics.fillRect(47, 55, 11, 2);
    graphics.generateTexture('judgment-eye-placeholder', 72, 72);

    graphics.clear();
    graphics.fillStyle(0x6f0713);
    graphics.fillCircle(5, 5, 5);
    graphics.fillStyle(0xff5b65);
    graphics.fillCircle(5, 5, 2);
    graphics.generateTexture('judgment-eye-bullet-placeholder', 10, 10);

    graphics.clear();
    graphics.fillStyle(0xb884ff);
    graphics.fillCircle(5, 5, 5);
    graphics.fillStyle(0xe6d6ff);
    graphics.fillCircle(5, 5, 2);
    graphics.generateTexture('flying-enemy-bullet-placeholder', 10, 10);

    graphics.clear();
    graphics.fillStyle(0xffffff);
    graphics.fillCircle(7, 7, 7);
    graphics.fillStyle(0xfff4c7);
    graphics.fillCircle(7, 7, 3);
    graphics.generateTexture('architect-bullet-placeholder', 14, 14);

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
      // Bosses with a real atlas (loaded in preload) keep it; only the rest
      // fall back to a generated placeholder.
      if (this.textures.exists(config.texture)) {
        continue;
      }
      createBossPlaceholder(
        config.texture,
        config.placeholder.bodyColor,
        config.placeholder.accentColor,
      );
    }

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
      key: ROOM_PORTAL_ANIMATION.key,
      frames: this.anims.generateFrameNumbers(ROOM_PORTAL_TEXTURE.key, {
        start: 0,
        end: ROOM_PORTAL_TEXTURE.frameCount - 1,
      }),
      frameRate: ROOM_PORTAL_ANIMATION.frameRate,
      repeat: -1,
    });
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
    for (const [tag, frames] of Object.entries(STAGE_ONE_BOSS_TAG_FRAMES) as [
      keyof typeof STAGE_ONE_BOSS_TAG_FRAMES,
      (typeof STAGE_ONE_BOSS_TAG_FRAMES)[keyof typeof STAGE_ONE_BOSS_TAG_FRAMES],
    ][]) {
      this.anims.create({
        key: STAGE_ONE_BOSS_ANIMATIONS[tag],
        frames: frames.map(({ frame, duration }) => ({
          key: STAGE_ONE_BOSS_ATLAS_KEY,
          frame,
          duration,
        })),
        repeat: STAGE_ONE_BOSS_LOOPING_TAGS.has(tag) ? -1 : 0,
      });
    }
    for (const [tag, frames] of Object.entries(STAGE_TWO_BOSS_TAG_FRAMES) as [
      keyof typeof STAGE_TWO_BOSS_TAG_FRAMES,
      (typeof STAGE_TWO_BOSS_TAG_FRAMES)[keyof typeof STAGE_TWO_BOSS_TAG_FRAMES],
    ][]) {
      this.anims.create({
        key: STAGE_TWO_BOSS_ANIMATIONS[tag],
        frames: frames.map(({ frame, duration }) => ({
          key: STAGE_TWO_BOSS_ATLAS_KEY,
          frame,
          duration,
        })),
        repeat: STAGE_TWO_BOSS_LOOPING_TAGS.has(tag) ? -1 : 0,
      });
    }
    for (const [tag, frames] of Object.entries(STAGE_THREE_BOSS_TAG_FRAMES) as [
      keyof typeof STAGE_THREE_BOSS_TAG_FRAMES,
      (typeof STAGE_THREE_BOSS_TAG_FRAMES)[keyof typeof STAGE_THREE_BOSS_TAG_FRAMES],
    ][]) {
      this.anims.create({
        key: STAGE_THREE_BOSS_ANIMATIONS[tag],
        frames: frames.map(({ frame, duration }) => ({
          key: STAGE_THREE_BOSS_ATLAS_KEY,
          frame,
          duration,
        })),
        repeat: STAGE_THREE_BOSS_LOOPING_TAGS.has(tag) ? -1 : 0,
      });
    }
  }
}
