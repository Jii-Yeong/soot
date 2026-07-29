import { create } from 'zustand';
import type { GamePhase } from '@/game/state/gamePhase';
import type { GameSceneKey } from '@/game/state/gameSceneKey';
import type { RoomState } from '@/game/state/roomState';

type GameUiState = {
  health: number;
  maxHealth: number;
  enemyHealth: number;
  enemyMaxHealth: number;
  scene: GameSceneKey;
  phase: GamePhase;
  roomState: RoomState;
  weaponId: string;
  weaponLabel: string;
  nearbyWeaponId: string | null;
  setHealth: (health: number, maxHealth: number) => void;
  setEnemyHealth: (health: number, maxHealth: number) => void;
  setScene: (scene: GameSceneKey) => void;
  setPhase: (phase: GamePhase) => void;
  setRoomState: (roomState: RoomState) => void;
  setWeapon: (weaponId: string, weaponLabel: string) => void;
  setNearbyWeapon: (nearbyWeaponId: string | null) => void;
};

export const useGameUiStore = create<GameUiState>((set) => ({
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
  setHealth: (health, maxHealth) => set({ health, maxHealth }),
  setEnemyHealth: (enemyHealth, enemyMaxHealth) =>
    set({ enemyHealth, enemyMaxHealth }),
  setScene: (scene) => set({ scene }),
  setPhase: (phase) => set({ phase }),
  setRoomState: (roomState) => set({ roomState }),
  setWeapon: (weaponId, weaponLabel) => set({ weaponId, weaponLabel }),
  setNearbyWeapon: (nearbyWeaponId) => set({ nearbyWeaponId }),
}));
