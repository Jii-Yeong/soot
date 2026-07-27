import { useEffect } from 'react';
import { PhaserGame } from '@/game/PhaserGame';
import { gameEvents } from '@/game/events/gameEvents';
import { useGameUiStore } from '@/stores/gameUiStore';

export function App() {
  const {
    health,
    maxHealth,
    enemyHealth,
    enemyMaxHealth,
    scene,
    setHealth,
    setEnemyHealth,
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

    gameEvents.on('health-changed', handleHealthChanged);
    gameEvents.on('enemy-health-changed', handleEnemyHealthChanged);
    gameEvents.on('scene-changed', handleSceneChanged);

    return () => {
      gameEvents.off('health-changed', handleHealthChanged);
      gameEvents.off('enemy-health-changed', handleEnemyHealthChanged);
      gameEvents.off('scene-changed', handleSceneChanged);
    };
  }, [setEnemyHealth, setHealth, setScene]);

  return (
    <main className="game-shell" data-scene={scene}>
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
