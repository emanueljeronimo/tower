// acomodar todo el menu
// bien, hacer varias torres mas
// hacer 2 paths
// que las naves se teletransporten


class Utils {
  static calculatePositionTowardsTarget(currentX, currentY, targetX, targetY, distance) {
    const angle = Phaser.Math.Angle.Between(currentX, currentY, targetX, targetY);
    const newX = currentX + distance * Math.cos(angle);
    const newY = currentY + distance * Math.sin(angle);
    return { x: newX, y: newY };
  }

  static getRandomNumber(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  static getClosestEnemy(enemyToAvoid, enemiesFromScene, x, y){
  
      let enemies = enemiesFromScene.getChildren();
      let closestEnemy = null;
      let distanciaMinima = 99999999;
 
      enemies.forEach(enemy => {
          let distancia = Phaser.Math.Distance.Between(enemy.x, enemy.y, x, y);
          if (distancia < distanciaMinima && enemyToAvoid !== enemy) {
              distanciaMinima = distancia; 
              closestEnemy = enemy; 
          }
      });
  
      return closestEnemy;

  }

}

class GameObject extends Phaser.Physics.Arcade.Sprite {
  group = null;
  constructor(scene, group, x, y, texture, height, width) {
    super(scene, x, y, texture);
    this.group = group;
    group.add(this);
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setSize(width, height);
    this.setDisplaySize(width, height);
  }
}

class MainTower extends GameObject {
  constructor(scene, group, x, y, height, width) {
    super(scene, group, x, y, 'main-tower', height, width);
    this.health = 15;
  }
}

class Particle extends GameObject {
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

class Enemy extends GameObject {
  constructor(scene, group, particleGroup, x = -10, y = 100, height, width, enemyConfig) {
    super(scene, group, x, y, enemyConfig.texture, height, width);
    Object.assign(this, enemyConfig);
    this.particleGroup = particleGroup;
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
    console.log(this.health);
    if (this.health <= 0) {
      this.scene.changeGold(this.gold);
      for (var i = 1; i <= 5; i++) {
        new Particle(this.scene, this.particleGroup, this.x, this.y, this.scene.unitSize / 3, this.scene.unitSize / 3);
      }
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
    this.setVelocityX(Math.cos(angleToTarget) * this.speed);
    this.setVelocityY(Math.sin(angleToTarget) * this.speed);
  }

  static commonEnemy = {
    texture: 'enemy',
    health: 100,
    speed: 150,
    gold: 15
  }

  static dummyEnemy = {
    texture: 'enemy',
    health: 100,
    speed: 10,
    gold: 0
  }
}


class Tower extends GameObject {
  target = null;
  groupBullets = null;
  groupEnemies = null;
  lastTimeFired = 0;
  lastTimeUpdated = 0;

  constructor(scene, group, groupEnemies, groupBullets, x, y, height, width, towerConfig, canSellIt) {
    super(scene, group, x, y, towerConfig.texture, height * towerConfig.heightRatio, width * towerConfig.widthRatio);
    Object.assign(this, towerConfig);
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
    heightRatio: 1,
    widthRatio: 2,
    price: 250,
    damage: 50,
    rangeUnits: 8,
    unitsCloserToTarget: 1.5,
    attackVelocity: 300,
    texture: 'tower',
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
    texture: 'tower',
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
    texture: 'tower',
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
    texture: 'laser-tower',
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
    texture: 'light-bulb',
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
    texture: 'ice-plasma',
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
    texture: 'tower',
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
    texture: 'tower',
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
    texture: 'tower',
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
    texture: 'tower',
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
    texture: 'tower',
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
    texture: 'tower',
    description: 'Bouncing Tower',
    executeOnUpdate: (that, time) => {
      that.shotWhenTargetIsClose(time, (scene, groupBullets, x, y, target, angle, damage, range) => {      
        new Bullet(scene, groupBullets, x, y, angle, scene.unitSize / 3, scene.unitSize / 3, damage, range, Bullet.bouncer);
      });
    }
  }


}

class Bullet extends GameObject {

