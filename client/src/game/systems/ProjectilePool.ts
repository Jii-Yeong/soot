import Phaser from 'phaser';
import { PLAYER_STACK_DEPTH } from '@/game/config/renderDepth';

export type ProjectilePoolConfig = {
  texture: string;
  speed: number;
  lifetime: number;
  maxSize: number;
};

export type FireOptions = {
  pierce?: number;
};

export class ProjectilePool {
  readonly group: Phaser.Physics.Arcade.Group;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly config: ProjectilePoolConfig,
  ) {
    this.group = scene.physics.add.group({
      classType: Phaser.Physics.Arcade.Image,
      maxSize: config.maxSize,
      allowGravity: false,
    });
  }

  fire(x: number, y: number, angle: number, options: FireOptions = {}) {
    const projectile = this.group.get(
      x,
      y,
      this.config.texture,
    ) as Phaser.Physics.Arcade.Image | null;

    if (!projectile) {
      return null;
    }

    projectile.enableBody(true, x, y, true, true);
    projectile
      .setActive(true)
      .setVisible(true)
      .setRotation(angle)
      .setDepth(PLAYER_STACK_DEPTH.projectile);
    projectile.setData('pierceRemaining', options.pierce ?? 0);
    this.scene.physics.velocityFromRotation(
      angle,
      this.config.speed,
      projectile.body!.velocity,
    );
    this.scheduleExpiry(projectile);

    return projectile;
  }

  /** Deactivates projectiles as soon as they strike solid room geometry. */
  collideWith(blockers: Phaser.Physics.Arcade.StaticGroup) {
    this.scene.physics.add.collider(
      this.group,
      blockers,
      this.handleBlockerHit,
    );
  }

  /** Returns true if the projectile should be deactivated after this hit. */
  registerHit(projectile: Phaser.Physics.Arcade.Image) {
    const pierceRemaining = (projectile.getData('pierceRemaining') as number) ?? 0;

    if (pierceRemaining <= 0) {
      projectile.disableBody(true, true);
      return true;
    }

    projectile.setData('pierceRemaining', pierceRemaining - 1);
    return false;
  }

  clear() {
    for (const child of this.group.getChildren()) {
      (child as Phaser.Physics.Arcade.Image).disableBody(true, true);
    }
  }

  private readonly handleBlockerHit: Phaser.Types.Physics.Arcade.ArcadePhysicsCallback =
    (firstObject, secondObject) => {
      const projectile =
        firstObject instanceof Phaser.Physics.Arcade.Image
          ? firstObject
          : (secondObject as Phaser.Physics.Arcade.Image);

      if (projectile.active) {
        projectile.disableBody(true, true);
      }
    };

  private scheduleExpiry(projectile: Phaser.Physics.Arcade.Image) {
    const launchId = (projectile.getData('launchId') ?? 0) + 1;
    projectile.setData('launchId', launchId);

    this.scene.time.delayedCall(this.config.lifetime, () => {
      if (projectile.active && projectile.getData('launchId') === launchId) {
        projectile.disableBody(true, true);
      }
    });
  }
}
