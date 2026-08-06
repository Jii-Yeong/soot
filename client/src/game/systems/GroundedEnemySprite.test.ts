import type Phaser from 'phaser';
import { describe, expect, it, vi } from 'vitest';
import { GroundedEnemySprite } from '@/game/systems/GroundedEnemySprite';

vi.mock('phaser', () => ({
  default: { Animations: { Events: { ANIMATION_COMPLETE: 'complete' } } },
}));

const config = {
  animations: { idle: 'idle', death: 'death' },
  scale: 1.25,
  bodyWidth: 40,
  bodyHeight: 60,
  bodyOffsetX: 4,
  bodyOffsetY: 8,
};

describe('GroundedEnemySprite', () => {
  it('restores the active animation when a cold atlas finishes loading', () => {
    const sprite = {
      play: vi.fn(),
      setScale: vi.fn(),
    } as unknown as Phaser.Physics.Arcade.Sprite;
    const rig = new GroundedEnemySprite(sprite, config);

    rig.play('attack');
    vi.mocked(sprite.play).mockClear();
    rig.refresh();

    expect(sprite.setScale).toHaveBeenCalledWith(config.scale);
    expect(sprite.play).toHaveBeenCalledWith('attack', true);
  });
});
