import { create } from 'zustand';
import type { BossPhase } from '@/game/state/bossPhase';
import type { GamePhase } from '@/game/state/gamePhase';
import type { GameSceneKey } from '@/game/state/gameSceneKey';
import type { RoomState } from '@/game/state/roomState';
import { WEAPON_INVENTORY_SIZE } from '@/game/config/weaponConfig';

type GameUiState = {
  health: number;
  maxHealth: number;
  enemyHealth: number;
  enemyMaxHealth: number;
  enemyIsBoss: boolean;
  bossPhase: BossPhase | null;
  scene: GameSceneKey;
  phase: GamePhase;
  roomState: RoomState;
  stageLabel: string;
  roomNumber: number;
  weaponId: string;
  weaponLabel: string;
  weaponSlots: readonly (string | null)[];
  activeWeaponSlot: number;
  nearbyWeaponId: string | null;
  paused: boolean;
  setHealth: (health: number, maxHealth: number) => void;
  setEnemyHealth: (health: number, maxHealth: number, isBoss: boolean) => void;
  setBossPhase: (bossPhase: BossPhase | null) => void;
  setScene: (scene: GameSceneKey) => void;
  setPhase: (phase: GamePhase) => void;
  setRoomState: (roomState: RoomState) => void;
  setStageLocation: (stageLabel: string, roomNumber: number) => void;
  setWeapon: (weaponId: string, weaponLabel: string) => void;
  setWeaponInventory: (
    weaponSlots: readonly (string | null)[],
    activeWeaponSlot: number,
  ) => void;
  setNearbyWeapon: (nearbyWeaponId: string | null) => void;
  setPaused: (paused: boolean) => void;
};

export const useGameUiStore = create<GameUiState>((set) => ({
  health: 100,
  maxHealth: 100,
  enemyHealth: 100,
  enemyMaxHealth: 100,
  enemyIsBoss: false,
  bossPhase: null,
  scene: 'boot',
  phase: 'boot',
  roomState: 'idle',
  stageLabel: 'STAGE 1 | THE CITY',
  roomNumber: 1,
  weaponId: 'smg',
  weaponLabel: 'SMG',
  weaponSlots: Array.from(
    { length: WEAPON_INVENTORY_SIZE },
    (_, index) => (index === 0 ? 'smg' : null),
  ),
  activeWeaponSlot: 0,
  nearbyWeaponId: null,
  paused: false,
  setHealth: (health, maxHealth) => set({ health, maxHealth }),
  setEnemyHealth: (enemyHealth, enemyMaxHealth, enemyIsBoss) =>
    set({ enemyHealth, enemyMaxHealth, enemyIsBoss }),
  setBossPhase: (bossPhase) => set({ bossPhase }),
  setScene: (scene) => set({ scene }),
  setPhase: (phase) => set({ phase }),
  setRoomState: (roomState) => set({ roomState }),
  setStageLocation: (stageLabel, roomNumber) => set({ stageLabel, roomNumber }),
  setWeapon: (weaponId, weaponLabel) => set({ weaponId, weaponLabel }),
  setWeaponInventory: (weaponSlots, activeWeaponSlot) =>
    set({ weaponSlots: [...weaponSlots], activeWeaponSlot }),
  setNearbyWeapon: (nearbyWeaponId) => set({ nearbyWeaponId }),
  setPaused: (paused) => set({ paused }),
}));
