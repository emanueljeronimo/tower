import { GameObject } from './GameObject.js'
import { Utils } from './Utils.js';

export class Enemy extends GameObject {
  constructor(scene, group, x = -10, y = 100, height, width, enemyConfig) {
    super(scene, group, x, y, enemyConfig.texture, height, width);
    Object.assign(this, enemyConfig);
    this.scene = scene;
    this.currentPointIndex = 0;
    this.increasedDamagePercent = 0;


    this.fireEmitter = scene.add.particles(0, 0, 'fire-texture', {
      speed: { min: 100, max: 100 },
      angle: { min: 0, max: 0 },
      lifespan: 300,
      scale: { start: 0.5, end: 0 },
      alpha: { start: 1, end: 0 },
      frequency: 50,
      quantity: 1,
      blendMode: 'ADD'
    }); 
    this.setDepth(10);
    this.fireEmitter.setDepth(5);
  }

  setPath(path) {
    this.path = path;
    this.startMoving();
  }

  takeDamage(bullet, damage) {
    this.health -= damage + (damage * this.increasedDamagePercent / 100);
    if (this.health <= 0) {
      this.scene.audioManager.play(`explosion${Utils.getRandomNumber(1,3)}`, {volume: 0.1});
      this.scene.changeGold(this.gold);
      let angle = Phaser.Math.RadToDeg(
        Phaser.Math.Angle.Between(
          bullet.getCenter().x, bullet.getCenter().y, this.getCenter().x, this.getCenter().y
        )
      );
      const explosion = this.scene.add.particles(this.x, this.y,'explosion-texture', {
          speed: { min: 100, max: 400 },
          angle: { min: angle - 30, max: angle + 30 },
          lifespan: { min: 300, max: 600 },
          scale: { start: 0.5, end: 0 },
          alpha: { start: 1, end: 0 },
          quantity: 10,
          blendMode: 'ADD',
          tint: [0xffaa00, 0xff5500, 0xffffff]
        });  
      explosion.explode(20);  

      this.scene.time.delayedCall(600, () => explosion.destroy());
      this.fireEmitter.destroy();
      this.destroy();
      this.group.remove(this);
    }
  }

  update() {
    const targetPoint = this.path[this.currentPointIndex];
    if(this.x - this.scene.unitSize < targetPoint.x && this.x + this.scene.unitSize > targetPoint.x &&
      this.y - this.scene.unitSize < targetPoint.y && this.y + this.scene.unitSize > targetPoint.y  ) {
      this.currentPointIndex++;
      if (this.currentPointIndex < this.path.length) {
        this.startMoving();
      }
    }
    const tailOffset = this.scene.unitSize/2; // distancia desde el centro hacia atrás
    const tailX = this.x + Math.cos(this.rotation + Math.PI) * tailOffset;
    const tailY = this.y + Math.sin(this.rotation + Math.PI) * tailOffset;
    this.fireEmitter.setPosition(tailX, tailY);
  
  
    const emitterAngle = Phaser.Math.RadToDeg(this.rotation) + 180;
    this.fireEmitter.setAngle(emitterAngle);
  }

  startMoving() {
    const targetPoint = this.path[this.currentPointIndex];
    const angleToTarget = Phaser.Math.Angle.Between(this.x, this.y, targetPoint.x, targetPoint.y);
    this.rotation = angleToTarget;
    this.setAngle(Phaser.Math.RAD_TO_DEG * angleToTarget);
    this.setVelocityX(Math.cos(angleToTarget) * (this.speed * this.scene.unitSize));
    this.setVelocityY(Math.sin(angleToTarget) * (this.speed * this.scene.unitSize));
  }

  static initTextures(scene) {
    scene.load.image('enemy', 'assets/enemy-7.png');

    const graphics = scene.make.graphics({ x: 0, y: 0, add: false });
    graphics.fillStyle(0xffffff, 1);
    graphics.fillCircle(scene.unitSize/2, scene.unitSize/2, scene.unitSize/2); // (x, y, radio)
    graphics.generateTexture('explosion-texture', 16, 16);
    graphics.destroy();

    const graphics2 = scene.make.graphics({ x: 0, y: 0, add: false });

    // capa externa azul celeste
    graphics2.fillStyle(0x00ffff, 1); // azul celeste
    graphics2.fillCircle(8, 8, 8);

    // capa interna blanca brillante
    graphics2.fillStyle(0xffffff, 1);
    graphics2.fillCircle(8, 8, 4);

    graphics2.fillStyle(0x00ffff, 0.3); // azul celeste translúcido
    graphics2.fillCircle(8, 8, 12);     // un halo más grande

    graphics2.generateTexture('fire-texture', 16, 16);
    graphics2.destroy();
  }

  static commonEnemy = {
    texture: 'enemy',
    health: 100,
    speed: 8,
    gold: 15
  }

  static dummyEnemy = {
    texture: 'enemy',
    health: 100,
    speed: 10,
    gold: 0
  }
}