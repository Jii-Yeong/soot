import Phaser from 'phaser';
import { GAME_HEIGHT } from '@/game/config/gameDimensions';
import {
  canDamageCeilingMaintainer,
  type CeilingMaintainerState,
} from '@/game/combat/stageThreeEnemyCombat';
import type { CeilingPipe } from '@/game/config/roomConfig';
import { CEILING_MAINTAINER_CONFIG } from '@/game/config/stageThreeEnemyConfig';
import {
  Enemy,
  ENEMY_DEPTH,
  type EnemyProjectileAttack,
  type ProjectileDamageResult,
} from '@/game/entities/Enemy';
import { FLOOR_SURFACE_Y } from '@/game/systems/FloorBuilder';

const PIPE_BODY_OFFSET_Y = 50;
const DROP_BLAST_RADIUS = 54;
const GROUND_DASH_TARGET_TOLERANCE = 8;
const GROUND_DASH_TIMEOUT_PADDING = 350;
const GROUND_MARK_DURATION = 1000;
const FLOOR_IDLE_DURATION = 1000;
const CONTACT_COOLDOWN = 700;

export class CeilingMaintainerEnemy extends Enemy {
  readonly aggroRadius = CEILING_MAINTAINER_CONFIG.aggroRadius;
  readonly aggroIndicatorColor = 0x83dc7a;

  private maintainerState: CeilingMaintainerState = 'crawl';
  private stateEndsAt = 0;
  private nextAttackAt = 0;
  private relocateX: number;
  private lockedDropX = 0;
  private warningMarker?: Phaser.GameObjects.Ellipse;
  private groundMarker?: Phaser.GameObjects.Ellipse;
  private activeFragment?: Phaser.GameObjects.Rectangle;
  private dropTween?: Phaser.Tweens.Tween;
  private contactReadyAt = 0;
  private lockedGroundTargetX = 0;
  private groundDashDirection = 1;

  constructor(
    scene: Phaser.Scene,
    x: number,
    pipe: CeilingPipe,
    private readonly damagePlayer: (damage: number) => void,
  ) {
    super(
      scene,
      Phaser.Math.Clamp(x, pipe.x + 50, pipe.x + pipe.width - 50),
      pipe.y + PIPE_BODY_OFFSET_Y,
      CEILING_MAINTAINER_CONFIG.texture,
      CEILING_MAINTAINER_CONFIG.maxHealth,
    );
    this.relocateX = this.x;
    (this.body as Phaser.Physics.Arcade.Body)
      .setAllowGravity(false)
      .setSize(
        CEILING_MAINTAINER_CONFIG.bodyWidth,
        CEILING_MAINTAINER_CONFIG.bodyHeight,
        true,
      );
    this.setScale(CEILING_MAINTAINER_CONFIG.scale);
    this.play(CEILING_MAINTAINER_CONFIG.animations.pipeIdle);
    this.setDepth(ENEMY_DEPTH);
    this.pipe = pipe;
  }

  private readonly pipe: CeilingPipe;

  override refreshAtlasSprite() {
    this.setScale(CEILING_MAINTAINER_CONFIG.scale);
    const anims = CEILING_MAINTAINER_CONFIG.animations;
    const keyByState: Record<CeilingMaintainerState, string> = {
      crawl: anims.pipeIdle,
      warning: anims.warning,
      relocate: anims.pipeMove,
      falling: anims.falling,
      'ground-mark': anims.floorIdle,
      'ground-dash': anims.groundDash,
      'floor-idle': anims.floorIdle,
    };
    this.play(keyByState[this.maintainerState], true);
  }

