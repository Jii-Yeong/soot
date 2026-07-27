import { HealthMeter } from '@/app/components/HealthMeter';
import { useGameUiEvents } from '@/app/hooks/useGameUiEvents';
import { PhaserGame } from '@/game/PhaserGame';
import { useGameUiStore } from '@/stores/gameUiStore';

export function App() {
  const { health, maxHealth, enemyHealth, enemyMaxHealth, scene, phase } =
    useGameUiStore();

  useGameUiEvents();

  return (
    <main className="game-shell" data-phase={phase} data-scene={scene}>
      <PhaserGame />
      {scene === 'game' && (
        <div className="hud-layer">
          <HealthMeter
            label="PLAYER"
            value={health}
            maxValue={maxHealth}
            variant="player"
          />
          <HealthMeter
            label="ENEMY"
            value={enemyHealth}
            maxValue={enemyMaxHealth}
            variant="enemy"
          />
        </div>
      )}
    </main>
  );
}
