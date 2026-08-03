import Phaser from 'phaser';
import {
  BOSS_COMBAT_CONFIGS,
  BOSS_SPRITES,
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
import type { EnemySpawnConfig } from '@/game/config/roomConfig';
import { ArchitectBossEnemy } from '@/game/entities/ArchitectBossEnemy';
import type { Enemy } from '@/game/entities/Enemy';
import { FlyingEnemy } from '@/game/entities/FlyingEnemy';
import { HoundBossEnemy } from '@/game/entities/HoundBossEnemy';
import { InfernalBossEnemy } from '@/game/entities/InfernalBossEnemy';
import { LaserBossEnemy } from '@/game/entities/LaserBossEnemy';
import { MeleeEnemy } from '@/game/entities/MeleeEnemy';
import { PurifierBossEnemy } from '@/game/entities/PurifierBossEnemy';
import { RangedEnemy } from '@/game/entities/RangedEnemy';
import type { BossPhase } from '@/game/state/bossPhase';

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
    intensity: number | undefined,
    private readonly damagePlayer: (damage: number) => void,
    private readonly grabPlayer: (bossX: number, bossHalfWidth: number) => void,
    private readonly pullPlayer: (bossX: number, pullSpeed: number) => void,
    private readonly bossArena: BossArenaBounds,
    private readonly onBossPhaseChanged: (phase: BossPhase) => void,
    private readonly flyingSprite?: FlyingSpriteConfig,
    private readonly meleeSwing?: MeleeSwingConfig,
    private readonly rangedSprite?: RangedSpriteConfig,
    private readonly meleeSprite?: MeleeSpriteConfig,
  ) {
    this.intensity = intensity ?? 1;
  }

  create(spawn: EnemySpawnConfig): Enemy {
    switch (spawn.type) {
      case 'melee':
        return this.createMeleeEnemy(spawn);
      case 'ranged':
        return this.createRangedEnemy(spawn);
      case 'flying':
        return this.createFlyingEnemy(spawn);
      case 'boss':
        return this.createBossEnemy(spawn);
    }
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
          BOSS_SPRITES[spawn.variant],
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
          this.grabPlayer,
          this.pullPlayer,
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
    options: { collidesWithFloor: boolean } = { collidesWithFloor: true },
  ) {
    enemy.setAlpha(0);

    if (options.collidesWithFloor) {
      this.scene.physics.add.collider(enemy, this.floor);
    }

    this.scene.tweens.add({
      targets: enemy,
      alpha: 1,
      duration: 260,
    });

    return enemy;
  }
}