  constructor(scene, group, x, y, angle, height, width, damage, range, config, target) {
    super(scene, group, x, y, config.texture, height, width);
    Object.assign(this, config);
    this.startX = x;
    this.startY = y;
    this.damage = damage;
    this.range = range;
    this.angle = angle;
    this.scene = scene;
    this.target = target;
    this.setDirection(angle);
    this.afterInit && this.afterInit(this);
  }

  hit(enemy) {
    enemy.takeDamage(this.damage);
    this.afterHit && this.afterHit(this, enemy);
  }
  
  update(delta) {
    const distance = Phaser.Math.Distance.Between(this.startX, this.startY, this.x, this.y);
    if (distance > this.range) {
      this.destroy();
      this.group.remove(this);
      return;
    }

    if(this.target) {
      const angle = Phaser.Math.Angle.Between(this.body.x, this.body.y, this.target.x, this.target.y);
      this.setDirection(angle);      
    }

    this.afterUpdate && this.afterUpdate(this, delta);
  }

  setDirection(angle){
    this.setAngle(Phaser.Math.RAD_TO_DEG * angle);
    this.setVelocityX(Math.cos(angle) * this.velocity);
    this.setVelocityY(Math.sin(angle) * this.velocity);
  }

  static common = {
    texture: 'common-bullet',
    velocity: 800,
    afterHit: (that, enemy)=>{
      that.destroy();
      that.group.remove(that);
    }
  }

  static lightBulbShot = {
    texture: 'light-bulb-shot',
    velocity: 400,
    afterUpdate: (that, _delta) => {
      const amplitude = 5.5;
      that.y += amplitude * Math.sin(that.x);
      that.x += amplitude * Math.cos(that.y);
    },
    afterHit: (that, enemy)=>{
      that.destroy();
      that.group.remove(that);
    }
  }

  static icePlasmaShot = {
    texture: 'ice-plasma-shot',
    velocity: 400,
    afterUpdate: (that, delta) => {
      if (!that.lastTime) {
        that.lastTime = 1;
        that.rotation = 1;
        that.xscale = 1.1;
        that.setAlpha(0.2); 
        setTimeout(()=>{
          that.destroy();
          that.group.remove(that);
        },500);
      }

      that.lastTime += delta;
      if (that.lastTime > 10) {
        that.rotation += 1;
        that.xscale += 0.1;
        that.body.velocity.x *= 0.976
        that.body.velocity.y *= 0.976
        that.setScale(that.xscale);
        that.lastTime = 1;
      }
    },
    afterHit: (that, enemy)=>{
      if(!enemy.active) return;
      enemy.body.velocity.x *= 0.90
      enemy.body.velocity.y *= 0.90
      setTimeout(()=>{
        enemy.body.velocity.x *= 1.10
        enemy.body.velocity.y *= 1.10
      },1000);
    }
  }

  static laser = {
    texture: 'laser',
    velocity: 5000,
    afterHit: (that, enemy)=>{
      that.destroy();
      that.group.remove(that);
    }
  }

  static bomb = {
    texture: 'common-bullet',
    velocity: 400,
    afterHit: (that, enemy)=>{
        for (let i = 0; i < 360; i++) {
            const angle = Phaser.Math.DegToRad(i);        
            new Bullet(that.scene, that.group, that.x, that.y, angle, that.scene.unitSize / 3, that.scene.unitSize / 3, that.damage, that.range, Bullet.common);
        }    
        that.destroy();
        that.group.remove(that);
    }
  }

  static circleShot = {
    texture: 'circle-shot',
    velocity: 200,
    afterInit:(that) =>{
      that.setTint(0xff0000);
    },
    afterUpdate: (that, delta) => {
      if (!that.lastTime) {
        that.lastTime = 1;
      }
      that.lastTime += delta;
      if (that.lastTime > 10) {
        that.rotation += 1;
        that.lastTime = 1;
      }
    },
  }

