import Phaser from 'phaser';
import {
  getExposedFaceBounds,
  isExposedFaceHit,
} from '@/game/combat/stageThreeEnemyCombat';
import { BLOCKER_CONFIG } from '@/game/config/stageThreeEnemyConfig';
import {
  Enemy,
  ENEMY_DEPTH,
  type EnemyProjectileAttack,
  type ProjectileDamageResult,
} from '@/game/entities/Enemy';
import { FLOOR_SURFACE_Y } from '@/game/systems/FloorBuilder';
import { GroundedEnemySprite } from '@/game/systems/GroundedEnemySprite';

const POSE = BLOCKER_CONFIG.animations;

type BlockerState = 'advance' | 'windup' | 'recover';

export class BlockerEnemy extends Enemy {
  readonly aggroRadius = BLOCKER_CONFIG.aggroRadius;
  readonly aggroIndicatorColor = 0x9acb83;

  private blockerState: BlockerState = 'advance';
  private stateEndsAt = 0;
  private nextSlamAt = 0;
  private dying = false;
  private readonly rig: GroundedEnemySprite;
  private readonly faceMarker: Phaser.GameObjects.Rectangle;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    private readonly damagePlayer: (damage: number) => void,
  ) {
    super(scene, x, y, BLOCKER_CONFIG.texture, BLOCKER_CONFIG.maxHealth);
    this.rig = new GroundedEnemySprite(this, BLOCKER_CONFIG);
    this.rig.apply();
    this.setDepth(ENEMY_DEPTH);
    const bounds = this.faceBounds;
    this.faceMarker = scene.add
      .rectangle(
        (bounds.left + bounds.right) / 2,
        (bounds.top + bounds.bottom) / 2,
        bounds.right - bounds.left,
        bounds.bottom - bounds.top,
        0x72ff9b,
        0.16,
      )
      .setStrokeStyle(2, 0xa6ffb9, 0.9)
      .setDepth(7);
  }

  updateCombat(
    time: number,
    target: Phaser.Physics.Arcade.Sprite,
    _fireProjectile: EnemyProjectileAttack,
  ) {
    const distance = Math.abs(target.x - this.x);
    const targetInRange = distance <= this.aggroRadius;
    this.setFlipX(target.x < this.x);
    this.positionFaceMarker();

    if (this.blockerState === 'windup') {
      this.setVelocityX(0);
      this.rig.play(POSE.slam);
      this.faceMarker.setFillStyle(0x72ff9b, Math.floor(time / 90) % 2 ? 0.2 : 0.65);
      if (time >= this.stateEndsAt) {
        this.slam(target);
        this.blockerState = 'recover';
        this.stateEndsAt = time + BLOCKER_CONFIG.slamRecoveryDuration;
        this.nextSlamAt = time + BLOCKER_CONFIG.slamCooldown;
      }
      return true;
    }

    if (this.blockerState === 'recover') {
      this.setVelocityX(0);
      this.rig.play(POSE.idle);
      this.faceMarker.setFillStyle(0x72ff9b, 0.72);
      if (time >= this.stateEndsAt) {
        this.blockerState = 'advance';
      }
      return targetInRange;
    }

    this.faceMarker.setFillStyle(0x72ff9b, 0.16);
    if (!targetInRange) {
      this.setVelocityX(0);
      this.rig.play(POSE.idle);
      return false;
    }

    if (distance <= BLOCKER_CONFIG.slamRange && time >= this.nextSlamAt) {
      this.blockerState = 'windup';
      this.stateEndsAt = time + BLOCKER_CONFIG.slamWarningDuration;
      this.setVelocityX(0);
      this.rig.play(POSE.slam);
      return true;
    }

    const direction = Math.sign(target.x - this.x) || 1;
    this.setVelocityX(direction * BLOCKER_CONFIG.moveSpeed);
    this.rig.play(POSE.walk);
    return true;
  }

  override takeProjectileDamage(
    amount: number,
    hitX: number,
    hitY: number,
  ): ProjectileDamageResult {
    if (
      !isExposedFaceHit(
        this.faceBounds,
        hitX,
        hitY,
        BLOCKER_CONFIG.projectileHitTolerance,
      )
    ) {
      this.showShieldImpact(hitX, hitY);
      return { applied: false, defeated: false };
    }
    return super.takeProjectileDamage(amount, hitX, hitY);
  }

  override get playsOwnDeathAnimation() {
    return true;
  }

  override refreshAtlasSprite() {
    this.rig.refresh();
    this.positionFaceMarker();
  }

  override defeat() {
    if (!this.active || this.dying) {
      return;
    }

    this.dying = true;
    this.onDefeated();
    this.rig.playDeath(() => this.disableBody(true, true));
  }

  protected override onDefeated() {
    super.onDefeated();
    if (this.faceMarker.active) {
      this.faceMarker.destroy();
    }
  }

  override destroy(fromScene?: boolean) {
    if (this.faceMarker.active) {
      this.faceMarker.destroy();
    }
    super.destroy(fromScene);
  }

  private get faceBounds() {
    // 발 기준으로 배치된 아틀라스 바디는 스프라이트 중심과 대칭이 아니므로,
    // 노출 바이저(바디 상단)를 실제 물리 바디 top에서 계산한다.
    const body = this.body as Phaser.Physics.Arcade.Body;
    return getExposedFaceBounds({
      enemyX: this.x,
      enemyY: body.top + BLOCKER_CONFIG.bodyHeight / 2,
      bodyWidth: BLOCKER_CONFIG.bodyWidth,
      bodyHeight: BLOCKER_CONFIG.bodyHeight,
      widthRatio: BLOCKER_CONFIG.faceWidthRatio,
      heightRatio: BLOCKER_CONFIG.faceHeightRatio,
    });
  }

  private positionFaceMarker() {
    const bounds = this.faceBounds;
    this.faceMarker.setPosition(
      (bounds.left + bounds.right) / 2,
      (bounds.top + bounds.bottom) / 2,
    );
  }

  private slam(target: Phaser.Physics.Arcade.Sprite) {
    const wave = this.scene.add
      .rectangle(this.x, FLOOR_SURFACE_Y - 7, 50, 12, 0x8cff9d, 0.7)
      .setDepth(9);
    this.scene.tweens.add({
      targets: wave,
      displayWidth: BLOCKER_CONFIG.shockwaveRange * 2,
      alpha: 0,
      duration: 260,
      onComplete: () => wave.destroy(),
    });
    const body = target.body as Phaser.Physics.Arcade.Body;
    const nearFloor = body.blocked.down || body.bottom >= FLOOR_SURFACE_Y - 18;
    if (
      nearFloor &&
      Math.abs(target.x - this.x) <= BLOCKER_CONFIG.shockwaveRange
    ) {
      this.damagePlayer(BLOCKER_CONFIG.shockwaveDamage);
    }
  }

  private showShieldImpact(x: number, y: number) {
    const spark = this.scene.add
      .circle(x, y, 5, 0xb9d5d2, 0.9)
      .setStrokeStyle(2, 0xffffff)
      .setDepth(12);
    this.scene.tweens.add({
      targets: spark,
      scale: 2.4,
      alpha: 0,
      duration: 100,
      onComplete: () => spark.destroy(),
    });
  }
}
