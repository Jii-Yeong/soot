import Phaser from 'phaser';

export type PlayerMovementConfig = {
  moveSpeed: number;
  jumpSpeed: number;
  fastFallSpeed: number;
  dash: {
    speed: number;
    duration: number;
    cooldown: number;
  };
};

type MovementKeys = Record<
  'left' | 'right' | 'jump' | 'down' | 'dash',
  Phaser.Input.Keyboard.Key
>;

// player_jump_down tag (frames 4-6 of the atlas): 4 covers both rise and
// fall, 5 is the apex hang, 6 is a brief landing pose before returning to idle.
const JUMP_RISE_FALL_FRAME = 'shoot-posture-refined 4.png';
const JUMP_APEX_FRAME = 'shoot-posture-refined 5.png';
const JUMP_LANDING_FRAME = 'shoot-posture-refined 6.png';
const JUMP_APEX_VELOCITY_THRESHOLD = 150;
const LANDING_POSE_DURATION = 260;

export class PlayerController {
  private readonly movementKeys: MovementKeys;
  private readonly cursorKeys: Phaser.Types.Input.Keyboard.CursorKeys;
  private dashReadyAt = 0;
  private dashEndsAt = 0;
  private dashDirection = 1;
  private dashing = false;
  private invulnerable = false;
  private wasGrounded = true;
  private landingPoseUntil = 0;
  private currentPose: string | null = null;

  constructor(
    scene: Phaser.Scene,
    private readonly player: Phaser.Physics.Arcade.Sprite,
    private readonly config: PlayerMovementConfig,
  ) {
    const keyboard = scene.input.keyboard;

    if (!keyboard) {
      throw new Error('Keyboard input is required for player controls');
    }

    this.movementKeys = keyboard.addKeys({
      left: Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D,
      jump: Phaser.Input.Keyboard.KeyCodes.W,
      down: Phaser.Input.Keyboard.KeyCodes.S,
      dash: Phaser.Input.Keyboard.KeyCodes.SHIFT,
    }) as MovementKeys;
    this.cursorKeys = keyboard.createCursorKeys();
    scene.input.mouse?.disableContextMenu();
  }

  update(time: number) {
    const movingLeft = this.isMovingLeft();
    const movingRight = this.isMovingRight();

    if (Phaser.Input.Keyboard.JustDown(this.movementKeys.dash)) {
      this.tryDash(time);
    }

    if (this.dashing && time >= this.dashEndsAt) {
      this.finishDash();
    }

    if (this.dashing) {
      this.player.setVelocity(this.config.dash.speed * this.dashDirection, 0);
      return;
    }

    if (movingLeft === movingRight) {
      this.player.setVelocityX(0);
    } else {
      this.player.setVelocityX(
        movingLeft ? -this.config.moveSpeed : this.config.moveSpeed,
      );
      this.player.setFlipX(movingLeft);
    }

    const jumpPressed =
      Phaser.Input.Keyboard.JustDown(this.movementKeys.jump) ||
      Phaser.Input.Keyboard.JustDown(this.cursorKeys.up) ||
      Phaser.Input.Keyboard.JustDown(this.cursorKeys.space);

    if (jumpPressed && this.player.body?.blocked.down) {
      this.player.setVelocityY(-this.config.jumpSpeed);
    }

    if (
      (this.movementKeys.down.isDown || this.cursorKeys.down.isDown) &&
      !this.player.body?.blocked.down &&
      this.player.body!.velocity.y < this.config.fastFallSpeed
    ) {
      this.player.setVelocityY(this.config.fastFallSpeed);
    }

    this.updateAnimation(time);
  }

  private updateAnimation(time: number) {
    const body = this.player.body as Phaser.Physics.Arcade.Body | undefined;
    const grounded = body?.blocked.down ?? false;

    if (!this.wasGrounded && grounded) {
      this.landingPoseUntil = time + LANDING_POSE_DURATION;
    }
    this.wasGrounded = grounded;

    if (!grounded) {
      const velocityY = body?.velocity.y ?? 0;
      this.setPose(
        Math.abs(velocityY) < JUMP_APEX_VELOCITY_THRESHOLD
          ? JUMP_APEX_FRAME
          : JUMP_RISE_FALL_FRAME,
      );
      return;
    }

    if (time < this.landingPoseUntil) {
      this.setPose(JUMP_LANDING_FRAME);
      return;
    }

    if (this.currentPose !== 'player-idle') {
      this.currentPose = 'player-idle';
      this.player.play('player-idle', true);
    }
  }

  private setPose(frameName: string) {
    if (this.currentPose === frameName) {
      return;
    }

    this.currentPose = frameName;
    this.player.anims.stop();
    this.player.setFrame(frameName);
  }

  tryDash(time: number) {
    if (this.dashing || time < this.dashReadyAt) {
      return false;
    }

    const movingLeft = this.isMovingLeft();
    const movingRight = this.isMovingRight();
    this.dashDirection =
      movingLeft === movingRight
        ? this.player.flipX
          ? -1
          : 1
        : movingLeft
          ? -1
          : 1;
    this.dashing = true;
    this.invulnerable = true;
    this.dashEndsAt = time + this.config.dash.duration;
    this.dashReadyAt = time + this.config.dash.cooldown;

    const body = this.player.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(false);
    this.player
      .setVelocity(this.config.dash.speed * this.dashDirection, 0)
      .setTint(0xb6ffe4);

    return true;
  }

  stop() {
    this.finishDash();
    this.player.setVelocity(0);
  }

  get isInvulnerable() {
    return this.invulnerable;
  }

  private finishDash() {
    if (!this.dashing) {
      return;
    }

    this.dashing = false;
    this.invulnerable = false;
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(true);
    this.player.setVelocityX(0).clearTint();
  }

  private isMovingLeft() {
    return this.movementKeys.left.isDown || this.cursorKeys.left.isDown;
  }

  private isMovingRight() {
    return this.movementKeys.right.isDown || this.cursorKeys.right.isDown;
  }
}
