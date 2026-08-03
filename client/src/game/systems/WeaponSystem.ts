import Phaser from 'phaser';
import type { WeaponConfig } from '@/game/config/weaponConfig';
import { Enemy } from '@/game/entities/Enemy';
import { gameEvents } from '@/game/events/gameEvents';
import { ProjectilePool } from '@/game/systems/ProjectilePool';
import { WeaponFeedback } from '@/game/systems/WeaponFeedback';

type WeaponRuntime = {
  config: WeaponConfig;
  pool: ProjectilePool;
  nextFireAt: number;
};

type EnemyHitListener = (enemy: Enemy, defeated: boolean) => void;

export class WeaponSystem {
  private readonly weapons: WeaponRuntime[];
  private readonly feedback: WeaponFeedback;
  private activeWeaponIndex: number;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly player: Phaser.Physics.Arcade.Sprite,
    private readonly enemies: Enemy[],
    weaponConfigs: readonly WeaponConfig[],
    startingWeaponId: string,
    private readonly canFire: () => boolean,
    private readonly onEnemyHit: EnemyHitListener,
  ) {
    this.activeWeaponIndex = Math.max(
      0,
      weaponConfigs.findIndex((weapon) => weapon.id === startingWeaponId),
    );
    this.weapons = weaponConfigs.map((config) => {
      const runtime: WeaponRuntime = {
        config,
        pool: new ProjectilePool(scene, {
          texture: config.texture,
          speed: config.projectileSpeed,
          lifetime: config.projectileLifetime,
          maxSize: config.maxPoolSize,
        }),
        nextFireAt: 0,
      };

      scene.physics.add.overlap(
        runtime.pool.group,
        enemies,
        this.createEnemyHitHandler(runtime),
      );
      return runtime;
    });
    this.feedback = new WeaponFeedback(
      scene,
      player,
      this.activeConfig,
      canFire,
    );
  }

  get activeConfig() {
    return this.activeWeapon.config;
  }

  update(delta: number, aimPoint: Phaser.Math.Vector2) {
    this.feedback.update(delta, aimPoint);
  }

  blockProjectilesWith(
    terrain: Phaser.Physics.Arcade.StaticGroup,
    blocksProjectile: (blocker: Phaser.GameObjects.GameObject) => boolean,
  ) {
    for (const weapon of this.weapons) {
      weapon.pool.collideWith(terrain, blocksProjectile);
    }
  }

  tryFire(aimPoint: Phaser.Math.Vector2, time: number) {
    const weapon = this.activeWeapon;
    if (!this.canFire() || time < weapon.nextFireAt) {
      return;
    }

    const baseAngle = Phaser.Math.Angle.Between(
      this.player.x,
      this.player.y,
      aimPoint.x,
      aimPoint.y,
    );
    const { config } = weapon;

    for (let burstIndex = 0; burstIndex < config.burstCount; burstIndex += 1) {
      const fireVolley = () => {
        if (!this.canFire() || this.activeWeapon !== weapon) {
          return;
        }
        this.fireVolley(weapon, baseAngle);
      };

      if (burstIndex === 0) {
        fireVolley();
      } else {
        this.scene.time.delayedCall(
          config.burstInterval * burstIndex,
          fireVolley,
        );
      }
    }

    weapon.nextFireAt = time + config.fireInterval;
    gameEvents.emit('weapon-fired', config.id, this.player.x, this.player.y);
  }

  equip(weaponId: string) {
    const index = this.weapons.findIndex(
      (weapon) => weapon.config.id === weaponId,
    );
    if (index < 0) {
      return false;
    }

    this.activeWeaponIndex = index;
    this.feedback.setWeapon(this.activeConfig);
    return true;
  }

  playEquipFeedback() {
    this.feedback.playEquip(this.activeConfig);
  }

  hide() {
    this.feedback.hide();
  }

  clearProjectiles() {
    for (const weapon of this.weapons) {
      weapon.pool.clear();
    }
  }

  cancelHitStop() {
    this.feedback.cancelHitStop();
  }

  private get activeWeapon() {
    return this.weapons[this.activeWeaponIndex];
  }

  private fireVolley(weapon: WeaponRuntime, baseAngle: number) {
    const { config } = weapon;
    const angles = this.computePelletAngles(
      baseAngle,
      config.pelletCount,
      config.spreadDegrees,
    );

    for (const angle of angles) {
      const muzzle = this.feedback.getMuzzlePosition(angle, config.muzzleOffset);
      const origin = this.spawnOrigin(muzzle);

      weapon.pool.fire(origin.x, origin.y, angle, {
        pierce: config.pierce,
      });
    }

    this.feedback.playFire(config, baseAngle, angles);
  }

  /**
   * Where a round is born, given what is standing in front of the gun.
   *
   * Normally the muzzle. But the muzzle is 24 to 47px out along the barrel and
   * nothing between the grip and it is ever tested, so an enemy standing on top
   * of the player was a hole the round appeared on the far side of: their
   * bodies are 44 to 48px wide, and every weapon but the SMG puts its muzzle
   * past that. Point blank, the shot missed a target it was inside of.
   *
   * When something is in that stretch the round starts at the grip instead, and
   * the normal projectile-enemy overlap does the rest — damage, knockback,
   * pierce and feedback all keep running through one path. The muzzle flash
   * stays where the barrel is, so nothing moves on screen except at the range
   * where the muzzle was inside an enemy anyway.
   */
  private spawnOrigin(muzzle: { x: number; y: number }) {
    const grip = this.feedback.display;
    const barrel = new Phaser.Geom.Line(grip.x, grip.y, muzzle.x, muzzle.y);

    for (const enemy of this.enemies) {
      const body = enemy.active
        ? (enemy.body as Phaser.Physics.Arcade.Body | null)
        : null;
      if (!body) {
        continue;
      }

      const bounds = new Phaser.Geom.Rectangle(
        body.x,
        body.y,
        body.width,
        body.height,
      );
      if (Phaser.Geom.Intersects.LineToRectangle(barrel, bounds)) {
        return { x: grip.x, y: grip.y };
      }
    }

    return muzzle;
  }

  private computePelletAngles(
    baseAngle: number,
    pelletCount: number,
    spreadDegrees: number,
  ) {
    if (pelletCount <= 1) {
      return [baseAngle];
    }

    const spreadRadians = Phaser.Math.DegToRad(spreadDegrees);
    return Array.from({ length: pelletCount }, (_, index) => {
      const offset = index / (pelletCount - 1) - 0.5;
      return baseAngle + offset * spreadRadians;
    });
  }

  private createEnemyHitHandler(
    weapon: WeaponRuntime,
  ): Phaser.Types.Physics.Arcade.ArcadePhysicsCallback {
    return (firstObject, secondObject) => {
      const enemy = this.findEnemy(firstObject, secondObject);
      const bullet =
        firstObject instanceof Enemy
          ? (secondObject as Phaser.Physics.Arcade.Image)
          : (firstObject as Phaser.Physics.Arcade.Image);

      if (!this.canFire() || !enemy || !bullet.active || !enemy.active) {
        return;
      }

      const { config } = weapon;
      const time = this.scene.time.now;

      const defeated = enemy.takeDamage(config.damage);
      this.feedback.playEnemyHit(enemy, config);
      if (config.knockback) {
        // A projectile flies straight, so its rotation is its heading.
        enemy.applyKnockback(bullet.rotation, config.knockback, time);
      }
      this.onEnemyHit(enemy, defeated);
      weapon.pool.registerHit(bullet);
    };
  }

  private findEnemy(firstObject: unknown, secondObject: unknown) {
    if (firstObject instanceof Enemy) {
      return firstObject;
    }

    return secondObject instanceof Enemy ? secondObject : null;
  }
}