  static teleport = {
    texture: 'common-bullet',
    velocity: 1000,
    afterHit: (that, enemy)=> {
      enemy.currentPointIndex = Utils.getRandomNumber(0, enemy.currentPointIndex);
      enemy.body.x = enemy.path[enemy.currentPointIndex].x;
      enemy.body.y = enemy.path[enemy.currentPointIndex].y;

      enemy.startMoving();
      that.destroy();
      that.group.remove(that);    
    }
  }

  static mine = {
    texture: 'common-bullet',
    velocity: 200,
    afterInit:(that) =>{
      that.setVelocityX(0);
      that.setVelocityY(0);
      setTimeout(()=>{
        that.destroy();
        that.group.remove(that);
      },500);
    },
    afterHit: (that, enemy)=>{
      that.destroy();
      that.group.remove(that);
    }
  }

  static damage = {
    texture: 'common-bullet',
    velocity: 200,
    afterHit: (that, enemy)=>{
     that.glued = true;
     that.enemy = enemy;
    },
    afterUpdate:(that, delta) =>{
      if(!that.increasedDamage && that.enemy) {
        that.enemy.increasedDamagePercent += 10;
        setTimeout(()=>{
          that.enemy.increasedDamagePercent -= 10;
          that.destroy();
          that.group.remove(that);
        },2000)
        that.increasedDamage = true;
      }

      if(that.glued && that.enemy.body) {
        that.body.x = that.enemy.body.x;
        that.body.y = that.enemy.body.y;
      }
    },
  }

  static bouncer = {
    texture: 'common-bullet',
    velocity: 1000,
    afterHit: (that, enemy) => {
      if(!that.rebounds) that.rebounds = 1;
      if(that.enemy !== enemy) {
        that.enemy = enemy;
        let nextEnemy =  Utils.getClosestEnemy(that.enemy, that.scene.enemies, that.body.x, that.body.y);
        if(!nextEnemy) {
          that.destroy();
          that.group.remove(that);
          return;
        }
        const angle = Phaser.Math.Angle.Between(that.body.x, that.body.y, nextEnemy.x, nextEnemy.y);
        that.setAngle(Phaser.Math.RAD_TO_DEG * angle);
        that.setVelocityX(Math.cos(angle) * that.velocity);
        that.setVelocityY(Math.sin(angle) * that.velocity); 
        that.rebounds++;
      } 

      if(that.rebounds == 8) {
        that.destroy();
        that.group.remove(that);
      }
    }
  }


}

class ButtonTower extends GameObject {
  target = null;
  tower = null;
  groupTowers = null;
  groupBullets = null;
  groupEnemies = null;

