import Phaser from 'phaser';

export type ProjectilePoolConfig = {
  texture: string;
  speed: number;
  lifetime: number;
  maxSize: number;
};

export type FireOptions = {
  pierce?: number;
  ricochet?: number;
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
      .setDepth(8);
    projectile.setData('pierceRemaining', options.pierce ?? 0);
    projectile.setData('ricochetRemaining', options.ricochet ?? 0);
    this.scene.physics.velocityFromRotation(
      angle,
      this.config.speed,
      projectile.body!.velocity,
    );
    this.scheduleExpiry(projectile);

    return projectile;
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

  /**
   * Consumes one ricochet charge and re-aims the projectile at `angle`,
   * nudging it out of the enemy it just struck. Returns false when no charges
   * remain (caller should fall back to normal hit handling).
   */
  redirect(projectile: Phaser.Physics.Arcade.Image, angle: number) {
    const remaining = (projectile.getData('ricochetRemaining') as number) ?? 0;
    if (remaining <= 0) {
      return false;
    }

    projectile.setData('ricochetRemaining', remaining - 1);
    projectile.setRotation(angle);
    projectile.setPosition(
      projectile.x + Math.cos(angle) * 18,
      projectile.y + Math.sin(angle) * 18,
    );
    this.scene.physics.velocityFromRotation(
      angle,
      this.config.speed,
      projectile.body!.velocity,
    );
    return true;
  }

  clear() {
    for (const child of this.group.getChildren()) {
      (child as Phaser.Physics.Arcade.Image).disableBody(true, true);
    }
  }

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
