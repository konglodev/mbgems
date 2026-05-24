import Phaser from 'phaser';
import { CafeteriaScene } from './scenes/CafeteriaScene';

export function createPhaserGame(parent: HTMLDivElement) {
  return new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    width: 360,
    height: 200,
    backgroundColor: '#fff4d6',
    pixelArt: true,
    roundPixels: true,
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    scene: [CafeteriaScene],
  });
}
