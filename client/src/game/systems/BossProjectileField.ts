import Phaser from 'phaser';
import { destroyCollider } from '@/game/systems/arcadePhysicsCleanup';

type ProjectileBounds = {
  left: number;
  right: number;
  top: number;
  bottom: number;
};

type BossProjectileFieldConfig = {
  texture: string;
  maxSize: number;
  radius: number;
  lifetime: number;
  depth: number;
  hurtboxSize: number;
  markerColor: number;
  bounds: ProjectileBounds;
  damageTarget: (damage: number) => void;
};

type BossProjectileSpawn = {
  x: number;
  y: number;
  angle: number;
  speed: number;
  damage: number;
  color: number;
};

/**
 * Owns a boss-only projectile pool and the intentionally small player hitbox
 * used by dense bullet patterns.
 */
export class BossProjectileField {
  private readonly bullets: Phaser.Physics.Arcade.Group;
  private readonly overlap: Phaser.Physics.Arcade.Collider;
  private readonly hurtbox: Phaser.GameObjects.Zone;
  private readonly hurtboxMarker: Phaser.GameObjects.Arc;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly config: BossProjectileFieldConfig,
  ) {
    this.bullets = scene.physics.add.group({
      classType: Phaser.Physics.Arcade.Image,
      maxSize: config.maxSize,
      allowGravity: false,
    });
    this.hurtbox = scene.add.zone(
      0,
      0,
      config.hurtboxSize,
      config.hurtboxSize,
    );
    scene.physics.add.existing(this.hurtbox);
    const hurtboxBody = this.hurtbox.body as Phaser.Physics.Arcade.Body;
    hurtboxBody.setAllowGravity(false);
    hurtboxBody.setImmovable(true);
    this.overlap = scene.physics.add.overlap(
      this.bullets,
      this.hurtbox,
      this.handleHit,
    );
    this.hurtboxMarker = scene.add
      .circle(0, 0, 3, config.markerColor, 0.9)
      .setStrokeStyle(1, 0xffffff, 0.8)
      .setDepth(config.depth + 1);
  }

  syncTarget(target: Phaser.Physics.Arcade.Sprite) {
    this.hurtbox.setPosition(target.x, target.y);
    this.hurtboxMarker.setPosition(target.x, target.y);
  }

  spawn({ x, y, angle, speed, damage, color }: BossProjectileSpawn) {
    const bullet = this.bullets.get(
      x,
      y,
      this.config.texture,
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
      .setDepth(this.config.depth)
      .setData('damage', damage)
      .setData('expiresAt', this.scene.time.now + this.config.lifetime);
    const body = bullet.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(false);
    body.setCircle(this.config.radius);
    this.scene.physics.velocityFromRotation(angle, speed, body.velocity);
  }

  update(time: number) {
    for (const child of this.bullets.getChildren()) {
      const bullet = child as Phaser.Physics.Arcade.Image;
      if (
        !bullet.active ||
        (bullet.getData('expiresAt') as number) <= time
      ) {
        if (bullet.active) {
          bullet.disableBody(true, true);
        }
        continue;
      }

      if (
        bullet.x < this.config.bounds.left ||
        bullet.x > this.config.bounds.right ||
        bullet.y < this.config.bounds.top ||
        bullet.y > this.config.bounds.bottom
      ) {
        bullet.disableBody(true, true);
      }
    }
  }

  clear() {
    for (const child of this.bullets.getChildren()) {
      (child as Phaser.Physics.Arcade.Image).disableBody(true, true);
    }
  }

  setMarkerVisible(visible: boolean) {
    this.hurtboxMarker.setVisible(visible);
  }

  destroy() {
    destroyCollider(this.overlap);
    this.bullets.destroy(true);
    this.hurtbox.destroy();
    this.hurtboxMarker.destroy();
  }

  private readonly handleHit: Phaser.Types.Physics.Arcade.ArcadePhysicsCallback =
    (firstObject, secondObject) => {
      const bullet =
        firstObject instanceof Phaser.Physics.Arcade.Image
          ? firstObject
          : (secondObject as Phaser.Physics.Arcade.Image);
      if (!bullet.active) {
        return;
      }

      const damage = (bullet.getData('damage') as number) ?? 0;
      bullet.disableBody(true, true);
      this.config.damageTarget(damage);
    };
}
