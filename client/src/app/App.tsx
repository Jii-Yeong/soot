import { useState } from 'react';
import { HealthMeter } from '@/app/components/HealthMeter';
import { useGameUiEvents } from '@/app/hooks/useGameUiEvents';
import { PhaserGame } from '@/game/PhaserGame';
import { gameEvents } from '@/game/events/gameEvents';
import { useGameSettingsStore } from '@/stores/gameSettingsStore';
import { useGameUiStore } from '@/stores/gameUiStore';

export function App() {
  const [adminOpen, setAdminOpen] = useState(false);
  const [showEnemyHealth, setShowEnemyHealth] = useState(false);
  const {
    health,
    maxHealth,
    enemyHealth,
    enemyMaxHealth,
    enemyIsBoss,
    bossPhase,
    scene,
    phase,
    roomState,
    weaponId,
    nearbyWeaponId,
  } = useGameUiStore();
  const { invincible, toggleInvincible } = useGameSettingsStore();

  useGameUiEvents();

  const goToStage = (stageIndex: number) => {
    setAdminOpen(false);
    gameEvents.emit('admin-stage-requested', stageIndex);
  };

  const goToStageBoss = (stageIndex: number) => {
    setAdminOpen(false);
    gameEvents.emit('admin-stage-boss-requested', stageIndex);
  };

  return (
    <main
      className="game-shell"
      data-phase={phase}
      data-room-state={roomState}
      data-scene={scene}
      data-weapon={weaponId}
      data-nearby-weapon={nearbyWeaponId ?? ''}
      data-invincible={invincible}
      data-enemy-health-visible={enemyIsBoss || showEnemyHealth}
    >
      <PhaserGame />
      {scene === 'game' && (
        <>
          <div className="hud-layer">
            <HealthMeter
              label="PLAYER"
              value={health}
              maxValue={maxHealth}
              variant="player"
            />
            {(enemyIsBoss || showEnemyHealth) && (
              <HealthMeter
                label={enemyIsBoss ? 'BOSS' : 'ENEMY'}
                value={enemyHealth}
                maxValue={enemyMaxHealth}
                variant="enemy"
                bossPhase={enemyIsBoss ? bossPhase : null}
              />
            )}
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

          <div className="admin-controls">
            <button
              type="button"
              className="admin-controls__trigger"
              aria-expanded={adminOpen}
              aria-controls="admin-menu"
              onClick={() => setAdminOpen((open) => !open)}
            >
              ADMIN
            </button>

            {adminOpen && (
              <div
                id="admin-menu"
                className="admin-controls__menu"
                role="dialog"
                aria-label="Admin menu"
              >
                <button
                  type="button"
                  className={`admin-controls__button${
                    invincible ? ' admin-controls__button--active' : ''
                  }`}
                  aria-label="Invincibility mode"
                  aria-pressed={invincible}
                  onClick={toggleInvincible}
                >
                  무적 // {invincible ? 'ON' : 'OFF'}
                </button>

                <button
                  type="button"
                  className={`admin-controls__button${
                    showEnemyHealth ? ' admin-controls__button--active' : ''
                  }`}
                  aria-label="Enemy health display"
                  aria-pressed={showEnemyHealth}
                  onClick={() => setShowEnemyHealth((visible) => !visible)}
                >
                  일반 몬스터 체력 // {showEnemyHealth ? 'ON' : 'OFF'}
                </button>

                {[1, 2, 3, 4, 5].map((stageNumber) => (
                  <div
                    key={stageNumber}
                    className="admin-controls__stage-row"
                  >
                    <button
                      type="button"
                      className="admin-controls__button"
                      onClick={() => goToStage(stageNumber - 1)}
                    >
                      {stageNumber}스테이지
                    </button>
                    <button
                      type="button"
                      className="admin-controls__button admin-controls__button--boss"
                      onClick={() => goToStageBoss(stageNumber - 1)}
                    >
                      보스
                    </button>
                  </div>
                ))}

                <button
                  type="button"
                  className="admin-controls__button admin-controls__button--close"
                  onClick={() => setAdminOpen(false)}
                >
                  닫기
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </main>
  );
}
