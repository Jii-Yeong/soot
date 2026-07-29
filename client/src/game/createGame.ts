import Phaser from 'phaser';
import { gameConfig } from '@/game/gameConfig';
import { AudioDirector } from '@/game/systems/AudioDirector';

export function createGame(parent: string) {
  const game = new Phaser.Game({
    ...gameConfig,
    parent,
  });
  const audioDirector = new AudioDirector(game);

  game.events.once(Phaser.Core.Events.DESTROY, () => audioDirector.destroy());

  return game;
}
