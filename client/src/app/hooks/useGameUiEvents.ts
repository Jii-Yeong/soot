import { useEffect } from 'react';
import { gameEvents } from '@/game/events/gameEvents';
import type { BossPhase } from '@/game/state/bossPhase';
import type { GamePhase } from '@/game/state/gamePhase';
import type { GameSceneKey } from '@/game/state/gameSceneKey';
import type { RoomState } from '@/game/state/roomState';
import { useGameUiStore } from '@/stores/gameUiStore';

export function useGameUiEvents() {
  useEffect(() => {
    const handleHealthChanged = (current: number, max: number) => {
      useGameUiStore.getState().setHealth(current, max);
    };
    const handleEnemyHealthChanged = (
      current: number,
      max: number,
      isBoss: boolean,
    ) => {
      useGameUiStore.getState().setEnemyHealth(current, max, isBoss);
    };
    const handleBossPhaseChanged = (bossPhase: BossPhase | null) => {
      useGameUiStore.getState().setBossPhase(bossPhase);
    };
    const handlePhaseChanged = (phase: GamePhase) => {
      useGameUiStore.getState().setPhase(phase);
    };
    const handleSceneChanged = (scene: GameSceneKey) => {
      useGameUiStore.getState().setScene(scene);
    };
    const handleRoomStateChanged = (roomState: RoomState) => {
      useGameUiStore.getState().setRoomState(roomState);
    };
    const handleWeaponChanged = (id: string, label: string) => {
      useGameUiStore.getState().setWeapon(id, label);
    };
    const handleNearbyWeaponChanged = (id: string | null) => {
      useGameUiStore.getState().setNearbyWeapon(id);
    };

    gameEvents.on('health-changed', handleHealthChanged);
    gameEvents.on('enemy-health-changed', handleEnemyHealthChanged);
    gameEvents.on('boss-phase-changed', handleBossPhaseChanged);
    gameEvents.on('phase-changed', handlePhaseChanged);
    gameEvents.on('room-state-changed', handleRoomStateChanged);
    gameEvents.on('scene-changed', handleSceneChanged);
    gameEvents.on('weapon-changed', handleWeaponChanged);
    gameEvents.on('nearby-weapon-changed', handleNearbyWeaponChanged);

    return () => {
      gameEvents.off('health-changed', handleHealthChanged);
      gameEvents.off('enemy-health-changed', handleEnemyHealthChanged);
      gameEvents.off('boss-phase-changed', handleBossPhaseChanged);
      gameEvents.off('phase-changed', handlePhaseChanged);
      gameEvents.off('room-state-changed', handleRoomStateChanged);
      gameEvents.off('scene-changed', handleSceneChanged);
      gameEvents.off('weapon-changed', handleWeaponChanged);
      gameEvents.off('nearby-weapon-changed', handleNearbyWeaponChanged);
    };
  }, []);
}
