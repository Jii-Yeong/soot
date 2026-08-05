import { useEffect, useState } from 'react';
import { HealthMeter } from '@/app/components/HealthMeter';
import { SettingsDialog } from '@/app/components/SettingsDialog';
import { WeaponInventory } from '@/app/components/WeaponInventory';
import { useGameUiEvents } from '@/app/hooks/useGameUiEvents';
import { PhaserGame } from '@/game/PhaserGame';
import { WEAPON_CONFIGS } from '@/game/config/weaponConfig';
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
    stageLabel,
    roomNumber,
    weaponId,
    weaponSlots,
    activeWeaponSlot,
    nearbyWeaponId,
    paused,
  } = useGameUiStore();
  const {
    invincible,
    audioMix,
    graphics,
    settingsOpen,
    toggleInvincible,
    openSettings,
    closeSettings,
  } = useGameSettingsStore();

  useGameUiEvents();

  useEffect(() => {
    gameEvents.emit('audio-mix-changed', audioMix);
  }, [audioMix]);

  useEffect(() => {
    if (settingsOpen && scene !== 'title' && !paused) {
      closeSettings();
    }
  }, [closeSettings, paused, scene, settingsOpen]);

  const goToStage = (stageIndex: number) => {
    setAdminOpen(false);
    gameEvents.emit('admin-stage-requested', stageIndex);
  };

  const goToStageBoss = (stageIndex: number) => {
    setAdminOpen(false);
    gameEvents.emit('admin-stage-boss-requested', stageIndex);
  };

  // The menu stays open: swapping weapons is something you do several times in
  // a row while checking one, unlike jumping stages.
  const giveWeapon = (id: string) => {
    gameEvents.emit('admin-weapon-requested', id);
  };

  return (
    <main
      className='game-shell'
      data-phase={phase}
      data-room-state={roomState}
      data-scene={scene}
      data-weapon={weaponId}
      data-nearby-weapon={nearbyWeaponId ?? ''}
      data-invincible={invincible}
      data-display-resolution={graphics.displayResolution}
      data-enemy-health-visible={enemyIsBoss || showEnemyHealth}
    >
      <div className='game-viewport'>
        <PhaserGame />
        {scene === 'title' && !settingsOpen && (
          <button
            type='button'
            className='title-settings-trigger'
            onClick={openSettings}
          >
            설정
          </button>
        )}
        {scene === 'game' && (
          <>
            <div className='hud-layer'>
              <div className='hud-player-stack'>
                <HealthMeter
                  label='PLAYER'
                  value={health}
                  maxValue={maxHealth}
                  variant='player'
                />
                <WeaponInventory
                  slots={weaponSlots}
                  activeSlotIndex={activeWeaponSlot}
                />
              </div>
              {(enemyIsBoss || showEnemyHealth) && (
                <HealthMeter
                  label={enemyIsBoss ? 'BOSS' : 'ENEMY'}
                  value={enemyHealth}
                  maxValue={enemyMaxHealth}
                  variant='enemy'
                  bossPhase={enemyIsBoss ? bossPhase : null}
                />
              )}
              {bossPhase === 2 && (
                <div
                  className='boss-phase-alert'
                  role='status'
                  aria-live='assertive'
                >
                  <span>PHASE 2</span>
                  <strong>CORE OVERLOAD</strong>
                </div>
              )}
            </div>

            {paused && !settingsOpen && (
              <div className='pause-overlay' role='dialog' aria-modal='true'>
                <div className='pause-overlay__panel'>
                  <p className='pause-overlay__eyebrow'>SYSTEM HALT</p>
                  <h2 className='pause-overlay__title'>일시정지</h2>
                  <button
                    type='button'
                    className='pause-overlay__resume'
                    onClick={() => gameEvents.emit('pause-toggle-requested')}
                    autoFocus
                  >
                    재개
                  </button>
                  <button
                    type='button'
                    className='pause-overlay__settings'
                    onClick={openSettings}
                  >
                    설정
                  </button>
                  <p className='pause-overlay__hint'>ESC 로도 재개됩니다</p>
                </div>
              </div>
            )}

            <div className='admin-controls'>
              <div className='stage-location' aria-label='Stage location'>
                <span className='stage-location__stage'>{stageLabel}</span>
                <strong className='stage-location__room'>
                  ROOM #{roomNumber}
                </strong>
              </div>

              <button
                type='button'
                className='admin-controls__trigger'
                aria-expanded={adminOpen}
                aria-controls='admin-menu'
                onClick={() => setAdminOpen((open) => !open)}
              >
                ADMIN
              </button>

              {adminOpen && (
                <div
                  id='admin-menu'
                  className='admin-controls__menu'
                  role='dialog'
                  aria-label='Admin menu'
                >
                  <button
                    type='button'
                    className={`admin-controls__button${
                      invincible ? ' admin-controls__button--active' : ''
                    }`}
                    aria-label='Invincibility mode'
                    aria-pressed={invincible}
                    onClick={toggleInvincible}
                  >
                    무적 // {invincible ? 'ON' : 'OFF'}
                  </button>

                  <button
                    type='button'
                    className={`admin-controls__button${
                      showEnemyHealth ? ' admin-controls__button--active' : ''
                    }`}
                    aria-label='Enemy health display'
                    aria-pressed={showEnemyHealth}
                    onClick={() => setShowEnemyHealth((visible) => !visible)}
                  >
                    일반 몬스터 체력 // {showEnemyHealth ? 'ON' : 'OFF'}
                  </button>

                  <p className='admin-controls__group'>무기</p>
                  {WEAPON_CONFIGS.map((weapon) => (
                    <button
                      key={weapon.id}
                      type='button'
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

                  <p className='admin-controls__group'>스테이지</p>
                  {[1, 2, 3, 4, 5].map((stageNumber) => (
                    <div
                      key={stageNumber}
                      className='admin-controls__stage-row'
                    >
                      <button
                        type='button'
                        className='admin-controls__button'
                        onClick={() => goToStage(stageNumber - 1)}
                      >
                        {stageNumber}스테이지
                      </button>
                      <button
                        type='button'
                        className='admin-controls__button admin-controls__button--boss'
                        onClick={() => goToStageBoss(stageNumber - 1)}
                      >
                        보스
                      </button>
                    </div>
                  ))}

                  <button
                    type='button'
                    className='admin-controls__button admin-controls__button--close'
                    onClick={() => setAdminOpen(false)}
                  >
                    닫기
                  </button>
                </div>
              )}
            </div>
          </>
        )}
        {settingsOpen && <SettingsDialog />}
      </div>
    </main>
  );
}
