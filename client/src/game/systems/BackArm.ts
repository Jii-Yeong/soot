import Phaser from 'phaser';
import { BACK_ARM } from '@/game/config/playerRigConfig';
import { PLAYER_STACK_DEPTH } from '@/game/config/renderDepth';
import { solveBackArmPose } from '@/game/systems/backArmPose';

/**
 * The support arm, hinged on the elbow.
 *
 * The elbow belongs to the body and the hand belongs to the weapon, so this is
 * the one piece that has to answer to both. It reads where the weapon ended up
 * and turns to meet it; it never moves the weapon.
 */
export class BackArm {
  private readonly sprite: Phaser.GameObjects.Image;

  constructor(
    scene: Phaser.Scene,
    private readonly player: Phaser.Physics.Arcade.Sprite,
  ) {
    this.sprite = scene.add
      .image(player.x, player.y, BACK_ARM.texture)
      .setOrigin(BACK_ARM.originX, BACK_ARM.originY)
      .setDepth(PLAYER_STACK_DEPTH.backArm);
  }

  hide() {
    this.sprite.setVisible(false);
  }

  update(weapon: Phaser.GameObjects.Image, mirrored: boolean, barrel: number) {
    const pose = solveBackArmPose({
      playerX: this.player.x,
      playerY: this.player.y,
      gripX: weapon.x,
      gripY: weapon.y,
      rotation: weapon.rotation,
      mirrored,
      barrel,
    });

    this.sprite
      .setVisible(true)
      .setPosition(pose.elbowX, pose.elbowY)
      .setRotation(pose.rotation)
      .setFlipY(pose.flipY);
  }
}
