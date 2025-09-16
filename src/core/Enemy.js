import { GameObject } from './GameObject.js'

export class Enemy extends GameObject {
  constructor(scene, group, x = -10, y = 100, height, width, enemyConfig) {
    super(scene, group, x, y, enemyConfig.texture, height, width);
    Object.assign(this, enemyConfig);
    this.scene = scene;
    this.currentPointIndex = 0;
    this.increasedDamagePercent = 0;
  }

  setPath(path) {
    this.path = path;
    this.startMoving();
  }

  takeDamage(bullet, damage) {
    this.health -= damage + (damage * this.increasedDamagePercent / 100);
    if (this.health <= 0) {
      this.scene.changeGold(this.gold);


      const explosion = this.scene.add.particles(this.x, this.y,'explosion-texture', {
          speed: { min: 100, max: 400 },
          angle: { min: bullet.angle - 20, max: bullet.angle + 20 }, // dispersión hacia adelante
          lifespan: { min: 300, max: 600 },
          scale: { start: 0.5, end: 0 },
          alpha: { start: 1, end: 0 },
          quantity: 10,
          blendMode: 'ADD',
          tint: [0xffaa00, 0xff5500, 0xffffff]
        });  
      explosion.explode(20 );  

      this.scene.time.delayedCall(600, () => explosion.destroy());
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
    const graphics = scene.make.graphics({ x: 0, y: 0, add: false });
    graphics.fillStyle(0xffffff, 1);
    graphics.fillCircle(scene.unitSize/2, scene.unitSize/2, scene.unitSize/2); // (x, y, radio)
    graphics.generateTexture('explosion-texture', 16, 16);
    graphics.destroy();
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