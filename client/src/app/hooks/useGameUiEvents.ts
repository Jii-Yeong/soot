import { useEffect } from 'react';
import { gameEvents } from '@/game/events/gameEvents';
import type { GamePhase } from '@/game/state/gamePhase';
import type { GameSceneKey } from '@/game/state/gameSceneKey';
import type { RoomState } from '@/game/state/roomState';
import { useGameUiStore } from '@/stores/gameUiStore';

export function useGameUiEvents() {
  useEffect(() => {
    const handleHealthChanged = (current: number, max: number) => {
      useGameUiStore.getState().setHealth(current, max);
    };
    const handleEnemyHealthChanged = (current: number, max: number) => {
      useGameUiStore.getState().setEnemyHealth(current, max);
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

    gameEvents.on('health-changed', handleHealthChanged);
    gameEvents.on('enemy-health-changed', handleEnemyHealthChanged);
    gameEvents.on('phase-changed', handlePhaseChanged);
    gameEvents.on('room-state-changed', handleRoomStateChanged);
    gameEvents.on('scene-changed', handleSceneChanged);

    return () => {
      gameEvents.off('health-changed', handleHealthChanged);
      gameEvents.off('enemy-health-changed', handleEnemyHealthChanged);
      gameEvents.off('phase-changed', handlePhaseChanged);
      gameEvents.off('room-state-changed', handleRoomStateChanged);
      gameEvents.off('scene-changed', handleSceneChanged);
    };
  }, []);
}
