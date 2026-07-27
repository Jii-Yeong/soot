import { beforeEach, describe, expect, it } from 'vitest';
import { useGameUiStore } from '@/stores/gameUiStore';

describe('gameUiStore', () => {
  beforeEach(() => {
    useGameUiStore.setState({
      health: 100,
      maxHealth: 100,
      scene: 'boot',
    });
  });

  it('updates health without owning gameplay state', () => {
    useGameUiStore.getState().setHealth(42, 120);

    expect(useGameUiStore.getState()).toMatchObject({
      health: 42,
      maxHealth: 120,
    });
  });

  it('tracks the active scene for React overlays', () => {
    useGameUiStore.getState().setScene('game');

    expect(useGameUiStore.getState().scene).toBe('game');
  });
});

