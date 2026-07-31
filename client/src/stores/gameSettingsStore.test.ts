import { beforeEach, describe, expect, it } from 'vitest';
import { useGameSettingsStore } from '@/stores/gameSettingsStore';

describe('gameSettingsStore', () => {
  beforeEach(() => {
    useGameSettingsStore.setState({ invincible: false });
  });

  it('toggles invincibility without resetting between scenes', () => {
    useGameSettingsStore.getState().toggleInvincible();
    expect(useGameSettingsStore.getState().invincible).toBe(true);

    useGameSettingsStore.getState().toggleInvincible();
    expect(useGameSettingsStore.getState().invincible).toBe(false);
  });
});
