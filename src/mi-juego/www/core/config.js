export const config = {
  type: Phaser.AUTO,
  width: window.innerWidth - 4,
  height: window.innerHeight - 4,

  // ⚠️ No uses pixelArt ni roundPixels con SVG
  pixelArt: false,
  roundPixels: false,

  render: {
    antialias: true,                 // ✅ Suaviza bordes de SVGs
    powerPreference: 'high-performance',
  },

  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 0 },
      debug: false,
      fps: 60,
      fixedStep: false,
    },
  },

  fps: {
    target: 60,
    forceSetTimeOut: false,
  },

  scene: [],
};