  updateCombat(
    time: number,
    target: Phaser.Physics.Arcade.Sprite,
    _fireProjectile: EnemyProjectileAttack,
  ) {
    const targetInRange =
      Phaser.Math.Distance.Between(this.x, this.y, target.x, target.y) <=
      this.aggroRadius;

    if (
      this.maintainerState !== 'falling' &&
      this.maintainerState !== 'ground-mark' &&
      this.maintainerState !== 'ground-dash' &&
      this.maintainerState !== 'floor-idle' &&
      this.currentHealth / this.maxHealth <=
        CEILING_MAINTAINER_CONFIG.lowHealthRatio
    ) {
      this.dropFromPipe();
    }

    if (
      this.maintainerState === 'falling' ||
      this.maintainerState === 'ground-mark' ||
      this.maintainerState === 'ground-dash' ||
      this.maintainerState === 'floor-idle'
    ) {
      this.updateGroundRush(time, target);
      return targetInRange;
    }

    this.setFlipX(target.x < this.x);
    // 한 번 시작한 경고와 파이프 재배치는 플레이어가 감지 범위를 벗어나도
    // 끝까지 진행해야 함. 거리 검사를 먼저 하면 이 상태와 애니메이션이
    // 영구 정지해 pipe-move에서 idle로 돌아오지 못함.
    if (this.maintainerState === 'warning') {
      this.setVelocityX(0);
      if (time >= this.stateEndsAt) {
        this.launchDrop(target);
      }
      return true;
    }

    if (this.maintainerState === 'relocate') {
      const direction = Math.sign(this.relocateX - this.x);
      this.setVelocityX(direction * CEILING_MAINTAINER_CONFIG.crawlSpeed);
      if (Math.abs(this.relocateX - this.x) < 8) {
        this.setPosition(this.relocateX, this.pipe.y + PIPE_BODY_OFFSET_Y);
        this.setVelocityX(0);
        this.maintainerState = 'crawl';
        this.play(CEILING_MAINTAINER_CONFIG.animations.pipeIdle, true);
        this.nextAttackAt = time + CEILING_MAINTAINER_CONFIG.attackCooldown;
      }
      return true;
    }

    if (!targetInRange) {
      this.setVelocityX(0);
      return false;
    }

    this.setVelocityX(0);
    if (time >= this.nextAttackAt) {
      this.beginWarning(time, target.x);
    }
    return true;
  }

  override tryContactAttack(time: number) {
    if (
      this.maintainerState !== 'ground-dash' ||
      time < this.contactReadyAt
    ) {
      return null;
    }

    this.contactReadyAt = time + CONTACT_COOLDOWN;
    return CEILING_MAINTAINER_CONFIG.groundDashDamage;
  }

  override takeProjectileDamage(
    amount: number,
    hitX: number,
    hitY: number,
  ): ProjectileDamageResult {
    if (!canDamageCeilingMaintainer(this.maintainerState)) {
      return { applied: false, defeated: false };
    }
    return super.takeProjectileDamage(amount, hitX, hitY);
  }

  protected override onDefeated() {
    super.onDefeated();
    this.clearAttackObjects();
    this.clearTint();
  }

  override destroy(fromScene?: boolean) {
    this.clearAttackObjects();
    super.destroy(fromScene);
  }

  private beginWarning(time: number, targetX: number) {
    this.maintainerState = 'warning';
    this.play(CEILING_MAINTAINER_CONFIG.animations.warning, true);
    this.stateEndsAt = time + CEILING_MAINTAINER_CONFIG.warningDuration;
    this.lockedDropX = targetX;
    this.warningMarker = this.scene.add
      .ellipse(targetX, FLOOR_SURFACE_Y - 4, DROP_BLAST_RADIUS * 2, 18, 0x78ff9c, 0.12)
      .setStrokeStyle(2, 0x78ff9c, 0.9)
      .setDepth(7);
  }

  private launchDrop(target: Phaser.Physics.Arcade.Sprite) {
    this.clearTint();
    const fragment = this.scene.add
      .rectangle(this.x, this.y + 18, 12, 24, 0x8fa4a7)
      .setStrokeStyle(2, 0x9cff9b)
      .setDepth(9);
    this.activeFragment = fragment;
    this.dropTween = this.scene.tweens.add({
      targets: fragment,
      x: this.lockedDropX,
      y: FLOOR_SURFACE_Y - 12,
      rotation: Math.PI * 2,
      duration: 420,
      ease: 'Quad.easeIn',
      onComplete: () => {
        this.dropTween = undefined;
        this.activeFragment = undefined;
        fragment.destroy();
        this.warningMarker?.destroy();
        this.warningMarker = undefined;
        this.flashDropImpact(this.lockedDropX);
        if (
          target.active &&
          Math.abs(target.x - this.lockedDropX) <= DROP_BLAST_RADIUS &&
          target.y > GAME_HEIGHT - 230
        ) {
          this.damagePlayer(CEILING_MAINTAINER_CONFIG.dropDamage);
        }
      },
    });
    this.maintainerState = 'relocate';
    this.play(CEILING_MAINTAINER_CONFIG.animations.pipeMove, true);
    const left = this.pipe.x + 70;
    const right = this.pipe.x + this.pipe.width - 70;
    this.relocateX = this.x < (left + right) / 2 ? right : left;
  }

