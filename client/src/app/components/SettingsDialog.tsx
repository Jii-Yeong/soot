import { type KeyboardEvent, useRef, useState } from 'react';
import { AUDIO_MIX_CONFIG, type AudioMix } from '@/game/config/audioConfig';
import {
  DEFAULT_GRAPHICS_SETTINGS,
  DISPLAY_RESOLUTION_OPTIONS,
} from '@/game/config/graphicsConfig';
import { useGameSettingsStore } from '@/stores/gameSettingsStore';

const AUDIO_CHANNELS: Array<{ key: keyof AudioMix; label: string }> = [
  { key: 'master', label: '마스터' },
  { key: 'music', label: '음악' },
  { key: 'sfx', label: '효과음' },
];

type SettingsTab = 'graphics' | 'audio';

export function SettingsDialog() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('graphics');
  const graphicsTabRef = useRef<HTMLButtonElement>(null);
  const audioTabRef = useRef<HTMLButtonElement>(null);
  const {
    audioMix,
    graphics,
    setAudioMix,
    resetAudioMix,
    setDisplayResolution,
    resetGraphics,
    closeSettings,
  } = useGameSettingsStore();

  const selectTab = (tab: SettingsTab) => {
    setActiveTab(tab);
    (tab === 'graphics' ? graphicsTabRef : audioTabRef).current?.focus();
  };

  const handleTabKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      selectTab(activeTab === 'graphics' ? 'audio' : 'graphics');
    }

    if (event.key === 'Home') {
      event.preventDefault();
      selectTab('graphics');
    }

    if (event.key === 'End') {
      event.preventDefault();
      selectTab('audio');
    }
  };

  return (
    <div
      className='settings-overlay'
      role='dialog'
      aria-modal='true'
      aria-labelledby='settings-title'
    >
      <section className='settings-panel'>
        <p className='settings-panel__eyebrow'>SYSTEM CONFIG</p>
        <h2 id='settings-title' className='settings-panel__title'>
          설정
        </h2>

        <div className='settings-panel__tabs' role='tablist' aria-label='설정 분류'>
          <button
            id='graphics-tab'
            ref={graphicsTabRef}
            type='button'
            role='tab'
            className={`settings-panel__tab${
              activeTab === 'graphics' ? ' settings-panel__tab--active' : ''
            }`}
            aria-selected={activeTab === 'graphics'}
            aria-controls='graphics-panel'
            onClick={() => selectTab('graphics')}
            onKeyDown={handleTabKeyDown}
            autoFocus
          >
            그래픽
          </button>
          <button
            id='audio-tab'
            ref={audioTabRef}
            type='button'
            role='tab'
            className={`settings-panel__tab${
              activeTab === 'audio' ? ' settings-panel__tab--active' : ''
            }`}
            aria-selected={activeTab === 'audio'}
            aria-controls='audio-panel'
            onClick={() => selectTab('audio')}
            onKeyDown={handleTabKeyDown}
          >
            사운드
          </button>
        </div>

        {activeTab === 'graphics' ? (
          <section
            id='graphics-panel'
            className='settings-panel__section'
            role='tabpanel'
            aria-labelledby='graphics-tab'
          >
            <div className='settings-panel__section-heading'>
              <h3>그래픽</h3>
              <button
                type='button'
                className='settings-panel__section-reset'
                aria-label='그래픽 기본값'
                onClick={resetGraphics}
                disabled={
                  graphics.displayResolution ===
                  DEFAULT_GRAPHICS_SETTINGS.displayResolution
                }
              >
                기본값
              </button>
            </div>
            <label className='settings-panel__select'>
              <span>표시 해상도</span>
              <select
                aria-label='표시 해상도'
                value={graphics.displayResolution}
                onChange={(event) =>
                  setDisplayResolution(
                    event.target
                      .value as (typeof DISPLAY_RESOLUTION_OPTIONS)[number]['value'],
                  )
                }
              >
                {DISPLAY_RESOLUTION_OPTIONS.map(({ value, label }) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <p className='settings-panel__description'>
              창보다 큰 해상도는 화면에 맞춰 표시됩니다.
            </p>
          </section>
        ) : (
          <section
            id='audio-panel'
            className='settings-panel__section'
            role='tabpanel'
            aria-labelledby='audio-tab'
          >
            <div className='settings-panel__section-heading'>
              <h3>사운드</h3>
              <button
                type='button'
                className='settings-panel__section-reset'
                aria-label='사운드 기본값'
                onClick={resetAudioMix}
                disabled={
                  audioMix.master === AUDIO_MIX_CONFIG.master &&
                  audioMix.music === AUDIO_MIX_CONFIG.music &&
                  audioMix.sfx === AUDIO_MIX_CONFIG.sfx
                }
              >
                기본값
              </button>
            </div>
            <div className='settings-panel__channels'>
              {AUDIO_CHANNELS.map(({ key, label }) => {
                const value = Math.round(audioMix[key] * 100);

                return (
                  <label key={key} className='settings-panel__channel'>
                    <span>{label}</span>
                    <output htmlFor={`volume-${key}`}>{value}%</output>
                    <input
                      id={`volume-${key}`}
                      type='range'
                      min='0'
                      max='100'
                      value={value}
                      aria-label={`${label} 볼륨`}
                      onChange={(event) =>
                        setAudioMix(key, Number(event.target.value) / 100)
                      }
                    />
                  </label>
                );
              })}
            </div>
          </section>
        )}

        <div className='settings-panel__actions'>
          <button
            type='button'
            className='settings-panel__close'
            onClick={closeSettings}
          >
            닫기
          </button>
        </div>
      </section>
    </div>
  );
}
