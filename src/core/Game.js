import { GameObject } from './GameObject.js'
import { Bullet } from './Bullet.js'
import { TowerMenuContainer } from './TowerMenuContainer.js'
import { SellPopUp } from './SellPopUp.js'
import { EnemyGenerator } from './EnemyGenerator.js'
import { MapGenerator } from './MapGenerator.js'
import { config } from './config.js'
import { Enemy } from './Enemy.js'
import { Tower } from './Tower.js'
import { AudioManager } from './AudioManager.js'
 
export class Game extends Phaser.Scene {
  constructor() {
    super({ key: 'Game' });

    this.unitSize = config.height/31;
    this.buttonTowerSize = this.unitSize * 4;
    this.grid = {
      rows: 5,
      cols: 30,
    };

    this.paths = null;
    this.mainTowers = null;
    this.enemies = null;
    this.bullets = null;
    this.towers = null;
    this.buttonTowers = null;
    this.enemyGenerator = null;
    this.isDragging = false;
    this.lastPointerPosition = { x: 0, y: 0 };
    this.gold = 10000000;
    this.selectedTowerConfig = null;
    this.buying = false;
    this.audioManager = null;
  }

  preload() {
    this.load.image('milkyway', 'assets/background14.png');
    this.load.svg('buttonTower', 'assets/buttonTower11.svg', { width: this.buttonTowerSize, height: this.buttonTowerSize });
    this.load.image('backgroundDemo', 'assets/backgroundDemo.png');
    this.load.image('up', 'assets/up.png');
    this.load.image('left', 'assets/left.png');
    this.load.image('right', 'assets/right.png');
    this.load.image('down', 'assets/down.png');
    this.load.image('buy', 'assets/buy.png');
    this.load.image('sell', 'assets/sell.png');
    this.load.image('mainFrame', 'assets/mainFrame.png');

    this.load.image('main-tower', 'assets/main-tower.png');

    Bullet.initTextures(this);
    Enemy.initTextures(this);
    Tower.initTextures(this);

    this.audioManager = new AudioManager(this);
  }

  create() {
    this.audioManager.setup();
    this.audioManager.play('music1');
    this.milkyWay = new GameObject(this,this.physics.add.group(), this.grid.cols * this.buttonTowerSize/3, this.grid.rows * this.buttonTowerSize/2, 'milkyway', this.grid.rows * this.buttonTowerSize, this.grid.cols * this.buttonTowerSize );
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


    this.paths = MapGenerator.generateMap(
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
    this.enemyGenerator = new EnemyGenerator(this, this.paths, this.enemies);

    this.physics.add.overlap(this.enemies, this.bullets, function (enemy, bullet) {
      bullet.hit(enemy);
    });

    this.physics.add.overlap(this.mainTowers, this.enemies, function (
      mainTower,
      enemy
    ) {
      enemy.hitWithMainTower(mainTower);
      mainTower.health--;
    });
  
    this.input.on('pointerdown', this.pointerDown, this);
    this.input.on('pointermove', this.pointerMove, this);
    this.input.on('pointerup', this.pointerUp, this);
    // this.input.on('wheel', this.mouseWheel, this);
  }

  update(time, delta) {

    if (!this.fpsText) {
        this.fpsText = this.add.text(10, 10, '', { font: '16px Arial', fill: '#ffffff' });
    }
    this.fpsText.setText(`FPS: ${Math.floor(this.game.loop.actualFps)}`);



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


    this.events.on('hidden', () => {
      this.sound.pauseAll();
    });

    this.events.on('visible', () => {
      if (this.sound.context.state === 'suspended') {
        this.sound.context.resume();
      }
      this.sound.resumeAll();
    });


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
      const deltaX = Math.floor(this.lastPointerPosition.x - pointer.x); 
      let aux = Math.floor(this.horizontalCamera.scrollX + deltaX);
      if (
        aux > 0 &&
        aux < this.grid.cols * this.buttonTowerSize - config.width
      ) {
        this.horizontalCamera.scrollX += deltaX;       
        this.milkyWay.x += deltaX/2;
        console.log(`delta ${deltaX} this.horizontalCamera.scrollX ${this.horizontalCamera.scrollX} this.milkyWay.x ${this.milkyWay.x} `);
      }

      this.lastPointerPosition = { x: pointer.x, y: pointer.y };
    }
  }

  pointerUp() {
    this.isDragging = false;
  }

}