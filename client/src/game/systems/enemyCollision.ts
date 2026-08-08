import type Phaser from 'phaser';
import type { Enemy } from '@/game/entities/Enemy';

export type EnemyCollisionOptions = {
  collidesWithFloor?: boolean;
  collidesWithTerrain?: boolean;
  /** 바닥과는 충돌하되 피트 가장자리 장벽은 무시할지. 천장 정비병처럼
   *  구덩이에 그대로 추락해야 하는 적에 사용. 기본값 true. */
  collidesWithPitBarriers?: boolean;
};

/**
 * 적 몸체를 해당 적이 따라야 하는 방 지형에 연결함.
 *
 * 지형 그룹의 몸체는 이미 면별 충돌 정책을 가짐. 벽은 모든 면이 단단하고
 * 발판은 위에서 착지하는 몸체만 받음. 지상 적은 추격 중 바닥 구간을 벗어나지
 * 않도록 보이지 않는 피트 가장자리 장벽과도 충돌함.
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
    if (enemyPitBarriers && (options.collidesWithPitBarriers ?? true)) {
      scene.physics.add.collider(enemy, enemyPitBarriers);
    }
  }

  if (options.collidesWithTerrain ?? true) {
    scene.physics.add.collider(enemy, terrain);
  }
}
