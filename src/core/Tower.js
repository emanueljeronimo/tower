import { Utils } from './Utils.js'
import { GameObject } from './GameObject.js'
import { Bullet } from './Bullet.js'

export class Tower extends GameObject {
  target = null;
  groupBullets = null;
  groupEnemies = null;
  lastTimeFired = 0;
  lastTimeUpdated = 0;

  constructor(scene, group, groupEnemies, groupBullets, x, y, height, width, towerConfig, canSellIt) {
    super(scene, group, x, y, towerConfig.texture, height * towerConfig.heightRatio, width * towerConfig.widthRatio);
    Object.assign(this, towerConfig);
    this.stopOnFrame(0)
    this.range = towerConfig.rangeUnits * scene.unitSize;
    this.groupBullets = groupBullets;
    this.groupEnemies = groupEnemies;
    this.rangeCircle = scene.add.circle(this.x, this.y, this.range, 0x0000ff, 0.2).setVisible(false);
    this.setOrigin(0.5, 0.5);
    if (canSellIt) {
      this.setInteractive();
      this.on('pointerdown', this.click, this);
    }
  }

  click() {
    this.rangeCircle.setVisible(true);
    setTimeout(() => { this.rangeCircle.setVisible(false) }, 300);
    this.scene.sellPopUp.setTower(this);
  }

  isInRange(enemy) {
    return Phaser.Math.Distance.Between(enemy.x, enemy.y, this.x, this.y) <= this.range;
  }

  updateTarget() {
    if (!this.target) {
      this.groupEnemies.getChildren().forEach(enemy => {
        if (this.isInRange(enemy)) {
          this.target = enemy;
        }
      })
    }

    if (this.target && (this.target.health <= 0 || !this.isInRange(this.target))) {
      this.target = null;
    }
  }

  shotWhenTargetIsClose(time, shotFn) {
    if (this.target && time > this.lastTimeFired + this.attackInterval) {
      if (this.isInRange(this.target)) {
        shotFn(this.scene, this.groupBullets, this.getCenter().x, this.getCenter().y, this.target, this.rangeUnits * this.scene.unitSize);
      }
      this.lastTimeFired = time;
    }
  }
  alignWithTarget(){
    if (/*this.lastTimeUpdated > this.attackInterval &&*/ this.target) {
      const angle = Phaser.Math.Angle.Between(this.getCenter().x, this.getCenter().y, this.target.getCenter().x, this.target.getCenter().y);
      this.setAngle(Phaser.Math.RAD_TO_DEG * angle);
      this.lastTimeUpdated = 0;
    }
  }

  update(time) {
    this.executeOnUpdate(this, time);
    this.updateTarget();
    this.alignWithTarget();
    this.lastTimeUpdated += time;
  }

  static commonTower = {
    heightRatio: 1.8,
    widthRatio: 4.2,
    price: 250,
    damage: 50,
    rangeUnits: 8,
    unitsCloserToTarget: 1.5,
    attackInterval: 100,
    texture: 'towerTexture',
    description: 'Common Tower',
    executeOnUpdate: (that, time) => {
      that.shotWhenTargetIsClose(time, (scene, groupBullets, x, y, target, range) => {
        new Bullet(scene, groupBullets, x, y, range, Bullet.common, target, range);
      });
    }
  }

  static laserTower = {
    heightRatio: 1.8,
    widthRatio: 4.2,
    price: 250,
    damage: 2000,
    rangeUnits: 18,
    unitsCloserToTarget: 5,
    attackInterval: 500,
    texture: 'towerTexture',
    description: 'Common Tower',
    executeOnUpdate: (that, time) => {
      that.shotWhenTargetIsClose(time, (scene, groupBullets, x, y, target, range) => {
        new Bullet(scene, groupBullets, x, y, range, Bullet.energyOrb, target, range);
      });
    }
  }

  static tripleShotTower = {
    heightRatio: 1,
    widthRatio: 2,
    price: 350,
    damage: 50,
    rangeUnits: 8,
    unitsCloserToTarget: 1.5,
    attackInterval: 300,
    texture: 'towerTexture',
    description: 'Triple Tower',
    executeOnUpdate: (that, time) => {
      that.shotWhenTargetIsClose(time, (scene, groupBullets, x, y, target, angle, damage, range) => {
        new Bullet(scene, groupBullets, x, y, angle + 0.2, scene.unitSize / 3, scene.unitSize / 3, damage, range, Bullet.common);
        new Bullet(scene, groupBullets, x, y, angle, scene.unitSize / 3, scene.unitSize / 3, damage, range, Bullet.common);
        new Bullet(scene, groupBullets, x, y, angle - 0.2, scene.unitSize / 3, scene.unitSize / 3, damage, range, Bullet.common);
      });
    }
  }

  static fastTower = {
    heightRatio: 1,
    widthRatio: 2,
    price: 250,
    damage: 50,
    rangeUnits: 8,
    unitsCloserToTarget: 1.5,
    attackInterval: 100,
    texture: 'towerTexture',
    description: 'Fast Tower',
    executeOnUpdate: (that, time) => {
      that.shotWhenTargetIsClose(time, (scene, groupBullets, x, y, target, angle, damage, range) => {
        new Bullet(scene, groupBullets, x, y, angle, scene.unitSize / 3, scene.unitSize / 3, damage, range, Bullet.common);
      });
    }
  }

