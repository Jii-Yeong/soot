import Phaser from 'phaser';
import {
  PLAYER_ANIMATIONS,
  PLAYER_JUMP_FRAMES,
} from '@/game/config/playerAnimationConfig';
import { gameEvents } from '@/game/events/gameEvents';

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

const JUMP_APEX_VELOCITY_THRESHOLD = 150;
const LANDING_POSE_DURATION = 260;
/** Grace window to still jump just after walking off a ledge. */
const COYOTE_TIME = 90;
/** A jump pressed this long before landing still fires on touchdown. */
const JUMP_BUFFER_TIME = 110;

export class PlayerController {
  private readonly movementKeys: MovementKeys;
  private readonly cursorKeys: Phaser.Types.Input.Keyboard.CursorKeys;
  private dashReadyAt = 0;
  private dashEndsAt = 0;
  private dashDirection = 1;
  private dashing = false;
  private invulnerable = false;
  private lastGroundedAt = 0;
  private jumpBufferedUntil = 0;
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

    if (this.player.body?.blocked.down) {
      this.lastGroundedAt = time;
    }

    const jumpPressed =
      Phaser.Input.Keyboard.JustDown(this.movementKeys.jump) ||
      Phaser.Input.Keyboard.JustDown(this.cursorKeys.up) ||
      Phaser.Input.Keyboard.JustDown(this.cursorKeys.space);

    if (jumpPressed) {
      this.jumpBufferedUntil = time + JUMP_BUFFER_TIME;
    }

    // Coyote time + jump buffer: forgive a jump pressed slightly early or a
    // step after leaving the ledge, so platforming over pits feels responsive.
    const withinCoyoteWindow = time - this.lastGroundedAt <= COYOTE_TIME;
    if (time <= this.jumpBufferedUntil && withinCoyoteWindow) {
      this.player.setVelocityY(-this.config.jumpSpeed);
      this.jumpBufferedUntil = 0;
      this.lastGroundedAt = time - COYOTE_TIME - 1;
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
          ? PLAYER_JUMP_FRAMES.apex
          : PLAYER_JUMP_FRAMES.airborne,
      );
      return;
    }

    if (time < this.landingPoseUntil) {
      this.setPose(PLAYER_JUMP_FRAMES.landing);
      return;
    }

    const isRunning = Math.abs(body?.velocity.x ?? 0) > 1;
    this.playAnimation(
      isRunning ? PLAYER_ANIMATIONS.run : PLAYER_ANIMATIONS.idle,
    );
  }

  private setPose(frameName: string) {
    if (this.currentPose === frameName) {
      return;
    }

    this.currentPose = frameName;
    this.player.anims.stop();
    this.player.setFrame(frameName);
  }

  private playAnimation(animationKey: string) {
    if (this.currentPose === animationKey) {
      return;
    }

    this.currentPose = animationKey;
    this.player.play(animationKey, true);
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
    // Emitted here rather than at the call sites so the keyboard and the
    // right-click dash raise the same cue exactly once.
    gameEvents.emit('player-dashed', this.player.x, this.player.y);

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
