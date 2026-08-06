import Phaser from 'phaser';
import { Enemy } from '@/game/entities/Enemy';
import type { EnemyAttackCoordinator } from '@/game/systems/EnemyAttackCoordinator';
import { FLOOR_SURFACE_Y } from '@/game/systems/FloorBuilder';

const DEATH_FALL_SPEED = 720;
const DEATH_WRECK_HOLD_MS = 400;
const DEATH_FADE_MS = 350;

/** 4스테이지 악마형 잡몹의 공격 순서와 기계 잔해 연출을 공유함. */
export abstract class HallucinatedAndroidEnemy extends Enemy {
  private ownsAttackSlot = false;

  protected constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    texture: string,
    health: number,
    private readonly attackCoordinator: EnemyAttackCoordinator,
  ) {
    super(scene, x, y, texture, health);
    this.setData('stage-four-attacking', false);
  }

  protected tryBeginAttack() {
    if (!this.attackCoordinator.tryAcquire(this)) {
      return false;
    }
    this.ownsAttackSlot = true;
    this.setData('stage-four-attacking', true);
    return true;
  }

  protected finishAttack() {
    if (!this.ownsAttackSlot) {
      return;
    }
    this.attackCoordinator.release(this);
    this.ownsAttackSlot = false;
    this.setData('stage-four-attacking', false);
  }

  protected override onDefeated() {
    super.onDefeated();
    this.finishAttack();
    this.flashMechanicalRemains();
  }

  override destroy(fromScene?: boolean) {
    this.finishAttack();
    super.destroy(fromScene);
  }

  /** 첫 death 자세로 떨어진 뒤 착지 자세를 보여주고 잔해를 제거함. */
  protected playFallingDeath(
    fallAnimation: string,
    landAnimation: string,
    landOffsetY = 0,
  ) {
    (this.body as Phaser.Physics.Arcade.Body).enable = false;
    this.play(fallAnimation, true);
    const restY = FLOOR_SURFACE_Y - this.displayHeight / 2 + landOffsetY;
    const fallDistance = Math.max(0, restY - this.y);
    this.scene.tweens.add({
      targets: this,
      y: this.y + fallDistance,
      duration: Phaser.Math.Clamp(
        (fallDistance / DEATH_FALL_SPEED) * 1_000,
        120,
        900,
      ),
      ease: 'Quad.easeIn',
      onComplete: () => {
        this.play(landAnimation, true);
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

  private flashMechanicalRemains() {
    for (const offset of [-16, 0, 16]) {
      const part = this.scene.add
        .rectangle(this.x + offset, this.y, 9, 5, 0x8fa4a7)
        .setStrokeStyle(1, 0x8fffe0, 0.8)
        .setDepth(this.depth + 1);
      this.scene.tweens.add({
        targets: part,
        x: part.x + offset * 1.8,
        y: part.y + 34 + Math.abs(offset),
        rotation: offset * 0.08,
        alpha: 0,
        duration: 420,
        onComplete: () => part.destroy(),
      });
    }
  }
}