  constructor(scene, group, groupTowers, groupEnemies, groupBullets, x, y) {
    super(scene, group, x, y, 'button', scene.buttonTowerSize, scene.buttonTowerSize);
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

class TowerMenuContainer extends Phaser.GameObjects.Container {
  constructor(scene, x, y) {
    super(scene, x, y);

    this.scene = scene;
    this.enemies = scene.physics.add.group();
    this.particles = scene.physics.add.group();
    this.bullets = scene.physics.add.group();
    this.towers = scene.add.group();
    this.buttonTowers = scene.add.group();

    scene.physics.add.overlap(this.enemies, this.bullets, function (enemy, bullet) {
      bullet.hit(enemy);
    });

    this.offset = this.scene.unitSize*10;

    this.buttonTower = new ButtonTower(scene, scene.buttonTowers, this.towers, this.enemies, this.bullets, this.x + scene.unitSize * 3, this.y+ this.offset + scene.unitSize * 2, scene.unitSize);
    this.buttonTowers.add(this.buttonTower);
    this.add(this.buttonTower);

    // Create a description text
    this.arrTowerConfig = [Tower.commonTower, Tower.tripleShotTower, Tower.fastTower, Tower.laserTower, Tower.lightBulbTower,
                           Tower.icePlasma, Tower.bombTower, Tower.circleTower, Tower.teleportTower, Tower.mineTower, Tower.damageTower, Tower.bouncerTower];

    this.towerDesc = scene.add.text(scene.unitSize * 7, this.offset + scene.unitSize * 4, '', {
      fontSize: '24px',
      fill: '#ffffff'
    });
    this.towerDesc.setOrigin(0.5);
    this.add(this.towerDesc);

    this.towerPrice = scene.add.text(scene.unitSize * 16,this.offset + scene.unitSize * 3, '', {
      fontSize: '24px',
      fill: '#ffffff'
    });
    this.add(this.towerPrice);

    this.towerRange = scene.add.text(scene.unitSize * 16, this.offset + scene.unitSize * 1, '', {
      fontSize: '24px',
      fill: '#ffffff'
    });
    this.add(this.towerRange);

    this.towerVelocity = scene.add.text(scene.unitSize * 16, this.offset + 0, '', {
      fontSize: '24px',
      fill: '#ffffff'
    });
    this.add(this.towerVelocity);


    const buttonLeft = scene.add.sprite(scene.unitSize, this.offset + scene.unitSize * 7, 'left');
    buttonLeft.setDisplaySize(scene.unitSize * 1.5, scene.unitSize * 1.5);
    this.add(buttonLeft);

    buttonLeft.setInteractive();
    buttonLeft.on('pointerdown', () => {
      const firstElement = this.arrTowerConfig.shift();
      this.arrTowerConfig.push(firstElement);
      this.updateTower();
    });

    const buttonRight = scene.add.sprite(scene.unitSize * 15, this.offset + scene.unitSize * 7, 'right');
    buttonRight.setDisplaySize(scene.unitSize * 1.5, scene.unitSize * 1.5);
    this.add(buttonRight);

    buttonRight.setInteractive();
    buttonRight.on('pointerdown', () => {
      const lastElement = this.arrTowerConfig.pop();
      this.arrTowerConfig.unshift(lastElement);
      this.updateTower();
    });

    const buyButton = scene.add.sprite(scene.unitSize * 8, this.offset +  scene.unitSize * 7, 'buy');
    buyButton.setDisplaySize(scene.unitSize * 5, scene.unitSize * 2);
    this.add(buyButton);

    buyButton.setInteractive();
    buyButton.on('pointerdown', () => {
      this.scene.buy();
    });


    var rectangle = this.scene.add.rectangle(this.x + scene.unitSize * 8, this.y+ this.offset + scene.unitSize, scene.unitSize * 15, scene.unitSize * 8, null); // x, y, width, height, color
    var thickness = 1;
    rectangle.setStrokeStyle(thickness, 0xffffff);

    this.updateTower();
    scene.add.existing(this);

  }

  updateTower() {
    this.towerDesc.setText(this.arrTowerConfig[0].description);
    this.towerPrice.setText(`Price: ${this.arrTowerConfig[0].price}`);
    this.towerRange.setText(`Range: ${this.arrTowerConfig[0].range}`);
    this.towerVelocity.setText(`Velocity: ${this.arrTowerConfig[0].attackVelocity}`);

    this.scene.setSelectedTowerConfig(this.arrTowerConfig[0]);
    this.buttonTower.destroyTower();
    if (this.enemy != null) this.enemy.destroy();
    let x = this.x + this.scene.unitSize * 9;
    let y = this.y+ this.offset + this.scene.unitSize * 2;
    this.enemy = new Enemy(this.scene, this.enemies, this.particles, x, y, this.scene.unitSize, this.scene.unitSize, Enemy.dummyEnemy);

    this.enemy.setPath([{x:x,y:y},{x:x+this.scene.unitSize*10,y:y}]);
    this.buttonTower.createTower(false);
  }

  update(time, delta) {
    this.towers.getChildren().forEach(function (tower) {
      tower.update(time);
    });

    this.bullets.getChildren().forEach(function (bullet) {
      bullet.update(delta);
    });
  }

}

class SellPopUp extends Phaser.GameObjects.Container {
  constructor(scene) {
    super(scene, -100, -100);
    this.scene = scene;

    // Create a description text
    this.description = scene.add.text(-100, -50, '', {
      fontSize: '24px',
      fill: '#ffffff'
    });
    this.add(this.description);

    // Create a button
    const button = scene.add.sprite(0, 50, 'sell'); // Replace 'button' with your button texture key
    this.add(button);


    button.setInteractive();
    button.on('pointerdown', () => {
      this.setOutSide();
      this.scene.changeGold(this.tower.price);
      this.tower.destroy()
    });
    scene.add.existing(this);
  }

  setTower(tower) {
    setTimeout(() => {
      this.setOutSide()
    }, 1500);
    this.tower = tower;
    this.description.setText(tower.description);
    this.x = this.tower.x;
    this.y = this.tower.y;
  }

  setOutSide() {
    this.x = -100;
    this.y = -100;
  }
}

class EnemyGenerator {
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
      let enemy = new Enemy(this.scene, this.groupEnemies, this.groupParticles, 0, 0, this.scene.unitSize, this.scene.unitSize, Enemy.commonEnemy);
      enemy.setPath(this.paths[Utils.getRandomNumber(0,1)]);
      this.lastEnemyCreated = time;
      this.counter++;
    }
  }
}

class MapGenerator {

