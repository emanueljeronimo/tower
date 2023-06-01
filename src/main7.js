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

class Enemy extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x = 0, y = 100, width = 50, height = 50) {
        super(scene, x, y, 'enemy');
        this.health = 100;
        scene.add.existing(this);
        scene.physics.add.existing(this);
        this.setSize(width, height);
        this.setDisplaySize(width, height);
    }
}

class Tower extends Phaser.GameObjects.Rectangle {
    constructor(scene, x, y, width = 50, height = 50) {
        super(scene, x, y, width, height, 0xff0000);
        scene.add.existing(this);
        this.lastFired = 0;
        this.rangeCircle = scene.add.circle(this.x, this.y, TOWER_RANGE, 0x0000ff, 0.2).setVisible(false);
    }
}

class Bullet extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
        super(scene, x, y, 'bullet');
        scene.add.existing(this);
        scene.physics.add.existing(this);
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
    this.load.image('enemy', 'enemy.png');
    this.load.image('tower', 'bullet.png');
}

function create() {
    addTowerButton = this.add.text(10, 10, 'Add Tower: OFF', { font: '24px Arial', fill: '#ffffff' }).setInteractive();
    addTowerButton.on('pointerdown', function() {
        addTowerMode = !addTowerMode;
        addTowerButton.setText('Add Tower: ' + (addTowerMode ? 'ON' : 'OFF'));
    });
    
    enemy = new Enemy(this);
    enemies = this.physics.add.group();
    enemies.add(enemy);
    bullets = this.physics.add.group();
    towers = this.add.group();
   
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

    this.physics.add.overlap(enemies, bullets, function(enemy, bullet) {
        enemy.health -= 10;
        bullet.destroy();
    }, null, this);
}

function update(time, delta) {
    var that = this;
    if (enemy.health <= 0) {
        enemy.destroy();
        towers.getChildren().forEach(function(tower) {
            tower.lastFired = 0;
        });
    }

    if (addTowerMode && this.input.activePointer.isDown) {
        var tower = new Tower(this, this.input.activePointer.worldX, this.input.activePointer.worldY);
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

                var bullet = new Bullet(that, tower.x, tower.y - tower.height / 2);
                bullets.add(bullet);
                bullet.setAngle(Phaser.Math.RAD_TO_DEG * angle); // Set the rotation of the bullet sprite
                bullet.setVelocityX(Math.cos(angle) * 400);
                bullet.setVelocityY(Math.sin(angle) * 400);
                
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

