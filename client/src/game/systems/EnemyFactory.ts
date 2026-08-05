import Phaser from 'phaser';
import {
  BOSS_COMBAT_CONFIGS,
  HOUND_BOSS_SPRITES,
  LASER_BOSS_SPRITES,
  PURIFIER_BOSS_SPRITES,
  hasBossPattern,
} from '@/game/config/bossConfig';
import type { BossArenaBounds } from '@/game/config/bossArena';
import {
  FLYING_ENEMY_COMBAT_CONFIG,
  MELEE_ENEMY_COMBAT_CONFIG,
  RANGED_ENEMY_COMBAT_CONFIG,
  type MeleeSwingConfig,
} from '@/game/config/combatConfig';
import type { FlyingSpriteConfig } from '@/game/config/flyingEnemyAnimationConfig';
import type { MeleeSpriteConfig } from '@/game/config/meleeEnemyAnimationConfig';
import type { RangedSpriteConfig } from '@/game/config/rangedEnemyAnimationConfig';
import type {
  CeilingPipe,
  EnemySpawnConfig,
} from '@/game/config/roomConfig';
import { ArchitectBossEnemy } from '@/game/entities/ArchitectBossEnemy';
import { BlockerEnemy } from '@/game/entities/BlockerEnemy';
import { CaptorEnemy } from '@/game/entities/CaptorEnemy';
import { CeilingMaintainerEnemy } from '@/game/entities/CeilingMaintainerEnemy';
import type { Enemy } from '@/game/entities/Enemy';
import { FlyingEnemy } from '@/game/entities/FlyingEnemy';
import type { PatrolBounds } from '@/game/systems/patrolSpan';
import { HoundBossEnemy } from '@/game/entities/HoundBossEnemy';
import { InfernalBossEnemy } from '@/game/entities/InfernalBossEnemy';
import { LaserBossEnemy } from '@/game/entities/LaserBossEnemy';
import { MeleeEnemy } from '@/game/entities/MeleeEnemy';
import { PurifierBossEnemy } from '@/game/entities/PurifierBossEnemy';
import { RangedEnemy } from '@/game/entities/RangedEnemy';
import type { BossPhase } from '@/game/state/bossPhase';
import {
  connectEnemyToRoomGeometry,
  type EnemyCollisionOptions,
} from '@/game/systems/enemyCollision';

type SpawnOf<Type extends EnemySpawnConfig['type']> = Extract<
  EnemySpawnConfig,
  { type: Type }
>;

const assertUnhandledBossConfig = (_config: never): never => {
  throw new Error('Unsupported boss pattern');
};

