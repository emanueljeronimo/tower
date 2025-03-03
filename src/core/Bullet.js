import { GameObject } from './GameObject.js';

export class Bullet extends GameObject {
  constructor(scene, group, x, y, angle, height, width, damage, range, config, target) {
    super(scene, group, x, y, null, height, width);
    Object.assign(this, config);

    this.startX = x;
    this.startY = y;
    this.damage = damage;
    this.range = range;
    this.angle = angle;
    this.scene = scene;
    this.target = target;

    this.setTexture(config.texture);
    this.setDirection(angle);
    this.afterInit && this.afterInit(this);
  }

  hit(enemy) {
    enemy.takeDamage(this.damage);
    this.afterHit && this.afterHit(this, enemy);
    this.destroy();
    this.group.remove(this);
  }

  update(delta) {
    const distance = Phaser.Math.Distance.Between(this.startX, this.startY, this.x, this.y);
    if (distance > this.range) {
      this.destroy();
      this.group.remove(this);
      return;
    }

    if (this.target && this.target.health > 0) {
      const angle = Phaser.Math.Angle.Between(this.body.x, this.body.y, this.target.x, this.target.y);
      this.setDirection(angle);
    }

    this.afterUpdate && this.afterUpdate(this, delta);
  }

  setDirection(angle) {
    this.setAngle(Phaser.Math.RAD_TO_DEG * angle);
    this.setVelocityX(Math.cos(angle) * this.velocity);
    this.setVelocityY(Math.sin(angle) * this.velocity);
  }

  static initTextures(scene) {
    // Crear un lienzo HTML5
    const canvasBullet = document.createElement('canvas');
    const radiusBullet  = 10; // Radio para una forma redondeada
    canvasBullet.width = radiusBullet  * 2; // Doble del radio para la textura
    canvasBullet.height = radiusBullet  * 2; // Doble del radio para la textura
    const contextBullet  = canvasBullet.getContext('2d');

    // Crear un degradado de color amarillo a naranja
    const gradientBullet = contextBullet.createLinearGradient(0, 0, 0, 30);
    gradientBullet.addColorStop(0, '#FFFF00'); // Amarillo
    gradientBullet.addColorStop(1, '#FF5500'); // Naranja

    // Rellenar el círculo con el degradado
    contextBullet.fillStyle = gradientBullet;
    contextBullet.beginPath();
    contextBullet.arc(radiusBullet, radiusBullet, radiusBullet, 0, Math.PI * 2, false); // Círculo
    contextBullet.fill();

    // Crear una textura a partir del lienzo
    scene.textures.addCanvas('bullet-texture', canvasBullet);
    

    const canvasLaser = document.createElement('canvas');
    const widthLaser = 4;
    const heightLaser = 50;
    canvasLaser.width = widthLaser;
    canvasLaser.height = heightLaser;
    const contextLaser = canvasLaser.getContext('2d');

    const gradientLaser = contextLaser.createLinearGradient(0, 0, 0, heightLaser);
    gradientLaser.addColorStop(0, '#FF0000');
    gradientLaser.addColorStop(0.5, '#FF6600');
    gradientLaser.addColorStop(1, '#FFFF00');

    contextLaser.fillStyle = gradientLaser;
    contextLaser.fillRect(0, 0, widthLaser, heightLaser);

    scene.textures.addCanvas('laser-texture', canvasLaser);
  }

  static common = {
    texture: 'bullet-texture',
    velocity: 800,

    afterInit: (that) => {
      const muzzleFlash = that.scene.add.particles(that.x, that.y, 'bullet-texture', {
        speed: { min: 200, max: 400 },
        angle: that.angle + 180, // Opuesto al disparo
        lifespan: 100, // Desaparece rápido
        scale: { start: 0.5, end: 0 },
        tint: [0xffff00, 0xff5500], // Amarillo y naranja
        blendMode: 'ADD'
      });
      that.scene.time.delayedCall(100, () => muzzleFlash.destroy());
    },

    afterHit: (that, enemy) => {
      const impactParticles = that.scene.add.particles(that.x, that.y, 'bullet-texture', {
        speed: { min: 50, max: 200 },
        angle: { min: 0, max: 360 },
        lifespan: 150, // Se desvanecen rápido
        scale: { start: 0.4, end: 0 },
        tint: [0xffff00, 0xff5500], // Amarillo y naranja
        blendMode: 'ADD'
      });

      that.scene.time.delayedCall(150, () => impactParticles.destroy());
      that.destroy();
      that.group.remove(that);
    }
  };

  static laser = {
    texture: 'laser-texture',
    velocity: 50,
    piercing: false, // No atraviesa enemigos

    afterInit: (that) => {
      const beamEffect = that.scene.add.particles(that.x, that.y, 'laser-texture', {
        speed: { min: 1000, max: 1000 },
        angle: that.angle,
        lifespan: 100,
        scale: { start: 1, end: 0.5 },
        tint: [0xff0000, 0xff6600, 0xffff00],
        blendMode: 'ADD'
      });

      that.scene.time.delayedCall(100, () => beamEffect.destroy());
    },

    afterHit: (that, enemy) => {
      const impactParticles = that.scene.add.particles(that.x, that.y, 'laser-texture', {
        speed: { min: 50, max: 200 },
        angle: { min: 0, max: 360 },
        lifespan: 150,
        scale: { start: 0.6, end: 0 },
        tint: [0xff0000, 0xff6600, 0xffff00],
        blendMode: 'ADD'
      });

      that.scene.time.delayedCall(150, () => impactParticles.destroy());
    }
  };
}