  static generateMap(scene, rows, cols) {

    if (rows % 2 == 0) {
      throw "rows should be odd";
    }

    var paths = [[], []];

    const gridSize = { cols: cols, rows: rows };

    // Loop through each buttonTower in the grid
    for (let row = 1; row < gridSize.rows; row++) {
      for (let col = 1; col < gridSize.cols; col++) {
        const x = col * scene.buttonTowerSize;
        const y = row * scene.buttonTowerSize;

        let buttonTower = new ButtonTower(scene, scene.buttonTowers, scene.towers, scene.enemies, scene.bullets, x, y);
        scene.buttonTowers.add(buttonTower);
      }
    }

    let buttonTower0 = scene.buttonTowers.getChildren()[0];


    paths.forEach((path, index) => {

      path.push({ x: (scene.buttonTowerSize * (cols - 1)) + buttonTower0.x + 1, y: (scene.buttonTowerSize / 2 * (rows)) + buttonTower0.y - (scene.buttonTowerSize / 2) + 1 });

      // el pasillo antes de la torre
      for (let i = 0; i <= 5; i++) {
        path.push({ x: path[i].x - scene.buttonTowerSize, y: path[i].y });
      }

      index == 0 && scene.mainTowers.add(new MainTower(scene, scene.mainTowers, path[1].x, path[1].y, scene.unitSize, scene.unitSize));

      const LEFT = "LEFT", UP = "UP", DOWN = "DOWN";
      const directions = [LEFT, UP, DOWN];
      const notAllowedPaths = [`${DOWN}-${LEFT}-${UP}`, `${UP}-${LEFT}-${DOWN}`,
      `${LEFT}-${DOWN}-${UP}`, `${LEFT}-${UP}-${DOWN}`,
      `${UP}-${DOWN}-${LEFT}`, `${DOWN}-${UP}-${LEFT}`,
      `${UP}-${DOWN}-${DOWN}`, `${UP}-${DOWN}-${UP}`,
      `${DOWN}-${UP}-${DOWN}`, `${DOWN}-${UP}-${UP}`,
      `${DOWN}-${DOWN}-${UP}`, `${DOWN}-${UP}-${UP}`,
      `${UP}-${UP}-${DOWN}`, `${UP}-${DOWN}-${DOWN}`];


      let steps = `${LEFT}-${LEFT}`;
      let stepsAux = steps;

      let leftF = ({ x, y }) => ({ x: x - scene.buttonTowerSize, y });
      let upF = ({ x, y }) => ({ x, y: y - scene.buttonTowerSize });
      let downF = ({ x, y }) => ({ x, y: y + scene.buttonTowerSize });


      let pathConfigArr = [{ direction: LEFT, funct: leftF }, { direction: UP, funct: upF }, { direction: DOWN, funct: downF }];
      while (path[path.length - 1].x > buttonTower0.x) {
        let direction = directions[Math.floor(Math.random() * directions.length)]
        let arrF = pathConfigArr.filter(path => path.direction == direction);
        let nextDirectionConfig = arrF[Math.floor(Math.random() * arrF.length)];

        stepsAux += `-${nextDirectionConfig.direction}`;
        if (stepsAux.split('-').length > 2) {
          let stepArr = stepsAux.split('-')
          let last3Steps = stepArr.splice(-3).join('-');

          if (notAllowedPaths.some(notAllowedPath => notAllowedPath == last3Steps)) {
            stepsAux = steps;
            continue;
          }
          else {
            let { x, y } = nextDirectionConfig.funct({ x: path[path.length - 1].x, y: path[path.length - 1].y });
            if (y > buttonTower0.y && y < (buttonTower0.y * rows)) {
              path.push({ x, y });
              direction = nextDirectionConfig.direction;
              steps = stepsAux;
            }

          }
        }
      }


      // Remove sprites that touch the specified points
      path.forEach((point) => {
        scene.buttonTowers.children.each((buttonTower) => {
          if (point.x >= buttonTower.x && point.x <= buttonTower.x + scene.buttonTowerSize && point.y >= buttonTower.y && point.y <= buttonTower.y + scene.buttonTowerSize) {
            scene.buttonTowers.remove(buttonTower);
            buttonTower.destroy();
          }
        });
      });

      // doing it "flat"
      path = path.reverse();
      let flatPath = [];
      flatPath.push(path[0]);
      for (var i = 1; i <= path.length - 1; i++) {
        if (i == path.length - 1) {
          flatPath.push(path[i]);
          break;
        }
        if (path[i].x !== flatPath[flatPath.length - 1].x && path[i].y !== flatPath[flatPath.length - 1].y) {
          flatPath.push(path[i - 1]);
        }
      }
      path = flatPath;

    });

    return paths;
  }
}

class Game extends Phaser.Scene {
  constructor() {
    super({ key: 'Game' });

    this.unitSize = 20;
    this.buttonTowerSize = this.unitSize * 2;
    this.grid = {
      rows: 11,
      cols: 55,
    };

    this.mainTowers = null;
    this.enemies = null;
    this.bullets = null;
    this.particles = null;
    this.towers = null;
    this.buttonTowers = null;
    this.enemyGenerator = null;
    this.isDragging = false;
    this.lastPointerPosition = { x: 0, y: 0 };
    this.gold = 1000;
    this.selectedTowerConfig = null;
    this.buying = false;
  }

