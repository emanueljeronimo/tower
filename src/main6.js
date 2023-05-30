var config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
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
    }
};

/*
class Enemy extends Phaser.GameObjects.Rectangle {
    health = 100;
    constructor(scene, x = 100, y = 100, width = 50, height = 50, fillColor =  0x00ff00){
        super(scene, x, y, width, height, fillColor);
        scene.add.existing(this);
        scene.physics.add.existing(this, true);
     }
}*/

class Enemy extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x = 0, y = 0, width = 100, height = 100, fillColor = 0x00ff00) {
        super(scene, x, y, 'rectangleKey');
        scene.add.existing(this);
        scene.physics.add.existing(this);
        this.setSize(width, height);
        this.setDisplaySize(width, height);
        this.setTint(fillColor);
    }
}



var game = new Phaser.Game(config);
var enemy;
var enemies;
var bullets;
var towers;
var lastFired = 0;
var addTowerButton;
var addTowerMode = false;
const TOWER_RANGE = 200;
var selectedTower = null;

function preload() {
    this.load.image('bullet', 'bullet.png');
}


function create() {
    enemies = this.physics.add.group();
    enemy = new Enemy(this);
    bullets = this.physics.add.group();
    towers = this.physics.add.group();
    enemies.add(enemy);

    // Add input event listener for towers group
    towers.children.iterate(function(tower) {
        tower.setInteractive();
        tower.on('pointerdown', function(pointer) {
            selectedTower = tower;
            var graphics = this.add.graphics();
            graphics.lineStyle(2, 0xff0000);
            graphics.drawCircle(selectedTower.x, selectedTower.y, TOWER_RANGE * 2);
        }, this);
    }, this);

    //this.physics.world.enable([bullets, enemies]);
    this.physics.add.overlap(enemies, bullets, function(enemy, bullet) {
        enemy.health -= 10;
        bullet.destroy();
    }, null, this);

    addTowerButton = this.add.text(10, 10, 'Add Tower: OFF', { font: '24px Arial', fill: '#ffffff' }).setInteractive();
    addTowerButton.on('pointerdown', function() {
        addTowerMode = !addTowerMode;
        addTowerButton.setText('Add Tower: ' + (addTowerMode ? 'ON' : 'OFF'));
    });
}

function update(time, delta) {
    if (enemy.health <= 0) {
        enemy.destroy();
        towers.getChildren().forEach(function(tower) {
            tower.lastFired = 0;
        });
    }

    if (addTowerMode && this.input.activePointer.isDown) {
        var tower = this.add.rectangle(this.input.activePointer.worldX, this.input.activePointer.worldY, 50, 50, 0xff0000);
        tower.lastFired = 0;
        tower.rangeCircle = this.add.circle(tower.x, tower.y, TOWER_RANGE, 0x0000ff, 0.2).setVisible(false);
        towers.add(tower);
    }

    // Handle tower clicks
    if (this.input.activePointer.isDown) {
        var clickedTowers = towers.getChildren().filter(function(tower) {
            return Phaser.Geom.Rectangle.Contains(tower.getBounds(), this.input.activePointer.worldX, this.input.activePointer.worldY);
        }, this);

        if (clickedTowers.length > 0) {
            clickedTowers[0].rangeCircle.setVisible(true);
        } else {
            towers.getChildren().forEach(function(tower) {
                tower.rangeCircle.setVisible(false);
            });
        }
    }

    if (enemy && time > lastFired + 500) {
        towers.getChildren().forEach(function(tower) {
            if (Phaser.Math.Distance.Between(enemy.x, enemy.y, tower.x, tower.y) <= TOWER_RANGE) {
                // Calculate the angle between the tower and the enemy
                var angle = Phaser.Math.Angle.Between(tower.x, tower.y, enemy.x, enemy.y);
                tower.setAngle(Phaser.Math.RAD_TO_DEG * angle); // Set the angle of the tower sprite

                var bullet = bullets.create(tower.x, tower.y - tower.height / 2, 'bullet');
                bullet.rotation = angle; // Set the rotation of the bullet sprite
                bullet.setVelocity(Math.cos(angle) * 400, Math.sin(angle) * 400);
            }
        });

        lastFired = time;
    }

    // Move the enemy
    if (enemy) {
        enemy.x += 2;
    }

    // Remove bullets that have gone out of bounds
    bullets.getChildren().forEach(function(bullet) {
        if (bullet.y < 0 || bullet.y > config.height) {
            bullet.destroy();
        }
    });
}