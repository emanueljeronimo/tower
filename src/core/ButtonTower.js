import { GameObject } from './GameObject.js'
import { Tower } from './Tower.js'

export class ButtonTower extends GameObject {
  target = null;
  tower = null;
  groupTowers = null;
  groupBullets = null;
  groupEnemies = null;

  constructor(scene, group, groupTowers, groupEnemies, groupBullets, x, y) {
    super(scene, group, x, y, 'buttonTower', scene.buttonTowerSize, scene.buttonTowerSize);
    this.scene = scene;
    this.groupTowers = groupTowers;
    this.groupEnemies = groupEnemies;
    this.groupBullets = groupBullets;
    this.setInteractive();
    this.on('pointerdown', this.buyTower, this);
  }

  createTower(sellable) {
    this.tower = new Tower(this.scene, this.groupTowers, this.groupEnemies, this.groupBullets, this.x, this.y, this.scene.unitSize, this.scene.unitSize, this.scene.getSelectedTowerConfig(), sellable);
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
