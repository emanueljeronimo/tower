class GameObject extends Phaser.Physics.Arcade.Sprite {
    list = null;
    constructor(scene, list, x, y, texture, height, width) {
        super(scene, x, y, texture);
        this.list = list;
        list.add(this);
        scene.add.existing(this);
        scene.physics.add.existing(this);
        this.setSize(width, height);
        this.setDisplaySize(width, height);
    }
}

class Enemy extends GameObject {
    constructor(scene, list, path, x = 0, y = 100, height, width) {
        super(scene, list, x, y, 'enemy', height, width);
        this.health = 100;
        this.path = path;
        this.currentPointIndex = 0;
        this.speed = 100;
        this.startMoving();
    }

    takeDamage(damage) {
        this.health -= damage;
        if (this.health <= 0) {
            this.destroy();
            this.list.remove(this, true, true);
        }
    }

    startMoving() {
        const targetPoint = this.path[this.currentPointIndex];
        this.scene.tweens.add({
            targets: this,
            x: targetPoint.x,
            y: targetPoint.y,
            duration: Phaser.Math.Distance.Between(this.x, this.y, targetPoint.x, targetPoint.y) / this.speed * 1000,
            onComplete: () => {
                this.currentPointIndex++;
                if (this.currentPointIndex < this.path.length) {
                    this.startMoving();
                }
            }
        });
    }
}


class Tower extends GameObject {
    target = null;
    range = 500;
    bulletList = null;
    lastFired = 0;

    constructor(scene, list, bulletList, x, y, height, width) {
        super(scene, list, x, y, 'tower', height, width);
        this.bulletList = bulletList;
        this.rangeCircle = scene.add.circle(this.x, this.y, this.range, 0x0000ff, 0.2).setVisible(false);
        this.setInteractive();
        this.on('pointerdown', this.toggleRange, this);
    }

    setTarget(target) {
        this.target = target;
    }

    toggleRange() {
        this.rangeCircle.setVisible(!this.rangeCircle.visible);
    }

    update(time) {
        if (this.target && this.target.health <= 0) {
            this.target = null;
        }

        if (this.target && time > this.lastFired + 500) {
            if (Phaser.Math.Distance.Between(this.target.x, this.target.y, this.x, this.y) <= this.range) {
                const angle = Phaser.Math.Angle.Between(this.x, this.y, this.target.x, this.target.y);
                this.setAngle(Phaser.Math.RAD_TO_DEG * angle); // Set the angle of the tower sprite

                new Bullet(
                    this.scene,
                    this.bulletList,
                    this.x,
                    this.y - this.height / 2,
                    angle,
                    config.unitSize,
                    config.unitSize
                );
            }
            this.lastFired = time;
        }
    }
}

class Bullet extends GameObject {
    damage = 10;
    maxDistance = 500;

    constructor(scene, list, x, y, angle, height, width) {
        super(scene, list, x, y, 'bullet', height, width);
        this.startX = x;
        this.startY = y;
        this.setAngle(Phaser.Math.RAD_TO_DEG * angle); // Set the rotation of the bullet sprite
        this.setVelocityX(Math.cos(angle) * 400);
        this.setVelocityY(Math.sin(angle) * 400);
    }

    update() {
        const distance = Phaser.Math.Distance.Between(this.startX, this.startY, this.x, this.y);
        if (distance > this.maxDistance) {
            this.destroy();
            this.list.remove(this);
        }
    }
}

class MapGenerator {

    static generateMap(game, unitSize, height, width) {

        var path = []
        var xpath = (unitSize / 2) * 3;
        var ypath = height / 2 * unitSize;
        path.push({ x: 0, y: ypath });
        path.push({ x: (unitSize / 2), y: ypath });
        for (var i = 3; i < width + 1; i++) {
            path.push({ x: xpath, y: ypath });
            xpath = (unitSize * i) - (unitSize / 2);
        }


        const gridSize = { width: 17, height: 15 };
        const cellSize = { width: unitSize, height: unitSize };


        /* this could be good if I want a background
        const grid = this.add.image(0, 0, 'grid');
        grid.setOrigin(0);
        */

        // Create a group to hold the grid cells
        cells = game.add.group();

        // Loop through each cell in the grid
        for (let row = 1; row < gridSize.height; row++) {
            for (let col = 1; col < gridSize.width; col++) {
                const x = col * cellSize.width;
                const y = row * cellSize.height;

                // Create a cell sprite and add it to the cells group
                const cell = game.add.sprite(x, y, null);
                cell.setInteractive(new Phaser.Geom.Rectangle(0, 0, cellSize.width, cellSize.height), Phaser.Geom.Rectangle.Contains);
                cells.add(cell);
            }
        }

        // Set the position of the grid based on the cell size
        const offsetX = (game.cameras.main.width - (gridSize.width * cellSize.width)) / 2;
        const offsetY = (game.cameras.main.height - (gridSize.height * cellSize.height)) / 2;
        cells.children.iterate(function (cell) {
            cell.x += offsetX;
            cell.y += offsetY;
        });

        // Remove sprites that touch the specified points
        path.forEach((point) => {
            cells.children.each((cell) => {
                if (point.x >= cell.x && point.x <= cell.x + cell.width && point.y >= cell.y && point.y <= cell.y + cell.height) {
                    cells.remove(cell);
                    cell.destroy();
                }
            });
        });

        return path;
    }
}


var config = {
    type: Phaser.AUTO,
    width: 800,
    height: 700,
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },
    scene: {
        preload: preload,
        create: create,
        update: update
    },
    unitSize: 20,
    grid: {
        height: 15,
        width: 17
    }
};

var game = new Phaser.Game(config);
var enemy;
var enemies;
var bullets;
var towers;
var cells;
var addTowerButton;
var addTowerMode = false;

function preload() {
    this.load.image('bullet', 'bullet.png');
    this.load.image('enemy', 'enemy.png');
    this.load.image('tower', 'tower.png');
}

function create() {

    let path = MapGenerator.generateMap(this, config.unitSize, config.grid.height, config.grid.width);

    enemies = this.physics.add.group();
    enemy = new Enemy(this, enemies, path, path[0].x, path[0].y, config.unitSize, config.unitSize);
    bullets = this.physics.add.group();
    towers = this.physics.add.group();

    this.physics.add.overlap(enemies, bullets, function (enemy, bullet) {
        enemy.takeDamage(bullet.damage)
        bullet.destroy();
    }, null, this);

    // Create a group to hold the towers
    towers = this.add.group();

    // Listen for pointer click on a cell
    this.input.on('gameobjectdown', function (pointer, cell) {
        if (cell.input.enabled) {
            // Create a tower at the cell's position
            let tower = new Tower(this, towers, bullets, cell.x, cell.y, config.unitSize, config.unitSize);
            tower.setTarget(enemy);
            tower.setOrigin(0.5);
            towers.add(tower);

            // Disable input on the cell to prevent placing multiple towers
            cell.input.enabled = false;
        }
    }, this);

    /*en grid*/


}

function update(time, delta) {

    if (enemy) {
        towers.getChildren().forEach(function (tower) {
            tower.update(time);
        });

        bullets.getChildren().forEach(function (bullet) {
            bullet.update();
        });
    }
}
