import Phaser from 'phaser';
import { INFERNAL_HOUND_CONFIG } from '@/game/config/stageFourEnemyConfig';
import {
  ENEMY_DEPTH,
  type EnemyProjectileAttack,
} from '@/game/entities/Enemy';
import { HallucinatedAndroidEnemy } from '@/game/entities/HallucinatedAndroidEnemy';
import type { EnemyAttackCoordinator } from '@/game/systems/EnemyAttackCoordinator';
import { FLOOR_SURFACE_Y } from '@/game/systems/FloorBuilder';

type HoundState = 'ready' | 'warning' | 'charging' | 'stunned';
const POSE = INFERNAL_HOUND_CONFIG.animations;

type MagmaTrail = {
  marker: Phaser.GameObjects.Rectangle;
  expiresAt: number;
  nextDamageAt: number;
};

export class InfernalHoundEnemy extends HallucinatedAndroidEnemy {
  readonly aggroRadius = INFERNAL_HOUND_CONFIG.aggroRadius;
  readonly aggroIndicatorColor = 0xff493d;

  private houndState: HoundState = 'ready';
  private stateEndsAt = 0;
  private nextAttackAt = 0;
  private chargeDirection = 1;
  private chargeDamageReady = false;
  private nextTrailAt = 0;
  private readonly warningLine: Phaser.GameObjects.Graphics;
  private readonly trails: MagmaTrail[] = [];
  private dying = false;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    attackCoordinator: EnemyAttackCoordinator,
    private readonly damagePlayer: (damage: number) => void,
  ) {
    super(
      scene,
      x,
      y,
      INFERNAL_HOUND_CONFIG.texture,
      INFERNAL_HOUND_CONFIG.maxHealth,
      attackCoordinator,
    );
    this.setScale(INFERNAL_HOUND_CONFIG.scale);
    this.playPose(POSE.idle);
    (this.body as Phaser.Physics.Arcade.Body)
      .setSize(
        INFERNAL_HOUND_CONFIG.bodyWidth,
        INFERNAL_HOUND_CONFIG.bodyHeight,
      )
      .setOffset(
        INFERNAL_HOUND_CONFIG.bodyOffsetX,
        INFERNAL_HOUND_CONFIG.bodyOffsetY,
      );
    this.setDepth(ENEMY_DEPTH);
    this.warningLine = scene.add.graphics().setDepth(7);
  }

  override get playsOwnDeathAnimation() {
    return true;
  }

  override refreshAtlasSprite() {
    this.setScale(INFERNAL_HOUND_CONFIG.scale);
    this.playPose(
      this.houndState === 'warning' || this.houndState === 'charging'
        ? POSE.attack
        : POSE.idle,
    );
  }

  override defeat() {
    if (!this.active || this.dying) {
      return;
    }
    if (!this.scene.anims.exists(POSE.death)) {
      super.defeat();
      return;
    }

    this.dying = true;
    this.onDefeated();
    (this.body as Phaser.Physics.Arcade.Body).enable = false;
    this.play(POSE.death, true);
    this.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () =>
      this.disableBody(true, true),
    );
  }

  updateCombat(
    time: number,
    target: Phaser.Physics.Arcade.Sprite,
    _fireProjectile: EnemyProjectileAttack,
  ) {
    if (!this.active || this.dying) {
      return false;
    }

    this.updateMagmaTrails(time, target);
    const targetInRange =
      Phaser.Math.Distance.Between(this.x, this.y, target.x, target.y) <=
      this.aggroRadius;

    if (this.houndState === 'warning') {
      this.setVelocityX(0);
      if (time >= this.stateEndsAt) {
        this.beginCharge(time);
      }
      return true;
    }

    if (this.houndState === 'charging') {
      const body = this.body as Phaser.Physics.Arcade.Body;
      const hitEdge =
        this.chargeDirection < 0 ? body.blocked.left : body.blocked.right;
      if (hitEdge || time >= this.stateEndsAt) {
        this.beginStun(time);
      } else {
        this.setVelocityX(
          this.chargeDirection * INFERNAL_HOUND_CONFIG.chargeSpeed,
        );
        if (time >= this.nextTrailAt) {
          this.leaveMagmaTrail(time);
          this.nextTrailAt = time + INFERNAL_HOUND_CONFIG.trailInterval;
        }
      }
      return true;
    }

    if (this.houndState === 'stunned') {
      this.setVelocityX(0);
      if (time >= this.stateEndsAt) {
        this.houndState = 'ready';
        this.playPose(POSE.idle);
        this.finishAttack();
        this.nextAttackAt = time + INFERNAL_HOUND_CONFIG.attackCooldown;
      }
      return targetInRange;
    }

    if (!targetInRange || this.isStaggered(time)) {
      this.setVelocityX(0);
      this.playPose(POSE.idle);
      return targetInRange;
    }

    this.setFlipX(target.x > this.x);
    if (time >= this.nextAttackAt && this.tryBeginAttack()) {
      this.beginWarning(time, target.x);
      return true;
    }

    const direction = Math.sign(target.x - this.x) || 1;
    this.setVelocityX(direction * INFERNAL_HOUND_CONFIG.prowlSpeed);
    this.playPose(POSE.walk);
    return true;
  }

  override tryContactAttack(_time: number) {
    if (this.houndState !== 'charging' || !this.chargeDamageReady) {
      return null;
    }
    this.chargeDamageReady = false;
    return INFERNAL_HOUND_CONFIG.chargeDamage;
  }

  protected override onDefeated() {
    super.onDefeated();
    this.clearAttackObjects();
  }

  override destroy(fromScene?: boolean) {
    this.clearAttackObjects();
    super.destroy(fromScene);
  }

  private beginWarning(time: number, targetX: number) {
    this.houndState = 'warning';
    this.chargeDirection = Math.sign(targetX - this.x) || 1;
    this.setFlipX(this.chargeDirection > 0);
    this.playPose(POSE.attack);
    this.stateEndsAt = time + INFERNAL_HOUND_CONFIG.warningDuration;
    const worldBounds = this.scene.physics.world.bounds;
    const endX =
      this.chargeDirection < 0 ? worldBounds.left : worldBounds.right;
    this.warningLine.clear();
    this.warningLine.lineStyle(4, 0xff2e24, 0.78);
    this.warningLine.lineBetween(
      this.x,
      FLOOR_SURFACE_Y - 7,
      endX,
      FLOOR_SURFACE_Y - 7,
    );
    this.warningLine.lineStyle(1, 0xffb08b, 0.95);
    this.warningLine.lineBetween(
      this.x,
      FLOOR_SURFACE_Y - 10,
      endX,
      FLOOR_SURFACE_Y - 10,
    );
  }

  private beginCharge(time: number) {
    this.houndState = 'charging';
    this.stateEndsAt = time + INFERNAL_HOUND_CONFIG.maxChargeDuration;
    this.chargeDamageReady = true;
    this.nextTrailAt = time;
    this.warningLine.clear();
  }

  private beginStun(time: number) {
    this.houndState = 'stunned';
    this.playPose(POSE.idle);
    this.stateEndsAt = time + INFERNAL_HOUND_CONFIG.stunDuration;
    this.setVelocityX(0);
    this.setAngle(this.chargeDirection * 7);
    this.scene.time.delayedCall(INFERNAL_HOUND_CONFIG.stunDuration, () => {
      if (this.active) {
        this.setAngle(0);
      }
    });
  }

  private leaveMagmaTrail(time: number) {
    const marker = this.scene.add
      .rectangle(this.x, FLOOR_SURFACE_Y - 5, 54, 10, 0xff3f1f, 0.42)
      .setStrokeStyle(1, 0xffa04e, 0.8)
      .setDepth(5);
    this.trails.push({
      marker,
      expiresAt: time + INFERNAL_HOUND_CONFIG.trailLifetime,
      nextDamageAt: time,
    });
  }

  private updateMagmaTrails(
    time: number,
    target: Phaser.Physics.Arcade.Sprite,
  ) {
    const targetBody = target.body as Phaser.Physics.Arcade.Body;
    for (let index = this.trails.length - 1; index >= 0; index -= 1) {
      const trail = this.trails[index];
      if (time >= trail.expiresAt) {
        trail.marker.destroy();
        this.trails.splice(index, 1);
        continue;
      }
      trail.marker.setAlpha(
        0.42 * ((trail.expiresAt - time) / INFERNAL_HOUND_CONFIG.trailLifetime),
      );
      const standingInTrail =
        Math.abs(target.x - trail.marker.x) <= trail.marker.width / 2 &&
        targetBody.bottom >= FLOOR_SURFACE_Y - 22;
      if (standingInTrail && time >= trail.nextDamageAt) {
        this.damagePlayer(INFERNAL_HOUND_CONFIG.trailDamage);
        trail.nextDamageAt = time + INFERNAL_HOUND_CONFIG.trailDamageCooldown;
      }
    }
  }

  private clearAttackObjects() {
    this.warningLine.clear();
    if (this.warningLine.active) {
      this.warningLine.destroy();
    }
    for (const trail of this.trails) {
      trail.marker.destroy();
    }
    this.trails.length = 0;
  }

  private playPose(pose: string) {
    if (this.scene.anims.exists(pose)) {
      this.play(pose, true);
    }
  }
}
