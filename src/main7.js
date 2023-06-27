class GameObject extends Phaser.Physics.Arcade.Sprite {
    list = null;
    constructor(scene, list, x, y, texture, width = 50, height = 50) {
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
    constructor(scene, list, path, x = 0, y = 100, width = 50, height = 50) {
        super(scene, list, x, y, 'enemy', width, height);
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

    constructor(scene, list, bulletList, x, y, width = 50, height = 50) {
        super(scene, list, x, y, 'tower', width, height);
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

                const bullet = new Bullet(
                    this.scene,
                    this.bulletList,
                    this.x,
                    this.y - this.height / 2,
                    angle // Pass the angle to the Bullet constructor
                );
            }
            this.lastFired = time;
        }
    }
}

class Bullet extends GameObject {
    damage = 10;
    maxDistance = 500;

    constructor(scene, list, x, y, angle, width = 50, height = 50) {
        super(scene, list, x, y, 'bullet', width, height);
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
var enemies;
var bullets;
var towers;
var addTowerButton;
var addTowerMode = false;

function preload() {
    this.load.image('bullet', 'bullet.png');
    this.load.image('enemy', 'enemy.png');
    this.load.image('tower', 'tower.png');
}

function create() {

    addTowerButton = this.add.text(10, 10, 'Add Tower: OFF', { font: '24px Arial', fill: '#ffffff' }).setInteractive();
    addTowerButton.on('pointerdown', function () {
        addTowerMode = !addTowerMode;
        addTowerButton.setText('Add Tower: ' + (addTowerMode ? 'ON' : 'OFF'));
    });

    enemies = this.physics.add.group();

    var path = [
        { x: 0, y: 100 },
        { x: 200, y: 150 },
        { x: 300, y: 50 }
    ];

    enemy = new Enemy(this, enemies, path);
    bullets = this.physics.add.group();
    towers = this.physics.add.group();

    this.physics.add.overlap(enemies, bullets, function (enemy, bullet) {
        enemy.takeDamage(bullet.damage)
        bullet.destroy();
    }, null, this);
}

function update(time, delta) {
    var that = this;

    if (addTowerMode && this.input.activePointer.isDown) {
        addTowerMode = false;
        let tower = new Tower(this, towers, bullets, this.input.activePointer.worldX, this.input.activePointer.worldY);
        tower.setTarget(enemy);
    }

    if (enemy) {
        towers.getChildren().forEach(function (tower) {
            tower.update(time);
        });

        bullets.getChildren().forEach(function (bullet) {
            bullet.update();
        });
    }
}

