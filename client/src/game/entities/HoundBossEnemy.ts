import Phaser from 'phaser';
import type {
  HoundBossPatternConfig,
  HoundBossCombatConfig,
} from '@/game/config/bossConfig';
import { isPointInsideLaser } from '@/game/combat/laserGeometry';
import { BossEnemy } from '@/game/entities/BossEnemy';
import type { EnemyProjectileAttack } from '@/game/entities/Enemy';
import { BeamEffects } from '@/game/systems/BeamEffects';

type HoundState =
  | 'recover'
  | 'lance-charge'
  | 'lance-fire'
  | 'pounce-telegraph'
  | 'pounce'
  | 'sweep-charge'
  | 'sweep-fire';

type PlayerDamageHandler = (damage: number) => void;

type Point = { x: number; y: number };

/**
 * Stage-2 boss (the searchlight hound). A state machine that alternates a
 * player-tracking lock-on beam (lance) with a lunging pounce, and adds a wide
 * sweeping beam once enraged. `recover` doubles as the between-attacks reposition
 * state and picks the next attack when its timer elapses.
 */
export class HoundBossEnemy extends BossEnemy<HoundBossPatternConfig> {
  private readonly effects: BeamEffects;
  private attackState: HoundState = 'recover';
  private stateEndsAt: number;
  private aimAngle = 0;
  private aimLocksAt = 0;
  private stateStartedAt = 0;
  private beamHit = false;
  private pounceDirection = 1;
  private sweepFromAngle = 0;
  private sweepToAngle = 0;
  private attackIndex = 0;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    texture: string,
    config: HoundBossCombatConfig,
    private readonly damagePlayer: PlayerDamageHandler,
  ) {
    super(scene, x, y, texture, config);

    this.stateEndsAt = scene.time.now + config.pattern.firstAttackDelay;
    this.effects = new BeamEffects(scene, config.pattern.beam);
  }

  updateCombat(
    time: number,
    target: Phaser.Physics.Arcade.Sprite,
    _fireProjectile: EnemyProjectileAttack,
  ) {
    if (!this.active) {
      this.effects.hideAll();
      return false;
    }

    const targetInRange =
      Phaser.Math.Distance.Between(this.x, this.y, target.x, target.y) <=
      this.aggroRadius;
    if (!targetInRange) {
      this.setVelocityX(0);
      this.effects.hideAll();
      return false;
    }

    switch (this.attackState) {
      case 'recover':
        this.updateRecover(time, target);
        break;
      case 'lance-charge':
        this.updateLanceCharge(time, target);
        break;
      case 'lance-fire':
        this.updateLanceFire(time, target);
        break;
      case 'pounce-telegraph':
        this.updatePounceTelegraph(time, target);
        break;
      case 'pounce':
        this.updatePounce(time);
        break;
      case 'sweep-charge':
        this.updateSweepCharge(time);
        break;
      case 'sweep-fire':
        this.updateSweepFire(time, target);
        break;
    }

    return true;
  }

  protected override onDefeated() {
    super.onDefeated();
    this.effects.hideAll();
  }

  override destroy(fromScene?: boolean) {
    this.effects.destroy();
    super.destroy(fromScene);
  }

  private updateRecover(time: number, target: Phaser.Physics.Arcade.Sprite) {
    this.effects.hideAll();
    this.moveToPreferredDistance(time, target);

    if (time >= this.stateEndsAt) {
      this.chooseNextAttack(time, target);
    }
  }

  private chooseNextAttack(
    time: number,
    target: Phaser.Physics.Arcade.Sprite,
  ) {
    // Non-enraged cycles lance/pounce; enrage injects the sweep as every 3rd.
    const cycle = this.isEnraged
      ? (['lance', 'pounce', 'sweep'] as const)
      : (['lance', 'pounce'] as const);
    const attack = cycle[this.attackIndex % cycle.length];
    this.attackIndex += 1;

    if (attack === 'lance') {
      this.beginLanceCharge(time, target);
    } else if (attack === 'pounce') {
      this.beginPounceTelegraph(time, target);
    } else {
      this.beginSweepCharge(time, target);
    }
  }

  private beginLanceCharge(
    time: number,
    target: Phaser.Physics.Arcade.Sprite,
  ) {
    const duration = this.isEnraged
      ? this.pattern.lance.enragedChargeDuration
      : this.pattern.lance.chargeDuration;

    this.attackState = 'lance-charge';
    this.stateStartedAt = time;
    this.stateEndsAt = time + duration;
    this.aimLocksAt = this.stateEndsAt - this.pattern.lance.aimLockDuration;
    this.aimAngle = this.aimAt(target);
  }

  private updateLanceCharge(
    time: number,
    target: Phaser.Physics.Arcade.Sprite,
  ) {
    this.setVelocityX(0);

    if (time < this.aimLocksAt) {
      this.aimAngle = this.aimAt(target);
    }
    this.setFlipX(Math.cos(this.aimAngle) < 0);
    this.effects.drawTelegraph(
      this.getMuzzlePosition(),
      this.aimAngle,
      this.stateProgress(time),
    );

    if (time >= this.stateEndsAt) {
      this.attackState = 'lance-fire';
      this.stateEndsAt = time + this.pattern.lance.fireDuration;
      this.beamHit = false;
      this.effects.showBeam(this.getMuzzlePosition(), this.aimAngle);
    }
  }

  private updateLanceFire(
    time: number,
    target: Phaser.Physics.Arcade.Sprite,
  ) {
    this.setVelocityX(0);
    const muzzle = this.getMuzzlePosition();
    this.effects.updateBeam(muzzle, this.aimAngle);
    this.tryBeamHit(target, muzzle);

    if (time >= this.stateEndsAt) {
      this.effects.hideBeam();
      this.beginRecover(time);
    }
  }

  private beginPounceTelegraph(
    time: number,
    target: Phaser.Physics.Arcade.Sprite,
  ) {
    this.attackState = 'pounce-telegraph';
    this.stateStartedAt = time;
    this.stateEndsAt = time + this.pattern.pounce.telegraphDuration;
    this.pounceDirection = Math.sign(target.x - this.x) || this.pounceDirection;
    // The hound throws its searchlight down the lane it's about to charge.
    this.aimAngle = this.pounceDirection < 0 ? Math.PI : 0;
    this.setFlipX(this.pounceDirection < 0);
  }

  private updatePounceTelegraph(
    time: number,
    _target: Phaser.Physics.Arcade.Sprite,
  ) {
    this.setVelocityX(0);
    this.effects.drawTelegraph(
      this.getMuzzlePosition(),
      this.aimAngle,
      this.stateProgress(time),
    );

    if (time >= this.stateEndsAt) {
      this.effects.hideAll();
      this.attackState = 'pounce';
      this.stateEndsAt = time + this.pattern.pounce.chargeDuration;
      this.setVelocityX(this.pounceDirection * this.pattern.pounce.chargeSpeed);
    }
  }

  private updatePounce(time: number) {
    // Committed lunge: keep driving even if knocked, until the dash ends.
    this.setVelocityX(this.pounceDirection * this.pattern.pounce.chargeSpeed);

    if (time >= this.stateEndsAt) {
      this.setVelocityX(0);
      this.beginRecover(time);
    }
  }

  private beginSweepCharge(
    time: number,
    target: Phaser.Physics.Arcade.Sprite,
  ) {
    this.attackState = 'sweep-charge';
    this.stateStartedAt = time;
    this.stateEndsAt = time + this.pattern.sweep.chargeDuration;

    // Sweep the beam across the player's side, ending past their position.
    const half = Phaser.Math.DegToRad(this.pattern.sweep.arcDegrees) / 2;
    const center = this.aimAt(target);
    const towardTarget = Math.sign(target.x - this.x) || 1;
    this.sweepFromAngle = center - towardTarget * half;
    this.sweepToAngle = center + towardTarget * half;
    this.aimAngle = this.sweepFromAngle;
    this.setFlipX(towardTarget < 0);
  }

  private updateSweepCharge(time: number) {
    this.setVelocityX(0);
    this.effects.drawTelegraph(
      this.getMuzzlePosition(),
      this.sweepFromAngle,
      this.stateProgress(time),
    );

    if (time >= this.stateEndsAt) {
      this.attackState = 'sweep-fire';
      this.stateStartedAt = time;
      this.stateEndsAt = time + this.pattern.sweep.fireDuration;
      this.beamHit = false;
      this.aimAngle = this.sweepFromAngle;
      this.effects.showBeam(this.getMuzzlePosition(), this.aimAngle);
    }
  }

  private updateSweepFire(
    time: number,
    target: Phaser.Physics.Arcade.Sprite,
  ) {
    this.setVelocityX(0);
    this.aimAngle = Phaser.Math.Linear(
      this.sweepFromAngle,
      this.sweepToAngle,
      this.stateProgress(time),
    );
    const muzzle = this.getMuzzlePosition();
    this.effects.updateBeam(muzzle, this.aimAngle);
    this.tryBeamHit(target, muzzle);

    if (time >= this.stateEndsAt) {
      this.effects.hideBeam();
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
    this.effects.hideAll();
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

  private tryBeamHit(target: Phaser.Physics.Arcade.Sprite, muzzle: Point) {
    if (this.beamHit) {
      return;
    }

    const body = target.body as Phaser.Physics.Arcade.Body | null;
    const point = body?.center ?? target;
    const targetRadius = body ? Math.max(body.width, body.height) * 0.35 : 24;

    if (
      isPointInsideLaser(
        muzzle,
        this.aimAngle,
        this.pattern.beam.range,
        this.pattern.beam.width,
        point,
        targetRadius,
      )
    ) {
      this.beamHit = true;
      this.damagePlayer(this.pattern.beam.damage);
    }
  }

  private aimAt(target: Phaser.Physics.Arcade.Sprite) {
    return Phaser.Math.Angle.Between(
      this.x,
      this.y + this.pattern.beam.muzzleOffsetY,
      target.x,
      target.y,
    );
  }

  private getMuzzlePosition(): Point {
    return {
      x: this.x + Math.cos(this.aimAngle) * this.pattern.beam.muzzleOffset,
      y:
        this.y +
        this.pattern.beam.muzzleOffsetY +
        Math.sin(this.aimAngle) * this.pattern.beam.muzzleOffset,
    };
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
