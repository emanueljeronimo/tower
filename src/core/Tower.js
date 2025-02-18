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
    if (this.target && time > this.lastTimeFired + this.attackVelocity) {
      if (this.isInRange(this.target)) {
        this.play({ key: this.animation, repeat: 0 });
        const angle = Phaser.Math.Angle.Between(this.x, this.y, this.target.x+(this.scene.unitSize*0.8) , this.target.y);
        let newPosition = this.unitsCloserToTarget ? Utils.calculatePositionTowardsTarget(this.x, this.y, this.target.x, this.target.y, this.scene.unitSize * this. unitsCloserToTarget )  : { x: this.x, y: this.y};
        shotFn(this.scene, this.groupBullets, newPosition.x, newPosition.y, this.target, angle, this.damage, this.range);
      }
      this.lastTimeFired = time;
    }
  }

  update(time) {
    this.updateTarget();
    if(this.lastTimeUpdated > 200 && this.target) {
      const angle = Phaser.Math.Angle.Between(this.x, this.y, this.target.x, this.target.y);
      this.setAngle(Phaser.Math.RAD_TO_DEG * angle);
      this.lastTimeUpdated = 0;
    }
    this.lastTimeUpdated += time;
    this.executeOnUpdate(this, time);
  }

  static commonTower = {
    heightRatio: 1.8,
    widthRatio: 4.2,
    price: 250,
    damage: 50,
    rangeUnits: 8,
    unitsCloserToTarget: 1.5,
    attackVelocity: 300,
    animation: 'towerAnimation',
    texture: 'towerTexture',
    description: 'Common Tower',
    executeOnUpdate: (that, time) => {
      that.shotWhenTargetIsClose(time, (scene, groupBullets, x, y, target, angle, damage, range) => {
        new Bullet(scene, groupBullets, x, y, angle, scene.unitSize / 3, scene.unitSize / 3, damage, range, Bullet.common, target);
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
    attackVelocity: 300,
    animation: 'tower',
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
    attackVelocity: 100,
    animation: 'tower',
    description: 'Fast Tower',
    executeOnUpdate: (that, time) => {
      that.shotWhenTargetIsClose(time, (scene, groupBullets, x, y, target, angle, damage, range) => {
        new Bullet(scene, groupBullets, x, y, angle, scene.unitSize / 3, scene.unitSize / 3, damage, range, Bullet.common);
      });
    }
  }

  static laserTower = {
    heightRatio: 1,
    widthRatio: 1,
    price: 250,
    damage: 100,
    rangeUnits: 150,
    unitsCloserToTarget: 1.5,
    attackVelocity: 500,
    animation: 'laser-tower',
    description: 'Laser',
    executeOnUpdate: (that, time) => {
      that.shotWhenTargetIsClose(time, (scene, groupBullets, x, y, target, angle, damage, range) => {
        new Bullet(scene, groupBullets, x, y, angle, scene.unitSize / 3, scene.unitSize * 15, damage, range, Bullet.laser);
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
    attackVelocity: 500,
    animation: 'light-bulb',
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
    attackVelocity: 300,
    animation: 'ice-plasma',
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
    attackVelocity: 300,
    animation: 'tower',
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
    attackVelocity: 300,
    animation: 'tower',
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
    attackVelocity: 1000,
    animation: 'tower',
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
    attackVelocity: 500,
    animation: 'tower',
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
    attackVelocity: 200,
    animation: 'tower',
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
    attackVelocity: 300,
    animation: 'tower',
    description: 'Bouncing Tower',
    executeOnUpdate: (that, time) => {
      that.shotWhenTargetIsClose(time, (scene, groupBullets, x, y, target, angle, damage, range) => {      
        new Bullet(scene, groupBullets, x, y, angle, scene.unitSize / 3, scene.unitSize / 3, damage, range, Bullet.bouncer);
      });
    }
  }


}