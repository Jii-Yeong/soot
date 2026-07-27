import Phaser from 'phaser';
import type { GamePhase } from '@/game/state/gamePhase';
import type { GameSceneKey } from '@/game/state/gameSceneKey';

type GameEventMap = {
  'health-changed': [current: number, max: number];
  'enemy-health-changed': [current: number, max: number];
  'phase-changed': [phase: GamePhase];
  'scene-changed': [scene: GameSceneKey];
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
