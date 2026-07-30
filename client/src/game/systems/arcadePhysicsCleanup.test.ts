import { describe, expect, it, vi } from 'vitest';
import type Phaser from 'phaser';
import { destroyCollider } from '@/game/systems/arcadePhysicsCleanup';

describe('destroyCollider', () => {
  it('destroys a collider that still belongs to a physics world', () => {
    const destroy = vi.fn();
    const collider = {
      world: {},
      destroy,
    } as unknown as Phaser.Physics.Arcade.Collider;

    destroyCollider(collider);

    expect(destroy).toHaveBeenCalledOnce();
  });

  it('ignores a collider already released during scene shutdown', () => {
    const destroy = vi.fn();
    const collider = {
      world: null,
      destroy,
    } as unknown as Phaser.Physics.Arcade.Collider;

    destroyCollider(collider);

    expect(destroy).not.toHaveBeenCalled();
  });
});
