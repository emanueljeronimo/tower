// fix overlapping when you change tower
// you can buy ilimted towers

class Utils {
  static calculatePositionTowardsTarget(currentX, currentY, targetX, targetY, distance) {
    const angle = Phaser.Math.Angle.Between(currentX, currentY, targetX, targetY);
    const newX = currentX + distance * Math.cos(angle);
    const newY = currentY + distance * Math.sin(angle);
    return { x: newX, y: newY };
  }
}

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
  constructor(scene, group, x, y, height, width) {
    super(scene, group, x, y, 'main-tower', height, width);
    this.health = 15;
  }
}

class Particle extends GameObject {
  constructor(scene, group, x = -10, y = 100, height, width) {
    super(scene, group, x, y, 'particle', height, width);
    this.scene = scene;
    this.startMoving();
  }

  startMoving() {
    const randomValues = [this.scene.unitSize, -this.scene.unitSize, this.scene.unitSize / 2, -this.scene.unitSize / 2, this.scene.unitSize * 1.5, -this.scene.unitSize * 1.5]
    const getRandomValue = () => randomValues[Math.floor(Math.random() * randomValues.length)];
    const targetPoint = { x: this.x + getRandomValue(), y: this.y + getRandomValue() };
    this.scene?.tweens.add({
      targets: this,
      x: targetPoint.x,
      y: targetPoint.y,
      duration: 100,
      onComplete: () => {
        this.destroy();
      },
    });
  }
}

class Enemy extends GameObject {
  constructor(scene, group, particleGroup, x = -10, y = 100, height, width, enemyConfig) {
    super(scene, group, x, y, enemyConfig.texture, height, width);
    this.particleGroup = particleGroup;
    this.scene = scene;
    this.currentPointIndex = 0;
    this.health = enemyConfig.health;
    this.speed = enemyConfig.speed;
    this.gold = enemyConfig.gold;
  }

  setPath(path) {
    this.path = path;
    this.startMoving();
  }

  takeDamage(damage) {
    this.health -= damage;
    if (this.health <= 0) {
      this.scene.changeGold(this.gold);
      for (var i = 1; i <= 5; i++) {
        new Particle(this.scene, this.particleGroup, this.x, this.y, this.scene.unitSize / 3, this.scene.unitSize / 3);
      }
      this.destroy();
      this.group.remove(this, true, true);
    }
  }

  startMoving() {
    const targetPoint = this.path[this.currentPointIndex];
    const angleToTarget = Phaser.Math.Angle.Between(this.x, this.y, targetPoint.x, targetPoint.y);
    this.rotation = angleToTarget;
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
      },
      onUpdate: (tween, target) => {
        let absDistance = Math.abs(this.x - targetPoint.x) + Math.abs(this.y - targetPoint.y);
        if (absDistance < this.scene?.unitSize / 2 && this.path[this.currentPointIndex + 1]) {
          const nextTargetPoint = this.path[this.currentPointIndex + 1]
          let nextAngleToTarget = Phaser.Math.Angle.Between(this.x, this.y, nextTargetPoint.x, nextTargetPoint.y);
          target.rotation = nextAngleToTarget * tween.progress
          //target.rotation = nextAngleToTarget * (absDistance*100/(this.scene?.unitSize/2));
        }
      }
    });
  }

  static commonEnemy = {
    texture: 'enemy',
    health: 100,
    speed: 150,
    gold: 15
  }

  static dummyEnemy = {
    texture: 'enemy',
    health: 100,
    speed: 0,
    gold: 0
  }
}


class Tower extends GameObject {
  target = null;
  groupBullets = null;
  groupEnemies = null;
  lastFired = 0;

