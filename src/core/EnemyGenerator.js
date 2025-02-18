import { Utils } from './Utils.js'
import { Enemy } from './Enemy.js'

export class EnemyGenerator {
  frequency = 500;
  path = null;
  groupEnemies = null;
  counter = 0;
  enemiesQuatity = 25;
  scene = null;
  lastEnemyCreated = 0;
  constructor(scene, paths, groupEnemies, groupParticles) {
    this.scene = scene;
    this.paths = paths;
    this.groupEnemies = groupEnemies;
    this.groupParticles = groupParticles;
  }

  update(time) {
    if (this.enemiesQuatity > this.counter && time > this.lastEnemyCreated + this.frequency) {
      let enemy = new Enemy(this.scene, this.groupEnemies, this.groupParticles, 0, 0, this.scene.unitSize*1.8, this.scene.unitSize*1.8, Enemy.commonEnemy);
      enemy.setPath(this.paths[Utils.getRandomNumber(0,1)]);
      this.lastEnemyCreated = time;
      this.counter++;
    }
  }
}