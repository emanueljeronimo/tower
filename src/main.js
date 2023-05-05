


// Create the game configuration object
const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    scene: {
      preload: preload,
      create: create,
      update: update
    }
  };
  
  // Create the game instance
  const game = new Phaser.Game(config);
  
  // Define global variables
  let button;
  let map;
  let tower;
  let enemy;
  let allyBase;
  
  // Preload assets
  function preload() {
    // Load assets if needed
  }
  
  // Create game objects
  function create() {
    // Create start button
    button = this.add.text(400, 300, 'Start Game', {
      fontSize: '32px',
      fill: '#fff',
      backgroundColor: '#000',
      padding: {
        x: 16,
        y: 8
      },
      align: 'center'
    }).setInteractive({ useHandCursor: true })
    .on('pointerdown', startGame);
  
    // Create map
    map = this.add.graphics();
    map.lineStyle(1, 0x808080, 1);
    for (let x = 0; x < 800; x += 25) {
      for (let y = 0; y < 600; y += 25) {
        map.strokeRect(x, y, 25, 25);
      }
    }
  }
  
  // Start the game
  function startGame() {
    // Remove button
    button.destroy();
  
    // Create the level 1 scene
    const level1Scene = new Phaser.Scene('Level1');
  
    // Preload level 1 assets if needed
    level1Scene.preload = function() {
      // Load assets if needed
    }
  
    // Create level 1 objects
    level1Scene.create = function() {
      // Create tower
      tower = this.add.graphics();
      tower.fillStyle(0xff0000, 1);
      tower.fillRect(300, 200, 25, 25);
  
      // Create enemy
      enemy = this.add.graphics();
      enemy.fillStyle(0x00ff00, 1);
      enemy.fillRect(500, 400, 25, 25);
  
      // Create ally base
      allyBase = this.add.graphics();
      allyBase.fillStyle(0x0000ff, 1);
      allyBase.fillRect(700, 300, 50, 50);
    }
  
    // Update level 1
    level1Scene.update = function() {
      // Update game objects for level 1
    }
  
    // Add level 1 scene to the game
    game.scene.add('Level1', level1Scene, true);
  }
  
  // Update the game
  function update() {
    // Update game objects
  }
  