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

class MainTower extends GameObject {
    constructor(scene, group,x ,y , height, width) {
        super(scene, group, x, y, 'main-tower', height, width);
        this.health = 15;
    }
}

class Enemy extends GameObject {
    constructor(scene, group, x = -10, y = 100, height, width) {
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
        this.scene?.tweens.add({
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
    attackVelocity = 300;
    groupBullets = null;
    groupEnemies = null;
    lastFired = 0;

    constructor(scene, group, groupEnemies, groupBullets, x, y, height, width) {
        super(scene, group, x, y, 'tower', height, width);
        this.groupBullets = groupBullets;
        this.groupEnemies = groupEnemies;
        this.rangeCircle = scene.add.circle(this.x, this.y, this.range, 0x0000ff, 0.2).setVisible(false);
        this.setInteractive();
        this.on('pointerdown', this.toggleRange, this);
    }

    toggleRange() {
        this.rangeCircle.setVisible(!this.rangeCircle.visible);
    }

    isInRange(enemy) {
        return Phaser.Math.Distance.Between(enemy.x, enemy.y, this.x, this.y) <= this.range;
    }

    update(time) {

        if (!this.target) {
            this.groupEnemies.getChildren().forEach(enemy => {
                if (this.isInRange(enemy)) {
                    this.target = enemy;
                }
            })
        }

        if (this.target && this.target.health <= 0) {
            this.target = null;
        }

        if (this.target && time > this.lastFired + this.attackVelocity) {
            if (this.isInRange(this.target)) {
                const angle = Phaser.Math.Angle.Between(this.x, this.y, this.target.x, this.target.y);
                this.setAngle(Phaser.Math.RAD_TO_DEG * angle);

                new Bullet(
                    this.scene,
                    this.groupBullets,
                    this.x,
                    this.y,
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
    groupTowers = null;
    groupBullets = null;
    groupEnemies = null;
    unitSize = null;

    constructor(scene, group, groupTowers, groupEnemies, groupBullets, x, y, unitSize) {
        super(scene, group, x, y, 'button', unitSize, unitSize);
        this.groupTowers = groupTowers;
        this.groupEnemies = groupEnemies;
        this.groupBullets = groupBullets;
        this.unitSize = unitSize;
        this.setInteractive();
        this.on('pointerdown', this.createTower, this);
    }

    createTower() {
        let tower = new Tower(this.scene, this.groupTowers, this.groupEnemies, this.groupBullets, this.x, this.y, this.unitSize, this.unitSize);
        tower.setOrigin(0.5);
    }
}

class EnemyGenerator {
    frequency = 500;
    path = null;
    groupEnemies = null;
    counter = 0;
    enemiesQuatity = 5;
    scene = null;
    lastEnemyCreated = 0;
    constructor(scene, path, groupEnemies) {
        this.scene = scene;
        this.path = path;
        this.groupEnemies = groupEnemies;
    }

    update(time) {
        if (this.enemiesQuatity > this.counter && time > this.lastEnemyCreated + this.frequency) {
            let enemy = new Enemy(this.scene, this.groupEnemies, 0, 0, game.unitSize, game.unitSize);
            enemy.setPath(this.path);
            this.lastEnemyCreated = time;
            this.counter++;
        }
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

                let buttonTower = new ButtonTower(scene, game.buttonTowers, game.towers, game.enemies, game.bullets, x, y, game.unitSize);
                game.buttonTowers.add(buttonTower);
            }
        }

        let buttonTower0 = game.buttonTowers.getChildren()[0];

        path.push({ x: (unitSize * (cols - 1)) + buttonTower0.x + 1, y: (unitSize / 2 * (rows)) + buttonTower0.y - (unitSize / 2) + 1 });
        path.push({ x: path[0].x - unitSize, y: path[0].y });
        game.mainTowers.add(new MainTower(scene, game.mainTowers,path[1].x ,path[1].y, game.unitSize, game.unitSize));

        const LEFT = "LEFT", UP = "UP", DOWN = "DOWN";
        const directions = [LEFT, UP, DOWN];
        const notAllowedPaths = [`${DOWN}-${LEFT}-${UP}`, `${UP}-${LEFT}-${DOWN}`,
        `${LEFT}-${DOWN}-${UP}`, `${LEFT}-${UP}-${DOWN}`,
        `${UP}-${DOWN}-${LEFT}`, `${DOWN}-${UP}-${LEFT}`,
        `${UP}-${DOWN}-${DOWN}`, `${UP}-${DOWN}-${UP}`,
        `${DOWN}-${UP}-${DOWN}`, `${DOWN}-${UP}-${UP}`,
        `${DOWN}-${DOWN}-${UP}`, `${DOWN}-${UP}-${UP}`,
        `${UP}-${UP}-${DOWN}`, `${UP}-${DOWN}-${DOWN}`];


        let steps = `${LEFT}-${LEFT}`;
        let stepsAux = steps;

        let leftF = ({ x, y }) => ({ x: x - unitSize, y });
        let upF = ({ x, y }) => ({ x, y: y - unitSize });
        let downF = ({ x, y }) => ({ x, y: y + unitSize });


        let pathConfigArr = [{ direction: LEFT, funct: leftF }, { direction: UP, funct: upF }, { direction: DOWN, funct: downF }];
        while (path[path.length - 1].x > buttonTower0.x) {
            let direction = directions[Math.floor(Math.random() * directions.length)]
            let arrF = pathConfigArr.filter(path => path.direction == direction);
            let nextDirectionConfig = arrF[Math.floor(Math.random() * arrF.length)];

            stepsAux += `-${nextDirectionConfig.direction}`;
            if (stepsAux.split('-').length > 2) {
                let stepArr = stepsAux.split('-')
                let last3Steps = stepArr.splice(-3).join('-');

                if (notAllowedPaths.some(notAllowedPath => notAllowedPath == last3Steps)) {
                    stepsAux = steps;
                    continue;
                }
                else {
                    let { x, y } = nextDirectionConfig.funct({ x: path[path.length - 1].x, y: path[path.length - 1].y });
                    if (y > buttonTower0.y && y < (buttonTower0.y * rows)) {
                        path.push({ x, y });
                        direction = nextDirectionConfig.direction;
                        steps = stepsAux;
                    }

                }
            }
        }


        // Remove sprites that touch the specified points
        path.forEach((point) => {
            game.buttonTowers.children.each((buttonTower) => {
                if (point.x >= buttonTower.x && point.x <= buttonTower.x + unitSize && point.y >= buttonTower.y && point.y <= buttonTower.y + unitSize) {
                    game.buttonTowers.remove(buttonTower);
                    buttonTower.destroy();
                }
            });
        });

        return path.reverse();
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
    cols: 55
};


game.mainTowers = null;
game.enemies = null;
game.bullets = null;
game.towers = null;
game.buttonTowers = null;
game.enemyGenerator = null;
game.isDragging = false;
game.lastPointerPosition = { x: 0, y: 0 };


function preload() {
    this.load.image('main-tower', 'main-tower.png');
    this.load.image('bullet', 'bullet.png');
    this.load.image('enemy', 'enemy.png');
    this.load.image('tower', 'tower.png');
}

function create() {
    game.mainTowers = this.physics.add.group();
    game.enemies = this.physics.add.group();
    game.bullets = this.physics.add.group();
    game.towers = this.add.group();
    game.buttonTowers = this.add.group();

    game.lifeLabel = this.add.text(0, 250, 'Life:', {
        font: '24px CustomFont',
        fill: '#777777'
      });
    game.lifeLabel.setScrollFactor(0);  

    let path = MapGenerator.generateMap(game, this, game.unitSize, game.grid.rows, game.grid.cols);

    game.enemyGenerator = new EnemyGenerator(this, path, game.enemies);

    this.physics.add.overlap(game.enemies, game.bullets, function (enemy, bullet) {
        enemy.takeDamage(bullet.damage)
        bullet.destroy();
    }, null, this);

    this.physics.add.overlap(game.mainTowers, game.enemies, function (mainTower, enemy) {
        enemy.destroy();
        mainTower.health--;
    }, null, this);

    //camera
    this.input.on('pointerdown', pointerDown, this);
    this.input.on('pointermove', pointerMove, this);
    this.input.on('pointerup', pointerUp, this);
    this.input.on('wheel', mouseWheel, this);

}

function update(time, delta) {

    game.mainTowers.getChildren().forEach(function (mainTower) {
        game.lifeLabel.setText(`Life: ${mainTower.health}`);
        if(mainTower.health == 0) {
            //game over
        }
    });

    game.towers.getChildren().forEach(function (tower) {
        tower.update(time);
    });

    game.bullets.getChildren().forEach(function (bullet) {
        bullet.update();
    });

    game.enemyGenerator.update(time);

    if (game.isDragging) {
        const pointer = this.input.activePointer;
        const deltaX = game.lastPointerPosition.x - pointer.x;
        const deltaY = game.lastPointerPosition.y - pointer.y;

        this.cameras.main.scrollX += deltaX;
        this.cameras.main.scrollY += deltaY;

        game.lastPointerPosition = { x: pointer.x, y: pointer.y };
    }

}


function pointerDown(pointer) {
    game.isDragging = true;
    game.lastPointerPosition = { x: pointer.x, y: pointer.y };
}

function pointerMove(pointer) {
    if (game.isDragging) {
        const deltaX = game.lastPointerPosition.x - pointer.x;
        //const deltaY = game.lastPointerPosition.y - pointer.y;

        let aux = this.cameras.main.scrollX + deltaX;

        if (aux > 0 && aux < (game.grid.cols * game.unitSize) - config.width) {
            this.cameras.main.scrollX += deltaX;
            //this.cameras.main.scrollY += deltaY;
        }

        game.lastPointerPosition = { x: pointer.x, y: pointer.y };
    }
}

function pointerUp() {
    game.isDragging = false;
}

function mouseWheel(event) {
    const delta = Phaser.Math.Clamp(-event.deltaY, -1, 1);
    const zoomAmount = 0.05;
    this.cameras.main.zoom += delta * zoomAmount;
}
