import Phaser from 'phaser';
import {
  FRONT_ARM,
  FRONT_ARM_SHOULDER_BY_FRAME,
  rigAnchor,
} from '@/game/config/playerRigConfig';
import {
  PLAYER_STACK_DEPTH,
  mirrorScaleY,
} from '@/game/config/renderDepth';
import { solveFrontArmPose } from '@/game/systems/frontArmPose';

const DEFAULT_SHOULDER = {
  x: FRONT_ARM.shoulderFromCentreX,
  y: FRONT_ARM.shoulderFromCentreY,
};

/**
 * The trigger arm, hinged on the shoulder.
 *
 * The only piece of the player drawn over the weapon, because it is the only
 * piece in front of it: the near hand wraps the grip from the camera's side.
 * Like the back arm it reads where the weapon ended up and turns to meet it,
 * and never moves the weapon.
 */
export class FrontArm {
  private readonly sprite: Phaser.GameObjects.Image;

  constructor(
    scene: Phaser.Scene,
    private readonly player: Phaser.Physics.Arcade.Sprite,
  ) {
    this.sprite = scene.add
      .image(player.x, player.y, FRONT_ARM.texture)
      .setOrigin(FRONT_ARM.originX, FRONT_ARM.originY)
      .setDepth(PLAYER_STACK_DEPTH.frontArm);
  }

  hide() {
    this.sprite.setVisible(false);
  }

  update(weapon: Phaser.GameObjects.Image, mirrored: boolean, barrel: number) {
    // Read at draw time for the same reason the back arm's elbow is: the
    // shoulder belongs to whichever pose is on screen this frame.
    const shoulder = rigAnchor(
      DEFAULT_SHOULDER,
      FRONT_ARM_SHOULDER_BY_FRAME,
      this.player.frame.name,
    );

    const pose = solveFrontArmPose({
      playerX: this.player.x,
      playerY: this.player.y,
      gripX: weapon.x,
      gripY: weapon.y,
      rotation: weapon.rotation,
      mirrored,
      barrel,
      shoulderFromCentreX: shoulder.x,
      shoulderFromCentreY: shoulder.y,
    });

    this.sprite
      .setVisible(true)
      .setPosition(pose.shoulderX, pose.shoulderY)
      .setRotation(pose.rotation)
      // By scale, not setFlipY: see mirrorScaleY.
      .setScale(1, mirrorScaleY(pose.flipY));
  }
}
