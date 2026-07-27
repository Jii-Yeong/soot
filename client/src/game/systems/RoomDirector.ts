import Phaser from 'phaser';
import type { RoomConfig } from '@/game/config/roomConfig';
import type { RangedEnemy } from '@/game/entities/RangedEnemy';
import type { RoomState } from '@/game/state/roomState';

type RoomDoor = {
  view: Phaser.GameObjects.Rectangle;
  body: Phaser.Physics.Arcade.StaticBody;
};

export class RoomDirector {
  private readonly enemies = new Set<RangedEnemy>();
  private readonly exit: RoomDoor;
  private readonly statusText: Phaser.GameObjects.Text;
  private state: RoomState = 'idle';

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly player: Phaser.Physics.Arcade.Sprite,
    private readonly config: RoomConfig,
    private readonly onStateChanged: (state: RoomState) => void,
  ) {
    this.createDoor(config.entranceX);
    this.exit = this.createDoor(config.exitX);
    this.statusText = scene.add
      .text(scene.scale.width / 2, 154, '', {
        color: '#ff7180',
        fontFamily: 'Arial, sans-serif',
        fontSize: '17px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setDepth(20);
  }

  start(enemies: RangedEnemy[]) {
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

  markEnemyDefeated(enemy: RangedEnemy) {
    if (!this.enemies.delete(enemy) || this.state !== 'locked') {
      return;
    }

    if (this.enemies.size === 0) {
      this.clearRoom();
      return;
    }

    this.statusText.setText(
      `${this.config.label}  //  ${this.enemies.size} HOSTILE REMAINING`,
    );
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
    this.scene.physics.add.collider(this.player, view);

    return { view, body };
  }

  private clearRoom() {
    this.exit.body.enable = false;
    this.exit.view.setFillStyle(0xb6ffe4, 0.28).setStrokeStyle(2, 0xb6ffe4);
    this.scene.tweens.add({
      targets: this.exit.view,
      alpha: 0,
      duration: 300,
      onComplete: () => this.exit.view.setVisible(false),
    });
    this.setState('cleared');
  }

  private setState(state: RoomState) {
    this.state = state;
    this.onStateChanged(state);

    if (state === 'locked') {
      this.statusText.setText(
        `${this.config.label}  //  LOCKDOWN  //  ${this.enemies.size} HOSTILES`,
      );
      return;
    }

    if (state === 'cleared') {
      this.statusText
        .setText(`${this.config.label}  //  CLEAR  //  EXIT UNLOCKED`)
        .setColor('#b6ffe4');
    }
  }
}
