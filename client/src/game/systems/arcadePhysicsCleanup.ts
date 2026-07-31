import type Phaser from 'phaser';

/** Phaser nulls a collider's world during scene shutdown before some owners. */
export function destroyCollider(
  collider: Phaser.Physics.Arcade.Collider | undefined,
) {
  if (collider?.world) {
    collider.destroy();
  }
}
