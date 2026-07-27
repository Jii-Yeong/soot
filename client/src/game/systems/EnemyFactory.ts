import Phaser from 'phaser';
import {
  MELEE_ENEMY_COMBAT_CONFIG,
  RANGED_ENEMY_COMBAT_CONFIG,
} from '@/game/config/combatConfig';
import type { EnemySpawnConfig } from '@/game/config/roomConfig';
import type { Enemy } from '@/game/entities/Enemy';
import { MeleeEnemy } from '@/game/entities/MeleeEnemy';
import { RangedEnemy } from '@/game/entities/RangedEnemy';

export class EnemyFactory {
  constructor(
    private readonly scene: Phaser.Scene,
    private readonly floor: Phaser.Physics.Arcade.StaticGroup,
  ) {}

  create(spawn: EnemySpawnConfig): Enemy {
    switch (spawn.type) {
      case 'melee':
        return this.createMeleeEnemy(spawn);
      case 'ranged':
        return this.createRangedEnemy(spawn);
    }
  }

  private createMeleeEnemy(spawn: EnemySpawnConfig) {
    const enemy = new MeleeEnemy(
      this.scene,
      spawn.x,
      spawn.y,
      'melee-enemy-placeholder',
      {
        health: MELEE_ENEMY_COMBAT_CONFIG.maxHealth,
        aggroRadius: MELEE_ENEMY_COMBAT_CONFIG.aggroRadius,
        moveSpeed: MELEE_ENEMY_COMBAT_CONFIG.moveSpeed,
        contactDamage: MELEE_ENEMY_COMBAT_CONFIG.contactDamage,
        contactDamageCooldown: MELEE_ENEMY_COMBAT_CONFIG.contactDamageCooldown,
      },
    );

    return this.finishSpawn(enemy);
  }

  private createRangedEnemy(spawn: EnemySpawnConfig) {
    const enemy = new RangedEnemy(
      this.scene,
      spawn.x,
      spawn.y,
      'enemy-placeholder',
      {
        health: RANGED_ENEMY_COMBAT_CONFIG.maxHealth,
        aggroRadius: RANGED_ENEMY_COMBAT_CONFIG.aggroRadius,
        fireInterval: RANGED_ENEMY_COMBAT_CONFIG.fireInterval,
      },
    );
    return this.finishSpawn(enemy);
  }

  private finishSpawn<EnemyType extends Enemy>(enemy: EnemyType) {
    enemy.setAlpha(0);
    this.scene.physics.add.collider(enemy, this.floor);
    this.scene.tweens.add({
      targets: enemy,
      alpha: 1,
      duration: 260,
    });

    return enemy;
  }
}
