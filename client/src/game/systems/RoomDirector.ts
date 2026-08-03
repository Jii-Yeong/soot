import Phaser from 'phaser';
import type { RoomConfig } from '@/game/config/roomConfig';
import type { RoomState } from '@/game/state/roomState';

type RoomDoor = {
  view: Phaser.GameObjects.Rectangle;
  body: Phaser.Physics.Arcade.StaticBody;
  playerCollider: Phaser.Physics.Arcade.Collider;
};

type RoomPortal = {
  view: Phaser.GameObjects.Graphics;
  zone: Phaser.GameObjects.Zone;
  body: Phaser.Physics.Arcade.StaticBody;
};

type RoomDirectorOptions = {
  scene: Phaser.Scene;
  player: Phaser.Physics.Arcade.Sprite;
  config: RoomConfig;
  onStateChanged: (state: RoomState) => void;
  onEntranceDetected: () => void;
  onExitRequested: () => void;
};

const ENTRANCE_DETECTOR_OFFSET_X = 200;
const ENTRANCE_DETECTOR_WIDTH = 72;
const PORTAL_WIDTH = 64;
const PORTAL_HEIGHT = 128;
const PORTAL_OVERLAP_PADDING = 28;
/** How far below its resting spot the portal starts before rising into view. */
const PORTAL_RISE = 96;

export class RoomDirector {
  private readonly enemies = new Set<Phaser.GameObjects.GameObject>();
  private readonly scene: Phaser.Scene;
  private readonly player: Phaser.Physics.Arcade.Sprite;
  private readonly config: RoomConfig;
  private readonly onStateChanged: (state: RoomState) => void;
  private readonly onEntranceDetected: () => void;
  private readonly onExitRequested: () => void;
  private readonly exit: RoomDoor;
  private readonly portal: RoomPortal;
  private readonly entranceDetector: Phaser.GameObjects.Zone;
  private readonly entranceOverlap: Phaser.Physics.Arcade.Collider;
  private readonly statusText: Phaser.GameObjects.Text;
  private state: RoomState = 'idle';
  private exitRequested = false;

  constructor(options: RoomDirectorOptions) {
    this.scene = options.scene;
    this.player = options.player;
    this.config = options.config;
    this.onStateChanged = options.onStateChanged;
    this.onEntranceDetected = options.onEntranceDetected;
    this.onExitRequested = options.onExitRequested;

    const detectorX = this.config.entranceX + ENTRANCE_DETECTOR_OFFSET_X;
    this.exit = this.createDoor(this.config.exitX);
    this.entranceDetector = this.createEntranceDetector(detectorX);
    this.entranceOverlap = this.scene.physics.add.overlap(
      this.player,
      this.entranceDetector,
      () => {
        if (this.state === 'idle') {
          this.onEntranceDetected();
        }
      },
    );
    this.portal = this.createPortal(this.config.exitX);
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
    this.entranceOverlap.destroy();
    this.entranceDetector.destroy();
    this.exit.playerCollider.destroy();
    this.scene.tweens.killTweensOf(this.exit.view);
    this.exit.view.destroy();
    this.portal.zone.destroy();
    this.scene.tweens.killTweensOf(this.portal.view);
    this.portal.view.destroy();
    this.statusText.destroy();
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

  private createDoor(x: number): RoomDoor {
    const view = this.scene.add
      .rectangle(
        x,
        this.config.door.y,
        this.config.door.width,
        this.config.door.height,
        0xe45d68,
        0.72,
      )
      .setStrokeStyle(2, 0xffa4ad)
      .setDepth(7);
    this.scene.physics.add.existing(view, true);
    const body = view.body as Phaser.Physics.Arcade.StaticBody;
    const playerCollider = this.scene.physics.add.collider(this.player, view);

    return { view, body, playerCollider };
  }

  private createEntranceDetector(x: number) {
    const detector = this.scene.add.zone(
      x,
      this.scene.scale.height / 2,
      ENTRANCE_DETECTOR_WIDTH,
      this.scene.scale.height,
    );
    this.scene.physics.add.existing(detector, true);
    return detector;
  }

  private createPortal(x: number): RoomPortal {
    const height = Math.min(PORTAL_HEIGHT, this.config.door.height - 16);
    const view = this.scene.add
      .graphics()
      .setPosition(x, this.config.door.y)
      .setDepth(7)
      .setVisible(false)
      .setAlpha(0);
    view.fillStyle(0x163d35, 0.7).fillEllipse(0, 0, PORTAL_WIDTH, height);
    view
      .lineStyle(4, 0xb6ffe4, 0.92)
      .strokeEllipse(0, 0, PORTAL_WIDTH, height);
    view
      .lineStyle(1, 0xffffff, 0.75)
      .strokeEllipse(0, 0, PORTAL_WIDTH - 18, height - 22);

    const zone = this.scene.add.zone(
      x,
      this.config.door.y,
      PORTAL_WIDTH + PORTAL_OVERLAP_PADDING,
      height + PORTAL_OVERLAP_PADDING,
    );
    this.scene.physics.add.existing(zone, true);
    const body = zone.body as Phaser.Physics.Arcade.StaticBody;
    body.enable = false;

    return { view, zone, body };
  }

  /**
   * Called when the player presses up/W: only leaves through an open portal the
   * player is actually standing in, so walking past it no longer transitions.
   */
  tryExit() {
    if (
      this.state !== 'cleared' ||
      this.exitRequested ||
      !this.scene.physics.overlap(this.player, this.portal.zone)
    ) {
      return;
    }

    this.exitRequested = true;
    this.onExitRequested();
  }

  private clearRoom() {
    this.exit.playerCollider.active = false;
    this.exit.body.enable = false;
    this.exit.view.setFillStyle(0xb6ffe4, 0.28).setStrokeStyle(2, 0xb6ffe4);
    this.scene.tweens.add({
      targets: this.exit.view,
      alpha: 0,
      duration: 300,
      onComplete: () => this.exit.view.setVisible(false),
    });
    // Rise into place from below rather than fading in on the spot.
    const restY = this.config.door.y;
    this.portal.body.enable = true;
    this.portal.view
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
        // Settle into a gentle vertical bob once it has arrived.
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
        .setText(`${this.config.label}  //  ${result}  //  ↑ / W TO ENTER PORTAL`)
        .setColor('#b6ffe4');
    }
  }
}
