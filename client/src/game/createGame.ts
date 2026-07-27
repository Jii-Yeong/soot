import Phaser from 'phaser';
import { gameConfig } from '@/game/gameConfig';

export function createGame(parent: string) {
  return new Phaser.Game({
    ...gameConfig,
    parent,
  });
}

