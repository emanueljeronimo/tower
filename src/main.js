/*
-acomodar todo el menu
-revisar todas las naves
-los bordes
-aplicar algun filtro de color por los niveles y el daño de las naves
-sonidos
-que disparen dentro de la pantalla
-sacar animaciones que van a ser con p5.js
*/

import { GameObject } from './core/GameObject.js'
import { Enemy } from './core/Enemy.js'
import { Tower } from './core/Tower.js'
import { ButtonTower } from './core/ButtonTower.js'
import { TowerMenuContainer } from './core/TowerMenuContainer.js'
import { SellPopUp } from './core/SellPopUp.js'
import { EnemyGenerator } from './core/EnemyGenerator.js'
import { MapGenerator } from './core/MapGenerator.js'

class Game extends Phaser.Scene {
  constructor() {
    super({ key: 'Game' });

    this.unitSize = config.height/31;
    this.buttonTowerSize = this.unitSize * 4;
    this.grid = {
      rows: 5,
      cols: 41,
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
    this.selectedTowerConfig = null;
    this.buying = false;
  }

  preload() {
    this.load.image('milkyway', 'assets/background7.png');
    this.load.image('buttonTower', 'assets/buttonTower6.png');
    this.load.image('backgroundDemo', 'assets/backgroundDemo.png');
    this.load.image('up', 'assets/up.png');
    this.load.image('left', 'assets/left.png');
    this.load.image('right', 'assets/right.png');
    this.load.image('down', 'assets/down.png');
    this.load.image('buy', 'assets/buy.png');
    this.load.image('sell', 'assets/sell.png');
    this.load.image('mainFrame', 'assets/mainFrame.png');

    this.load.image('main-tower', 'assets/main-tower.png');

    this.load.image('enemy', 'assets/enemy-3.png');
    this.load.image('towerTexture', 'assets/tower-2.png');

    this.load.image('laser-tower', 'assets/laser-tower.png');
    this.load.image('light-bulb', 'assets/light-bulb.png');
    this.load.image('ice-plasma-shot', 'assets/ice-plasma-shot.png');
    this.load.image('circle-shot', 'assets/circle-shot.png');

    this.load.image('laser', 'assets/laser.png');
    this.load.image('common-bullet', 'assets/common-bullet.png');
    this.load.image('light-bulb-shot', 'assets/light-bulb-shot.png');
    this.load.image('ice-plasma', 'assets/ice-plasma.png');

  }

  create() {
    this.milkyWay = new GameObject(this,this.physics.add.group(), this.grid.cols * this.buttonTowerSize/3, this.grid.rows * this.buttonTowerSize/2, 'milkyway', (this.grid.rows+1) * this.buttonTowerSize, this.grid.cols * (this.buttonTowerSize/1.5) );
    this.mainTowers = this.physics.add.group();
    this.enemies = this.physics.add.group();
    this.bullets = this.physics.add.group();
    this.towers = this.add.group();
    this.buttonTowers = this.add.group();

    this.goldLabel = this.add.text(500, 690, `Gold: ${this.gold}`, {
      font: '24px CustomFont',
      fill: '#777777',
    });
    this.lifeLabel = this.add.text(500, 650, 'Life:', {
      font: '24px CustomFont',
      fill: '#777777',
    });


    let paths = MapGenerator.generateMap(
      this,
      this.grid.rows,
      this.grid.cols
    );

    //Cameras
    this.towerMenuContainer = new TowerMenuContainer(this, this.unitSize*1, this.unitSize*50);//random offset
    this.cameras.main.setScroll(0, this.unitSize*46)
    this.cameras.main.setPosition(0, this.unitSize*20);
    this.cameras.main.setSize(config.width, this.unitSize*22);
    this.horizontalCamera = this.cameras.add(0, 0, config.width, this.unitSize*20);

    this.demoCamera = this.cameras.add(0, 0, this.unitSize*10, this.unitSize*6);
    this.demoCamera.setScroll(0, this.unitSize*80);
    this.demoCamera.setPosition(this.unitSize*31, this.unitSize*21);

    this.sellPopUp = new SellPopUp(this);
    this.enemyGenerator = new EnemyGenerator(this, paths, this.enemies);

    this.physics.add.overlap(this.enemies, this.bullets, function (enemy, bullet) {
      bullet.hit(enemy);
    });

    this.physics.add.overlap(this.mainTowers, this.enemies, function (
      mainTower,
      enemy
    ) {
      enemy.destroy();
      mainTower.health--;
    });
  
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
      bullet.update(delta);
    });

    this.enemies.getChildren().forEach(function (enemy) {
      enemy.update();
    });

    this.enemyGenerator.update(time);
    this.towerMenuContainer.update(time, delta);

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
    if (this.selectedTowerConfig && this.gold > this.selectedTowerConfig.price && !this.buying) {
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
        aux < this.grid.cols * this.buttonTowerSize - config.width
      ) {
        this.horizontalCamera.scrollX += deltaX;
        this.milkyWay.x += deltaX/2;
        // this.cameras.main.scrollY += deltaY;
      }

      this.lastPointerPosition = { x: pointer.x, y: pointer.y };
    }
  }

  pointerUp() {
    this.isDragging = false;
  }

}

var config = {
  type: Phaser.AUTO,
  width: window.innerWidth-4,
  height: window.innerHeight-4,
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 0 },
      debug: false,
    },
  },
  scene: Game,
};

var game = new Phaser.Game(config);
