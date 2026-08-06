import Phaser from 'phaser';
import { Enemy } from '@/game/entities/Enemy';
import type { EnemyAttackCoordinator } from '@/game/systems/EnemyAttackCoordinator';

/** 동시에 활성화되는 위험 패턴 수를 제한하는 5스테이지 공중 적 기반 클래스. */
export abstract class CoordinatedAerialEnemy extends Enemy {
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
    (this.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);
    this.setData('stage-five-attacking', false);
  }

  protected tryBeginAttack() {
    if (!this.attackCoordinator.tryAcquire(this)) {
      return false;
    }
    this.ownsAttackSlot = true;
    this.setData('stage-five-attacking', true);
    return true;
  }

  protected finishAttack() {
    if (!this.ownsAttackSlot) {
      return;
    }
    this.attackCoordinator.release(this);
    this.ownsAttackSlot = false;
    this.setData('stage-five-attacking', false);
  }

  /** 지정 위치까지 일정 속도로 이동하고 도착 오차 안에서는 멈춤. */
  protected moveToward(
    x: number,
    y: number,
    speed: number,
    stopDistance = 8,
  ) {
    if (Phaser.Math.Distance.Between(this.x, this.y, x, y) < stopDistance) {
      this.setVelocity(0);
      return;
    }
    this.scene.physics.velocityFromRotation(
      Phaser.Math.Angle.Between(this.x, this.y, x, y),
      speed,
      (this.body as Phaser.Physics.Arcade.Body).velocity,
    );
  }

  /** 화면 안쪽 공격 위치에 도달했는지 확인함. */
  protected isInsideAttackEdge(rightMargin: number) {
    const view = this.scene.cameras.main.worldView;
    return this.x >= view.left && this.x <= view.right - rightMargin;
  }

  protected override onDefeated() {
    super.onDefeated();
    this.finishAttack();
  }

  override destroy(fromScene?: boolean) {
    this.finishAttack();
    super.destroy(fromScene);
  }
}
