import Phaser from 'phaser';
import type { BossPhase } from '@/game/state/bossPhase';
import type { GamePhase } from '@/game/state/gamePhase';
import type { GameSceneKey } from '@/game/state/gameSceneKey';
import type { RoomState } from '@/game/state/roomState';

/**
 * State events describe what the world *is* and drive the React HUD. Cue events
 * describe what just *happened* and carry the origin point, so audio, particles
 * and camera effects can subscribe without gameplay code knowing they exist.
 *
 * These names are a cross-developer contract — rename only by agreement.
 */
type GameEventMap = {
  'health-changed': [current: number, max: number];
  'enemy-health-changed': [current: number, max: number];
  'boss-phase-changed': [phase: BossPhase | null];
  'phase-changed': [phase: GamePhase];
  'room-state-changed': [state: RoomState];
  'scene-changed': [scene: GameSceneKey];
  'stage-changed': [stageId: string];
  'admin-stage-requested': [stageIndex: number];
  'weapon-fired': [weaponId: string, x: number, y: number];
  'player-damaged': [x: number, y: number];
  'player-dashed': [x: number, y: number];
  'enemy-damaged': [x: number, y: number];
  'enemy-defeated': [x: number, y: number];
  'weapon-changed': [id: string, label: string];
  'nearby-weapon-changed': [id: string | null];
};

type GameEventName = keyof GameEventMap;
type GameEventListener<Event extends GameEventName> = (
  ...args: GameEventMap[Event]
) => void;

class GameEventBus {
  private readonly emitter = new Phaser.Events.EventEmitter();

  emit<Event extends GameEventName>(
    event: Event,
    ...args: GameEventMap[Event]
  ) {
    return this.emitter.emit(event, ...args);
  }

  on<Event extends GameEventName>(
    event: Event,
    listener: GameEventListener<Event>,
  ) {
    this.emitter.on(event, listener);
    return this;
  }

  off<Event extends GameEventName>(
    event: Event,
    listener: GameEventListener<Event>,
  ) {
    this.emitter.off(event, listener);
    return this;
  }
}

export const gameEvents = new GameEventBus();
