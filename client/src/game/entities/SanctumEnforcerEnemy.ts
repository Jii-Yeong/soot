import Phaser from 'phaser';
import { PLAYER_FLIGHT_BOUNDS } from '@/game/config/playerMovementConfig';
import { SANCTUM_ENFORCER_CONFIG } from '@/game/config/stageFiveEnemyConfig';
import { CoordinatedAerialEnemy } from '@/game/entities/CoordinatedAerialEnemy';
import { ENEMY_DEPTH, type EnemyProjectileAttack } from '@/game/entities/Enemy';
import { CelestialProjectileField } from '@/game/systems/CelestialProjectileField';
import type { EnemyAttackCoordinator } from '@/game/systems/EnemyAttackCoordinator';

type EnforcerPattern = 'triple' | 'fan' | 'dash';
type EnforcerState =
  'ready' | 'warning' | 'firing' | 'retreating' | 'charging' | 'returning';

export class SanctumEnforcerEnemy extends CoordinatedAerialEnemy {
  readonly aggroRadius = SANCTUM_ENFORCER_CONFIG.aggroRadius;
  readonly aggroIndicatorColor = 0xffda7a;

  private readonly projectileField: CelestialProjectileField;
  private readonly warningLine: Phaser.GameObjects.Graphics;
  private enforcerState: EnforcerState = 'ready';
  private activePattern: EnforcerPattern = 'triple';
  private patternIndex = 0;
  private stateEndsAt = 0;
  private nextAttackAt = 0;
  private lockedY = 0;
  private chargeEndX = 0;
  private chargeDamageReady = false;
  private nextFragmentAt = 0;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    attackCoordinator: EnemyAttackCoordinator,
    damagePlayer: (damage: number) => void,
  ) {
    super(
      scene,
      x,
      y,
      SANCTUM_ENFORCER_CONFIG.texture,
      SANCTUM_ENFORCER_CONFIG.maxHealth,
      attackCoordinator,
    );
    (this.body as Phaser.Physics.Arcade.Body).setSize(
      SANCTUM_ENFORCER_CONFIG.bodyWidth,
      SANCTUM_ENFORCER_CONFIG.bodyHeight,
      true,
    );
    this.setDepth(ENEMY_DEPTH).setFlipX(true);
    this.warningLine = scene.add.graphics().setDepth(8);
    this.projectileField = new CelestialProjectileField(scene, {
      texture: SANCTUM_ENFORCER_CONFIG.spearTexture,
      damage: SANCTUM_ENFORCER_CONFIG.spearDamage,
      radius: 7,
      damagePlayer,
    });
  }

  updateCombat(
    time: number,
    target: Phaser.Physics.Arcade.Sprite,
    _fireProjectile: EnemyProjectileAttack,
  ) {
    this.projectileField.update(time, target);
    const targetInRange =
      Phaser.Math.Distance.Between(this.x, this.y, target.x, target.y) <=
      this.aggroRadius;

    if (this.enforcerState === 'warning' && time >= this.stateEndsAt) {
      this.beginFiring(time);
    } else if (this.enforcerState === 'firing' && time >= this.stateEndsAt) {
      this.finishPattern(time);
    } else if (this.enforcerState === 'retreating') {
      this.updateRetreat(time);
    } else if (this.enforcerState === 'charging') {
      this.updateCharge(time);
    } else if (this.enforcerState === 'returning') {
      this.updateReturn();
    } else if (this.enforcerState === 'ready') {
      if (targetInRange) {
        this.hoverNearTarget(target);
      } else {
        this.setVelocity(0);
      }
      if (
        targetInRange &&
        this.isInsideAttackEdge() &&
        time >= this.nextAttackAt &&
        this.tryBeginAttack()
      ) {
        this.beginNextPattern(time, target.y);
      }
    }
    return targetInRange;
  }

  override tryContactAttack(_time: number) {
    if (this.enforcerState !== 'charging' || !this.chargeDamageReady) {
      return null;
    }
    this.chargeDamageReady = false;
    return SANCTUM_ENFORCER_CONFIG.chargeDamage;
  }

  protected override onDefeated() {
    super.onDefeated();
    this.clearAttackObjects();
  }

  override destroy(fromScene?: boolean) {
    this.clearAttackObjects();
    this.projectileField.destroy();
    super.destroy(fromScene);
  }

  private beginNextPattern(time: number, targetY: number) {
    const patterns = ['triple', 'fan', 'dash'] as const;
    this.activePattern = patterns[this.patternIndex % patterns.length];
    this.patternIndex += 1;
    this.lockedY = Phaser.Math.Clamp(
      targetY,
      PLAYER_FLIGHT_BOUNDS.minY,
      PLAYER_FLIGHT_BOUNDS.maxY,
    );

    if (this.activePattern === 'dash') {
      this.enforcerState = 'retreating';
      this.stateEndsAt = time + 420;
      return;
    }

    this.enforcerState = 'warning';
    this.stateEndsAt = time + SANCTUM_ENFORCER_CONFIG.warningDuration;
    this.drawWarningLine(this.lockedY);
    this.setVelocity(0);
  }

  private beginFiring(time: number) {
    this.warningLine.clear();
    if (this.activePattern === 'dash') {
      this.enforcerState = 'charging';
      this.stateEndsAt = time + 1_200;
      this.chargeDamageReady = true;
      this.nextFragmentAt = time;
      this.setPosition(this.x, this.lockedY);
      return;
    }

    this.enforcerState = 'firing';
    if (this.activePattern === 'triple') {
      for (const offsetY of [-112, 0, 112]) {
        this.projectileField.spawn({
          x: this.x,
          y: this.lockedY + offsetY,
          angle: Math.PI,
          speed: SANCTUM_ENFORCER_CONFIG.spearSpeed,
        });
      }
      this.stateEndsAt = time + 1_050;
      return;
    }

    const angles = [-35, -17.5, 0, 17.5, 35];
    for (let volley = 0; volley < 2; volley += 1) {
      const orderedAngles = volley === 0 ? angles : [...angles].reverse();
      orderedAngles.forEach((degrees, index) => {
        this.projectileField.spawn({
          x: this.x,
          y: this.y,
          angle: Math.PI + Phaser.Math.DegToRad(degrees),
          speed: SANCTUM_ENFORCER_CONFIG.spearSpeed * 0.82,
          delay: volley * 430 + index * 55,
        });
      });
    }
    this.stateEndsAt = time + 1_650;
  }

  private updateRetreat(time: number) {
    const retreatX = Math.min(
      this.scene.physics.world.bounds.right - 32,
      this.scene.cameras.main.worldView.right - 32,
    );
    this.moveToward(
      retreatX,
      this.lockedY,
      SANCTUM_ENFORCER_CONFIG.moveSpeed * 1.3,
    );
    if (time < this.stateEndsAt && Math.abs(this.x - retreatX) > 12) {
      return;
    }
    this.enforcerState = 'warning';
    this.stateEndsAt = time + SANCTUM_ENFORCER_CONFIG.warningDuration;
    this.chargeEndX = this.scene.cameras.main.worldView.left + 36;
    this.drawWarningLine(this.lockedY);
    this.setVelocity(0);
  }

  private updateCharge(time: number) {
    this.setVelocity(-SANCTUM_ENFORCER_CONFIG.chargeSpeed, 0);
    if (time >= this.nextFragmentAt) {
      this.leaveLightFragment();
      this.nextFragmentAt = time + 70;
    }
    if (this.x > this.chargeEndX && time < this.stateEndsAt) {
      return;
    }
    this.enforcerState = 'returning';
    this.chargeDamageReady = false;
    this.finishAttack();
    this.nextAttackAt = time + SANCTUM_ENFORCER_CONFIG.attackCooldown;
  }

  private updateReturn() {
    const returnX = Math.min(
      this.scene.physics.world.bounds.right - 100,
      this.scene.cameras.main.worldView.right - 150,
    );
    if (Math.abs(this.x - returnX) < 14) {
      this.enforcerState = 'ready';
      this.setVelocity(0);
      return;
    }
    this.moveToward(returnX, this.lockedY, SANCTUM_ENFORCER_CONFIG.returnSpeed);
  }

  private finishPattern(time: number) {
    this.enforcerState = 'ready';
    this.finishAttack();
    this.nextAttackAt = time + SANCTUM_ENFORCER_CONFIG.attackCooldown;
  }

  private hoverNearTarget(target: Phaser.Physics.Arcade.Sprite) {
    const desiredX = Math.min(
      this.scene.physics.world.bounds.right - 100,
      this.scene.cameras.main.worldView.right - 150,
    );
    const desiredY = Phaser.Math.Clamp(
      target.y,
      PLAYER_FLIGHT_BOUNDS.minY + 35,
      PLAYER_FLIGHT_BOUNDS.maxY - 35,
    );
    this.moveToward(desiredX, desiredY, SANCTUM_ENFORCER_CONFIG.moveSpeed);
  }

  private moveToward(x: number, y: number, speed: number) {
    if (Phaser.Math.Distance.Between(this.x, this.y, x, y) < 8) {
      this.setVelocity(0);
      return;
    }
    this.scene.physics.velocityFromRotation(
      Phaser.Math.Angle.Between(this.x, this.y, x, y),
      speed,
      (this.body as Phaser.Physics.Arcade.Body).velocity,
    );
  }

  private drawWarningLine(y: number) {
    const view = this.scene.cameras.main.worldView;
    this.warningLine.clear();
    this.warningLine.lineStyle(3, 0xffe98b, 0.78);
    this.warningLine.lineBetween(view.left, y, view.right, y);
  }

  private leaveLightFragment() {
    const fragment = this.scene.add
      .rectangle(this.x + 24, this.y, 18, 4, 0xffe79a, 0.72)
      .setDepth(7);
    this.scene.tweens.add({
      targets: fragment,
      x: fragment.x + 32,
      alpha: 0,
      duration: 320,
      onComplete: () => fragment.destroy(),
    });
  }

  private isInsideAttackEdge() {
    const view = this.scene.cameras.main.worldView;
    return this.x >= view.left && this.x <= view.right - 90;
  }

  private clearAttackObjects() {
    if (this.warningLine.active) {
      this.warningLine.clear();
      this.warningLine.destroy();
    }
    this.projectileField.clear();
  }
}
