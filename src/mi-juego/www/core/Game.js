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

    this.unitSize = config.height / 31;
    this.buttonTowerSize = this.unitSize * 4;
    this.grid = { rows: 5, cols: 30 };

    // Game objects
    this.paths = null;
    this.mainTowers = null;
    this.enemies = null;
    this.bullets = null;
    this.towers = null;
    this.buttonTowers = null;
    this.enemyGenerator = null;

    // UI
    this.isDragging = false;
    this.lastPointerPosition = { x: 0, y: 0 };
    this.gold = 10000000;
    this.selectedTowerConfig = null;
    this.buying = false;
    this.audioManager = null;

    // Parallax
    this.starLayers = [];
    this.parallaxOffsetY = 0;
    this.parallaxMax = 40; // tope visual

    // Gyroscope
    this.gyroBaseOrientation = null;
    this.gyroEnabled = false;
    this.gyroLogs = [];
    this.maxLogs = 10;
  }

  preload() {
    this.load.image('buttonTower', 'assets/buttonTower11-2.png');
    this.load.image('backgroundDemo', 'assets/backgroundDemo.png');
    this.load.image('buy', 'assets/buy.png');
    this.load.image('sell', 'assets/sell.png');
    this.load.image('mainFrame', 'assets/mainFrame.png');
    this.load.image('main-tower', 'assets/main-tower.png');

    Bullet.initTextures(this);
    Enemy.initTextures(this);
    Tower.initTextures(this);

    this.audioManager = new AudioManager(this);
    this.createStarTexture();
  }

  createStarTexture() {
    const g = this.add.graphics();
    const size = this.unitSize * 0.3;
    const points = 8;
    const outer = size;
    const inner = size * 0.4;

    g.fillStyle(0xFFFFFF, 1);
    g.beginPath();

    for (let i = 0; i < points * 2; i++) {
      const angle = (i * Math.PI) / points - Math.PI / 2;
      const radius = i % 2 === 0 ? outer : inner;
      const x = size + Math.cos(angle) * radius;
      const y = size + Math.sin(angle) * radius;
      i === 0 ? g.moveTo(x, y) : g.lineTo(x, y);
    }

    g.closePath();
    g.fillPath();
    g.generateTexture('whiteStar', size * 2, size * 2);
    g.destroy();
  }

  create() {
    this.audioManager.setup();
    // this.audioManager.play('music1');

    this.initDeviceMotion();
    this.createStarLayers();

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

    this.paths = MapGenerator.generateMap(this, this.grid.rows, this.grid.cols);

    // Cameras
    this.towerMenuContainer = new TowerMenuContainer(this, this.unitSize * 1, this.unitSize * 50);
    this.cameras.main.setScroll(0, this.unitSize * 46);
    this.cameras.main.setPosition(0, this.unitSize * 20);
    this.cameras.main.setSize(config.width, this.unitSize * 22);
    this.horizontalCamera = this.cameras.add(0, 0, config.width, this.unitSize * 20);
    this.demoCamera = this.cameras.add(0, 0, this.unitSize * 10, this.unitSize * 6);
    this.demoCamera.setScroll(0, this.unitSize * 80);
    this.demoCamera.setPosition(this.unitSize * 31, this.unitSize * 21);

    this.sellPopUp = new SellPopUp(this);
    this.enemyGenerator = new EnemyGenerator(this, this.paths, this.enemies);

    this.physics.add.overlap(this.enemies, this.bullets, (enemy, bullet) => {
      bullet.hit(enemy);
    });

    this.physics.add.overlap(this.mainTowers, this.enemies, (mainTower, enemy) => {
      enemy.hitWithMainTower(mainTower);
      mainTower.health--;
    });

    this.input.on('pointerdown', this.pointerDown, this);
    this.input.on('pointermove', this.pointerMove, this);
    this.input.on('pointerup', this.pointerUp, this);
  }

  createStarLayers() {
    const layers = [
      { count: 50, scale: 0.4, color: 0x4444FF, speed: 0.15, alpha: 0.6 },
      { count: 30, scale: 0.6, color: 0x8844FF, speed: 0.35, alpha: 0.8 },
      { count: 20, scale: 1.0, color: 0xFF4488, speed: 0.6, alpha: 1 }
    ];

    const w = this.grid.cols * this.buttonTowerSize;
    const h = this.grid.rows * this.buttonTowerSize;

    layers.forEach((cfg, idx) => {
      const stars = [];
      for (let i = 0; i < cfg.count; i++) {
        const star = this.add.image(
          Phaser.Math.Between(0, w),
          Phaser.Math.Between(0, h),
          'whiteStar'
        );
        star.setScale(cfg.scale);
        star.setTint(cfg.color);
        star.setAlpha(cfg.alpha);
        star.setDepth(-3 + idx);
        stars.push(star);
      }
      this.starLayers.push({ stars, speed: cfg.speed });
    });
  }

  initDeviceMotion() {
    this.addGyroLog('Iniciando DeviceMotionEvent');

    this.motionEnabled = false;
    this.motionBaseY = null;

    const handler = (event) => {
      if (!this.motionEnabled) return;

      if (!event.accelerationIncludingGravity) return;

      const raw = -event.accelerationIncludingGravity.x;

      if (this.motionBaseY === null) {
        this.motionBaseY = raw;
        return;
      }

      let diff = raw - this.motionBaseY;
      if (Math.abs(diff) < 0.2) diff = 0;

      diff *= 6;

      this.parallaxOffsetY = Phaser.Math.Clamp(
        diff,
        -this.parallaxMax,
        this.parallaxMax
      );

      this.applyParallaxY(this.parallaxOffsetY);
    };

    window.addEventListener('devicemotion', handler, true);

    this.input.once('pointerdown', () => {
      this.motionEnabled = true;
      this.addGyroLog('DeviceMotion: Enabled');
    });
  }

  applyParallaxX(deltaX) {
    this.starLayers.forEach(layer => {
      layer.stars.forEach(star => {
        star.x += deltaX * layer.speed;
      });
    });
  }

  applyParallaxY(deltaY) {
    this.starLayers.forEach(layer => {
      layer.stars.forEach(star => {
        star.y += deltaY * layer.speed * 0.5;
      });
    });
  }

  addGyroLog(msg) {
    const time = new Date().toLocaleTimeString();
    this.gyroLogs.push(`[${time}] ${msg}`);
    if (this.gyroLogs.length > this.maxLogs) this.gyroLogs.shift();
  }

  update(time, delta) {
    if (!this.fpsText) {
      this.fpsText = this.add.text(10, 10, '', {
        font: '16px Arial',
        fill: '#ffffff'
      });
      this.fpsText.setScrollFactor(0).setDepth(1000);
      this.cameras.main.ignore(this.fpsText);
      this.demoCamera.ignore(this.fpsText);
    }
    this.fpsText.setText(`FPS: ${Math.floor(this.game.loop.actualFps)}`);

    if (!this.gyroLogText) {
      this.gyroLogText = this.add.text(10, 40, '', {
        font: '14px Arial',
        fill: '#00ff00',
        backgroundColor: '#000000',
        padding: { x: 5, y: 5 }
      });
      this.gyroLogText.setScrollFactor(0).setDepth(1000);
      this.cameras.main.ignore(this.gyroLogText);
      this.demoCamera.ignore(this.gyroLogText);
    }
    this.gyroLogText.setText(this.gyroLogs.join('\n'));

    this.mainTowers.getChildren().forEach(mt => {
      this.lifeLabel.setText(`Life: ${mt.health}`);
      if (mt.health === 0) {
        // Game over
      }
    });

    this.towers.getChildren().forEach(t => t.update(time));
    this.enemies.getChildren().forEach(e => e.update());
    this.bullets.getChildren().forEach(b => b.update(delta));

    this.enemyGenerator.update(time);
    this.towerMenuContainer.update(time, delta);

    this.parallaxOffsetY = Phaser.Math.Linear(
      this.parallaxOffsetY,
      0,
      0.1
    );

    this.applyParallaxY(this.parallaxOffsetY);
  }

  changeGold(gold) {
    this.gold += gold;
    this.goldLabel.setText(`Gold: ${this.gold}`);
  }

  getGold() {
    return this.gold;
  }

  setSelectedTowerConfig(cfg) {
    this.selectedTowerConfig = cfg;
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

  pointerDown(pointer) {
    this.isDragging = true;
    this.lastPointerPosition = { x: pointer.x, y: pointer.y };
  }

  pointerMove(pointer) {
    if (!this.isDragging) return;

    const deltaX = Math.floor(this.lastPointerPosition.x - pointer.x);
    const newScrollX = Math.floor(this.horizontalCamera.scrollX + deltaX);

    if (newScrollX > 0 && newScrollX < this.grid.cols * this.buttonTowerSize - config.width) {
      this.horizontalCamera.scrollX += deltaX;
      this.applyParallaxX(deltaX);
    }

    this.lastPointerPosition = { x: pointer.x, y: pointer.y };
  }

  pointerUp() {
    this.isDragging = false;
  }
}