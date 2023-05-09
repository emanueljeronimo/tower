// Define the size of each cell
const CELL_SIZE = 20;

// Define the size of the game board
const BOARD_WIDTH = 60;
const BOARD_HEIGHT = 31;

// Initialize the Phaser game object
const game = new Phaser.Game({
  type: Phaser.AUTO,
  width: BOARD_WIDTH * CELL_SIZE,
  height: BOARD_HEIGHT * CELL_SIZE,
  scene: {
    // Define the create function that will run when the game starts
    create: function() {
      // Create a 2D array to represent the game board
      const board = [];
      for (let x = 0; x < BOARD_WIDTH; x++) {
        board[x] = [];
        for (let y = 0; y < BOARD_HEIGHT; y++) {
          board[x][y] = 0; // Set all cells to empty initially
        }
      }

      // Add a click listener to the game canvas
      this.input.on('pointerdown', function(pointer) {
        // Calculate the x and y coordinates of the cell that was clicked
        const x = Math.floor(pointer.x / CELL_SIZE);
        const y = Math.floor(pointer.y / CELL_SIZE);

        // Check if the clicked cell is within the bounds of the game board
        if (x >= 0 && x < BOARD_WIDTH && y >= 0 && y < BOARD_HEIGHT) {
          // Set the cell to contain a tower
          board[x][y] = 1;

          // Draw a tower sprite at the center of the clicked cell
          const tower = this.add.sprite(
            x * CELL_SIZE + CELL_SIZE / 2,
            y * CELL_SIZE + CELL_SIZE / 2,
            'tower'
          );
          tower.setOrigin(0.5); // Set the origin to the center of the sprite
        }
      }, this);
    }
  }
});

// Load the tower sprite image
game.load.image('tower', 'tower.png');

// Start the game
game.start();
