import { useEffect, useRef } from 'react';
import type Phaser from 'phaser';
import { gameEvents } from '../game/events';
import { createPhaserGame } from '../game/phaserGame';
import type { Challenge, Tray } from '../types/game';

type PhaserStageProps = {
  challenge: Challenge;
  tray: Tray;
};

export default function PhaserStage({ challenge, tray }: PhaserStageProps) {
  const ref = useRef<HTMLDivElement>(null);
  const game = useRef<Phaser.Game | null>(null);

  useEffect(() => {
    if (!ref.current || game.current) return;
    game.current = createPhaserGame(ref.current);
    const replayTimer = window.setTimeout(() => {
      gameEvents.emit('challengeChanged', challenge);
      gameEvents.emit('trayChanged', tray);
    }, 50);
    return () => {
      window.clearTimeout(replayTimer);
      game.current?.destroy(true);
      game.current = null;
    };
  }, []);

  useEffect(() => {
    if (!game.current) return;
    gameEvents.emit('challengeChanged', challenge);
    gameEvents.emit('trayChanged', tray);
  }, [challenge, tray]);

  return <div ref={ref} className="pixel-stage" aria-label="Animated pixel cafeteria" />;
}