  private flashDropImpact(x: number) {
    const pulse = this.scene.add
      .ellipse(x, FLOOR_SURFACE_Y - 4, 30, 10, 0x89ff9c, 0.45)
      .setDepth(9);
    this.scene.tweens.add({
      targets: pulse,
      scaleX: 4,
      scaleY: 2,
      alpha: 0,
      duration: 180,
      onComplete: () => pulse.destroy(),
    });
  }

  private dropFromPipe() {
    this.maintainerState = 'falling';
    this.play(CEILING_MAINTAINER_CONFIG.animations.falling, true);
    this.warningMarker?.destroy();
    this.warningMarker = undefined;
    this.setVelocity(0, 80);
    (this.body as Phaser.Physics.Arcade.Body).setAllowGravity(true);
  }

  private updateGroundRush(
    time: number,
    target: Phaser.Physics.Arcade.Sprite,
  ) {
    if (this.maintainerState === 'falling') {
      if (!this.body?.blocked.down) {
        return;
      }
      this.beginGroundMark(time, target.x);
      return;
    }

    if (this.maintainerState === 'floor-idle') {
      this.setVelocityX(0);
      if (time >= this.stateEndsAt) {
        this.beginGroundMark(time, target.x);
      }
      return;
    }

    if (this.maintainerState === 'ground-mark') {
      this.setVelocityX(0);
      if (time < this.stateEndsAt) {
        return;
      }
      this.beginGroundDash(time);
    }

    const body = this.body as Phaser.Physics.Arcade.Body;
    const reachedTarget =
      this.groundDashDirection < 0
        ? this.x <=
          this.lockedGroundTargetX + GROUND_DASH_TARGET_TOLERANCE
        : this.x >=
          this.lockedGroundTargetX - GROUND_DASH_TARGET_TOLERANCE;
    const blockedInDashDirection =
      this.groundDashDirection < 0 ? body.blocked.left : body.blocked.right;
    if (reachedTarget || blockedInDashDirection || time >= this.stateEndsAt) {
      this.beginFloorIdle(time);
      return;
    }
    this.setVelocityX(
      this.groundDashDirection * CEILING_MAINTAINER_CONFIG.groundDashSpeed,
    );
  }

  private beginGroundMark(time: number, targetX: number) {
    this.maintainerState = 'ground-mark';
    this.stateEndsAt = time + GROUND_MARK_DURATION;
    this.lockedGroundTargetX = targetX;
    // 착지 후에는 바닥면을 미끄러지듯 돌진한다. 중력을 꺼 피트 위를 지나도
    // 떨어지지 않게 하고(피트 장벽 충돌도 없음), 지상 높이에 고정한다.
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(false);
    this.setVelocity(0, 0);
    this.play(CEILING_MAINTAINER_CONFIG.animations.floorIdle, true);
    this.groundMarker?.destroy();
    this.groundMarker = this.scene.add
      .ellipse(targetX, FLOOR_SURFACE_Y - 5, 92, 20, 0xff9b62, 0.14)
      .setStrokeStyle(2, 0xffb27b, 0.95)
      .setDepth(7);
  }

  private beginGroundDash(time: number) {
    this.maintainerState = 'ground-dash';
    const distance = Math.abs(this.lockedGroundTargetX - this.x);
    this.stateEndsAt =
      time +
      (distance / CEILING_MAINTAINER_CONFIG.groundDashSpeed) * 1000 +
      GROUND_DASH_TIMEOUT_PADDING;
    this.groundDashDirection =
      Math.sign(this.lockedGroundTargetX - this.x) ||
      (this.flipX ? -1 : 1);
    this.setFlipX(this.groundDashDirection < 0);
    this.groundMarker?.destroy();
    this.groundMarker = undefined;
    this.play(CEILING_MAINTAINER_CONFIG.animations.groundDash, true);
  }

  private beginFloorIdle(time: number) {
    this.maintainerState = 'floor-idle';
    this.stateEndsAt = time + FLOOR_IDLE_DURATION;
    this.setVelocityX(0);
    this.play(CEILING_MAINTAINER_CONFIG.animations.floorIdle, true);
  }

  private clearAttackObjects() {
    this.dropTween?.stop();
    this.dropTween = undefined;
    this.activeFragment?.destroy();
    this.activeFragment = undefined;
    this.warningMarker?.destroy();
    this.warningMarker = undefined;
    this.groundMarker?.destroy();
    this.groundMarker = undefined;
  }
}
