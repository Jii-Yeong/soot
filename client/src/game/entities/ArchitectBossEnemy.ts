import Phaser from "phaser";
import {
  clampPatternTarget,
  damageBeforeThreshold,
  getFanAngles,
  getRingAngles,
} from "@/game/combat/architectPattern";
import type {
  ArchitectBossCombatConfig,
  ArchitectBossPatternConfig,
} from "@/game/config/bossConfig";
import { GAME_HEIGHT } from "@/game/config/gameDimensions";
import { BossEnemy } from "@/game/entities/BossEnemy";
import type { EnemyProjectileAttack } from "@/game/entities/Enemy";
import type { BossPhase } from "@/game/state/bossPhase";
import type { BossArenaBounds } from "@/game/entities/InfernalBossEnemy";

type ArchitectState =
  | "recover"
  | "phase-transition"
  | "halo-warning"
  | "halo-firing"
  | "wings"
  | "eye-tracking"
  | "eye-locked"
  | "eye-wait"
  | "eye-active"
  | "salvation-transition"
  | "salvation-rings"
  | "core-exposed";

type ArchitectAttack = "halo" | "wings" | "eye" | "chorus";
type EffectCleanup = () => void;

const PHASE_ONE_SEQUENCE: readonly ArchitectAttack[] = ["halo", "wings", "eye"];
const PHASE_TWO_SEQUENCE: readonly ArchitectAttack[] = [
  "eye",
  "halo",
  "wings",
  "chorus",
];
const BULLET_TEXTURE = "architect-bullet-placeholder";
const BULLET_DEPTH = 9;
const EFFECT_DEPTH = 7;
const UI_EFFECT_DEPTH = 24;
const PLAYER_HURTBOX_SIZE = 16;

/**
 * Stage-5 final boss. Every pattern is built for unrestricted flight:
 * readable ring gaps, alternating wing fans, and baitable judgment orbs.
 * At 10% health damage is clamped until False Salvation exposes the eye.
 */
export class ArchitectBossEnemy extends BossEnemy<ArchitectBossPatternConfig> {
  private readonly bullets: Phaser.Physics.Arcade.Group;
  private readonly bulletOverlap: Phaser.Physics.Arcade.Collider;
  private readonly hurtbox: Phaser.GameObjects.Zone;
  private readonly hurtboxMarker: Phaser.GameObjects.Arc;
  private readonly telegraph: Phaser.GameObjects.Graphics;
  private readonly phaseOverlay: Phaser.GameObjects.Graphics;
  private readonly haloGlow: Phaser.GameObjects.Ellipse;
  private readonly eyeGlow: Phaser.GameObjects.Arc;
  private readonly effectCleanups = new Set<EffectCleanup>();

  private attackState: ArchitectState = "recover";
  private stateStartedAt = 0;
  private stateEndsAt: number;
  private phaseTwo = false;
  private phaseOneAttackIndex = 0;
  private phaseTwoAttackIndex = 0;

  private haloRingsToFire = 0;
  private haloRingsFired = 0;
  private nextHaloRingAt = 0;
  private haloGapAngle = 0;
  private haloFollowUpWings = false;

  private wingStep = 0;
  private wingFinalStep = 2;
  private nextWingStepAt = 0;

  private eyeShotsRemaining = 0;
  private lockedTargetX = 0;
  private lockedTargetY = 0;

