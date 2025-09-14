export const config = {
  type: Phaser.AUTO,
  width: window.innerWidth - 4,
  height: window.innerHeight - 4,
  pixelArt: true,
  roundPixels: false,
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
  scene: [],
};
