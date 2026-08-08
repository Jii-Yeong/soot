import type Phaser from 'phaser';
import { describe, expect, it, vi } from 'vitest';
import type { Enemy } from '@/game/entities/Enemy';
import { connectEnemyToRoomGeometry } from '@/game/systems/enemyCollision';

function createFixture() {
  const enemy = { id: 'enemy' } as unknown as Enemy;
  const floor = { id: 'floor' } as unknown as Phaser.Physics.Arcade.StaticGroup;
  const enemyPitBarriers = {
    id: 'enemy-pit-barriers',
  } as unknown as Phaser.Physics.Arcade.StaticGroup;
  const terrain = {
    id: 'terrain',
  } as unknown as Phaser.Physics.Arcade.StaticGroup;
  const collider = vi.fn();
  const scene = {
    physics: { add: { collider } },
  } as unknown as Phaser.Scene;

  return { collider, enemy, enemyPitBarriers, floor, scene, terrain };
}

describe('enemy collision with room geometry', () => {
  it('connects grounded enemies to floor, terrain, and pit barriers', () => {
    const { collider, enemy, enemyPitBarriers, floor, scene, terrain } =
      createFixture();

    connectEnemyToRoomGeometry(
      scene,
      enemy,
      floor,
      terrain,
      {},
      enemyPitBarriers,
    );

    expect(collider).toHaveBeenCalledWith(enemy, floor);
    expect(collider).toHaveBeenCalledWith(enemy, terrain);
    expect(collider).toHaveBeenCalledWith(enemy, enemyPitBarriers);
  });

  it('keeps flying enemies off the floor while still respecting terrain', () => {
    const { collider, enemy, enemyPitBarriers, floor, scene, terrain } =
      createFixture();

    connectEnemyToRoomGeometry(
      scene,
      enemy,
      floor,
      terrain,
      { collidesWithFloor: false },
      enemyPitBarriers,
    );

    expect(collider).not.toHaveBeenCalledWith(enemy, floor);
    expect(collider).not.toHaveBeenCalledWith(enemy, enemyPitBarriers);
    expect(collider).toHaveBeenCalledWith(enemy, terrain);
  });

  it('can ignore raised terrain while keeping floor collision', () => {
    const { collider, enemy, enemyPitBarriers, floor, scene, terrain } =
      createFixture();

    connectEnemyToRoomGeometry(
      scene,
      enemy,
      floor,
      terrain,
      { collidesWithTerrain: false },
      enemyPitBarriers,
    );

    expect(collider).toHaveBeenCalledWith(enemy, floor);
    expect(collider).toHaveBeenCalledWith(enemy, enemyPitBarriers);
    expect(collider).not.toHaveBeenCalledWith(enemy, terrain);
  });
});
