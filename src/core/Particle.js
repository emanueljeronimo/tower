import { GameObject } from './GameObject.js'

export class Particle extends GameObject {
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