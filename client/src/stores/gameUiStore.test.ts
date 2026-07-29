import { beforeEach, describe, expect, it } from 'vitest';
import { useGameUiStore } from '@/stores/gameUiStore';

describe('gameUiStore', () => {
  beforeEach(() => {
    useGameUiStore.setState({
      health: 100,
      maxHealth: 100,
      enemyHealth: 100,
      enemyMaxHealth: 100,
      scene: 'boot',
      phase: 'boot',
      roomState: 'idle',
      weaponId: 'smg',
      weaponLabel: 'SMG',
      nearbyWeaponId: null,
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

  it('tracks gameplay phases without owning the game simulation', () => {
    useGameUiStore.getState().setPhase('dead');

    expect(useGameUiStore.getState().phase).toBe('dead');
  });

  it('tracks room lock and clear states for React overlays', () => {
    useGameUiStore.getState().setRoomState('locked');

    expect(useGameUiStore.getState().roomState).toBe('locked');
  });

  it('tracks the equipped weapon for the HUD and integration tests', () => {
    useGameUiStore.getState().setWeapon('rail-rifle', 'RAIL RIFLE');

    expect(useGameUiStore.getState()).toMatchObject({
      weaponId: 'rail-rifle',
      weaponLabel: 'RAIL RIFLE',
    });
  });

  it('tracks when a dropped weapon is close enough to equip', () => {
    useGameUiStore.getState().setNearbyWeapon('shotgun');

    expect(useGameUiStore.getState().nearbyWeaponId).toBe('shotgun');
  });
});
