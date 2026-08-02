import Phaser from 'phaser';
import {
  BACK_ARM,
  BACK_ARM_ELBOW_BY_FRAME,
} from '@/game/config/playerRigConfig';
import { PLAYER_STACK_DEPTH } from '@/game/config/renderDepth';
import { solveBackArmPose } from '@/game/systems/backArmPose';

const DEFAULT_ELBOW = {
  x: BACK_ARM.elbowFromCentreX,
  y: BACK_ARM.elbowFromCentreY,
};

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
    // The shoulder belongs to whichever pose is on screen this frame, so the
    // anchor is read at draw time rather than fixed when the arm is built.
    const elbow =
      BACK_ARM_ELBOW_BY_FRAME[this.player.frame.name] ?? DEFAULT_ELBOW;

    const pose = solveBackArmPose({
      playerX: this.player.x,
      playerY: this.player.y,
      gripX: weapon.x,
      gripY: weapon.y,
      rotation: weapon.rotation,
      mirrored,
      barrel,
      elbowFromCentreX: elbow.x,
      elbowFromCentreY: elbow.y,
    });

    this.sprite
      .setVisible(true)
      .setPosition(pose.elbowX, pose.elbowY)
      .setRotation(pose.rotation)
      .setFlipY(pose.flipY);
  }
}