  static lightBulbTower = {
    heightRatio: 1,
    widthRatio: 1.2,
    price: 250,
    damage: 100,
    rangeUnits: 150,
    unitsCloserToTarget: 1,
    attackInterval: 500,
    texture: 'towerTexture',
    description: 'light',
    executeOnUpdate: (that, time) => {
      that.shotWhenTargetIsClose(time, (scene, groupBullets, x, y, target, angle, damage, range) => {
        new Bullet(scene, groupBullets, x, y, angle + 0.1, scene.unitSize / 3, scene.unitSize / 3, damage, range, Bullet.lightBulbShot);
        new Bullet(scene, groupBullets, x, y, angle + 0.2, scene.unitSize / 3, scene.unitSize / 3, damage, range, Bullet.lightBulbShot);
        new Bullet(scene, groupBullets, x, y, angle, scene.unitSize / 3, scene.unitSize / 3, damage, range, Bullet.lightBulbShot);
        new Bullet(scene, groupBullets, x, y, angle - 0.1, scene.unitSize / 3, scene.unitSize / 3, damage, range, Bullet.lightBulbShot);
        new Bullet(scene, groupBullets, x, y, angle - 0.2, scene.unitSize / 3, scene.unitSize / 3, damage, range, Bullet.lightBulbShot);
      });
    }
  }

  static icePlasma = {
    heightRatio: 0.8,
    widthRatio: 1.3,
    price: 250,
    damage: 0,
    rangeUnits: 8,
    unitsCloserToTarget: 1.5,
    attackInterval: 300,
    texture: 'towerTexture',
    description: 'Ice Plasma',
    executeOnUpdate: (that, time) => {
      that.shotWhenTargetIsClose(time, (scene, groupBullets, x, y, target, angle, damage, range) => {
        new Bullet(scene, groupBullets, x, y, angle, scene.unitSize / 2, scene.unitSize / 2, damage, range, Bullet.icePlasmaShot);
      });
    }
  }

  static bombTower = {
    heightRatio: 1,
    widthRatio: 2,
    price: 250,
    damage: 50,
    rangeUnits: 8,
    unitsCloserToTarget: 1.5,
    attackInterval: 300,
    texture: 'towerTexture',
    description: 'Bomb Tower',
    executeOnUpdate: (that, time) => {
      that.shotWhenTargetIsClose(time, (scene, groupBullets, x, y, target, angle, damage, range) => {
        new Bullet(scene, groupBullets, x, y, angle, scene.unitSize / 3, scene.unitSize / 3, damage, range, Bullet.bomb);
      });
    }
  }

  static circleTower = {
    heightRatio: 1,
    widthRatio: 2,
    price: 250,
    damage: 1,
    rangeUnits: 8,
    unitsCloserToTarget: 2.3,
    attackInterval: 300,
    texture: 'towerTexture',
    description: 'Circle Tower',
    executeOnUpdate: (that, time) => {
      that.shotWhenTargetIsClose(time, (scene, groupBullets, x, y, target, angle, damage, range) => {
        new Bullet(scene, groupBullets, x, y, angle, scene.unitSize * 3, scene.unitSize * 3, damage, range, Bullet.circleShot);
      });
    }
  }

  static teleportTower = {
    heightRatio: 1,
    widthRatio: 2,
    price: 250,
    damage: 0,
    rangeUnits: 8,
    unitsCloserToTarget: 1.5,
    attackInterval: 1000,
    texture: 'towerTexture',
    description: 'Teleport Tower',
    executeOnUpdate: (that, time) => {
      that.shotWhenTargetIsClose(time, (scene, groupBullets, x, y, target, angle, damage, range) => {
        new Bullet(scene, groupBullets, x, y, angle, scene.unitSize, scene.unitSize, damage, range, Bullet.teleport);
      });
    }
  }

  static mineTower = {
    heightRatio: 1,
    widthRatio: 2,
    price: 250,
    damage: 5000,
    rangeUnits: 800,
    attackInterval: 500,
    texture: 'towerTexture',
    description: 'Mine Tower',
    executeOnUpdate: (that, time) => {
      that.shotWhenTargetIsClose(time, (scene, groupBullets, x, y, target, angle, damage, range) => {
        let randomPoint = Utils.getRandomNumber(0,target.path.length-1);
        let point1 = target.path[randomPoint];
        let point2 = target.path[randomPoint-1] ? target.path[randomPoint-1] : target.path[randomPoint+1];
        new Bullet(scene, groupBullets, Utils.getRandomNumber(point1.x, point2.x), Utils.getRandomNumber(point1.y, point2.y), angle, scene.unitSize, scene.unitSize, damage, range, Bullet.mine);
      });
    }
  }

  static damageTower = {
    heightRatio: 1,
    widthRatio: 2,
    price: 250,
    damage: 0,
    rangeUnits: 8,
    unitsCloserToTarget: 1.5,
    attackInterval: 200,
    texture: 'towerTexture',
    description: 'Damage Tower',
    executeOnUpdate: (that, time) => {
      that.shotWhenTargetIsClose(time, (scene, groupBullets, x, y, target, angle, damage, range) => {
        new Bullet(scene, groupBullets, x, y, angle, scene.unitSize / 3, scene.unitSize / 3, damage, range, Bullet.damage);
      });
    }
  }

  static bouncerTower = {
    heightRatio: 1,
    widthRatio: 2,
    price: 250,
    damage: 50,
    rangeUnits: 8,
    unitsCloserToTarget: 1.5,
    attackInterval: 300,
    texture: 'towerTexture',
    description: 'Bouncing Tower',
    executeOnUpdate: (that, time) => {
      that.shotWhenTargetIsClose(time, (scene, groupBullets, x, y, target, angle, damage, range) => {      
        new Bullet(scene, groupBullets, x, y, angle, scene.unitSize / 3, scene.unitSize / 3, damage, range, Bullet.bouncer);
      });
    }
  }
}