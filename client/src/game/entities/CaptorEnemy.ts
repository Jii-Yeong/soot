import Phaser from 'phaser';
import { getCapturePullSpeed } from '@/game/combat/stageThreeEnemyCombat';
import { CAPTOR_CONFIG } from '@/game/config/stageThreeEnemyConfig';
import {
  Enemy,
  ENEMY_DEPTH,
  type EnemyProjectileAttack,
} from '@/game/entities/Enemy';
import { FLOOR_SURFACE_Y } from '@/game/systems/FloorBuilder';

type CaptorState = 'ready' | 'warning' | 'tethered' | 'recover';

export class CaptorEnemy extends Enemy {
  readonly aggroRadius = CAPTOR_CONFIG.aggroRadius;
  readonly aggroIndicatorColor = 0x74df91;

  private captorState: CaptorState = 'ready';
  private stateEndsAt = 0;
  private nextAttackAt = 0;
  private lockedTarget = new Phaser.Math.Vector2();
  private tetherDamage = 0;
  private readonly cable: Phaser.GameObjects.Graphics;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    private readonly damagePlayer: (damage: number) => void,
    private readonly applyTether: (
      sourceX: number,
      slowFactor: number,
      pullSpeed: number,
    ) => void,
    private readonly isPlayerDashing: () => boolean,
  ) {
    super(scene, x, y, CAPTOR_CONFIG.texture, CAPTOR_CONFIG.maxHealth);
    (this.body as Phaser.Physics.Arcade.Body).setSize(48, 92, true);
    this.setDepth(ENEMY_DEPTH);
    this.cable = scene.add.graphics().setDepth(8);
  }

  updateCombat(
    time: number,
    target: Phaser.Physics.Arcade.Sprite,
    _fireProjectile: EnemyProjectileAttack,
  ) {
    const distance = Phaser.Math.Distance.Between(
      this.x,
      this.y,
      target.x,
      target.y,
    );
    const targetInRange = distance <= this.aggroRadius;
    this.setFlipX(target.x < this.x);

    if (this.captorState === 'tethered') {
      if (this.isPlayerDashing() || time >= this.stateEndsAt) {
        this.releaseCable(time);
        return targetInRange;
      }

      this.drawCable(target.x, target.y, 0.9);
      const captureSpeed = getCapturePullSpeed(
        target.x - this.x,
        this.stateEndsAt - time,
        CAPTOR_CONFIG.minimumPullSpeed,
      );
      this.applyTether(
        this.x,
        CAPTOR_CONFIG.slowFactor,
        captureSpeed,
      );
      if (Math.abs(target.x - this.x) <= CAPTOR_CONFIG.shockRange) {
        this.damagePlayer(CAPTOR_CONFIG.shockDamage);
        this.releaseCable(time);
      }
      return true;
    }

    if (this.captorState === 'warning') {
      this.setVelocityX(0);
      this.drawCable(this.lockedTarget.x, this.lockedTarget.y, 0.45);
      if (time >= this.stateEndsAt) {
        const evaded = Phaser.Math.Distance.Between(
          target.x,
          target.y,
          this.lockedTarget.x,
          this.lockedTarget.y,
        ) > 70;
        if (evaded) {
          this.releaseCable(time);
        } else {
          this.captorState = 'tethered';
          this.stateEndsAt = time + CAPTOR_CONFIG.tetherDuration;
          this.tetherDamage = 0;
        }
      }
      return true;
    }

    if (this.captorState === 'recover' && time < this.stateEndsAt) {
      this.setVelocityX(0);
      return targetInRange;
    }
    if (this.captorState === 'recover') {
      this.captorState = 'ready';
    }

    if (!targetInRange) {
      this.setVelocityX(0);
      return false;
    }

    const direction = Math.sign(target.x - this.x) || 1;
    this.setVelocityX(distance > 430 ? direction * 75 : 0);
    if (time >= this.nextAttackAt) {
      this.captorState = 'warning';
      this.stateEndsAt = time + CAPTOR_CONFIG.warningDuration;
      this.lockedTarget.set(target.x, target.y);
      this.setVelocityX(0);
    }
    return true;
  }

  override takeDamage(amount: number) {
    const defeated = super.takeDamage(amount);
    if (this.captorState === 'tethered') {
      this.tetherDamage += amount;
      if (this.tetherDamage >= CAPTOR_CONFIG.tetherBreakDamage) {
        this.releaseCable(this.scene.time.now);
      }
    }
    return defeated;
  }

  protected override onDefeated() {
    super.onDefeated();
    if (this.cable.active) {
      this.cable.destroy();
    }
  }

  override destroy(fromScene?: boolean) {
    if (this.cable.active) {
      this.cable.destroy();
    }
    super.destroy(fromScene);
  }

  private drawCable(targetX: number, targetY: number, alpha: number) {
    this.cable.clear();
    this.cable.lineStyle(3, 0x79ff9a, alpha);
    this.cable.lineBetween(this.x, this.y - 12, targetX, targetY);
    this.cable.lineStyle(1, 0xb6ffd0, alpha * 0.7);
    this.cable.lineBetween(
      this.x,
      FLOOR_SURFACE_Y - 4,
      targetX,
      FLOOR_SURFACE_Y - 4,
    );
  }

  private releaseCable(time: number) {
    this.cable.clear();
    this.tetherDamage = 0;
    this.captorState = 'recover';
    this.stateEndsAt = time + 480;
    this.nextAttackAt = time + CAPTOR_CONFIG.attackCooldown;
  }
}
