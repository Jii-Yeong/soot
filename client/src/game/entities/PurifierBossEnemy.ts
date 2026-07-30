import Phaser from 'phaser';
import type {
  PurifierBossPatternConfig,
  PurifierBossCombatConfig,
} from '@/game/config/bossConfig';
import { getSlamLeapVelocity } from '@/game/combat/slamLeap';
import { BossEnemy } from '@/game/entities/BossEnemy';
import type { EnemyProjectileAttack } from '@/game/entities/Enemy';
import { FLOOR_SURFACE_Y } from '@/game/systems/FloorBuilder';

type PurifierState =
  | 'recover'
  | 'grab-warn'
  | 'grab-strike'
  | 'grab-hold'
  | 'slam-warn'
  | 'slam-leap'
  | 'slam-strike'
  | 'vacuum-warn'
  | 'vacuum-active';

type PlayerDamageHandler = (damage: number) => void;
/** Drags the player until it overlaps the boss; see PlayerController.applyGrab. */
type PlayerGrabHandler = (bossX: number, bossHalfWidth: number) => void;
type PlayerPullHandler = (bossX: number, pullSpeed: number) => void;

const TELEGRAPH_DEPTH = 7;
const SHOCKWAVE_DEPTH = 6;
const MARKER_HEIGHT = 74;
const LANDING_GRACE_DURATION = 400;

/**
 * Stage-3 boss (the purification enforcer). v1 of the capture/crush kit:
 *
 * - Impurity collection: warns on the player's ground spot, then the claw
 *   strikes it. A grounded player caught there takes a hit and is dragged into
 *   the boss — where its own contact damage "collects" them (moderate, on a
 *   cooldown, and escapable with a dash, so never a one-shot stunlock).
 * - Waste compaction: marks the player's position, leaps toward it, then sends
 *   two green pressure waves along the floor on landing; move off the marker
 *   and jump the waves.
 * - Contaminant intake: pulls the player from anywhere in the arena. Keep
 *   running away from the boss to resist the flow.
 */
