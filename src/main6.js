var config = {
    type: Phaser.AUTO,
    width: 960,
    height: 496,
    scene: {
        preload: preload,
        create: create
    }
};

var game = new Phaser.Game(config);

function preload ()
{
    // Load any assets you need here
}

function create ()
{
    // Define the dimensions of the map
    var mapWidth = 60;
    var mapHeight = 31;

    // Define the width of the path
    var pathWidth = 10;

    // Define the color of the path
    var pathColor = '#00ff00';

    // Create a graphics object to draw the map
    var graphics = this.add.graphics();

    // Loop through each tile in the map and draw it
    for (var x = 0; x < mapWidth; x++) {
        for (var y = 0; y < mapHeight; y++) {
            // Define the position of the tile
            var xPos = x * 16; // assuming 16x16 pixel tiles
            var yPos = y * 16; // assuming 16x16 pixel tiles

            // Define the color of the tile
            var color = '#ffffff';

            // Check if this tile is part of the path
            if (x >= (mapWidth - pathWidth) / 2 && x < (mapWidth + pathWidth) / 2) {
                color = pathColor;
            }

            // Draw the tile
            graphics.fillStyle(color);
            graphics.fillRect(xPos, yPos, 16, 16);
        }
    }
}
