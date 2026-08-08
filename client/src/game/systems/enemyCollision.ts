import type Phaser from 'phaser';
import type { Enemy } from '@/game/entities/Enemy';

export type EnemyCollisionOptions = {
  collidesWithFloor?: boolean;
  collidesWithTerrain?: boolean;
};

/**
 * 적 몸체를 해당 적이 따라야 하는 방 지형에 연결함.
 *
 * 지형 그룹의 몸체는 이미 면별 충돌 정책을 가짐. 벽은 모든 면이 단단하고
 * 발판은 위에서 착지하는 몸체만 받음. 지상 적은 구덩이 가장자리 장벽에서
 * 멈춰 돌진이나 추격 때문에 추락하지 않음.
 */
export function connectEnemyToRoomGeometry(
  scene: Phaser.Scene,
  enemy: Enemy,
  floor: Phaser.Physics.Arcade.StaticGroup,
  terrain: Phaser.Physics.Arcade.StaticGroup,
  options: EnemyCollisionOptions = {},
  enemyPitBarriers?: Phaser.Physics.Arcade.StaticGroup,
) {
  if (options.collidesWithFloor ?? true) {
    scene.physics.add.collider(enemy, floor);
    if (enemyPitBarriers) {
      scene.physics.add.collider(enemy, enemyPitBarriers);
    }
  }

  if (options.collidesWithTerrain ?? true) {
    scene.physics.add.collider(enemy, terrain);
  }
}