export class PurifierBossEnemy extends BossEnemy<PurifierBossPatternConfig> {
  private readonly telegraph: Phaser.GameObjects.Graphics;
  private readonly waveCleanups = new Set<() => void>();
  private attackState: PurifierState = 'recover';
  private stateStartedAt = 0;
  private stateEndsAt: number;
  private grabTargetX = 0;
  private grabResolved = false;
  private grabHit = false;
  private slamTargetX = 0;
  private slamHasLeftGround = false;
  // Open with the clearly marked leap before introducing grab and vacuum.
  private attackIndex = 1;
  private playerTarget?: Phaser.Physics.Arcade.Sprite;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    texture: string,
    config: PurifierBossCombatConfig,
    private readonly damagePlayer: PlayerDamageHandler,
    private readonly grabPlayer: PlayerGrabHandler,
    private readonly pullPlayer: PlayerPullHandler,
  ) {
    super(scene, x, y, texture, config);

    this.stateEndsAt = scene.time.now + config.pattern.firstAttackDelay;
    this.telegraph = scene.add.graphics().setDepth(TELEGRAPH_DEPTH);
  }

  updateCombat(
    time: number,
    target: Phaser.Physics.Arcade.Sprite,
    _fireProjectile: EnemyProjectileAttack,
  ) {
    this.playerTarget = target;

    if (!this.active) {
      this.telegraph.clear();
      return false;
    }

    const inRange =
      Phaser.Math.Distance.Between(this.x, this.y, target.x, target.y) <=
      this.aggroRadius;
    if (!inRange) {
      this.setVelocityX(0);
      this.telegraph.clear();
      return false;
    }

    switch (this.attackState) {
      case 'recover':
        this.updateRecover(time, target);
        break;
      case 'grab-warn':
        this.updateGrabWarn(time);
        break;
      case 'grab-strike':
        this.updateGrabStrike(time, target);
        break;
      case 'grab-hold':
        this.updateGrabHold(time);
        break;
      case 'slam-warn':
        this.updateSlamWarn(time, target);
        break;
      case 'slam-leap':
        this.updateSlamLeap(time);
        break;
      case 'slam-strike':
        this.updateSlamStrike(time);
        break;
      case 'vacuum-warn':
        this.updateVacuumWarn(time, target);
        break;
      case 'vacuum-active':
        this.updateVacuumActive(time, target);
        break;
    }

    return true;
  }

  protected override onDefeated() {
    super.onDefeated();
    this.telegraph.clear();
    this.clearTint();
    this.clearWaves();
  }

  override destroy(fromScene?: boolean) {
    this.telegraph.destroy();
    this.clearWaves();
    super.destroy(fromScene);
  }

  private updateRecover(time: number, target: Phaser.Physics.Arcade.Sprite) {
    this.telegraph.clear();
    this.clearTint();
    this.moveToPreferredDistance(time, target);

    if (time >= this.stateEndsAt) {
      // Rotate all three patterns so the same one never runs back to back.
      switch (this.attackIndex % 3) {
        case 0:
          this.beginGrabWarn(time, target);
          break;
        case 1:
          this.beginSlamWarn(time, target);
          break;
        case 2:
          this.beginVacuumWarn(time);
          break;
      }
      this.attackIndex += 1;
    }
  }

  private beginGrabWarn(time: number, target: Phaser.Physics.Arcade.Sprite) {
    this.attackState = 'grab-warn';
    this.stateStartedAt = time;
    this.stateEndsAt = time + this.pattern.grab.warnDuration;
    // Mark where the player stands now — moving off the spot dodges it.
    this.grabTargetX = target.x;
    this.setFlipX(target.x < this.x);
  }

  private updateGrabWarn(time: number) {
    this.setVelocityX(0);
    this.drawGroundMarker(
      this.grabTargetX,
      this.pattern.grab.reach,
      this.stateProgress(time),
    );

    if (time >= this.stateEndsAt) {
      this.attackState = 'grab-strike';
      this.stateStartedAt = time;
      this.stateEndsAt = time + this.pattern.grab.strikeDuration;
      this.grabResolved = false;
    }
  }

  private updateGrabStrike(time: number, target: Phaser.Physics.Arcade.Sprite) {
    this.setVelocityX(0);
    this.drawGroundMarker(this.grabTargetX, this.pattern.grab.reach, 1);

    if (!this.grabResolved) {
      this.grabResolved = true;
      this.grabHit = this.tryGrab(target);
    }

    if (time >= this.stateEndsAt) {
      if (this.grabHit) {
        this.attackState = 'grab-hold';
        this.stateStartedAt = time;
        this.stateEndsAt = time + this.pattern.grab.holdDuration;
        this.telegraph.clear();
      } else {
        this.beginRecover(time);
      }
    }
  }

  /** Holds still while the caught player is dragged in, so they actually reach us. */
  private updateGrabHold(time: number) {
    this.setVelocityX(0);
    if (time >= this.stateEndsAt) {
      this.beginRecover(time);
    }
  }

  private tryGrab(target: Phaser.Physics.Arcade.Sprite) {
    const body = target.body as Phaser.Physics.Arcade.Body | null;
    const grounded = body?.blocked.down ?? false;
    const halfReach = this.pattern.grab.reach / 2 + (body ? body.width / 2 : 20);

    // Airborne players slip the claw; only a grounded target in the zone is caught.
    if (grounded && Math.abs(target.x - this.grabTargetX) <= halfReach) {
      this.damagePlayer(this.pattern.grab.damage);
      this.grabPlayer(this.x, this.displayWidth / 2);
      return true;
    }
    return false;
  }

  private beginSlamWarn(
    time: number,
    target: Phaser.Physics.Arcade.Sprite,
  ) {
    this.attackState = 'slam-warn';
    this.stateStartedAt = time;
    this.stateEndsAt = time + this.pattern.slam.warnDuration;
    this.slamTargetX = target.x;
  }

  private updateSlamWarn(
    time: number,
    target: Phaser.Physics.Arcade.Sprite,
  ) {
    this.setVelocityX(0);
    // Track the player during the warning, then lock this spot at takeoff.
    this.slamTargetX = target.x;
    this.setTint(this.pattern.telegraphColor);
    this.drawGroundMarker(
      this.slamTargetX,
      this.pattern.slam.landingRadius * 2,
      this.stateProgress(time),
    );

    if (time >= this.stateEndsAt) {
      this.beginSlamLeap(time);
    }
  }

  private beginSlamLeap(time: number) {
    const leap = getSlamLeapVelocity({
      originX: this.x,
      targetX: this.slamTargetX,
      launchSpeedY: this.pattern.slam.launchSpeedY,
      gravityY: this.scene.physics.world.gravity.y,
      maxTravelSpeedX: this.pattern.slam.maxTravelSpeedX,
    });

    this.attackState = 'slam-leap';
    this.stateStartedAt = time;
    this.stateEndsAt =
      time + leap.flightDurationMs + LANDING_GRACE_DURATION;
    this.slamHasLeftGround = false;
    this.setFlipX(leap.velocityX < 0);
    this.setVelocity(leap.velocityX, leap.velocityY);
  }

  private updateSlamLeap(time: number) {
    const body = this.body as Phaser.Physics.Arcade.Body;
    this.drawGroundMarker(
      this.slamTargetX,
      this.pattern.slam.landingRadius * 2,
      1,
    );

    if (!body.blocked.down) {
      this.slamHasLeftGround = true;
    }

    if (this.slamHasLeftGround && body.blocked.down) {
      this.beginSlamStrike(time);
      return;
    }

    // A collision or knockback should not leave the boss drifting forever.
    if (time >= this.stateEndsAt) {
      this.setVelocityX(0);
      this.setVelocityY(
        Math.max(body.velocity.y, this.pattern.slam.launchSpeedY),
      );
    }
  }

  private beginSlamStrike(time: number) {
    this.attackState = 'slam-strike';
    this.stateStartedAt = time;
    this.stateEndsAt = time + this.pattern.slam.strikeDuration;
    this.setVelocity(0);
    this.clearTint();
    this.telegraph.clear();
    this.scene.cameras.main.shake(180, 0.012);
    this.spawnShockwave(-1);
    this.spawnShockwave(1);
  }

  private updateSlamStrike(time: number) {
    this.setVelocityX(0);
    if (time >= this.stateEndsAt) {
      this.beginRecover(time);
    }
  }

  private beginVacuumWarn(time: number) {
    this.attackState = 'vacuum-warn';
    this.stateStartedAt = time;
    this.stateEndsAt = time + this.pattern.vacuum.warnDuration;
    this.setVelocityX(0);
  }

  private updateVacuumWarn(
    time: number,
    target: Phaser.Physics.Arcade.Sprite,
  ) {
    this.setVelocityX(0);
    this.setTint(this.pattern.telegraphColor);
    this.drawVacuumFlow(time, target, this.stateProgress(time) * 0.45);

    if (time >= this.stateEndsAt) {
      this.attackState = 'vacuum-active';
      this.stateStartedAt = time;
      this.stateEndsAt = time + this.pattern.vacuum.duration;
    }
  }

  private updateVacuumActive(
    time: number,
    target: Phaser.Physics.Arcade.Sprite,
  ) {
    this.setVelocityX(0);
    this.drawVacuumFlow(time, target, 1);
    this.pullPlayer(
      this.x,
      this.isEnraged
        ? this.pattern.vacuum.enragedPullSpeed
        : this.pattern.vacuum.pullSpeed,
    );

    if (time >= this.stateEndsAt) {
      this.beginRecover(time);
    }
  }

  private beginRecover(time: number) {
    this.attackState = 'recover';
    this.stateEndsAt =
      time +
      (this.isEnraged
        ? this.pattern.enragedRecoveryDuration
        : this.pattern.recoveryDuration);
    this.telegraph.clear();
    this.clearTint();
  }

  private spawnShockwave(direction: number) {
    const slam = this.pattern.slam;
    const wave = this.scene.add
      .rectangle(
        this.x + direction * 70,
        FLOOR_SURFACE_Y - slam.shockwaveHeight / 2,
        slam.shockwaveWidth,
        slam.shockwaveHeight,
        this.pattern.telegraphColor,
        0.55,
      )
      .setStrokeStyle(2, 0xffffff, 0.5)
      .setDepth(SHOCKWAVE_DEPTH);
    this.scene.physics.add.existing(wave);
    const body = wave.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(false);
    body.setVelocityX(direction * slam.shockwaveSpeed);

    let hit = false;
    let cleaned = false;
    const cleanup = () => {
      if (cleaned) {
        return;
      }
      cleaned = true;
      this.scene.physics.world.removeCollider(overlap);
      timer.remove(false);
      this.waveCleanups.delete(cleanup);
      wave.destroy();
    };
    const overlap = this.scene.physics.add.overlap(
      wave,
      this.playerTarget as Phaser.Physics.Arcade.Sprite,
      () => {
        const targetBody = this.playerTarget?.body as
          | Phaser.Physics.Arcade.Body
          | undefined;
        // Only a grounded player is caught; jumping clears the low wave.
        if (!hit && targetBody?.blocked.down) {
          hit = true;
          this.damagePlayer(slam.shockwaveDamage);
        }
      },
    );
    const timer = this.scene.time.delayedCall(
      (slam.shockwaveRange / slam.shockwaveSpeed) * 1000,
      cleanup,
    );
    this.waveCleanups.add(cleanup);
  }

  private clearWaves() {
    for (const cleanup of Array.from(this.waveCleanups)) {
      cleanup();
    }
  }

  private drawGroundMarker(x: number, width: number, intensity: number) {
    const top = FLOOR_SURFACE_Y - MARKER_HEIGHT;
    this.telegraph
      .clear()
      .fillStyle(this.pattern.telegraphColor, 0.12 + intensity * 0.4)
      .fillRect(x - width / 2, top, width, MARKER_HEIGHT)
      .lineStyle(2, this.pattern.telegraphColor, 0.4 + intensity * 0.5)
      .strokeRect(x - width / 2, top, width, MARKER_HEIGHT);
  }

  private drawVacuumFlow(
    time: number,
    target: Phaser.Physics.Arcade.Sprite,
    intensity: number,
  ) {
    const direction = Math.sign(this.x - target.x) || 1;
    const intakeX = this.x - direction * this.displayWidth * 0.35;
    const intakeY = this.y;
    const particleCount = 8;

    this.telegraph
      .clear()
      .lineStyle(3, this.pattern.telegraphColor, 0.18 + intensity * 0.28)
      .lineBetween(target.x, target.y, intakeX, intakeY)
      .lineStyle(2, this.pattern.telegraphColor, 0.3 + intensity * 0.45)
      .strokeCircle(
        this.x,
        this.y,
        58 + Math.sin(time * 0.018) * 7,
      );

    for (let index = 0; index < particleCount; index += 1) {
      const progress =
        (time * 0.0012 + index / particleCount) % 1;
      const x = Phaser.Math.Linear(target.x, intakeX, progress);
      const y =
        Phaser.Math.Linear(target.y, intakeY, progress) +
        Math.sin(progress * Math.PI * 4 + index) * 18 * (1 - progress);
      this.telegraph
        .fillStyle(
          this.pattern.telegraphColor,
          (0.25 + progress * 0.65) * intensity,
        )
        .fillCircle(x, y, 3 + progress * 4);
    }
  }

  private moveToPreferredDistance(
    time: number,
    target: Phaser.Physics.Arcade.Sprite,
  ) {
    if (this.isStaggered(time)) {
      return;
    }

    const horizontalDistance = Math.abs(target.x - this.x);
    const directionToTarget = Math.sign(target.x - this.x) || 1;
    this.setFlipX(directionToTarget < 0);

    const speed = this.isEnraged
      ? this.pattern.enragedMoveSpeed
      : this.pattern.moveSpeed;

    if (
      horizontalDistance >
      this.pattern.preferredDistance + this.pattern.distanceTolerance
    ) {
      this.setVelocityX(directionToTarget * speed);
      return;
    }

    if (
      horizontalDistance <
      this.pattern.preferredDistance - this.pattern.distanceTolerance
    ) {
      this.setVelocityX(-directionToTarget * speed);
      return;
    }

    this.setVelocityX(0);
  }

  private stateProgress(time: number) {
    return Phaser.Math.Clamp(
      (time - this.stateStartedAt) / (this.stateEndsAt - this.stateStartedAt),
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