/*import { GameObject } from './GameObject.js';

export class Bullet extends GameObject {
  constructor(scene, group, x, y, angle, height, width, damage, range, config, target) {
    super(scene, group, x, y, null, height, width);
    Object.assign(this, config);

    this.startX = x;
    this.startY = y;
    this.damage = damage;
    this.range = range;
    this.angle = angle;
    this.scene = scene;
    this.target = target;

    // Generar la textura del disparo si aún no existe
    this.createBulletTexture(scene);
    this.setTexture('bullet-texture');
    this.setSize(10, 30);

    this.setDirection(angle);

    // Crear efecto de disparo (chispas al salir)
    this.createMuzzleFlash();

    this.afterInit && this.afterInit(this);
  }

  createBulletTexture(scene) {
    if (scene.textures.exists('bullet-texture')) return;

    // Crear un lienzo HTML5
    const canvas = document.createElement('canvas');
    canvas.width = 10;
    canvas.height = 30;
    const context = canvas.getContext('2d');

    // Crear un degradado de color amarillo a naranja
    const gradient = context.createLinearGradient(0, 0, 0, 30);
    gradient.addColorStop(0, '#FFFF00'); // Amarillo
    gradient.addColorStop(1, '#FF5500'); // Naranja

    // Rellenar el rectángulo con el degradado
    context.fillStyle = gradient;
    context.fillRect(0, 0, 10, 30);

    // Crear una textura a partir del lienzo
    scene.textures.addCanvas('bullet-texture', canvas);
  }

  createMuzzleFlash() {
    const muzzleFlash = this.scene.add.particles(this.x, this.y, 'bullet-texture', {
      speed: { min: 200, max: 400 },
      angle: this.angle + 180, // Opuesto al disparo
      lifespan: 100, // Desaparece rápido
      scale: { start: 0.5, end: 0 },
      tint: [0xffff00, 0xff5500], // Amarillo y naranja
      blendMode: 'ADD'
    });

    // Eliminar el efecto después de su duración
    this.scene.time.delayedCall(100, () => muzzleFlash.destroy());
  }

  hit(enemy) {
    enemy.takeDamage(this.damage);
    
    // Partículas de impacto al colisionar
    this.createImpactEffect();

    this.afterHit && this.afterHit(this, enemy);
    this.destroy();
    this.group.remove(this);
  }

  createImpactEffect() {
    const impactParticles = this.scene.add.particles(this.x, this.y, 'bullet-texture', {
      speed: { min: 50, max: 200 },
      angle: { min: 0, max: 360 },
      lifespan: 150, // Se desvanecen rápido
      scale: { start: 0.4, end: 0 },
      tint: [0xffff00, 0xff5500], // Amarillo y naranja
      blendMode: 'ADD'
    });

    // Eliminar el efecto después de su duración
    this.scene.time.delayedCall(150, () => impactParticles.destroy());
  }

  update(delta) {
    const distance = Phaser.Math.Distance.Between(this.startX, this.startY, this.x, this.y);
    if (distance > this.range) {
      this.destroy();
      this.group.remove(this);
      return;
    }

    if (this.target && this.target.health > 0) {
      const angle = Phaser.Math.Angle.Between(this.body.x, this.body.y, this.target.x, this.target.y);
      this.setDirection(angle);
    }

    this.afterUpdate && this.afterUpdate(this, delta);
  }

  setDirection(angle) {
    this.setAngle(Phaser.Math.RAD_TO_DEG * angle);
    this.setVelocityX(Math.cos(angle) * this.velocity);
    this.setVelocityY(Math.sin(angle) * this.velocity);
  }

  static common = {
    velocity: 800,
    afterHit: (that, enemy) => {
      that.destroy();
      that.group.remove(that);
    }
  };
}
*/






/*import { GameObject } from './GameObject.js';

export class Bullet extends GameObject {
  constructor(scene, group, x, y, angle, height, width, damage, range, config, target) {
    super(scene, group, x, y, null, height, width);
    Object.assign(this, config);

    this.startX = x;
    this.startY = y;
    this.damage = damage;
    this.range = range;
    this.angle = angle;
    this.scene = scene;
    this.target = target;

    // Generar la textura si aún no existe
    this.createBulletGraphics(scene);

    // Aplicar la textura generada
    this.setTexture('bullet-texture');
    this.setSize(10, 30);

    this.setDirection(angle);
    this.afterInit && this.afterInit(this);
  }

  createBulletGraphics(scene) {
    // Evitar recrear la textura si ya existe
    if (scene.textures.exists('bullet-texture')) return;

    // Crear un gráfico temporal
    const graphics = scene.add.graphics();

    // Dibujar el disparo (forma alargada con gradiente amarillo-naranja)
    graphics.fillStyle(0xffaa00, 1); // Amarillo anaranjado
    graphics.fillRoundedRect(0, 0, 10, 30, 5); // Rectángulo con esquinas redondeadas

    // Generar la textura y eliminar el gráfico temporal
    graphics.generateTexture('bullet-texture', 10, 30);
    graphics.destroy();
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

    if (this.target && this.target.health > 0) {
      const angle = Phaser.Math.Angle.Between(this.body.x, this.body.y, this.target.x, this.target.y);
      this.setDirection(angle);
    }

    this.afterUpdate && this.afterUpdate(this, delta);
  }

  setDirection(angle) {
    this.setAngle(Phaser.Math.RAD_TO_DEG * angle);
    this.setVelocityX(Math.cos(angle) * this.velocity);
    this.setVelocityY(Math.sin(angle) * this.velocity);
  }

  static common = {
    velocity: 800,
    afterHit: (that, enemy) => {
      that.destroy();
      that.group.remove(that);
    }
  };
}*/



/*import { Utils } from './Utils.js'
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
}*/