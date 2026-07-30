import { HealthMeter } from '@/app/components/HealthMeter';
import { useGameUiEvents } from '@/app/hooks/useGameUiEvents';
import { PhaserGame } from '@/game/PhaserGame';
import { useGameUiStore } from '@/stores/gameUiStore';

export function App() {
  const {
    health,
    maxHealth,
    enemyHealth,
    enemyMaxHealth,
    bossPhase,
    scene,
    phase,
    roomState,
    weaponId,
    nearbyWeaponId,
  } = useGameUiStore();

  useGameUiEvents();

  return (
    <main
      className="game-shell"
      data-phase={phase}
      data-room-state={roomState}
      data-scene={scene}
      data-weapon={weaponId}
      data-nearby-weapon={nearbyWeaponId ?? ''}
    >
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
            bossPhase={bossPhase}
          />
          {bossPhase === 2 && (
            <div
              className="boss-phase-alert"
              role="status"
              aria-live="assertive"
            >
              <span>PHASE 2</span>
              <strong>CORE OVERLOAD</strong>
            </div>
          )}
        </div>
      )}
    </main>
  );
}
