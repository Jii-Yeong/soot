import type Phaser from 'phaser';
import type { Enemy } from '@/game/entities/Enemy';

export type EnemyCollisionOptions = {
  collidesWithFloor?: boolean;
  collidesWithTerrain?: boolean;
};

/**
 * Connects an enemy body to the room geometry it should obey.
 *
 * The terrain group's bodies already carry the face policy: walls are solid,
 * while platforms only catch a body landing from above. Reusing that group
 * gives enemies the same authored spatial rules as the player.
 */
export function connectEnemyToRoomGeometry(
  scene: Phaser.Scene,
  enemy: Enemy,
  floor: Phaser.Physics.Arcade.StaticGroup,
  terrain: Phaser.Physics.Arcade.StaticGroup,
  options: EnemyCollisionOptions = {},
) {
  if (options.collidesWithFloor ?? true) {
    scene.physics.add.collider(enemy, floor);
  }

  if (options.collidesWithTerrain ?? true) {
    scene.physics.add.collider(enemy, terrain);
  }
}