  preload() {
    this.load.image('up', 'assets/up.png');
    this.load.image('left', 'assets/left.png');
    this.load.image('right', 'assets/right.png');
    this.load.image('down', 'assets/down.png');
    this.load.image('buy', 'assets/buy.png');
    this.load.image('sell', 'assets/sell.png');

    this.load.image('main-tower', 'assets/main-tower.png');

    this.load.image('enemy', 'assets/enemy-6.png');
    this.load.image('tower', 'assets/tower-2.png');
    this.load.image('particle', 'assets/particle.png');
    this.load.image('laser-tower', 'assets/laser-tower.png');
    this.load.image('light-bulb', 'assets/light-bulb.png');
    this.load.image('ice-plasma-shot', 'assets/ice-plasma-shot.png');
    this.load.image('circle-shot', 'assets/circle-shot.png');

    this.load.image('laser', 'assets/laser.png');
    this.load.image('common-bullet', 'assets/common-bullet.png');
    this.load.image('light-bulb-shot', 'assets/light-bulb-shot.png');
    this.load.image('ice-plasma', 'assets/ice-plasma.png');

  }

  create() {

    this.mainTowers = this.physics.add.group();
    this.enemies = this.physics.add.group();
    this.bullets = this.physics.add.group();
    this.particles = this.physics.add.group();
    this.towers = this.add.group();
    this.buttonTowers = this.add.group();

    this.goldLabel = this.add.text(500, 690, `Gold: ${this.gold}`, {
      font: '24px CustomFont',
      fill: '#777777',
    });
    this.lifeLabel = this.add.text(500, 650, 'Life:', {
      font: '24px CustomFont',
      fill: '#777777',
    });


    let paths = MapGenerator.generateMap(
      this,
      this.grid.rows,
      this.grid.cols
    );

    this.towerMenuContainer = new TowerMenuContainer(this, 0, 350);
    this.sellPopUp = new SellPopUp(this);
    this.enemyGenerator = new EnemyGenerator(this, paths, this.enemies, this.particles);

    this.physics.add.overlap(this.enemies, this.bullets, function (enemy, bullet) {
      bullet.hit(enemy);
    });

    this.physics.add.overlap(this.mainTowers, this.enemies, function (
      mainTower,
      enemy
    ) {
      enemy.destroy();
      mainTower.health--;
    });

    // Camera
    this.horizontalCamera = this.cameras.add(0, 0, config.width, this.buttonTowerSize * this.grid.rows);
    this.cameras.main.setScroll(0, this.buttonTowerSize * this.grid.rows)
    this.cameras.main.setSize(800, 500);
    this.cameras.main.setPosition(0, this.buttonTowerSize * this.grid.rows);
    this.input.on('pointerdown', this.pointerDown, this);
    this.input.on('pointermove', this.pointerMove, this);
    this.input.on('pointerup', this.pointerUp, this);
    // this.input.on('wheel', this.mouseWheel, this);
  }

