import Phaser from 'phaser';
import {
  Enemy,
  type ProjectileDamageResult,
} from '@/game/entities/Enemy';
import type { EnemyAttackCoordinator } from '@/game/systems/EnemyAttackCoordinator';

/** 4스테이지 악마 환각 아래의 안드로이드 정체를 짧게 드러내는 공용 적. */
export abstract class HallucinatedAndroidEnemy extends Enemy {
  override readonly usesHitFlash = false;
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

  override takeProjectileDamage(
    amount: number,
    hitX: number,
    hitY: number,
  ): ProjectileDamageResult {
    const result = super.takeProjectileDamage(amount, hitX, hitY);
    if (result.applied) {
      this.flashAndroidReality();
    }
    return result;
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

  private flashAndroidReality() {
    this.setTint(0x8fffe0);
    this.scene.time.delayedCall(65, () => {
      if (this.active) {
        this.clearTint();
      }
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
