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

function preload() {
    this.load.image('board', 'path/to/board/image.png');
    this.load.image('enemy', 'path/to/enemy/image.png');
}

function create() {
    // create the board sprite
    var board = this.add.sprite(0, 0, 'board');
    board.setOrigin(0, 0);

    // create the grid of cells
    var cellSize = 16;
    var gridWidth = 60;
    var gridHeight = 31;
    var cells = [];
    for (var y = 0; y < gridHeight; y++) {
        var row = [];
        for (var x = 0; x < gridWidth; x++) {
            var cell = this.add.rectangle(x * cellSize + cellSize/2, y * cellSize + cellSize/2, cellSize, cellSize, 0x000000);
            cell.setOrigin(0.5, 0.5);
            cell.setInteractive();
            cell.on('pointerdown', function () {
                if (!isPathCell(this)) {
                    this.setFillStyle(0x00ff00);
                }
            });
            row.push(cell);
        }
        cells.push(row);
    }

    // create the path of cells
    var pathY = Math.floor(gridHeight / 2);
    for (var x = 0; x < gridWidth; x++) {
        var cell = cells[pathY][x];
        cell.setFillStyle(0xff0000);
        cell.setInteractive({ useHandCursor: true });
        if (x > 0 && x < gridWidth - 1) {
            cell.on('pointerdown', function () {
                // do nothing, this is a path cell
            });
        } else {
            cell.on('pointerdown', function () {
                this.setFillStyle(0x00ff00);
            });
        }
    }

    var enemy = this.add.sprite(0, cellSize * pathY + cellSize/2, 'enemy');
    enemy.setScale(2); // Scale up the enemy sprite
    
    var targetX = config.width - cellSize/2;
    var duration = 3000; // in ms
    var enemyTween = this.tweens.add({
      targets: enemy,
      x: targetX,
      duration: duration,
      ease: 'Linear',
      repeat: -1 // repeat forever
    });
  }

  function isPathCell(cell) {
    return cell.fillColor == 0xff0000;
  }