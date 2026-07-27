import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('boot');
  }

  preload() {
    this.load.atlas(
      'player',
      '/assets/player/player.png',
      '/assets/player/player.json',
    );
  }

  create() {
    this.createRuntimeTextures();
    this.createAnimations();
    this.scene.start('title');
  }

  private createRuntimeTextures() {
    const graphics = this.make.graphics({ x: 0, y: 0 }, false);

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
    graphics.fillStyle(0x202629);
    graphics.fillRect(0, 0, 64, 64);
    graphics.lineStyle(2, 0x445056);
    graphics.strokeRect(0, 0, 64, 64);
    graphics.generateTexture('floor-placeholder', 64, 64);

    graphics.destroy();
  }

  private createAnimations() {
    this.anims.create({
      key: 'player-idle',
      frames: [0, 1, 2, 3].map((index) => ({
        key: 'player',
        frame: `shoot-posture ${index}.aseprite`,
      })),
      duration: 1500,
      repeat: -1,
    });
  }
}
