import Phaser from 'phaser';
import { RANGED_ENEMY_COMBAT_CONFIG } from '@/game/config/combatConfig';
import type { EnemySpawnConfig } from '@/game/config/roomConfig';
import { RangedEnemy } from '@/game/entities/RangedEnemy';

export class EnemyFactory {
  constructor(
    private readonly scene: Phaser.Scene,
    private readonly floor: Phaser.Physics.Arcade.StaticGroup,
  ) {}

  create(spawn: EnemySpawnConfig) {
    switch (spawn.type) {
      case 'ranged':
        return this.createRangedEnemy(spawn);
    }
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
