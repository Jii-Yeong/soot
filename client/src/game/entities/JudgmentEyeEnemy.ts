import Phaser from 'phaser';
import { GAME_HEIGHT } from '@/game/config/gameDimensions';
import { JUDGMENT_EYE_CONFIG } from '@/game/config/stageFourEnemyConfig';
import {
  ENEMY_DEPTH,
  type EnemyProjectileAttack,
} from '@/game/entities/Enemy';
import { HallucinatedAndroidEnemy } from '@/game/entities/HallucinatedAndroidEnemy';
import type { EnemyAttackCoordinator } from '@/game/systems/EnemyAttackCoordinator';

type EyeState = 'ready' | 'tracking' | 'orb' | 'repositioning';

type EyeBullet = {
  sprite: Phaser.Physics.Arcade.Image;
  expiresAt: number;
};

export class JudgmentEyeEnemy extends HallucinatedAndroidEnemy {
  readonly aggroRadius = JUDGMENT_EYE_CONFIG.aggroRadius;
  readonly aggroIndicatorColor = 0xff4050;

  private eyeState: EyeState = 'ready';
  private stateEndsAt = 0;
  private nextAttackAt = 0;
  private lockedTarget = new Phaser.Math.Vector2();
  private repositionTarget = new Phaser.Math.Vector2();
  private orb?: Phaser.GameObjects.Arc;
  private firedOrb = false;
  private radialVolleyIndex = 0;
  private readonly reticle: Phaser.GameObjects.Graphics;
  private readonly bullets: EyeBullet[] = [];

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
      JUDGMENT_EYE_CONFIG.texture,
      JUDGMENT_EYE_CONFIG.maxHealth,
      attackCoordinator,
    );
    (this.body as Phaser.Physics.Arcade.Body)
      .setAllowGravity(false)
      .setCircle(JUDGMENT_EYE_CONFIG.bodySize / 2);
    this.setDepth(ENEMY_DEPTH);
    this.reticle = scene.add.graphics().setDepth(8);
  }

  updateCombat(
    time: number,
    target: Phaser.Physics.Arcade.Sprite,
    _fireProjectile: EnemyProjectileAttack,
  ) {
    this.updateBullets(time, target);
    const targetInRange =
      Phaser.Math.Distance.Between(this.x, this.y, target.x, target.y) <=
      this.aggroRadius;
    this.setFlipX(target.x < this.x);

    if (this.eyeState === 'tracking') {
      this.lockedTarget.set(target.x, target.y);
      this.drawReticle(time);
      this.setVelocity(0);
      if (time >= this.stateEndsAt) {
        this.beginOrb(time);
      }
      return true;
    }

    if (this.eyeState === 'orb') {
      this.setVelocity(0);
      if (
        !this.firedOrb &&
        time >= this.stateEndsAt - JUDGMENT_EYE_CONFIG.orbLifetime +
          JUDGMENT_EYE_CONFIG.orbChargeDuration
      ) {
        this.fireRadialVolley(time);
        this.firedOrb = true;
      }
      if (time >= this.stateEndsAt) {
        this.orb?.destroy();
        this.orb = undefined;
        this.finishAttack();
        this.beginReposition(time, target.x);
      }
      return true;
    }

    if (this.eyeState === 'repositioning') {
      this.moveToward(this.repositionTarget.x, this.repositionTarget.y);
      if (
        time >= this.stateEndsAt ||
        Phaser.Math.Distance.Between(
          this.x,
          this.y,
          this.repositionTarget.x,
          this.repositionTarget.y,
        ) < 10
      ) {
        this.eyeState = 'ready';
        this.setVelocity(0);
      }
      return targetInRange;
    }

    this.hoverNear(target);
    if (
      targetInRange &&
      time >= this.nextAttackAt &&
      this.tryBeginAttack()
    ) {
      this.eyeState = 'tracking';
      this.stateEndsAt = time + JUDGMENT_EYE_CONFIG.trackingDuration;
      this.lockedTarget.set(target.x, target.y);
      this.setVelocity(0);
    }
    return targetInRange;
  }

  protected override onDefeated() {
    super.onDefeated();
    this.clearAttackObjects();
  }

  override destroy(fromScene?: boolean) {
    this.clearAttackObjects();
    super.destroy(fromScene);
  }

  private drawReticle(time: number) {
    const pulse = Math.floor(time / 90) % 2 ? 18 : 24;
    this.reticle.clear();
    this.reticle.lineStyle(2, 0xff3544, 0.95);
    this.reticle.strokeCircle(this.lockedTarget.x, this.lockedTarget.y, pulse);
    this.reticle.lineBetween(
      this.lockedTarget.x - pulse - 8,
      this.lockedTarget.y,
      this.lockedTarget.x + pulse + 8,
      this.lockedTarget.y,
    );
  }

  private beginOrb(time: number) {
    this.eyeState = 'orb';
    this.stateEndsAt = time + JUDGMENT_EYE_CONFIG.orbLifetime;
    this.firedOrb = false;
    this.reticle.clear();
    this.orb = this.scene.add
      .circle(this.lockedTarget.x, this.lockedTarget.y, 18, 0x6c0611, 0.86)
      .setStrokeStyle(3, 0xff4050, 0.95)
      .setDepth(9);
  }

  private fireRadialVolley(time: number) {
    const bulletCount = this.radialVolleyIndex % 2 === 0 ? 6 : 8;
    this.radialVolleyIndex += 1;
    for (let index = 0; index < bulletCount; index += 1) {
      const angle = (Math.PI * 2 * index) / bulletCount + Math.PI / bulletCount;
      const sprite = this.scene.physics.add
        .image(
          this.lockedTarget.x,
          this.lockedTarget.y,
          JUDGMENT_EYE_CONFIG.bulletTexture,
        )
        .setDepth(9);
      const body = sprite.body as Phaser.Physics.Arcade.Body;
      body.setAllowGravity(false).setCircle(5);
      sprite.setVelocity(
        Math.cos(angle) * JUDGMENT_EYE_CONFIG.bulletSpeed,
        Math.sin(angle) * JUDGMENT_EYE_CONFIG.bulletSpeed,
      );
      this.bullets.push({
        sprite,
        expiresAt: time + JUDGMENT_EYE_CONFIG.bulletLifetime,
      });
    }
  }

  private updateBullets(
    time: number,
    target: Phaser.Physics.Arcade.Sprite,
  ) {
    for (let index = this.bullets.length - 1; index >= 0; index -= 1) {
      const bullet = this.bullets[index];
      const outsideWorld =
        bullet.sprite.x < 0 ||
        bullet.sprite.x > this.scene.physics.world.bounds.width ||
        bullet.sprite.y < 0 ||
        bullet.sprite.y > GAME_HEIGHT;
      if (time >= bullet.expiresAt || outsideWorld) {
        bullet.sprite.destroy();
        this.bullets.splice(index, 1);
        continue;
      }
      if (
        target.active &&
        Phaser.Math.Distance.Between(
          bullet.sprite.x,
          bullet.sprite.y,
          target.x,
          target.y,
        ) <= 24
      ) {
        this.damagePlayer(JUDGMENT_EYE_CONFIG.bulletDamage);
        bullet.sprite.destroy();
        this.bullets.splice(index, 1);
      }
    }
  }

  private beginReposition(time: number, targetX: number) {
    this.eyeState = 'repositioning';
    this.stateEndsAt = time + JUDGMENT_EYE_CONFIG.repositionDuration;
    this.nextAttackAt = time + JUDGMENT_EYE_CONFIG.attackCooldown;
    const worldWidth = this.scene.physics.world.bounds.width;
    const side = this.x < targetX ? -1 : 1;
    this.repositionTarget.set(
      Phaser.Math.Clamp(targetX + side * 320, 120, worldWidth - 120),
      Phaser.Math.Clamp(this.y + (this.radialVolleyIndex % 2 ? -120 : 120), 120, 390),
    );
  }

  private hoverNear(target: Phaser.Physics.Arcade.Sprite) {
    const desiredX = target.x + (this.x < target.x ? -300 : 300);
    const desiredY = Phaser.Math.Clamp(target.y - 180, 120, 390);
    this.moveToward(desiredX, desiredY);
  }

  private moveToward(x: number, y: number) {
    const angle = Phaser.Math.Angle.Between(this.x, this.y, x, y);
    this.scene.physics.velocityFromRotation(
      angle,
      JUDGMENT_EYE_CONFIG.moveSpeed,
      (this.body as Phaser.Physics.Arcade.Body).velocity,
    );
  }

  private clearAttackObjects() {
    this.reticle.clear();
    if (this.reticle.active) {
      this.reticle.destroy();
    }
    this.orb?.destroy();
    this.orb = undefined;
    for (const bullet of this.bullets) {
      bullet.sprite.destroy();
    }
    this.bullets.length = 0;
  }
}
