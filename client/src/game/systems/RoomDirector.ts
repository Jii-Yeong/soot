import Phaser from 'phaser';
import {
  ROOM_PORTAL_ANIMATION,
  ROOM_PORTAL_HEIGHT,
  ROOM_PORTAL_TEXTURE,
  ROOM_PORTAL_WIDTH,
} from '@/game/config/portalConfig';
import type { RoomConfig } from '@/game/config/roomConfig';
import type { RoomState } from '@/game/state/roomState';

type RoomPortal = {
  view: Phaser.GameObjects.Sprite;
  zone: Phaser.GameObjects.Zone;
  body: Phaser.Physics.Arcade.StaticBody;
};

type RoomDirectorOptions = {
  scene: Phaser.Scene;
  player: Phaser.Physics.Arcade.Sprite;
  config: RoomConfig;
  portalTint?: number;
  onStateChanged: (state: RoomState) => void;
  onExitRequested: () => void;
};

const PORTAL_OVERLAP_PADDING = 28;
/** 포탈이 나타나기 전, 정지 위치보다 얼마나 아래에서 올라오기 시작하는지. */
const PORTAL_RISE = 96;
export class RoomDirector {
  private readonly enemies = new Set<Phaser.GameObjects.GameObject>();
  private readonly scene: Phaser.Scene;
  private readonly player: Phaser.Physics.Arcade.Sprite;
  private readonly config: RoomConfig;
  private readonly portalTint: number;
  private readonly onStateChanged: (state: RoomState) => void;
  private readonly onExitRequested: () => void;
  private readonly portal: RoomPortal;
  private readonly portalPrompt: Phaser.GameObjects.Text;
  private readonly statusText: Phaser.GameObjects.Text;
  private state: RoomState = 'idle';
  private exitRequested = false;

  constructor(options: RoomDirectorOptions) {
    this.scene = options.scene;
    this.player = options.player;
    this.config = options.config;
    this.portalTint = options.portalTint ?? 0xb6ffe4;
    this.onStateChanged = options.onStateChanged;
    this.onExitRequested = options.onExitRequested;
    this.portal = this.createPortal(this.config.exitX);
    this.portalPrompt = this.scene.add
      .text(
        this.config.exitX,
        this.config.portal.y - ROOM_PORTAL_HEIGHT / 2 - 24,
        '[W] ENTER',
        {
          color: '#ffffff',
          backgroundColor: '#070a0bd9',
          fontFamily: 'Arial, sans-serif',
          fontSize: '12px',
          fontStyle: 'bold',
          padding: { x: 6, y: 3 },
        },
      )
      .setOrigin(0.5)
      .setDepth(12)
      .setVisible(false);
    this.statusText = this.scene.add
      .text(this.scene.scale.width / 2, 154, '', {
        color: '#ff7180',
        fontFamily: 'Arial, sans-serif',
        fontSize: '17px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setDepth(20)
      .setScrollFactor(0);
  }

  destroy() {
    this.portal.zone.destroy();
    this.scene.tweens.killTweensOf(this.portal.view);
    this.portal.view.destroy();
    this.portalPrompt.destroy();
    this.statusText.destroy();
  }

  update() {
    this.portalPrompt.setVisible(this.isPlayerAtOpenPortal());
  }

  beginEncounter(enemies: Phaser.GameObjects.GameObject[]) {
    if (this.state !== 'idle') {
      return;
    }

    this.enemies.clear();

    for (const enemy of enemies) {
      if (enemy.active) {
        this.enemies.add(enemy);
      }
    }

    this.setState('locked');

    if (this.enemies.size === 0) {
      this.clearRoom();
    }
  }

  notifyEnemyDefeated(enemy: Phaser.GameObjects.GameObject) {
    if (!this.enemies.delete(enemy) || this.state !== 'locked') {
      return;
    }

    if (this.enemies.size === 0) {
      this.clearRoom();
      return;
    }

    this.updateStatusText();
  }

  private createPortal(x: number): RoomPortal {
    const height = Math.min(
      ROOM_PORTAL_HEIGHT,
      this.config.portal.height - 16,
    );
    const view = this.scene.add
      .sprite(x, this.config.portal.y, ROOM_PORTAL_TEXTURE.key, 0)
      .setDepth(7)
      .setVisible(false)
      .setAlpha(0)
      .setDisplaySize(ROOM_PORTAL_WIDTH, height)
      .setTint(this.portalTint);

    const zone = this.scene.add.zone(
      x,
      this.config.portal.y,
      ROOM_PORTAL_WIDTH + PORTAL_OVERLAP_PADDING,
      height + PORTAL_OVERLAP_PADDING,
    );
    this.scene.physics.add.existing(zone, true);
    const body = zone.body as Phaser.Physics.Arcade.StaticBody;
    body.enable = false;

    return { view, zone, body };
  }

  /**
   * 플레이어가 위/W를 누를 때 호출됨: 실제로 서 있는 열린 포탈로만
   * 나감. 그래서 포탈을 그냥 지나쳐도 더 이상 전환되지 않음.
   */
  tryExit() {
    if (this.exitRequested || !this.isPlayerAtOpenPortal()) {
      return;
    }

    this.exitRequested = true;
    this.onExitRequested();
  }

  private isPlayerAtOpenPortal() {
    return (
      this.state === 'cleared' &&
      this.scene.physics.overlap(this.player, this.portal.zone)
    );
  }

  private clearRoom() {
    // 제자리에서 페이드인하는 대신 아래에서 위로 올라오게 함.
    const restY = this.config.portal.y;
    this.portal.body.enable = true;
    this.portal.view
      .play(ROOM_PORTAL_ANIMATION.key)
      .setVisible(true)
      .setAlpha(0)
      .setScale(0.9, 0.7)
      .setPosition(this.config.exitX, restY + PORTAL_RISE);
    this.scene.tweens.add({
      targets: this.portal.view,
      y: restY,
      alpha: 1,
      scaleX: 1,
      scaleY: 1,
      duration: 360,
      ease: 'Back.easeOut',
      onComplete: () => {
        // 도착한 뒤에는 부드러운 상하 흔들림(bob)으로 정착함.
        this.scene.tweens.add({
          targets: this.portal.view,
          y: restY - 6,
          duration: 900,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut',
        });
      },
    });
    this.setState('cleared');
  }

  private setState(state: RoomState) {
    if (this.state === state) {
      return;
    }

    this.state = state;
    this.onStateChanged(state);
    this.updateStatusText();
  }

  private updateStatusText() {
    if (this.state === 'locked') {
      if (this.config.kind === 'boss') {
        this.statusText.setText(`${this.config.label}  //  BOSS ENGAGED`);
        return;
      }

      const suffix = this.enemies.size === 1 ? 'HOSTILE' : 'HOSTILES';
      this.statusText.setText(
        `${this.config.label}  //  LOCKDOWN  //  ${this.enemies.size} ${suffix}`,
      );
      return;
    }

    if (this.state === 'cleared') {
      const result = this.config.kind === 'boss' ? 'BOSS DEFEATED' : 'CLEAR';
      this.statusText
        .setText(
          `${this.config.label}  //  ${result}  //  ↑ / W TO ENTER PORTAL`,
        )
        .setColor('#b6ffe4');
    }
  }
}