  update(time, delta) {
    this.mainTowers.getChildren().forEach(function (mainTower) {
      this.lifeLabel.setText(`Life: ${mainTower.health}`);
      if (mainTower.health === 0) {
        // Game over logic here
      }
    }, this);

    this.towers.getChildren().forEach(function (tower) {
      tower.update(time);
    });

    this.bullets.getChildren().forEach(function (bullet) {
      bullet.update(delta);
    });

    this.enemies.getChildren().forEach(function (enemy) {
      enemy.update();
    });

    this.enemyGenerator.update(time);
    this.towerMenuContainer.update(time, delta);

  }

  changeGold(gold) {
    this.gold += gold;
    this.goldLabel.setText(`Gold: ${this.gold}`);
  }

  getGold() {
    return this.gold;
  }

  setSelectedTowerConfig(towerConfig) {
    this.selectedTowerConfig = towerConfig;
  }

  getSelectedTowerConfig() {
    return this.selectedTowerConfig;
  }

  isBuying() {
    return this.buying;
  }

  afterPlaceTower() {
    return this.buying = false;
  }

  buy() {
    if (this.selectedTowerConfig && this.gold > this.selectedTowerConfig.price && !this.buying) {
      this.changeGold(-this.selectedTowerConfig.price);
      this.buying = true;
    }
  }

  // Camera things
  pointerDown(pointer) {
    this.isDragging = true;
    this.lastPointerPosition = { x: pointer.x, y: pointer.y };
  }

  pointerMove(pointer) {
    if (this.isDragging) {
      const deltaX = this.lastPointerPosition.x - pointer.x;
      // const deltaY = this.lastPointerPosition.y - pointer.y;

      let aux = this.horizontalCamera.scrollX + deltaX;

      if (
        aux > 0 &&
        aux < this.grid.cols * this.buttonTowerSize - config.width
      ) {
        this.horizontalCamera.scrollX += deltaX;
        // this.cameras.main.scrollY += deltaY;
      }

      this.lastPointerPosition = { x: pointer.x, y: pointer.y };
    }
  }

  pointerUp() {
    this.isDragging = false;
  }

}

var config = {
  type: Phaser.AUTO,
  width: 800,
  height: 800,
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 0 },
      debug: false,
    },
  },
  scene: Game, // Use the custom Game class here
};

var game = new Phaser.Game(config);
