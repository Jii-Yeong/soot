import Phaser from 'phaser';
import {
  AerialMovementMode,
  type AerialMovementConfig,
} from '@/game/config/aerialMovementConfig';
import { PLAYER_FLIGHT_BOUNDS } from '@/game/config/playerMovementConfig';
import { Enemy, type EnemyProjectileAttack } from '@/game/entities/Enemy';

export type FlyingEnemyConfig = {
  health: number;
  aggroRadius: number;
  hoverY: number;
  trackSpeed: number;
  fireInterval: number;
  muzzleOffset: number;
  movement?: AerialMovementConfig;
};

export class FlyingEnemy extends Enemy {
  readonly aggroRadius: number;
  readonly aggroIndicatorColor = 0xb884ff;
  readonly projectile: { kind: 'flying'; muzzleOffset: number };

  private readonly hoverY: number;
  private readonly trackSpeed: number;
  private readonly fireInterval: number;
  private readonly anchorX: number;
  private readonly movement?: AerialMovementConfig;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    texture: string,
    config: FlyingEnemyConfig,
  ) {
    super(scene, x, y, texture, config.health);

    this.aggroRadius = config.aggroRadius;
    this.hoverY = config.hoverY;
    this.trackSpeed = config.trackSpeed;
    this.fireInterval = config.fireInterval;
    this.anchorX = x;
    this.movement = config.movement;
    this.projectile = { kind: 'flying', muzzleOffset: config.muzzleOffset };

    (this.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);
    // Flyers hover at platform height, so they render in front of terrain
    // (depth 5) instead of being hidden behind it — still under the player (8).
    this.setDepth(6);
  }

  updateCombat(
    time: number,
    target: Phaser.Physics.Arcade.Sprite,
    fireProjectile: EnemyProjectileAttack,
  ) {
    if (!this.active) {
      return false;
    }

    const targetInRange = this.updateRangedAttack(
      time,
      target,
      fireProjectile,
      this.fireInterval,
    );

    // While staggered, let the knockback push it before hover control resumes.
    if (this.isStaggered(time)) {
      if (this.movement) {
        this.clampAerialHeight();
      }
      return targetInRange;
    }

    if (this.movement) {
      this.updateAerialMovement(time, target, targetInRange);
      this.clampAerialHeight();
    } else {
      // Preserve the original stages 1-4 behavior exactly when no strategy is
      // supplied: follow horizontally and return to the configured hover line.
      const horizontalDirection = Math.sign(target.x - this.x);
      this.setVelocityX(
        targetInRange ? horizontalDirection * this.trackSpeed : 0,
      );
      this.seekVertical(this.hoverY);
    }

    return targetInRange;
  }

  private updateAerialMovement(
    time: number,
    target: Phaser.Physics.Arcade.Sprite,
    targetInRange: boolean,
  ) {
    const movement = this.movement;
    if (!movement) {
      return;
    }

    const rangeX = movement.rangeX ?? 110;
    const rangeY = movement.rangeY ?? 45;
    const cycleDuration = movement.cycleDuration ?? 2600;
    const phase = (time / cycleDuration) * Math.PI * 2;

    switch (movement.mode) {
      case AerialMovementMode.HOVER:
        this.seek(
          this.anchorX + Math.sin(phase) * rangeX * 0.25,
          this.hoverY + Math.sin(phase * 1.5) * rangeY,
        );
        break;
      case AerialMovementMode.TRACK:
        this.seek(
          targetInRange ? target.x : this.anchorX,
          targetInRange ? target.y : this.hoverY,
        );
        break;
      case AerialMovementMode.PATROL:
        this.seek(
          this.anchorX + Math.sin(phase) * rangeX,
          this.hoverY + Math.sin(phase * 2) * rangeY,
        );
        break;
      case AerialMovementMode.ORBIT:
        this.seek(
          this.anchorX + Math.cos(phase) * rangeX,
          this.hoverY + Math.sin(phase) * rangeY,
        );
        break;
    }
  }

  private seek(targetX: number, targetY: number) {
    const deltaX = targetX - this.x;
    const deltaY = targetY - this.y;
    const distance = Math.hypot(deltaX, deltaY);
    if (distance < 4) {
      this.setVelocity(0, 0);
      return;
    }

    const speed = Math.min(this.trackSpeed, distance * 4);
    this.setVelocity((deltaX / distance) * speed, (deltaY / distance) * speed);
  }

  private seekVertical(targetY: number) {
    const verticalOffset = targetY - this.y;
    this.setVelocityY(
      Phaser.Math.Clamp(verticalOffset * 4, -this.trackSpeed, this.trackSpeed),
    );
  }

  private clampAerialHeight() {
    this.setY(
      Phaser.Math.Clamp(
        this.y,
        PLAYER_FLIGHT_BOUNDS.minY,
        PLAYER_FLIGHT_BOUNDS.maxY,
      ),
    );
  }
}
