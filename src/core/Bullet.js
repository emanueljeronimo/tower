import { Utils } from './Utils.js'
import { GameObject } from './GameObject.js'

export class Bullet extends GameObject {

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

    if(this.target && this.target.health > 0) {
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