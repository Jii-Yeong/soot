import { useEffect, useRef } from 'react';
import type Phaser from 'phaser';
import { createGame } from '@/game/createGame';

export function PhaserGame() {
  const gameRef = useRef<Phaser.Game | null>(null);

  useEffect(() => {
    gameRef.current = createGame('game-root');

    return () => {
      gameRef.current?.destroy(true);
      gameRef.current = null;
    };
  }, []);

  return <div id='game-root' className='game-canvas' />;
}