  constructor(scene, group, groupEnemies, groupBullets, x, y, height, width, towerConfig, canSellIt) {
    super(scene, group, x, y, towerConfig.texture, height*towerConfig.heightRatio, width*towerConfig.widthRatio);
    this.range = towerConfig.rangeUnit * scene.unitSize;
    this.price = towerConfig.price;
    this.description = towerConfig.description;
    this.executeOnUpdate = towerConfig.executeOnUpdate;
    this.attackVelocity = towerConfig.attackVelocity;
    this.groupBullets = groupBullets;
    this.groupEnemies = groupEnemies;
    this.rangeCircle = scene.add.circle(this.x, this.y, this.range, 0x0000ff, 0.2).setVisible(false);
    if (canSellIt) {
      this.setInteractive();
      this.on('pointerdown', this.click, this);
    }
  }

  click() {
    this.rangeCircle.setVisible(true);
    setTimeout(() => { this.rangeCircle.setVisible(false) }, 300);
    this.scene.sellPopUp.setTower(this);
  }

  isInRange(enemy) {
    return Phaser.Math.Distance.Between(enemy.x, enemy.y, this.x, this.y) <= this.range;
  }

  updateTarget() {
    if (!this.target) {
      this.groupEnemies.getChildren().forEach(enemy => {
        if (this.isInRange(enemy)) {
          this.target = enemy;
        }
      })
    }

    if (this.target && (this.target.health <= 0 || !this.isInRange(this.target))) {
      this.target = null;
    }
  }

  shotWhenTargetIsClose(time, shot) {
    if (this.target && time > this.lastFired + this.attackVelocity) {
      if (this.isInRange(this.target)) {
        const angle = Phaser.Math.Angle.Between(this.x, this.y, this.target.x, this.target.y);
        this.setAngle(Phaser.Math.RAD_TO_DEG * angle);
        shot(this.scene, this.groupBullets, this.x, this.y, this.target, angle);
      }
      this.lastFired = time;
    }
  }

  update(time) {
    this.executeOnUpdate(this, time);
  }

  static commonTower = {
    heightRatio: 1,
    widthRatio: 2,
    price: 250,
    rangeUnit: 10,
    attackVelocity: 300,
    texture: 'tower',
    description: 'Common Tower',
    executeOnUpdate: (that, time) => {
      that.updateTarget();
      that.shotWhenTargetIsClose(time, (scene, groupBullets, x, y, target, angle) => {
        let newPosition = Utils.calculatePositionTowardsTarget(x, y, target.x, target.y, scene.unitSize * 1.5);
        new CommonBullet(scene, groupBullets, newPosition.x, newPosition.y, angle, scene.unitSize / 3, scene.unitSize / 3);
      });
    }
  }

  static tripleShotTower = {
    heightRatio: 1,
    widthRatio: 2,
    price: 350,
    rangeUnit: 10,
    attackVelocity: 300,
    texture: 'tower',
    description: 'Triple Tower',
    executeOnUpdate: (that, time) => {
      that.updateTarget();
      that.shotWhenTargetIsClose(time, (scene, groupBullets, x, y, target, angle) => {
        let newPosition = Utils.calculatePositionTowardsTarget(x, y, target.x, target.y, scene.unitSize * 1.5);
        new CommonBullet(scene, groupBullets, newPosition.x, newPosition.y, angle + 0.2, scene.unitSize / 3, scene.unitSize / 3);
        new CommonBullet(scene, groupBullets, newPosition.x, newPosition.y, angle, scene.unitSize / 3, scene.unitSize / 3);
        new CommonBullet(scene, groupBullets, newPosition.x, newPosition.y, angle - 0.2, scene.unitSize / 3, scene.unitSize / 3);
      });
    }
  }

  static fastTower = {
    heightRatio: 1,
    widthRatio: 2,
    price: 250,
    rangeUnit: 10,
    attackVelocity: 100,
    texture: 'tower',
    description: 'Fast Tower',
    executeOnUpdate: (that, time) => {
      that.updateTarget();
      that.shotWhenTargetIsClose(time, (scene, groupBullets, x, y, target, angle) => {
        let newPosition = Utils.calculatePositionTowardsTarget(x, y, target.x, target.y, scene.unitSize * 1.5);
        new CommonBullet(scene, groupBullets, newPosition.x, newPosition.y, angle, scene.unitSize / 3, scene.unitSize / 3);
      });
    }
  }

