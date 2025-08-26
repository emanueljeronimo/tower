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

  takeDamage(damage) {
    this.health -= damage + (damage * this.increasedDamagePercent / 100);
    if (this.health <= 0) {
      this.scene.changeGold(this.gold);
      this.destroy();
      this.group.remove(this, true, true);
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