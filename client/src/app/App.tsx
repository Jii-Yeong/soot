import { useEffect } from 'react';
import { PhaserGame } from '@/game/PhaserGame';
import { gameEvents } from '@/game/events/gameEvents';
import type { GamePhase } from '@/game/state/gamePhase';
import { useGameUiStore } from '@/stores/gameUiStore';

export function App() {
  const {
    health,
    maxHealth,
    enemyHealth,
    enemyMaxHealth,
    scene,
    phase,
    setHealth,
    setEnemyHealth,
    setPhase,
    setScene,
  } = useGameUiStore();

  useEffect(() => {
    const handleHealthChanged = (current: number, max: number) => {
      setHealth(current, max);
    };
    const handleSceneChanged = (nextScene: string) => {
      setScene(nextScene);
    };
    const handleEnemyHealthChanged = (current: number, max: number) => {
      setEnemyHealth(current, max);
    };
    const handlePhaseChanged = (nextPhase: GamePhase) => {
      setPhase(nextPhase);
    };

    gameEvents.on('health-changed', handleHealthChanged);
    gameEvents.on('enemy-health-changed', handleEnemyHealthChanged);
    gameEvents.on('phase-changed', handlePhaseChanged);
    gameEvents.on('scene-changed', handleSceneChanged);

    return () => {
      gameEvents.off('health-changed', handleHealthChanged);
      gameEvents.off('enemy-health-changed', handleEnemyHealthChanged);
      gameEvents.off('phase-changed', handlePhaseChanged);
      gameEvents.off('scene-changed', handleSceneChanged);
    };
  }, [setEnemyHealth, setHealth, setPhase, setScene]);

  return (
    <main className="game-shell" data-phase={phase} data-scene={scene}>
      <PhaserGame />
      {scene === 'game' && (
        <div className="hud-layer">
          <aside className="hud hud--player" aria-label="Player status">
            <span className="hud__label">PLAYER</span>
            <div
              className="hud__meter"
              role="meter"
              aria-label="Player health"
              aria-valuemin={0}
              aria-valuemax={maxHealth}
              aria-valuenow={health}
            >
              <span
                className="hud__meter-fill"
                style={{ width: `${(health / maxHealth) * 100}%` }}
              />
            </div>
            <span className="hud__value">
              {health}/{maxHealth}
            </span>
          </aside>

          <aside className="hud hud--enemy" aria-label="Enemy status">
            <span className="hud__label">ENEMY</span>
            <div
              className="hud__meter"
              role="meter"
              aria-label="Enemy health"
              aria-valuemin={0}
              aria-valuemax={enemyMaxHealth}
              aria-valuenow={enemyHealth}
            >
              <span
                className="hud__meter-fill hud__meter-fill--enemy"
                style={{
                  width: `${(enemyHealth / enemyMaxHealth) * 100}%`,
                }}
              />
            </div>
            <span className="hud__value">
              {enemyHealth}/{enemyMaxHealth}
            </span>
          </aside>
        </div>
      )}
    </main>
  );
}
