var config = {
    type: Phaser.AUTO,
    width: window.innerWidth-4,
    height: window.innerHeight-4,
    physics: {
      default: 'arcade',
      arcade: {
        gravity: { y: 0 },
        debug: false,
      },
    },
    scene: Game, // Use the custom Game class here
  };