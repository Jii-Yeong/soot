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
    const handleEnemyHealthChanged = (current: number, max: number) => {
      useGameUiStore.getState().setEnemyHealth(current, max);
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
    const handlePauseChanged = (paused: boolean) => {
      useGameUiStore.getState().setPaused(paused);
    };
    /**
     * Listened for on the window rather than through Phaser's keyboard plugin:
     * that plugin pauses along with the scene, so a key bound through it could
     * pause the game and then never be heard again to unpause it.
     */
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || event.repeat) {
        return;
      }

      event.preventDefault();
      gameEvents.emit('pause-toggle-requested');
    };
    window.addEventListener('keydown', handleKeyDown);

    gameEvents.on('health-changed', handleHealthChanged);
    gameEvents.on('enemy-health-changed', handleEnemyHealthChanged);
    gameEvents.on('boss-phase-changed', handleBossPhaseChanged);
    gameEvents.on('phase-changed', handlePhaseChanged);
    gameEvents.on('room-state-changed', handleRoomStateChanged);
    gameEvents.on('scene-changed', handleSceneChanged);
    gameEvents.on('weapon-changed', handleWeaponChanged);
    gameEvents.on('nearby-weapon-changed', handleNearbyWeaponChanged);
    gameEvents.on('pause-changed', handlePauseChanged);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      gameEvents.off('pause-changed', handlePauseChanged);
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
