import Phaser from 'phaser';
import {
  FRONT_ARM,
  FRONT_ARM_SHOULDER_BY_FRAME,
} from '@/game/config/playerRigConfig';
import { PLAYER_STACK_DEPTH } from '@/game/config/renderDepth';
import { solveFrontArmPose } from '@/game/systems/frontArmPose';

const DEFAULT_SHOULDER = {
  x: FRONT_ARM.shoulderFromCentreX,
  y: FRONT_ARM.shoulderFromCentreY,
};

/**
 * The trigger arm.
 *
 * The only piece of the player drawn over the weapon, because it is the only
 * piece in front of it: a hand on a grip wraps the near side. Its elbow is
 * behind the torso and never drawn, which is what lets the forearm be one rigid
 * sprite — whatever the pose cannot account for, the coat hides.
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

  update(weapon: Phaser.GameObjects.Image, mirrored: boolean) {
    // Read at draw time for the same reason the back arm's elbow is: the
    // shoulder belongs to whichever pose is on screen this frame.
    const shoulder =
      FRONT_ARM_SHOULDER_BY_FRAME[this.player.frame.name] ?? DEFAULT_SHOULDER;

    const pose = solveFrontArmPose({
      playerX: this.player.x,
      playerY: this.player.y,
      gripX: weapon.x,
      gripY: weapon.y,
      rotation: weapon.rotation,
      mirrored,
      shoulderFromCentreX: shoulder.x,
      shoulderFromCentreY: shoulder.y,
    });

    this.sprite
      .setVisible(true)
      .setPosition(pose.handX, pose.handY)
      .setRotation(pose.rotation)
      .setFlipY(pose.flipY);
  }
}
