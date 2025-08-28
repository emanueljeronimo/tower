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

  shotWhenIsTime(time, shotFn) {
    if (time > this.lastTimeFired + this.attackInterval) {
      shotFn(this.scene, this.groupBullets, this.getCenter().x, this.getCenter().y, this.rangeUnits * this.scene.unitSize);
      this.lastTimeFired = time;
    }
  }

  alignWithTarget() {
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
    attackInterval: 100,
    texture: 'towerTexture',
    description: 'Common Tower',
    executeOnUpdate: (that, time) => {
      that.shotWhenTargetIsClose(time, (scene, groupBullets, x, y, target, range) => {
        new Bullet(scene, groupBullets, x, y, Bullet.common, target, range);
      });
    }
  }

  static energyOrbTower = {
    heightRatio: 1.8,
    widthRatio: 4.2,
    price: 250,
    damage: 2000,
    rangeUnits: 18,
    attackInterval: 500,
    texture: 'towerTexture',
    description: 'Common Tower',
    executeOnUpdate: (that, time) => {
      that.shotWhenTargetIsClose(time, (scene, groupBullets, x, y, target, range) => {
        new Bullet(scene, groupBullets, x, y, Bullet.energyOrb, target, range);
      });
    }
  }

  static bouncerTower = {
    heightRatio: 1.8,
    widthRatio: 4.2,
    price: 250,
    damage: 2000,
    rangeUnits: 18,
    attackInterval: 500,
    texture: 'towerTexture',
    description: 'Common Tower',
    executeOnUpdate: (that, time) => {
      that.shotWhenTargetIsClose(time, (scene, groupBullets, x, y, target, range) => {
        new Bullet(scene, groupBullets, x, y, Bullet.bouncer, target, range);
      });
    }
  }

  static bombTower = {
    heightRatio: 1.8,
    widthRatio: 4.2,
    price: 250,
    damage: 50,
    rangeUnits: 8,
    attackInterval: 100,
    texture: 'towerTexture',
    description: 'Common Tower',
    executeOnUpdate: (that, time) => {
      that.shotWhenTargetIsClose(time, (scene, groupBullets, x, y, target, range) => {
        new Bullet(scene, groupBullets, x, y, Bullet.bomb, target, range);
      });
    }
  }

  static slowerTower = {
    heightRatio: 1.8,
    widthRatio: 4.2,
    price: 250,
    damage: 50,
    rangeUnits: 8,
    attackInterval: 100,
    texture: 'towerTexture',
    description: 'Common Tower',
    executeOnUpdate: (that, time) => {
      that.shotWhenTargetIsClose(time, (scene, groupBullets, x, y, target, range) => {
        new Bullet(scene, groupBullets, x, y, Bullet.slower, target, range);
      });
    }
  }

  static tripleShotTower = {
    heightRatio: 1.8,
    widthRatio: 4.2,
    price: 250,
    damage: 50,
    rangeUnits: 8,
    attackInterval: 100,
    texture: 'towerTexture',
    description: 'Common Tower',
    executeOnUpdate: (that, time) => {
      that.shotWhenTargetIsClose(time, (scene, groupBullets, x, y, target, range) => {
        const angle = Phaser.Math.Angle.Between(that.getCenter().x, that.getCenter().y, target.getCenter().x, target.getCenter().y);
        new Bullet(scene, groupBullets, x, y, Bullet.triple, null, range, angle - 0.2);
        new Bullet(scene, groupBullets, x, y, Bullet.triple, null, range, angle);
        new Bullet(scene, groupBullets, x, y, Bullet.triple, null, range, angle + 0.2);
      });
    }
  }

  static circleTower = {
    heightRatio: 1.8,
    widthRatio: 4.2,
    price: 250,
    damage: 50,
    rangeUnits: 8,
    attackInterval: 100,
    texture: 'towerTexture',
    description: 'Common Tower',
    executeOnUpdate: (that, time) => {
      that.shotWhenTargetIsClose(time, (scene, groupBullets, x, y, target, range) => {
        new Bullet(scene, groupBullets, x, y, Bullet.circle, target, range);
      });
    }
  }

  static teleportTower = {
    heightRatio: 1.8,
    widthRatio: 4.2,
    price: 250,
    damage: 50,
    rangeUnits: 8,
    attackInterval: 100,
    texture: 'towerTexture',
    description: 'Common Tower',
    executeOnUpdate: (that, time) => {
      that.shotWhenTargetIsClose(time, (scene, groupBullets, x, y, target, range) => {
        new Bullet(scene, groupBullets, x, y, Bullet.teleport, target, range);
      });
    }
  }

  static mineTower = {
    heightRatio: 1.8,
    widthRatio: 4.2,
    price: 250,
    damage: 50,
    rangeUnits: 15,
    attackInterval: 100,
    texture: 'towerTexture',
    description: 'Common Tower',
    executeOnUpdate: (that, time) => {
      that.shotWhenIsTime(time, (scene, groupBullets, x, y, range) => {

        function findRandomPointAlongPathInRange(path, towerX, towerY, range) {

          function closestPointOnSegment(a, b, p) {
            const ax = a.x, ay = a.y;
            const bx = b.x, by = b.y;
            const px = p.x, py = p.y;

            const abx = bx - ax;
            const aby = by - ay;
            const apx = px - ax;
            const apy = py - ay;

            const abLenSq = abx * abx + aby * aby;
            const dot = (apx * abx + apy * aby) / abLenSq;

            const t = Phaser.Math.Clamp(dot, 0, 1);

            return {
              x: ax + abx * t,
              y: ay + aby * t
            };
          }

          const rangeSq = range * range;
          const validSegments = [];

          for (let i = 0; i < path.length - 1; i++) {
            const p1 = path[i];
            const p2 = path[i + 1];

            const closest = closestPointOnSegment(p1, p2, { x: towerX, y: towerY });
            const dx = closest.x - towerX;
            const dy = closest.y - towerY;
            const distSq = dx * dx + dy * dy;

            if (distSq <= rangeSq) {
              validSegments.push({ p1, p2 });
            }
          }

          if (validSegments.length === 0) return null;

          // Elegimos un segmento válido al azar
          const { p1, p2 } = Phaser.Utils.Array.GetRandom(validSegments);
          const t = Math.random(); // entre 0 y 1
          const x = Phaser.Math.Linear(p1.x, p2.x, t);
          const y = Phaser.Math.Linear(p1.y, p2.y, t);
          return { x, y };
        }

        const path = scene.paths[Math.floor(Math.random() * scene.paths.length)];
        let targetPoint = findRandomPointAlongPathInRange(path, x, y, that.rangeUnits * scene.unitSize);
        //lo reescribo con numeros mas randoms
        if (targetPoint) {
          const halfUnitSize = scene.unitSize / 2;
          targetPoint = { x: Utils.getRandomNumber(targetPoint.x - halfUnitSize, targetPoint.x + halfUnitSize), y: Utils.getRandomNumber(targetPoint.y - halfUnitSize, targetPoint.y + halfUnitSize) };
          new Bullet(scene, groupBullets, targetPoint.x, targetPoint.y, Bullet.mine, null, range);
        }

      });
    }
  }

  static damageTower = {
    heightRatio: 1.8,
    widthRatio: 4.2,
    price: 250,
    damage: 50,
    rangeUnits: 8,
    attackInterval: 1000,
    texture: 'towerTexture',
    description: 'Common Tower',
    executeOnUpdate: (that, time) => {
      that.shotWhenTargetIsClose(time, (scene, groupBullets, x, y, target, range) => {
        new Bullet(scene, groupBullets, x, y, Bullet.damage, target, range);
      });
    }
  }

  static electricityTower = {
    heightRatio: 1.8,
    widthRatio: 4.2,
    price: 250,
    damage: 50,
    rangeUnits: 15,
    attackInterval: 1000,
    texture: 'towerTexture',
    description: 'Common Tower',
    executeOnUpdate: (that, time) => {
      that.shotWhenIsTime(time, (scene, groupBullets, x, y, range) => {
        new Bullet(scene, groupBullets, that.getCenter().x, that.getCenter().y, Bullet.electricity, null, range, Utils.getRandomAngle());
        new Bullet(scene, groupBullets, that.getCenter().x, that.getCenter().y, Bullet.electricity, null, range, Utils.getRandomAngle());
        new Bullet(scene, groupBullets, that.getCenter().x, that.getCenter().y, Bullet.electricity, null, range, Utils.getRandomAngle());
        new Bullet(scene, groupBullets, that.getCenter().x, that.getCenter().y, Bullet.electricity, null, range, Utils.getRandomAngle());
        new Bullet(scene, groupBullets, that.getCenter().x, that.getCenter().y, Bullet.electricity, null, range, Utils.getRandomAngle());
        new Bullet(scene, groupBullets, that.getCenter().x, that.getCenter().y, Bullet.electricity, null, range, Utils.getRandomAngle());
        new Bullet(scene, groupBullets, that.getCenter().x, that.getCenter().y, Bullet.electricity, null, range, Utils.getRandomAngle());
        new Bullet(scene, groupBullets, that.getCenter().x, that.getCenter().y, Bullet.electricity, null, range, Utils.getRandomAngle());
        new Bullet(scene, groupBullets, that.getCenter().x, that.getCenter().y, Bullet.electricity, null, range, Utils.getRandomAngle());
        new Bullet(scene, groupBullets, that.getCenter().x, that.getCenter().y, Bullet.electricity, null, range, Utils.getRandomAngle());
        new Bullet(scene, groupBullets, that.getCenter().x, that.getCenter().y, Bullet.electricity, null, range, Utils.getRandomAngle());
        new Bullet(scene, groupBullets, that.getCenter().x, that.getCenter().y, Bullet.electricity, null, range, Utils.getRandomAngle());
        new Bullet(scene, groupBullets, that.getCenter().x, that.getCenter().y, Bullet.electricity, null, range, Utils.getRandomAngle());
        new Bullet(scene, groupBullets, that.getCenter().x, that.getCenter().y, Bullet.electricity, null, range, Utils.getRandomAngle());
        new Bullet(scene, groupBullets, that.getCenter().x, that.getCenter().y, Bullet.electricity, null, range, Utils.getRandomAngle());
      });
    }
  }


}