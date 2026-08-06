import Phaser from 'phaser';
import { gameConfig } from '@/game/gameConfig';
import { AudioDirector } from '@/game/systems/AudioDirector';
import { useGameSettingsStore } from '@/stores/gameSettingsStore';

export function createGame(parent: string) {
  const game = new Phaser.Game({
    ...gameConfig,
    parent,
  });
  const audioDirector = new AudioDirector(game);
  audioDirector.setMix(useGameSettingsStore.getState().audioMix);

  game.events.once(Phaser.Core.Events.DESTROY, () => audioDirector.destroy());

  // A handle to poke at from the console while the game is running. Phaser
  // keeps no registry of live instances, so without this there is no way to ask
  // a running build where a sprite actually ended up — which is the only way to
  // tell a bad offset from a bad texture. Stripped from production builds.
  if (import.meta.env.DEV) {
    (window as unknown as { __game?: Phaser.Game }).__game = game;
  }

  return game;
}
