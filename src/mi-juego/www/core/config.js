// config.js
import { Game } from './game.js'; // asegúrate de importar tu escena

export const config = {
  type: Phaser.AUTO,
  width: window.innerWidth - 4,
  height: window.innerHeight - 4,
  pixelArt: true,
  roundPixels: true,
  render: {
    antialias: false,
    powerPreference: 'high-performance',
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 0 },
      debug: false,
      fps: 60,
      fixedStep: false
    },
  },
  fps: {
    target: 30,
    forceSetTimeOut: false
  },
  scene: Game,
};
