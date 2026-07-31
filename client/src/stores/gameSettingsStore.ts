import { create } from 'zustand';

type GameSettingsState = {
  invincible: boolean;
  setInvincible: (invincible: boolean) => void;
  toggleInvincible: () => void;
};

export const useGameSettingsStore = create<GameSettingsState>((set) => ({
  invincible: false,
  setInvincible: (invincible) => set({ invincible }),
  toggleInvincible: () =>
    set((state) => ({ invincible: !state.invincible })),
}));