  private salvationPending = false;
  private salvationStarted = false;
  private salvationCenterX = 0;
  private salvationCenterY = 0;
  private salvationGapAngle = 0;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    texture: string,
    config: ArchitectBossCombatConfig,
    private readonly damagePlayer: (damage: number) => void,
    private readonly arena: BossArenaBounds,
    private readonly onPhaseChanged: (phase: BossPhase) => void,
  ) {
    super(scene, x, y, texture, config);

    this.stateEndsAt = scene.time.now + config.pattern.firstAttackDelay;
    (this.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);
    this.setDepth(6);

    this.bullets = scene.physics.add.group({
      classType: Phaser.Physics.Arcade.Image,
      maxSize: 180,
      allowGravity: false,
    });
    this.hurtbox = scene.add.zone(
      0,
      0,
      PLAYER_HURTBOX_SIZE,
      PLAYER_HURTBOX_SIZE,
    );
    scene.physics.add.existing(this.hurtbox);
    const hurtboxBody = this.hurtbox.body as Phaser.Physics.Arcade.Body;
    hurtboxBody.setAllowGravity(false);
    hurtboxBody.setImmovable(true);
    this.bulletOverlap = scene.physics.add.overlap(
      this.bullets,
      this.hurtbox,
      this.handleBulletHit,
    );

    this.hurtboxMarker = scene.add
      .circle(0, 0, 3, config.pattern.skyColor, 0.9)
      .setStrokeStyle(1, 0xffffff, 0.8)
      .setDepth(BULLET_DEPTH + 1);
    this.telegraph = scene.add.graphics().setDepth(EFFECT_DEPTH);
    this.phaseOverlay = scene.add
      .graphics()
      .setDepth(UI_EFFECT_DEPTH)
      .setScrollFactor(0);
    this.haloGlow = scene.add
      .ellipse(x, y - 68, 118, 34, config.pattern.goldColor, 0.16)
      .setStrokeStyle(4, config.pattern.goldColor, 0.85)
      .setDepth(EFFECT_DEPTH);
    this.eyeGlow = scene.add
      .circle(x, y, 16, config.pattern.skyColor, 0.82)
      .setStrokeStyle(3, 0xffffff, 0.75)
      .setDepth(EFFECT_DEPTH + 1);

    this.onPhaseChanged(1);
  }

  updateCombat(
    time: number,
    target: Phaser.Physics.Arcade.Sprite,
    _fireProjectile: EnemyProjectileAttack,
  ) {
    this.syncPlayerHurtbox(target);
    this.updateBullets(time);
    this.syncBossEffects(time);
    this.telegraph.clear();

    if (!this.active) {
      return false;
    }

    const targetInRange =
      Phaser.Math.Distance.Between(this.x, this.y, target.x, target.y) <=
      this.aggroRadius;
    if (!targetInRange) {
      this.setVelocity(0, 0);
      return false;
    }

    if (this.salvationPending && !this.salvationStarted) {
      this.beginFalseSalvation(time, target);
    } else if (
      !this.phaseTwo &&
      this.isEnraged &&
      this.attackState === "recover"
    ) {
      this.beginPhaseTransition(time);
    }

    switch (this.attackState) {
      case "recover":
        this.updateRecover(time, target);
        break;
      case "phase-transition":
        this.updatePhaseTransition(time);
        break;
      case "halo-warning":
        this.updateHaloWarning(time);
        break;
      case "halo-firing":
        this.updateHaloFiring(time, target);
        break;
      case "wings":
        this.updateWings(time, target);
        break;
      case "eye-tracking":
        this.updateEyeTracking(time, target);
        break;
      case "eye-locked":
        this.updateEyeLocked(time, target);
        break;
      case "eye-wait":
        this.updateEyeWait(time, target);
        break;
      case "eye-active":
        if (time >= this.stateEndsAt) {
          this.beginRecover(time);
        }
        break;
      case "salvation-transition":
        this.updateSalvationTransition(time);
        break;
      case "salvation-rings":
        if (time >= this.stateEndsAt) {
          this.exposeCore();
        }
        break;
      case "core-exposed":
        this.drawExposedCore(time);
        this.setVelocity(0, 0);
        break;
    }

    this.clampBossPosition();
    return true;
  }

  override takeDamage(amount: number) {
    if (this.salvationStarted && this.attackState !== "core-exposed") {
      return false;
    }

    if (!this.salvationStarted) {
      const allowedDamage = damageBeforeThreshold(
        this.currentHealth,
        this.maxHealth,
        this.pattern.salvationHealthRatio,
        amount,
      );
      const defeated =
        allowedDamage > 0 ? super.takeDamage(allowedDamage) : false;
      if (
        this.currentHealth / this.maxHealth <=
        this.pattern.salvationHealthRatio
      ) {
        this.salvationPending = true;
      }
      return defeated;
    }

    return super.takeDamage(
      amount * this.pattern.salvation.coreDamageMultiplier,
    );
  }

  override tryContactAttack(time: number) {
    if (
      this.attackState === "phase-transition" ||
      this.attackState === "salvation-transition" ||
      this.attackState === "salvation-rings" ||
      this.attackState === "core-exposed"
    ) {
      return null;
    }
    return super.tryContactAttack(time);
  }

  protected override onDefeated() {
    super.onDefeated();
    this.clearBullets();
    this.clearEffects();
    this.telegraph.clear();
    this.phaseOverlay.clear();
    this.haloGlow.setVisible(false);
    this.eyeGlow.setVisible(false);
    this.hurtboxMarker.setVisible(false);
    this.spawnHeavenShatter();
    this.scene.cameras.main.flash(750, 255, 250, 235);
  }

  override destroy(fromScene?: boolean) {
    this.clearEffects();
    if (this.bulletOverlap.world) {
      this.bulletOverlap.destroy();
    }
    this.bullets.destroy(true);
    this.hurtbox.destroy();
    this.hurtboxMarker.destroy();
    this.telegraph.destroy();
    this.phaseOverlay.destroy();
    this.haloGlow.destroy();
    this.eyeGlow.destroy();
    super.destroy(fromScene);
  }

  private updateRecover(time: number, target: Phaser.Physics.Arcade.Sprite) {
    this.moveTowardArenaCenter();
    this.clearTint();
    this.eyeGlow.setAlpha(this.phaseTwo ? 0.95 : 0.82);

    if (time < this.stateEndsAt) {
      return;
    }

    const sequence = this.phaseTwo ? PHASE_TWO_SEQUENCE : PHASE_ONE_SEQUENCE;
    const index = this.phaseTwo
      ? this.phaseTwoAttackIndex++
      : this.phaseOneAttackIndex++;
    this.beginAttack(sequence[index % sequence.length], time, target);
  }

  private beginAttack(
    attack: ArchitectAttack,
    time: number,
    target: Phaser.Physics.Arcade.Sprite,
  ) {
    switch (attack) {
      case "halo":
        this.beginHalo(time, target, false);
        break;
      case "wings":
        this.beginWings(time);
        break;
      case "eye":
        this.beginEye(time, target, true);
        break;
      case "chorus":
        this.beginHalo(time, target, true);
        break;
    }
  }

  private beginPhaseTransition(time: number) {
    this.phaseTwo = true;
    this.onPhaseChanged(2);
    this.attackState = "phase-transition";
    this.stateStartedAt = time;
    this.stateEndsAt = time + this.pattern.phaseTransitionDuration;
    this.setVelocity(0, 0);
    this.setTint(0xd4c6e8);
    this.haloGlow
      .setFillStyle(this.pattern.corruptionColor, 0.35)
      .setStrokeStyle(4, this.pattern.goldColor, 0.7)
      .setRotation(-0.14);
    this.scene.cameras.main.flash(260, 210, 224, 255);
    this.scene.cameras.main.shake(420, 0.009);
  }

  private updatePhaseTransition(time: number) {
    this.setVelocity(0, 0);
    this.drawRealityCracks(time);
    this.eyeGlow
      .setFillStyle(this.pattern.skyColor, 1)
      .setScale(1 + Math.sin(time * 0.025) * 0.2);

    if (time >= this.stateEndsAt) {
      this.eyeGlow.setScale(1);
      this.phaseOverlay.clear();
      this.clearTint();
      this.beginRecover(time);
    }
  }

  private beginHalo(
    time: number,
    target: Phaser.Physics.Arcade.Sprite,
    followWithWings: boolean,
  ) {
    this.attackState = "halo-warning";
    this.stateStartedAt = time;
    this.stateEndsAt = time + this.pattern.halo.warnDuration;
    this.haloRingsToFire = followWithWings
      ? 1
      : this.phaseTwo
        ? this.pattern.halo.phaseTwoRings
        : this.pattern.halo.phaseOneRings;
    this.haloRingsFired = 0;
    this.haloFollowUpWings = followWithWings;
    this.haloGapAngle = Phaser.Math.Angle.Between(
      this.x,
      this.y - 64,
      target.x,
      target.y,
    );
    this.setVelocity(0, 0);
  }

  private updateHaloWarning(time: number) {
    this.setVelocity(0, 0);
    const progress = this.stateProgress(time);
    const pulse = 0.45 + progress * 0.5;
    this.haloGlow.setAlpha(pulse).setScale(1 + Math.sin(time * 0.02) * 0.06);
    this.telegraph
      .lineStyle(4, this.pattern.goldColor, pulse)
      .strokeCircle(this.x, this.y - 64, 72 + progress * 12)
      .lineStyle(5, this.pattern.skyColor, 0.9)
      .lineBetween(
        this.x,
        this.y - 64,
        this.x + Math.cos(this.haloGapAngle) * 92,
        this.y - 64 + Math.sin(this.haloGapAngle) * 92,
      );

    if (time >= this.stateEndsAt) {
      this.attackState = "halo-firing";
      this.nextHaloRingAt = time;
    }
  }

  private updateHaloFiring(time: number, target: Phaser.Physics.Arcade.Sprite) {
    this.setVelocity(0, 0);

    if (
      this.haloRingsFired < this.haloRingsToFire &&
      time >= this.nextHaloRingAt
    ) {
      this.fireHaloRing();
      this.haloRingsFired += 1;
      this.nextHaloRingAt = time + this.pattern.halo.ringInterval;
    }

    if (
      this.haloRingsFired >= this.haloRingsToFire &&
      time >= this.nextHaloRingAt
    ) {
      this.haloGlow.setScale(1);
      if (this.haloFollowUpWings) {
        this.beginWings(time, 2, 2);
      } else {
        this.beginRecover(time);
      }
      this.haloGapAngle = Phaser.Math.Angle.RotateTo(
        this.haloGapAngle,
        Phaser.Math.Angle.Between(this.x, this.y, target.x, target.y),
        this.pattern.halo.gapStep,
      );
    }
  }

  private fireHaloRing() {
    const originY = this.y - 64;
    const angles = getRingAngles(
      this.pattern.halo.bulletCount,
      this.haloGapAngle,
      this.pattern.halo.gapWidth,
    );
    for (let index = 0; index < angles.length; index += 1) {
      this.spawnBullet(
        this.x,
        originY,
        angles[index],
        this.pattern.projectile.speed,
        this.pattern.halo.damage,
        this.phaseTwo && index % 5 === 0
          ? this.pattern.corruptionColor
          : this.pattern.goldColor,
      );
    }

    this.haloGapAngle += this.pattern.halo.gapStep;
    this.scene.cameras.main.shake(70, 0.003);
  }

  private beginWings(time: number, firstStep = 0, finalStep = 2) {
    this.attackState = "wings";
    this.stateStartedAt = time;
    this.wingStep = firstStep;
    this.wingFinalStep = finalStep;
    this.nextWingStepAt = time + this.pattern.wings.warnDuration;
    this.setVelocity(0, 0);
  }

  private updateWings(time: number, target: Phaser.Physics.Arcade.Sprite) {
    this.setVelocity(0, 0);

    if (this.wingStep <= this.wingFinalStep) {
      this.drawWingWarning(time, this.wingStep);
    }

    if (time < this.nextWingStepAt) {
      return;
    }

    if (this.wingStep > this.wingFinalStep) {
      this.beginRecover(time);
      return;
    }

    this.fireWingVolley(this.wingStep, target);
    this.wingStep += 1;
    this.nextWingStepAt =
      time +
      (this.wingStep > this.wingFinalStep
        ? this.pattern.wings.recoveryDuration
        : this.pattern.wings.stepInterval);
  }

  private drawWingWarning(time: number, step: number) {
    const pulse = 0.4 + Math.sin(time * 0.025) * 0.18;
    this.telegraph.fillStyle(this.pattern.goldColor, pulse);
    if (step === 0 || step === 2) {
      this.telegraph.fillTriangle(
        this.x - 40,
        this.y - 20,
        this.x - 155,
        this.y - 105,
        this.x - 125,
        this.y + 80,
      );
    }
    if (step === 1 || step === 2) {
      this.telegraph.fillTriangle(
        this.x + 40,
        this.y - 20,
        this.x + 155,
        this.y - 105,
        this.x + 125,
        this.y + 80,
      );
    }
  }

  private fireWingVolley(step: number, target: Phaser.Physics.Arcade.Sprite) {
    const targetAngle = Phaser.Math.Angle.Between(
      this.x,
      this.y,
      target.x,
      target.y,
    );

    if (step < 2) {
      const side = step === 0 ? -1 : 1;
      this.fireFan(
        this.x + side * 72,
        this.y,
        targetAngle,
        this.pattern.wings.bulletCount,
      );
    } else {
      this.fireFan(
        this.x - 72,
        this.y,
        targetAngle - this.pattern.wings.simultaneousSeparation,
        this.pattern.wings.simultaneousBulletCount,
      );
      this.fireFan(
        this.x + 72,
        this.y,
        targetAngle + this.pattern.wings.simultaneousSeparation,
        this.pattern.wings.simultaneousBulletCount,
      );
    }

    this.scene.cameras.main.shake(80, 0.0035);
  }

  private fireFan(
    x: number,
    y: number,
    centerAngle: number,
    bulletCount: number,
  ) {
    const angles = getFanAngles(
      centerAngle,
      bulletCount,
      this.pattern.wings.spread,
    );
    for (let index = 0; index < angles.length; index += 1) {
      const isOuter = index === 0 || index === angles.length - 1;
      this.spawnBullet(
        x,
        y,
        angles[index],
        this.pattern.wings.speed,
        this.pattern.wings.damage,
        this.phaseTwo && index % 4 === 0
          ? this.pattern.corruptionColor
          : isOuter
            ? this.pattern.skyColor
            : this.pattern.goldColor,
      );
    }
  }

  private beginEye(
    time: number,
    target: Phaser.Physics.Arcade.Sprite,
    resetShots: boolean,
  ) {
    if (resetShots) {
      this.eyeShotsRemaining = this.phaseTwo ? 2 : 1;
    }
    this.attackState = "eye-tracking";
    this.stateStartedAt = time;
    this.stateEndsAt = time + this.pattern.eye.trackingDuration;
    this.updateLockedTarget(target);
    this.setVelocity(0, 0);
  }

  private updateEyeTracking(
    time: number,
    target: Phaser.Physics.Arcade.Sprite,
  ) {
    this.setVelocity(0, 0);
    this.updateLockedTarget(target);
    const pulse = 0.55 + Math.sin(time * 0.03) * 0.2;
    this.telegraph
      .lineStyle(3, this.pattern.skyColor, pulse)
      .strokeCircle(
        this.lockedTargetX,
        this.lockedTargetY,
        46 - this.stateProgress(time) * 18,
      )
      .lineStyle(1, 0xffffff, 0.65)
      .lineBetween(
        this.eyeGlow.x,
        this.eyeGlow.y,
        this.lockedTargetX,
        this.lockedTargetY,
      );

    if (time >= this.stateEndsAt) {
      this.attackState = "eye-locked";
      this.stateStartedAt = time;
      this.stateEndsAt = time + this.pattern.eye.lockedWarningDuration;
      this.scene.cameras.main.flash(90, 120, 220, 255);
    }
  }

  private updateEyeLocked(time: number, target: Phaser.Physics.Arcade.Sprite) {
    this.setVelocity(0, 0);
    const pulse = 0.65 + Math.sin(time * 0.045) * 0.25;
    this.telegraph
      .fillStyle(this.pattern.goldColor, 0.12)
      .fillCircle(
        this.lockedTargetX,
        this.lockedTargetY,
        this.pattern.eye.orbRadius,
      )
      .lineStyle(4, this.pattern.goldColor, pulse)
      .strokeCircle(
        this.lockedTargetX,
        this.lockedTargetY,
        this.pattern.eye.orbRadius,
      );

    if (time >= this.stateEndsAt) {
      this.fireEyeOrb(target);
      this.eyeShotsRemaining -= 1;
      this.stateStartedAt = time;
      if (this.eyeShotsRemaining > 0) {
        this.attackState = "eye-wait";
        this.stateEndsAt = time + this.pattern.eye.phaseTwoFollowUpDelay;
      } else {
        this.attackState = "eye-active";
        this.stateEndsAt = time + this.pattern.eye.orbDuration;
      }
    }
  }

  private updateEyeWait(time: number, target: Phaser.Physics.Arcade.Sprite) {
    this.setVelocity(0, 0);
    if (time >= this.stateEndsAt) {
      this.beginEye(time, target, false);
    }
  }

  private updateLockedTarget(target: Phaser.Physics.Arcade.Sprite) {
    const targetPosition = clampPatternTarget(target.x, target.y, {
      minX: this.arena.left + 60,
      maxX: this.arena.right - 60,
      minY: this.pattern.aerial.minY,
      maxY: this.pattern.aerial.maxY,
    });
    this.lockedTargetX = targetPosition.x;
    this.lockedTargetY = targetPosition.y;
  }

  private fireEyeOrb(target: Phaser.Physics.Arcade.Sprite) {
    if (
      Phaser.Math.Distance.Between(
        target.x,
        target.y,
        this.lockedTargetX,
        this.lockedTargetY,
      ) <= this.pattern.eye.orbRadius
    ) {
      this.damagePlayer(this.pattern.eye.directDamage);
    }

    this.spawnJudgmentOrb(this.lockedTargetX, this.lockedTargetY);
    for (let index = 0; index < this.pattern.eye.splitBulletCount; index += 1) {
      const angle = (index / this.pattern.eye.splitBulletCount) * Math.PI * 2;
      this.spawnBullet(
        this.lockedTargetX,
        this.lockedTargetY,
        angle,
        this.pattern.projectile.speed * 0.9,
        this.pattern.eye.splitDamage,
        this.phaseTwo && index % 3 === 0
          ? this.pattern.corruptionColor
          : this.pattern.skyColor,
      );
    }
    this.scene.cameras.main.shake(120, 0.005);
  }

  private spawnJudgmentOrb(x: number, y: number) {
    let orb: Phaser.GameObjects.Arc | undefined = this.scene.add
      .circle(x, y, this.pattern.eye.orbRadius, this.pattern.skyColor, 0.24)
      .setStrokeStyle(4, this.pattern.goldColor, 0.85)
      .setDepth(EFFECT_DEPTH);
    let cleaned = false;
    const timer = this.scene.time.delayedCall(
      this.pattern.eye.orbDuration,
      () => cleanup(),
    );
    const cleanup = () => {
      if (cleaned) {
        return;
      }
      cleaned = true;
      timer.remove(false);
      orb?.destroy();
      orb = undefined;
      this.effectCleanups.delete(cleanup);
    };
    this.effectCleanups.add(cleanup);
  }

  private beginFalseSalvation(
    time: number,
    target: Phaser.Physics.Arcade.Sprite,
  ) {
    this.salvationStarted = true;
    this.salvationPending = false;
    this.clearBullets();
    this.clearEffects();
    this.telegraph.clear();
    this.attackState = "salvation-transition";
    this.stateStartedAt = time;
    this.stateEndsAt = time + this.pattern.salvation.transitionDuration;
    const center = clampPatternTarget(target.x, target.y, {
      minX: this.arena.left + 220,
      maxX: this.arena.right - 220,
      minY: this.pattern.aerial.minY + 70,
      maxY: this.pattern.aerial.maxY - 70,
    });
    this.salvationCenterX = center.x;
    this.salvationCenterY = center.y;
    this.salvationGapAngle =
      center.x < (this.arena.left + this.arena.right) / 2 ? Math.PI : 0;
    this.setTint(this.pattern.goldColor);
    this.scene.cameras.main.flash(600, 255, 224, 135);
    this.scene.cameras.main.shake(500, 0.01);
  }

  private updateSalvationTransition(time: number) {
    this.moveToward(
      (this.arena.left + this.arena.right) / 2,
      (this.pattern.aerial.minY + this.pattern.aerial.maxY) / 2,
      this.pattern.aerial.moveSpeed * 1.6,
    );
    const progress = this.stateProgress(time);
    this.phaseOverlay
      .clear()
      .fillStyle(this.pattern.goldColor, progress * 0.32)
      .fillRect(
        0,
        0,
        this.scene.cameras.main.width,
        this.scene.cameras.main.height,
      );
    this.telegraph
      .lineStyle(5, this.pattern.goldColor, 0.8)
      .strokeCircle(
        this.salvationCenterX,
        this.salvationCenterY,
        70 + progress * 170,
      );

    if (time >= this.stateEndsAt) {
      this.setPosition(
        (this.arena.left + this.arena.right) / 2,
        (this.pattern.aerial.minY + this.pattern.aerial.maxY) / 2,
      );
      this.setVelocity(0, 0);
      this.beginSalvationRings(time);
    }
  }

  private beginSalvationRings(time: number) {
    this.attackState = "salvation-rings";
    this.stateStartedAt = time;
    this.stateEndsAt = time + this.pattern.salvation.ringDuration;
    this.phaseOverlay.clear();

    for (
      let ringIndex = 0;
      ringIndex < this.pattern.salvation.ringCount;
      ringIndex += 1
    ) {
      const radius =
        this.pattern.salvation.innerRadius +
        ringIndex * this.pattern.salvation.radiusStep;
      const angles = getRingAngles(
        this.pattern.salvation.bulletCount,
        this.salvationGapAngle,
        this.pattern.salvation.gapWidth,
      );
      for (const angle of angles) {
        this.spawnBullet(
          this.salvationCenterX + Math.cos(angle) * radius,
          this.salvationCenterY + Math.sin(angle) * radius,
          angle,
          this.pattern.salvation.bulletSpeed,
          this.pattern.salvation.damage,
          ringIndex % 2 === 0 ? this.pattern.goldColor : this.pattern.skyColor,
        );
      }
    }
  }

  private exposeCore() {
    this.attackState = "core-exposed";
    this.clearBullets();
    this.clearTint();
    this.eyeGlow
      .setFillStyle(0xffffff, 1)
      .setStrokeStyle(5, this.pattern.skyColor, 1)
      .setScale(1.55);
    this.haloGlow
      .setFillStyle(this.pattern.corruptionColor, 0.5)
      .setStrokeStyle(3, this.pattern.skyColor, 0.5)
      .setRotation(-0.28);
    this.scene.cameras.main.flash(260, 255, 255, 255);
  }

  private drawExposedCore(time: number) {
    const pulse = 0.65 + Math.sin(time * 0.035) * 0.25;
    this.telegraph
      .lineStyle(5, this.pattern.skyColor, pulse)
      .strokeCircle(this.x, this.y, 34 + pulse * 10)
      .lineStyle(2, 0xffffff, pulse)
      .strokeCircle(this.x, this.y, 52 + pulse * 12);
  }

  private beginRecover(time: number) {
    this.attackState = "recover";
    this.stateStartedAt = time;
    this.stateEndsAt =
      time +
      (this.phaseTwo
        ? this.pattern.enragedRecoveryDuration
        : this.pattern.recoveryDuration);
    this.setVelocity(0, 0);
    this.telegraph.clear();
    this.haloGlow.setAlpha(0.8).setScale(1);
  }

  private spawnBullet(
    x: number,
    y: number,
    angle: number,
    speed: number,
    damage: number,
    color: number,
  ) {
    const bullet = this.bullets.get(
      x,
      y,
      BULLET_TEXTURE,
    ) as Phaser.Physics.Arcade.Image | null;
    if (!bullet) {
      return;
    }

    bullet
      .enableBody(true, x, y, true, true)
      .setActive(true)
      .setVisible(true)
      .setTint(color)
      .setRotation(angle)
      .setDepth(BULLET_DEPTH)
      .setData("damage", damage)
      .setData(
        "expiresAt",
        this.scene.time.now + this.pattern.projectile.lifetime,
      );
    const body = bullet.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(false);
    body.setCircle(this.pattern.projectile.radius);
    this.scene.physics.velocityFromRotation(angle, speed, body.velocity);
  }

  private updateBullets(time: number) {
    for (const child of this.bullets.getChildren()) {
      const bullet = child as Phaser.Physics.Arcade.Image;
      if (!bullet.active || (bullet.getData("expiresAt") as number) <= time) {
        if (bullet.active) {
          bullet.disableBody(true, true);
        }
        continue;
      }

      if (
        bullet.x < this.arena.left - 120 ||
        bullet.x > this.arena.right + 120 ||
        bullet.y < -120 ||
        bullet.y > GAME_HEIGHT + 120
      ) {
        bullet.disableBody(true, true);
      }
    }
  }

  private readonly handleBulletHit: Phaser.Types.Physics.Arcade.ArcadePhysicsCallback =
    (firstObject, secondObject) => {
      const bullet =
        firstObject instanceof Phaser.Physics.Arcade.Image
          ? firstObject
          : (secondObject as Phaser.Physics.Arcade.Image);
      if (!bullet.active) {
        return;
      }

      const damage = (bullet.getData("damage") as number) ?? 0;
      bullet.disableBody(true, true);
      this.damagePlayer(damage);
    };

  private clearBullets() {
    for (const child of this.bullets.getChildren()) {
      (child as Phaser.Physics.Arcade.Image).disableBody(true, true);
    }
  }

  private clearEffects() {
    for (const cleanup of Array.from(this.effectCleanups)) {
      cleanup();
    }
  }

  private syncPlayerHurtbox(target: Phaser.Physics.Arcade.Sprite) {
    this.hurtbox.setPosition(target.x, target.y);
    this.hurtboxMarker.setPosition(target.x, target.y);
  }

  private syncBossEffects(time: number) {
    this.haloGlow
      .setPosition(this.x, this.y - 68)
      .setRotation(
        this.phaseTwo ? -0.14 + Math.sin(time * 0.001) * 0.05 : time * 0.0004,
      );
    this.eyeGlow.setPosition(this.x, this.y);
  }

  private moveTowardArenaCenter() {
    this.moveToward(
      (this.arena.left + this.arena.right) / 2,
      (this.pattern.aerial.minY + this.pattern.aerial.maxY) / 2,
      this.pattern.aerial.moveSpeed,
    );
  }

  private moveToward(targetX: number, targetY: number, speed: number) {
    const deltaX = targetX - this.x;
    const deltaY = targetY - this.y;
    const distance = Math.hypot(deltaX, deltaY);
    if (distance < 8) {
      this.setVelocity(0, 0);
      return;
    }
    this.setVelocity(
      (deltaX / distance) * Math.min(speed, distance * 3),
      (deltaY / distance) * Math.min(speed, distance * 3),
    );
  }

  private clampBossPosition() {
    this.setPosition(
      Phaser.Math.Clamp(this.x, this.arena.left + 70, this.arena.right - 70),
      Phaser.Math.Clamp(
        this.y,
        this.pattern.aerial.minY,
        this.pattern.aerial.maxY,
      ),
    );
  }

  private drawRealityCracks(time: number) {
    const pulse = 0.4 + Math.sin(time * 0.025) * 0.22;
    const width = this.scene.cameras.main.width;
    const height = this.scene.cameras.main.height;
    this.phaseOverlay
      .clear()
      .fillStyle(this.pattern.corruptionColor, 0.08)
      .fillRect(0, 0, width, height)
      .lineStyle(3, this.pattern.skyColor, pulse)
      .lineBetween(0, height * 0.28, width * 0.34, height * 0.48)
      .lineBetween(width * 0.34, height * 0.48, width * 0.22, height * 0.82)
      .lineBetween(width, height * 0.22, width * 0.66, height * 0.46)
      .lineBetween(width * 0.66, height * 0.46, width * 0.78, height * 0.86);
  }

  private spawnHeavenShatter() {
    for (let index = 0; index < 14; index += 1) {
      const angle = (index / 14) * Math.PI * 2;
      const shard = this.scene.add
        .rectangle(
          this.x,
          this.y,
          8 + (index % 3) * 5,
          18 + (index % 4) * 6,
          index % 2 === 0 ? this.pattern.goldColor : this.pattern.skyColor,
          0.9,
        )
        .setRotation(angle)
        .setDepth(EFFECT_DEPTH + 2);
      this.scene.tweens.add({
        targets: shard,
        x: this.x + Math.cos(angle) * (160 + (index % 4) * 45),
        y: this.y + Math.sin(angle) * (120 + (index % 3) * 50),
        rotation: angle + Math.PI,
        alpha: 0,
        duration: 900,
        ease: "Quad.easeOut",
        onComplete: () => shard.destroy(),
      });
    }
  }

  private stateProgress(time: number) {
    return Phaser.Math.Clamp(
      (time - this.stateStartedAt) /
        Math.max(1, this.stateEndsAt - this.stateStartedAt),
      0,
      1,
    );
  }

  private get isEnraged() {
    return (
      this.currentHealth / this.maxHealth <= this.pattern.enrageHealthRatio
    );
  }

  private get pattern() {
    return this.config.pattern;
  }
}
