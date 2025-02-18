import { GameObject } from './GameObject.js'

export class MainTower extends GameObject {
  constructor(scene, group, x, y, height, width) {
    super(scene, group, x, y, 'main-tower', height, width);
    this.health = 15;
  }
}