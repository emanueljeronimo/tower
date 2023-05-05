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

var game = new Phaser.Game(config);
var enemy;
var bullets;
var towers;
var lastFired = 0;
var addTowerButton;
var addTowerMode = false;
const TOWER_RANGE = 200;
var selectedTower = null;

function preload() {}


function create() {
    enemy = this.add.rectangle(100, 100, 50, 50, 0x00ff00);
    this.physics.add.existing(enemy, true);
    enemy.health = 100;
    bullets = this.physics.add.group();
    towers = this.physics.add.group();

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

    this.physics.add.overlap(bullets, enemy, function(bullet, enemy) {
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
        tower.rangeCircle = this.add.circle(tower.x, tower.y, 200, 0x0000ff, 0.2).setVisible(false);
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
            if (Phaser.Math.Distance.Between(enemy.x, enemy.y, tower.x, tower.y) <= tower.rangeCircle.radius) {
                var bullet = bullets.create(tower.x, tower.y - tower.height / 2, 5, 20, 0xffffff);
                var angle = Phaser.Math.Angle.Between(tower.x, tower.y, enemy.x, enemy.y);
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

