class GameObject extends Phaser.Physics.Arcade.Sprite {
    group = null;
    constructor(scene, group, x, y, texture, height, width) {
        super(scene, x, y, texture);
        this.group = group;
        group.add(this);
        scene.add.existing(this);
        scene.physics.add.existing(this);
        this.setSize(width, height);
        this.setDisplaySize(width, height);
    }
}

class Enemy extends GameObject {
    constructor(scene, group, x = 0, y = 100, height, width) {
        super(scene, group, x, y, 'enemy', height, width);
        this.health = 100;
        this.currentPointIndex = 0;
        this.speed = 100;
    }

    setPath(path) {
        this.path = path;
        this.startMoving();
    }

    takeDamage(damage) {
        this.health -= damage;
        if (this.health <= 0) {
            this.destroy();
            this.group.remove(this, true, true);
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
    bulletGroup = null;
    lastFired = 0;

    constructor(scene, group, bulletGroup, x, y, height, width) {
        super(scene, group, x, y, 'tower', height, width);
        this.bulletGroup = bulletGroup;
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
                this.setAngle(Phaser.Math.RAD_TO_DEG * angle);

                new Bullet(
                    this.scene,
                    this.bulletGroup,
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
    maxDistance = 150;

    constructor(scene, group, x, y, angle, height, width) {
        super(scene, group, x, y, 'bullet', height, width);
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
            this.group.remove(this);
        }
    }
}

class ButtonTower extends GameObject {
    target = null;
    tower = null;
    groupTower = null;
    groupBullets = null;

    constructor(scene, group, groupTower, groupBullets, x, y, height, width) {
        super(scene, group, x, y, 'button', height, width);
        this.groupTower = groupTower;
        this.groupBullets = groupBullets;
        this.setInteractive();
        this.on('pointerdown', this.createTower, this);
    }

    setTarget(target) {
        this.target = target;
    }

    createTower() {
        let tower = new Tower(this.scene, this.groupTower, this.groupBullets, this.x, this.y, this.height, this.width);
        tower.setTarget(this.target);
        tower.setOrigin(0.5);
    }
}


class MapGenerator {

    static generateMap(game, scene, unitSize, rows, cols) {

        if (rows % 2 == 0) {
            throw "rows should be odd";
        }

        var path = []

        const gridSize = { cols: cols, rows: rows };

        // Loop through each buttonTower in the grid
        for (let row = 1; row < gridSize.rows; row++) {
            for (let col = 1; col < gridSize.cols; col++) {
                const x = col * unitSize;
                const y = row * unitSize;

                let buttonTower = new ButtonTower(scene, game.buttonTowers, game.towers, game.bullets, x, y, game.unitSize, game.unitSize);
                buttonTower.setTarget(game.enemy);
                game.buttonTowers.add(buttonTower);
            }
        }

        let buttonTower0 = game.buttonTowers.getChildren()[0];

        path.push({ x: (unitSize * (cols - 1)) + buttonTower0.x + 1, y: (unitSize / 2 * (rows)) + buttonTower0.y - (unitSize / 2) + 1 });
        path.push({ x: path[0].x - unitSize, y: path[0].y });

        const LEFT = "LEFT", UP = "UP", DOWN = "DOWN";
        const directions = [LEFT, UP, DOWN];

        let leftF = ({ x, y }) => ({ x: x - unitSize, y });
        let upF = ({ x, y }) => ({ x, y: y - unitSize });
        let downF = ({ x, y }) => ({ x, y: y + unitSize });

        let pathConfigThree = {
            LEFT: [{ direction: LEFT, funct: leftF }, { direction: UP, funct: upF }, { direction: DOWN, funct: downF }],
            UP: [{ direction: UP, funct: upF }, { direction: LEFT, funct: leftF }],
            DOWN: [{ direction: DOWN, funct: downF }, { direction: LEFT, funct: leftF }],
        }

        let direction = directions[Math.floor(Math.random() * directions.length)];
        while (path[path.length - 1].x > buttonTower0.x) {
            let arrF = pathConfigThree[direction];
            let nextDirectionConfig = arrF[Math.floor(Math.random() * arrF.length)];
            let { x, y } = nextDirectionConfig.funct({ x: path[path.length - 1].x, y: path[path.length - 1].y });
            if (y > buttonTower0.y && y < (buttonTower0.y * rows)) {
                path.push({ x, y });
                direction = nextDirectionConfig.direction;
            }
        }

        // Remove sprites that touch the specified points
        path.forEach((point) => {
            game.buttonTowers.children.each((buttonTower) => {
                if (point.x >= buttonTower.x && point.x <= buttonTower.x + buttonTower.width && point.y >= buttonTower.y && point.y <= buttonTower.y + buttonTower.height) {
                    game.buttonTowers.remove(buttonTower);
                    buttonTower.destroy();
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

};

var game = new Phaser.Game(config);

game.unitSize = 20;
game.grid = {
    rows: 11,
    cols: 18
};

game.enemy = null;
game.enemies = null;
game.bullets = null;
game.towers = null;
game.buttonTowers = null;
game.addTowerButton = null;


function preload() {
    this.load.image('bullet', 'bullet.png');
    this.load.image('enemy', 'enemy.png');
    this.load.image('tower', 'tower.png');
}

function create() {

    game.enemies = this.physics.add.group();
    game.enemy = new Enemy(this, game.enemies, 0, 0, game.unitSize, game.unitSize);
    game.bullets = this.physics.add.group();
    game.towers = this.add.group();
    game.buttonTowers = this.add.group();

    let path = MapGenerator.generateMap(game, this, game.unitSize, game.grid.rows, game.grid.cols);
    game.enemy.setPath(path);

    this.physics.add.overlap(game.enemies, game.bullets, function (enemy, bullet) {
        enemy.takeDamage(bullet.damage)
        bullet.destroy();
    }, null, this);

}

function update(time, delta) {

    if (game.enemy) {
        game.towers.getChildren().forEach(function (tower) {
            tower.update(time);
        });

        game.bullets.getChildren().forEach(function (bullet) {
            bullet.update();
        });
    }
}
