import Phaser from 'phaser';
import {
  AerialMovementMode,
  type AerialMovementConfig,
} from '@/game/config/aerialMovementConfig';
import type { FlyingSpriteConfig } from '@/game/config/flyingEnemyAnimationConfig';
import { PLAYER_FLIGHT_BOUNDS } from '@/game/config/playerMovementConfig';
import {
  Enemy,
  ENEMY_DEPTH,
  type EnemyProjectileAttack,
} from '@/game/entities/Enemy';
import { FLOOR_SURFACE_Y } from '@/game/systems/FloorBuilder';

/** 격추된 비행체가 떨어지는 속도(px/s). 낙하 tween 시간에 사용됨. */
const DEATH_FALL_SPEED = 720;
/** 찌그러진 잔해가 사라지기 전에 바닥에 머무는 시간. */
const DEATH_WRECK_HOLD_MS = 400;
/** 머무름이 끝난 뒤 페이드아웃 시간. */
const DEATH_FADE_MS = 350;

export type FlyingEnemyConfig = {
  health: number;
  aggroRadius: number;
  hoverY: number;
  trackSpeed: number;
  fireInterval: number;
  muzzleOffset: number;
  movement?: AerialMovementConfig;
  sprite?: FlyingSpriteConfig;
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
  private readonly sprite?: FlyingSpriteConfig;
  private inHitPose = false;
  private dying = false;

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
    this.sprite = config.sprite;
    this.projectile = { kind: 'flying', muzzleOffset: config.muzzleOffset };

    (this.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);
    // 비행체는 발판 높이에서 떠다니므로, 지형 뒤에 가려지지 않고 그 앞에
    // 렌더링됨 — 그래도 플레이어(8)보다는 아래.
    this.setDepth(ENEMY_DEPTH);
    this.applySprite();
  }

  /** 실제 아틀라스 프레임에는 여백이 있어, 바디를 드론 크기로 줄임. */
  private applySprite() {
    if (!this.sprite) {
      return;
    }

    this.setScale(this.sprite.scale);
    (this.body as Phaser.Physics.Arcade.Body).setSize(
      this.sprite.bodyWidth,
      this.sprite.bodyHeight,
      true,
    );
    this.play(this.sprite.animations.idle);
  }

  /** 경직 동안 움찔 포즈를 보이고, 이후 idle 호버로 복귀. */
  private updateHitPose(time: number) {
    if (!this.sprite) {
      return;
    }

    const staggered = this.isStaggered(time);
    if (staggered && !this.inHitPose) {
      this.inHitPose = true;
      this.play(this.sprite.animations.hit);
    } else if (!staggered && this.inHitPose) {
      this.inHitPose = false;
      this.play(this.sprite.animations.idle);
    }
  }

  /** 실제 아틀라스 비행체는 팝 잔상 대신 자체 죽음 애니메이션을 재생. */
  override get playsOwnDeathAnimation() {
    return Boolean(this.sprite);
  }

  override defeat() {
    if (!this.active || !this.sprite) {
      super.defeat();
      return;
    }

    this.dying = true;
    this.onDefeated();
    // 전투/충돌을 즉시 중단. 이후 잔해가 tween으로 떨어져 부서지고
    // (물리는 꺼진 채) 오브젝트가 제거됨.
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.enable = false;

    const sprite = this.sprite;
    // 1단계: 바닥으로 떨어지는 동안 첫 death 프레임을 유지.
    this.play(sprite.animations.deathFall);
    const restY = FLOOR_SURFACE_Y - this.displayHeight * 0.3;
    const fallDistance = Math.max(0, restY - this.y);
    this.scene.tweens.add({
      targets: this,
      y: this.y + fallDistance,
      duration: Phaser.Math.Clamp(
        (fallDistance / DEATH_FALL_SPEED) * 1000,
        120,
        900,
      ),
      ease: 'Quad.easeIn',
      onComplete: () => {
        // 2단계: 충돌 시 찌그러지고, 잔해를 잠깐 유지한 뒤 페이드아웃.
        this.play(sprite.animations.deathLand);
        this.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
          this.scene.time.delayedCall(DEATH_WRECK_HOLD_MS, () => {
            if (!this.active) {
              return;
            }
            this.scene.tweens.add({
              targets: this,
              alpha: 0,
              duration: DEATH_FADE_MS,
              ease: 'Sine.easeIn',
              onComplete: () => this.disableBody(true, true),
            });
          });
        });
      },
    });
  }

  updateCombat(
    time: number,
    target: Phaser.Physics.Arcade.Sprite,
    fireProjectile: EnemyProjectileAttack,
  ) {
    if (!this.active || this.dying) {
      return false;
    }

    // 넉백 경직이 유지되는 동안만 움찔함. 그래서 낮은 넉백의 빠른 사격
    // (SMG)은 포즈를 묶지 않고, 샷건/레일 타격은 확실히 흔들리게 함.
    this.updateHitPose(time);

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
