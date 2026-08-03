import { useState } from 'react';
import { HealthMeter } from '@/app/components/HealthMeter';
import { useGameUiEvents } from '@/app/hooks/useGameUiEvents';
import { PhaserGame } from '@/game/PhaserGame';
import { WEAPON_CONFIGS } from '@/game/config/weaponConfig';
import { gameEvents } from '@/game/events/gameEvents';
import { useGameSettingsStore } from '@/stores/gameSettingsStore';
import { useGameUiStore } from '@/stores/gameUiStore';

export function App() {
  const [adminOpen, setAdminOpen] = useState(false);
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
    paused,
  } = useGameUiStore();
  const { invincible, toggleInvincible } = useGameSettingsStore();

  useGameUiEvents();

  const goToStage = (stageIndex: number) => {
    setAdminOpen(false);
    gameEvents.emit('admin-stage-requested', stageIndex);
  };

  // The menu stays open: swapping weapons is something you do several times in
  // a row while checking one, unlike jumping stages.
  const giveWeapon = (id: string) => {
    gameEvents.emit('admin-weapon-requested', id);
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

          {paused && (
            <div className="pause-overlay" role="dialog" aria-modal="true">
              <div className="pause-overlay__panel">
                <p className="pause-overlay__eyebrow">SYSTEM HALT</p>
                <h2 className="pause-overlay__title">일시정지</h2>
                <button
                  type="button"
                  className="pause-overlay__resume"
                  onClick={() => gameEvents.emit('pause-toggle-requested')}
                  autoFocus
                >
                  재개
                </button>
                <p className="pause-overlay__hint">ESC 로도 재개됩니다</p>
              </div>
            </div>
          )}

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

                <p className="admin-controls__group">무기</p>
                {WEAPON_CONFIGS.map((weapon) => (
                  <button
                    key={weapon.id}
                    type="button"
                    className={`admin-controls__button${
                      weaponId === weapon.id
                        ? ' admin-controls__button--active'
                        : ''
                    }`}
                    aria-pressed={weaponId === weapon.id}
                    onClick={() => giveWeapon(weapon.id)}
                  >
                    {weapon.label} 지급
                  </button>
                ))}

                <p className="admin-controls__group">스테이지</p>
                {[1, 2, 3, 4, 5].map((stageNumber) => (
                  <button
                    key={stageNumber}
                    type="button"
                    className="admin-controls__button"
                    onClick={() => goToStage(stageNumber - 1)}
                  >
                    {stageNumber}스테이지 가기
                  </button>
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