  static laserTower = {
    heightRatio: 1,
    widthRatio: 1,
    price: 250,
    rangeUnit: 300,
    attackVelocity: 500,
    texture: 'laser-tower',
    description: 'Laser',
    executeOnUpdate: (that, time) => {
      that.updateTarget();
      that.shotWhenTargetIsClose(time, (scene, groupBullets, x, y, target, angle) => {
        let newPosition = Utils.calculatePositionTowardsTarget(x, y, target.x, target.y, (scene.unitSize * 15)/2);
        new LaserBullet(scene, groupBullets, newPosition.x, newPosition.y, angle, scene.unitSize / 3, scene.unitSize * 15);
      });
    }
  }


}

class CommonBullet extends GameObject {
  damage = 50;
  maxDistance = 300;

  constructor(scene, group, x, y, angle, height, width) {
    super(scene, group, x, y, 'common-bullet', height, width);
    this.startX = x;
    this.startY = y;
    this.setAngle(Phaser.Math.RAD_TO_DEG * angle);
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

class LaserBullet extends GameObject {
  damage = 100;
  maxDistance = 1500;

  constructor(scene, group, x, y, angle, height, width) {
    super(scene, group, x, y, 'common-bullet', height, width);
    this.startX = x;
    this.startY = y;
    this.setAngle(Phaser.Math.RAD_TO_DEG * angle);
    this.setVelocityX(Math.cos(angle) * 5000);
    this.setVelocityY(Math.sin(angle) * 5000);
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
    this.scene = scene;
    this.groupTowers = groupTowers;
    this.groupEnemies = groupEnemies;
    this.groupBullets = groupBullets;
    this.unitSize = unitSize;
    this.setInteractive();
    this.on('pointerdown', this.buyTower, this);
  }

  createTower(sellable) {
    this.tower = new Tower(this.scene, this.groupTowers, this.groupEnemies, this.groupBullets, this.x, this.y, this.unitSize, this.unitSize, this.scene.getSelectedTowerConfig(), sellable);
    this.tower.setOrigin(0.5);
    return this.tower;
  }

  buyTower() {
    if (this.scene.isBuying()) {
      this.createTower(true);
      this.scene.afterPlaceTower();
    }
  }

  destroyTower() {
    if (this.tower) {
      this.tower.destroy();
    }
  }

}

class TowerMenuContainer extends Phaser.GameObjects.Container {
  constructor(scene, x, y) {
    super(scene, x, y);

    this.scene = scene;
    this.enemies = scene.physics.add.group();
    this.particles = scene.physics.add.group();
    this.bullets = scene.physics.add.group();
    this.towers = scene.add.group();
    this.buttonTowers = scene.add.group();

    scene.physics.add.overlap(this.enemies, this.bullets, function (enemy, bullet) {
      enemy.takeDamage(bullet.damage);
      bullet.destroy();
    });


    this.buttonTower = new ButtonTower(scene, scene.buttonTowers, this.towers, this.enemies, this.bullets, this.x + scene.unitSize*3, this.y + scene.unitSize*2, scene.unitSize);
    this.buttonTowers.add(this.buttonTower);
    this.add(this.buttonTower);


    // Create a description text
    this.arrTowerConfig = [Tower.commonTower, Tower.tripleShotTower, Tower.fastTower, Tower.laserTower];

    this.towerDesc = scene.add.text(scene.unitSize*2.5, scene.unitSize*3, '', {
      fontSize: '24px',
      fill: '#ffffff'
    });
    this.add(this.towerDesc);


    const buttonUp = scene.add.sprite(scene.unitSize, 0, 'up');
    buttonUp.setDisplaySize(scene.unitSize*1.5, scene.unitSize*1.5);
    this.add(buttonUp);

    buttonUp.setInteractive();
    buttonUp.on('pointerdown', () => {
      const firstElement = this.arrTowerConfig.shift();
      this.arrTowerConfig.push(firstElement);
      this.updateTower();
    });

    const buttonDown = scene.add.sprite(scene.unitSize, scene.unitSize*4, 'down');
    buttonDown.setDisplaySize(scene.unitSize*1.5, scene.unitSize*1.5);
    this.add(buttonDown);

    buttonDown.setInteractive();
    buttonDown.on('pointerdown', () => {
      const lastElement = this.arrTowerConfig.pop();
      this.arrTowerConfig.unshift(lastElement);
      this.updateTower();
    });

    const buyButton = scene.add.sprite(scene.unitSize*3,scene.unitSize*5, 'buy');
    buyButton.setDisplaySize(scene.unitSize*5, scene.unitSize*2);
    this.add(buyButton);

    buyButton.setInteractive();
    buyButton.on('pointerdown', () => {
      this.scene.buy();
    });

    this.updateTower();
    scene.add.existing(this);

  }

  updateTower() {
    this.towerDesc.setText(this.arrTowerConfig[0].description);
    this.scene.setSelectedTowerConfig(this.arrTowerConfig[0]);
    this.buttonTower.destroyTower();
    if (this.enemy!=null)this.enemy.destroy();
    this.enemy = new Enemy(this.scene, this.enemies, this.particles, this.x + this.scene.unitSize * 9, this.y + this.scene.unitSize*2, this.scene.unitSize, this.scene.unitSize, Enemy.dummyEnemy);
    this.buttonTower.createTower(false);
  }

  update(time) {
    this.towers.getChildren().forEach(function (tower) {
      tower.update(time);
    });

    this.bullets.getChildren().forEach(function (bullet) {
      bullet.update();
    });
  }



}


/*
class CardContainer extends Phaser.GameObjects.Container {
  constructor(scene, x, y) {
      super(scene, x, y);
      this.scene = scene;
      this.image = scene.add.image(0, 0, '');
      this.add(this.image);

      // Create a description text
      this.description = scene.add.text(-100, -50, '', {
          fontSize: '24px',
          fill: '#ffffff'
      });
      this.add(this.description);

      // Create a button
      const button = scene.add.sprite(0, 50, 'button'); // Replace 'button' with your button texture key
      this.add(button);

      
      button.setInteractive();
      button.on('pointerdown', () => {
        if(this.scene.getGold() - this.towerConfig.price >= 0) {
          this.scene.changeGold(-this.towerConfig.price);
          this.scene.setSelectedTowerConfig(this.towerConfig);
        }
      });

      scene.add.existing(this);
  }

  setConfig(towerConfig) {
    this.towerConfig = towerConfig;
    this.description.setText(towerConfig.description);
    this.image.setTexture(towerConfig.texture)
  }
}*/

class SellPopUp extends Phaser.GameObjects.Container {
  constructor(scene) {
    super(scene, -100, -100);
    this.scene = scene;

    // Create a description text
    this.description = scene.add.text(-100, -50, '', {
      fontSize: '24px',
      fill: '#ffffff'
    });
    this.add(this.description);

    // Create a button
    const button = scene.add.sprite(0, 50, 'sell'); // Replace 'button' with your button texture key
    this.add(button);


    button.setInteractive();
    button.on('pointerdown', () => {
      this.setOutSide();
      this.scene.changeGold(this.tower.price);
      this.tower.destroy()
    });
    scene.add.existing(this);
  }

  setTower(tower) {
    setTimeout(() => {
      this.setOutSide()
    }, 1500);
    this.tower = tower;
    this.description.setText(tower.description);
    this.x = this.tower.x;
    this.y = this.tower.y;
  }

  setOutSide() {
    this.x = -100;
    this.y = -100;
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
  constructor(scene, path, groupEnemies, groupParticles) {
    this.scene = scene;
    this.path = path;
    this.groupEnemies = groupEnemies;
    this.groupParticles = groupParticles;
  }

  update(time) {
    if (this.enemiesQuatity > this.counter && time > this.lastEnemyCreated + this.frequency) {
      let enemy = new Enemy(this.scene, this.groupEnemies, this.groupParticles, 0, 0, this.scene.unitSize, this.scene.unitSize, Enemy.commonEnemy);
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
    scene.mainTowers.add(new MainTower(scene, scene.mainTowers, path[1].x, path[1].y, scene.unitSize, scene.unitSize));

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

    // doing it "flat"
    path = path.reverse();
    let flatPath = [];
    flatPath.push(path[0]);
    for (var i = 1; i <= path.length - 1; i++) {
      if (i == path.length - 1) {
        flatPath.push(path[i]);
        break;
      }
      if (path[i].x !== flatPath[flatPath.length - 1].x && path[i].y !== flatPath[flatPath.length - 1].y) {
        flatPath.push(path[i - 1]);
      }
    }
    return flatPath;
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
    this.particles = null;
    this.towers = null;
    this.buttonTowers = null;
    this.enemyGenerator = null;
    this.isDragging = false;
    this.lastPointerPosition = { x: 0, y: 0 };
    this.gold = 1000;
    this.selectedTowerConfig = null;
    this.buying = false;
  }

  preload() {
    this.load.image('up', 'assets/up.png');
    this.load.image('down', 'assets/down.png');
    this.load.image('buy', 'assets/buy.png');
    this.load.image('sell', 'assets/sell.png');

    this.load.image('main-tower', 'assets/main-tower.png');
    this.load.image('common-bullet', 'assets/common-bullet.png');
    this.load.image('enemy', 'assets/enemy-6.png');
    this.load.image('tower', 'assets/tower-2.png');
    this.load.image('particle', 'assets/particle.png');
    this.load.image('laser', 'assets/laser.png');
    this.load.image('laser-tower', 'assets/laser-tower.png');
    
  }

  create() {

    this.mainTowers = this.physics.add.group();
    this.enemies = this.physics.add.group();
    this.bullets = this.physics.add.group();
    this.particles = this.physics.add.group();
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


    let path = MapGenerator.generateMap(
      this,
      this.unitSize,
      this.grid.rows,
      this.grid.cols
    );

    this.towerMenuContainer = new TowerMenuContainer(this, 0, 350);
    this.sellPopUp = new SellPopUp(this);
    this.enemyGenerator = new EnemyGenerator(this, path, this.enemies, this.particles);

    this.physics.add.overlap(this.enemies, this.bullets, function (enemy, bullet) {
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
    this.horizontalCamera = this.cameras.add(0, 0, 800, 220);
    this.cameras.main.setScroll(0, 220)
    this.cameras.main.setSize(800, 500);
    this.cameras.main.setPosition(0, 220);
    this.input.on('pointerdown', this.pointerDown, this);
    this.input.on('pointermove', this.pointerMove, this);
    this.input.on('pointerup', this.pointerUp, this);
    // this.input.on('wheel', this.mouseWheel, this);
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
    this.towerMenuContainer.update(time);

  }

  changeGold(gold) {
    this.gold += gold;
    this.goldLabel.setText(`Gold: ${this.gold}`);
  }

  getGold() {
    return this.gold;
  }

  setSelectedTowerConfig(towerConfig) {
    this.selectedTowerConfig = towerConfig;
  }

  getSelectedTowerConfig() {
    return this.selectedTowerConfig;
  }

  isBuying() {
    return this.buying;
  }

  afterPlaceTower() {
    return this.buying = false;
  }

  buy() {
    if (this.selectedTowerConfig && this.gold > this.selectedTowerConfig.price) {
      this.changeGold(-this.selectedTowerConfig.price);
      this.buying = true;
    }
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

      let aux = this.horizontalCamera.scrollX + deltaX;

      if (
        aux > 0 &&
        aux < this.grid.cols * this.unitSize - config.width
      ) {
        this.horizontalCamera.scrollX += deltaX;
        // this.cameras.main.scrollY += deltaY;
      }

      this.lastPointerPosition = { x: pointer.x, y: pointer.y };
    }
  }

  pointerUp() {
    this.isDragging = false;
  }

  /*mouseWheel(event) {
    const delta = Phaser.Math.Clamp(-event.deltaY, -1, 1);
    const zoomAmount = 0.05;
    this.cameras.main.zoom += delta * zoomAmount;
  }*/
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
