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
  /** 현재 방의 교전이 시작된 뒤 발사된 탄환인지 여부. */
  canDamage?: boolean;
  /**
   * 탄환을 발사한 주체. 사망 시 해당 사수의 탄환을 화면에서 제거하기 위해
   * 보관하며, 풀 자체는 이 객체의 속성을 읽지 않는다.
   */
  owner?: object;
};

type ProjectileBlockerFilter = (
  blocker: Phaser.GameObjects.GameObject,
) => boolean;

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
    projectile.setData('canDamage', options.canDamage ?? true);
    // 매 발사 시 덮어써 재사용된 몸체가 이전 소유자 정보를 유지하지 않게 한다.
    projectile.setData('owner', options.owner ?? null);
    this.scene.physics.velocityFromRotation(
      angle,
      this.config.speed,
      projectile.body!.velocity,
    );
    this.scheduleExpiry(projectile);

    return projectile;
  }

  /** 전달된 지형이 허용하는 경우에만 탄환을 비활성화한다. */
  collideWith(
    blockers: Phaser.Physics.Arcade.StaticGroup,
    blocksProjectile: ProjectileBlockerFilter = () => true,
  ) {
    this.scene.physics.add.collider(
      this.group,
      blockers,
      this.handleBlockerHit,
      (firstObject, secondObject) => {
        const blocker =
          firstObject instanceof Phaser.Physics.Arcade.Image
            ? secondObject
            : firstObject;
        return blocksProjectile(blocker as Phaser.GameObjects.GameObject);
      },
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
    // 장면 재시작은 재사용된 GameScene이 캐시한 시스템 참조를 교체하기 전에
    // 물리 그룹의 자식을 파괴한다. 이미 파괴된 풀의 정리는 아무 작업도 하지 않고,
    // 스테이지 이동을 중단시키지 않는다.
    if (!this.group.children) {
      return;
    }

    for (const child of this.group.getChildren()) {
      (child as Phaser.Physics.Arcade.Image).disableBody(true, true);
    }
  }

  /**
   * 탄환 풀을 현재 전투 화면 안으로 제한한다.
   *
   * 플레이어 탄환이 아직 보지 못한 교전까지 미리 날아가지 않도록 무기에 적용한다.
   * 적 탄환은 플레이어를 맞힐 수 있을 때 반드시 화면 안에 있으므로 원래 수명을 유지한다.
   */
  clearOutsideCamera(camera: Phaser.Cameras.Scene2D.Camera) {
    if (!this.group.children) {
      return;
    }

    const view = camera.worldView;
    for (const child of this.group.getChildren()) {
      const projectile = child as Phaser.Physics.Arcade.Image;
      if (
        projectile.active &&
        !Phaser.Geom.Rectangle.Contains(view, projectile.x, projectile.y)
      ) {
        projectile.disableBody(true, true);
      }
    }
  }

  /**
   * 사수가 사망하면 그 사수가 발사한 탄환을 화면에서 제거한다.
   *
   * 소유자가 사라진 뒤에도 탄환이 맞는 상황을 막기 위해 같은 프레임에 몸체를
   * 비활성화하고, 잔상 객체가 페이드를 담당한다. 풀은 탄환 몸체를 즉시 재사용하므로
   * 탄환 자체를 페이드하면 트윈이 다음 탄환의 투명도까지 낮추게 된다.
   */
  clearFrom(owner: object) {
    if (!this.group.children) {
      return;
    }

    for (const child of this.group.getChildren()) {
      const projectile = child as Phaser.Physics.Arcade.Image;
      if (!projectile.active || projectile.getData('owner') !== owner) {
        continue;
      }

      const ghost = this.scene.add
        .image(projectile.x, projectile.y, this.config.texture)
        .setRotation(projectile.rotation)
        .setDepth(projectile.depth);
      this.scene.tweens.add({
        targets: ghost,
        alpha: 0,
        duration: 80,
        onComplete: () => ghost.destroy(),
      });

      projectile.disableBody(true, true);
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