export class EnemyFactory {
  private readonly intensity: number;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly floor: Phaser.Physics.Arcade.StaticGroup,
    private readonly terrain: Phaser.Physics.Arcade.StaticGroup,
    private readonly enemyPitBarriers: Phaser.Physics.Arcade.StaticGroup,
    intensity: number | undefined,
    private readonly damagePlayer: (damage: number) => void,
    private readonly tetherPlayer: (
      sourceX: number,
      slowFactor: number,
      pullSpeed: number,
    ) => void,
    private readonly isPlayerDashing: () => boolean,
    private readonly pullPlayer: (bossX: number, pullSpeed: number) => void,
    private readonly ceilingPipes: readonly CeilingPipe[],
    private readonly bossArena: BossArenaBounds,
    private readonly onBossPhaseChanged: (phase: BossPhase) => void,
    /**
     * 이 위치의 적이 순찰할 수 있도록 방의 구덩이와 가장자리에 맞춰 잘라낸
     * 바닥 구간. 팩토리는 방의 형태를 모르고 배치 시점에 범위가 고정되므로,
     * 장면에서 계산해 전달한다.
     */
    private readonly patrolBoundsFor: (spawnX: number) => PatrolBounds | null,
    private readonly flyingSprite?: FlyingSpriteConfig,
    private readonly meleeSwing?: MeleeSwingConfig,
    private readonly rangedSprite?: RangedSpriteConfig,
    private readonly meleeSprite?: MeleeSpriteConfig,
  ) {
    this.intensity = intensity ?? 1;
  }

  private patrolFor(spawnX: number) {
    const bounds = this.patrolBoundsFor(spawnX);
    return bounds
      ? { ...bounds, speed: MELEE_ENEMY_COMBAT_CONFIG.patrolSpeed }
      : undefined;
  }

  create(spawn: EnemySpawnConfig): Enemy {
    switch (spawn.type) {
      case 'melee':
        return this.createMeleeEnemy(spawn);
      case 'ranged':
        return this.createRangedEnemy(spawn);
      case 'flying':
        return this.createFlyingEnemy(spawn);
      case 'ceiling-maintainer':
        return this.createCeilingMaintainer(spawn);
      case 'captor':
        return this.createCaptor(spawn);
      case 'blocker':
        return this.createBlocker(spawn);
      case 'boss':
        return this.createBossEnemy(spawn);
    }
  }

  private createCeilingMaintainer(spawn: SpawnOf<'ceiling-maintainer'>) {
    const pipe = this.ceilingPipes.find(({ id }) => id === spawn.pipeId);
    if (!pipe) {
      throw new Error(`Missing ceiling pipe: ${spawn.pipeId}`);
    }

    // 발판(2층)에 걸리지 않고 천장에서 1층 바닥까지 떨어져 돌진하도록 지형
    // 충돌은 끄고, 바닥 착지와 구덩이 가장자리 장벽은 그대로 둔다.
    return this.finishSpawn(
      new CeilingMaintainerEnemy(
        this.scene,
        spawn.x,
        pipe,
        this.damagePlayer,
      ),
      { collidesWithTerrain: false },
    );
  }

  private createCaptor(spawn: SpawnOf<'captor'>) {
    return this.finishSpawn(
      new CaptorEnemy(
        this.scene,
        spawn.x,
        spawn.y,
        this.damagePlayer,
        this.tetherPlayer,
        this.isPlayerDashing,
      ),
    );
  }

  private createBlocker(spawn: SpawnOf<'blocker'>) {
    return this.finishSpawn(
      new BlockerEnemy(
        this.scene,
        spawn.x,
        spawn.y,
        this.damagePlayer,
      ),
    );
  }

  private createMeleeEnemy(spawn: SpawnOf<'melee'>) {
    const enemy = new MeleeEnemy(
      this.scene,
      spawn.x,
      spawn.y,
      this.meleeSprite?.texture ?? 'melee-enemy-placeholder',
      {
        health: MELEE_ENEMY_COMBAT_CONFIG.maxHealth,
        aggroRadius: MELEE_ENEMY_COMBAT_CONFIG.aggroRadius,
        moveSpeed: MELEE_ENEMY_COMBAT_CONFIG.moveSpeed * this.intensity,
        contactDamage: MELEE_ENEMY_COMBAT_CONFIG.contactDamage,
        contactDamageCooldown: MELEE_ENEMY_COMBAT_CONFIG.contactDamageCooldown,
        patrol: this.patrolFor(spawn.x),
        swing: this.meleeSwing,
        sprite: this.meleeSprite,
      },
      this.damagePlayer,
    );

    return this.finishSpawn(enemy);
  }

  private createRangedEnemy(spawn: SpawnOf<'ranged'>) {
    const enemy = new RangedEnemy(
      this.scene,
      spawn.x,
      spawn.y,
      this.rangedSprite?.texture ?? 'enemy-placeholder',
      {
        health: RANGED_ENEMY_COMBAT_CONFIG.maxHealth,
        aggroRadius: RANGED_ENEMY_COMBAT_CONFIG.aggroRadius,
        fireInterval: RANGED_ENEMY_COMBAT_CONFIG.fireInterval / this.intensity,
        muzzleOffset: RANGED_ENEMY_COMBAT_CONFIG.projectile.muzzleOffset,
        moveSpeed: RANGED_ENEMY_COMBAT_CONFIG.moveSpeed * this.intensity,
        preferredDistance: RANGED_ENEMY_COMBAT_CONFIG.preferredDistance,
        distanceTolerance: RANGED_ENEMY_COMBAT_CONFIG.distanceTolerance,
        patrol: this.patrolFor(spawn.x),
        sprite: this.rangedSprite,
      },
    );
    return this.finishSpawn(enemy);
  }

  private createFlyingEnemy(spawn: SpawnOf<'flying'>) {
    const enemy = new FlyingEnemy(
      this.scene,
      spawn.x,
      spawn.y,
      this.flyingSprite?.texture ?? 'flying-enemy-placeholder',
      {
        health: FLYING_ENEMY_COMBAT_CONFIG.maxHealth,
        aggroRadius: FLYING_ENEMY_COMBAT_CONFIG.aggroRadius,
        hoverY: spawn.y,
        trackSpeed: FLYING_ENEMY_COMBAT_CONFIG.trackSpeed * this.intensity,
        fireInterval: FLYING_ENEMY_COMBAT_CONFIG.fireInterval / this.intensity,
        muzzleOffset: FLYING_ENEMY_COMBAT_CONFIG.projectile.muzzleOffset,
        movement: spawn.movement,
        sprite: this.flyingSprite,
      },
    );
    return this.finishSpawn(enemy, { collidesWithFloor: false });
  }

  private createBossEnemy(spawn: SpawnOf<'boss'>) {
    const config = BOSS_COMBAT_CONFIGS[spawn.variant];

    if (hasBossPattern(config, 'laser-cannon')) {
      return this.finishSpawn(
        new LaserBossEnemy(
          this.scene,
          spawn.x,
          spawn.y,
          config.texture,
          config,
          this.damagePlayer,
          LASER_BOSS_SPRITES[spawn.variant],
        ),
      );
    }

    if (hasBossPattern(config, 'hound')) {
      return this.finishSpawn(
        new HoundBossEnemy(
          this.scene,
          spawn.x,
          spawn.y,
          config.texture,
          config,
          this.damagePlayer,
          HOUND_BOSS_SPRITES[spawn.variant],
        ),
      );
    }

    if (hasBossPattern(config, 'purifier')) {
      return this.finishSpawn(
        new PurifierBossEnemy(
          this.scene,
          spawn.x,
          spawn.y,
          config.texture,
          config,
          this.damagePlayer,
          this.pullPlayer,
          PURIFIER_BOSS_SPRITES[spawn.variant],
        ),
      );
    }

    if (hasBossPattern(config, 'infernal')) {
      return this.finishSpawn(
        new InfernalBossEnemy(
          this.scene,
          spawn.x,
          spawn.y,
          config.texture,
          config,
          this.damagePlayer,
          this.bossArena,
          this.onBossPhaseChanged,
        ),
      );
    }

    if (hasBossPattern(config, 'architect')) {
      return this.finishSpawn(
        new ArchitectBossEnemy(
          this.scene,
          spawn.x,
          spawn.y,
          config.texture,
          config,
          this.damagePlayer,
          this.bossArena,
          this.onBossPhaseChanged,
        ),
        { collidesWithFloor: false },
      );
    }

    return assertUnhandledBossConfig(config);
  }

  private finishSpawn<EnemyType extends Enemy>(
    enemy: EnemyType,
    options: EnemyCollisionOptions = {},
  ) {
    enemy.setAlpha(0);
    connectEnemyToRoomGeometry(
      this.scene,
      enemy,
      this.floor,
      this.terrain,
      options,
      this.enemyPitBarriers,
    );

    this.scene.tweens.add({
      targets: enemy,
      alpha: 1,
      duration: 260,
    });

    return enemy;
  }
}
