import type Phaser from 'phaser';
import { describe, expect, it, vi } from 'vitest';
import type { Enemy } from '@/game/entities/Enemy';
import { connectEnemyToRoomGeometry } from '@/game/systems/enemyCollision';

function createFixture() {
  const enemy = { id: 'enemy' } as unknown as Enemy;
  const floor = { id: 'floor' } as unknown as Phaser.Physics.Arcade.StaticGroup;
  const terrain = {
    id: 'terrain',
  } as unknown as Phaser.Physics.Arcade.StaticGroup;
  const collider = vi.fn();
  const scene = {
    physics: { add: { collider } },
  } as unknown as Phaser.Scene;

  return { collider, enemy, floor, scene, terrain };
}

describe('enemy collision with room geometry', () => {
  it('connects grounded enemies to both the floor and room terrain', () => {
    const { collider, enemy, floor, scene, terrain } = createFixture();

    connectEnemyToRoomGeometry(scene, enemy, floor, terrain);

    expect(collider).toHaveBeenCalledWith(enemy, floor);
    expect(collider).toHaveBeenCalledWith(enemy, terrain);
  });

  it('keeps flying enemies off the floor while still respecting terrain', () => {
    const { collider, enemy, floor, scene, terrain } = createFixture();

    connectEnemyToRoomGeometry(scene, enemy, floor, terrain, {
      collidesWithFloor: false,
    });

    expect(collider).not.toHaveBeenCalledWith(enemy, floor);
    expect(collider).toHaveBeenCalledWith(enemy, terrain);
  });
});
