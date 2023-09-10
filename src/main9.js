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
            // changeGold(50);
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
    range = 150;
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
                    this.scene.unitSize,
                    this.scene.unitSize
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
            let enemy = new Enemy(this.scene, this.groupEnemies, 0, 0, this.scene.unitSize, this.scene.unitSize);
            enemy.setPath(this.path);
            this.lastEnemyCreated = time;
            this.counter++;
        }
    }
}


class MapGenerator {

    static generateMap(scene, unitSize, rows, cols) {

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

                let buttonTower = new ButtonTower(scene, scene.buttonTowers, scene.towers, scene.enemies, scene.bullets, x, y, scene.unitSize);
                scene.buttonTowers.add(buttonTower);
            }
        }

        let buttonTower0 = scene.buttonTowers.getChildren()[0];

        path.push({ x: (unitSize * (cols - 1)) + buttonTower0.x + 1, y: (unitSize / 2 * (rows)) + buttonTower0.y - (unitSize / 2) + 1 });
        path.push({ x: path[0].x - unitSize, y: path[0].y });
        scene.mainTowers.add(new MainTower(scene, scene.mainTowers,path[1].x ,path[1].y, scene.unitSize, scene.unitSize));

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
            scene.buttonTowers.children.each((buttonTower) => {
                if (point.x >= buttonTower.x && point.x <= buttonTower.x + unitSize && point.y >= buttonTower.y && point.y <= buttonTower.y + unitSize) {
                    scene.buttonTowers.remove(buttonTower);
                    buttonTower.destroy();
                }
            });
        });

        return path.reverse();
    }
}

class Game extends Phaser.Scene {
    constructor() {
      super({ key: 'Game' });
  
      this.unitSize = 20;
      this.grid = {
        rows: 11,
        cols: 55,
      };
  
      this.mainTowers = null;
      this.enemies = null;
      this.bullets = null;
      this.towers = null;
      this.buttonTowers = null;
      this.enemyGenerator = null;
      this.isDragging = false;
      this.lastPointerPosition = { x: 0, y: 0 };
      this.gold = 1000;
    }
  
    preload() {
      this.load.image('main-tower', 'main-tower.png');
      this.load.image('bullet', 'bullet.png');
      this.load.image('enemy', 'enemy.png');
      this.load.image('tower', 'tower.png');
    }
  
    create() {
      this.mainTowers = this.physics.add.group();
      this.enemies = this.physics.add.group();
      this.bullets = this.physics.add.group();
      this.towers = this.add.group();
      this.buttonTowers = this.add.group();
  
      this.goldLabel = this.add.text(0, 290, `Gold: ${this.gold}`, {
        font: '24px CustomFont',
        fill: '#777777',
      });
      this.lifeLabel = this.add.text(0, 250, 'Life:', {
        font: '24px CustomFont',
        fill: '#777777',
      });
      this.lifeLabel.setScrollFactor(0);
      this.goldLabel.setScrollFactor(0);
  
      let path = MapGenerator.generateMap(
        this,
        this.unitSize,
        this.grid.rows,
        this.grid.cols
      );
  
      this.enemyGenerator = new EnemyGenerator(this, path, this.enemies);
  
      this.physics.add.overlap(this.enemies, this.bullets, function (
        enemy,
        bullet
      ) {
        enemy.takeDamage(bullet.damage);
        bullet.destroy();
      });
  
      this.physics.add.overlap(this.mainTowers, this.enemies, function (
        mainTower,
        enemy
      ) {
        enemy.destroy();
        mainTower.health--;
      });
  
      // Camera
      this.input.on('pointerdown', this.pointerDown, this);
      this.input.on('pointermove', this.pointerMove, this);
      this.input.on('pointerup', this.pointerUp, this);
      this.input.on('wheel', this.mouseWheel, this);
    }
  
    update(time, delta) {
      this.mainTowers.getChildren().forEach(function (mainTower) {
        this.lifeLabel.setText(`Life: ${mainTower.health}`);
        if (mainTower.health === 0) {
          // Game over logic here
        }
      }, this);
  
      this.towers.getChildren().forEach(function (tower) {
        tower.update(time);
      });
  
      this.bullets.getChildren().forEach(function (bullet) {
        bullet.update();
      });
  
      this.enemyGenerator.update(time);
  
      if (this.isDragging) {
        const pointer = this.input.activePointer;
        const deltaX = this.lastPointerPosition.x - pointer.x;
        const deltaY = this.lastPointerPosition.y - pointer.y;
  
        this.cameras.main.scrollX += deltaX;
        this.cameras.main.scrollY += deltaY;
  
        this.lastPointerPosition = { x: pointer.x, y: pointer.y };
      }
    }
  
    changeGold(gold) {
      this.gold += gold;
      this.goldLabel.setText(`Gold: ${this.gold}`);
    }
  
    // Camera things
    pointerDown(pointer) {
      this.isDragging = true;
      this.lastPointerPosition = { x: pointer.x, y: pointer.y };
    }
  
    pointerMove(pointer) {
      if (this.isDragging) {
        const deltaX = this.lastPointerPosition.x - pointer.x;
        // const deltaY = this.lastPointerPosition.y - pointer.y;
  
        let aux = this.cameras.main.scrollX + deltaX;
  
        if (
          aux > 0 &&
          aux < this.grid.cols * this.unitSize - config.width
        ) {
          this.cameras.main.scrollX += deltaX;
          // this.cameras.main.scrollY += deltaY;
        }
  
        this.lastPointerPosition = { x: pointer.x, y: pointer.y };
      }
    }
  
    pointerUp() {
      this.isDragging = false;
    }
  
    mouseWheel(event) {
      const delta = Phaser.Math.Clamp(-event.deltaY, -1, 1);
      const zoomAmount = 0.05;
      this.cameras.main.zoom += delta * zoomAmount;
    }
    // End camera things
  }
  
  var config = {
    type: Phaser.AUTO,
    width: 800,
    height: 700,
    physics: {
      default: 'arcade',
      arcade: {
        gravity: { y: 0 },
        debug: false,
      },
    },
    scene: Game, // Use the custom Game class here
  };
  
  var game = new Phaser.Game(config);
  