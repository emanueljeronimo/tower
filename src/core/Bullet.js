import { GameObject } from './GameObject.js';
import { Utils } from './Utils.js';

export class Bullet extends GameObject {
  constructor(scene, group, x, y, config, target, range, angle) {
    super(scene, group, x, y, config.texture, config.heightUnits * scene.unitSize, config.widthUnits * scene.unitSize);
    this.target = target;
    Object.assign(this, config);

    if (this.target) {
      this.angle = Phaser.Math.Angle.Between(this.getCenter().x, this.getCenter().y, this.target.getCenter().x, this.target.getCenter().y);
      this.setDirection(this.angle);
    } else if (angle) {
      this.setDirection(angle);
    }

    this.startX = x;
    this.startY = y;
    this.range = range;
    this.scene = scene;
    this.visible = false;   
  }

  hit(enemy) {
    enemy.takeDamage(this.damage);
    this.afterHit && this.afterHit(this, enemy);
    if (this.destroyAfterHit) {
      this.destroy();
      this.group.remove(this);
    }
  }

  update(delta) {
    const distance = Phaser.Math.Distance.Between(this.startX, this.startY, this.getCenter().x, this.getCenter().y);
   
    if (distance > this.unitsToDestroy * this.scene.unitSize) {
      this.destroy();
      this.group.remove(this);
      return;
    }

    if (!this.visible && distance > this.unitsToSetVisible * this.scene.unitSize){
      this.visible = true;
      this.afterVisible && this.afterVisible(this);
    }

    if (this.target && this.target.health > 0 && this.follow) {
      const angle = Phaser.Math.Angle.Between(this.getCenter().x, this.getCenter().y, this.target.getCenter().x, this.target.getCenter().y);
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
    // Textura de bala original
    const canvasBullet = document.createElement('canvas');
    const radiusBullet  = scene.unitSize; 
    canvasBullet.width = radiusBullet  * 2;
    canvasBullet.height = radiusBullet  * 2;
    const contextBullet  = canvasBullet.getContext('2d');

    const gradientBullet = contextBullet.createLinearGradient(0, 0, 0, 30);
    gradientBullet.addColorStop(0, '#FFFF00');
    gradientBullet.addColorStop(1, '#FF5500');

    contextBullet.fillStyle = gradientBullet;
    contextBullet.beginPath();
    contextBullet.arc(radiusBullet, radiusBullet, radiusBullet, 0, Math.PI * 2, false);
    contextBullet.fill();

    scene.textures.addCanvas('bullet-texture', canvasBullet);  

    // Nueva textura para el orbe de energía
    const canvasEnergyOrb = document.createElement('canvas');
    const sizeOrb = scene.unitSize * 1.2;
    canvasEnergyOrb.width = sizeOrb;
    canvasEnergyOrb.height = sizeOrb;
    const contextOrb = canvasEnergyOrb.getContext('2d');

    // Crear un degradado radial para el orbe
    const gradientOrb = contextOrb.createRadialGradient(
      sizeOrb/2, sizeOrb/2, 0,
      sizeOrb/2, sizeOrb/2, sizeOrb/2
    );
    
    // Colores vibrantes para el centro del orbe
    gradientOrb.addColorStop(0, '#FF00FF');    // Magenta brillante en el centro
    gradientOrb.addColorStop(0.3, '#8A2BE2');  // Azul violeta
    gradientOrb.addColorStop(0.6, '#4B0082');  // Índigo
    gradientOrb.addColorStop(1, '#000066');    // Azul oscuro en el borde

    contextOrb.fillStyle = gradientOrb;
    contextOrb.beginPath();
    contextOrb.arc(sizeOrb/2, sizeOrb/2, sizeOrb/2, 0, Math.PI * 2, false);
    contextOrb.fill();

    // Agregar un brillo alrededor
    contextOrb.globalCompositeOperation = 'lighter';
    const glowGradient = contextOrb.createRadialGradient(
      sizeOrb/2, sizeOrb/2, sizeOrb*0.4,
      sizeOrb/2, sizeOrb/2, sizeOrb*0.7
    );
    glowGradient.addColorStop(0, 'rgba(255, 0, 255, 0.5)');
    glowGradient.addColorStop(1, 'rgba(255, 0, 255, 0)');
    
    contextOrb.fillStyle = glowGradient;
    contextOrb.beginPath();
    contextOrb.arc(sizeOrb/2, sizeOrb/2, sizeOrb/2, 0, Math.PI * 2, false);
    contextOrb.fill();

    scene.textures.addCanvas('energy-orb-texture', canvasEnergyOrb);

    // Textura para partículas del orbe
    const canvasOrbParticle = document.createElement('canvas');
    const particleSize = scene.unitSize * 0.7; 
    canvasOrbParticle.width = particleSize;
    canvasOrbParticle.height = particleSize;
    const ctxParticle = canvasOrbParticle.getContext('2d');

    const gradientParticle = ctxParticle.createRadialGradient(
      particleSize/2, particleSize/2, 0,
      particleSize/2, particleSize/2, particleSize/2
    );
    
    gradientParticle.addColorStop(0, 'rgba(255, 255, 255, 1)');
    gradientParticle.addColorStop(0.5, 'rgba(230, 0, 255, 0.7)');
    gradientParticle.addColorStop(1, 'rgba(100, 0, 255, 0)');

    ctxParticle.fillStyle = gradientParticle;
    ctxParticle.beginPath();
    ctxParticle.arc(particleSize/2, particleSize/2, particleSize/2, 0, Math.PI * 2);
    ctxParticle.fill();

    scene.textures.addCanvas('orb-particle-texture', canvasOrbParticle);

    // Textura para chispas de impacto
    const canvasSparkle = document.createElement('canvas');
    const sparkleSize = scene.unitSize; 
    canvasSparkle.width = sparkleSize;
    canvasSparkle.height = sparkleSize;
    const ctxSparkle = canvasSparkle.getContext('2d');

    const gradientSparkle = ctxSparkle.createRadialGradient(
      sparkleSize/2, sparkleSize/2, 0,
      sparkleSize/2, sparkleSize/2, sparkleSize/2
    );
    gradientSparkle.addColorStop(0, 'rgba(255, 255, 255, 1)');
    gradientSparkle.addColorStop(0.4, 'rgba(255, 255, 200, 0.8)');
    gradientSparkle.addColorStop(1, 'rgba(255, 255, 200, 0)');

    ctxSparkle.fillStyle = gradientSparkle;
    ctxSparkle.beginPath();
    ctxSparkle.arc(sparkleSize/2, sparkleSize/2, sparkleSize/2, 0, Math.PI * 2);
    ctxSparkle.fill();

    scene.textures.addCanvas('sparkle-texture', canvasSparkle);

    const bouncer = scene.add.graphics();
    // Ejemplo: un cuadrado con borde y gradiente
    bouncer.lineStyle(6, 0x00ffff, 1); // Color neón, sin relleno
    bouncer.strokeRect(0, 0, scene.unitSize, scene.unitSize);
    bouncer.generateTexture('bouncer-texture', 32, 32);
    bouncer.destroy();

    const canvasLaser = document.createElement('canvas');
    const width = scene.unitSize * 1.2;
    const height = scene.unitSize * 0.15;
    
    canvasLaser.width = width;
    canvasLaser.height = height;
    
    const ctxLaser = canvasLaser.getContext('2d');
    
    // Línea blanca con leve desenfoque central
    const gradient = ctxLaser.createLinearGradient(0, height / 2, width, height / 2);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 0)');
    gradient.addColorStop(0.3, 'rgba(255, 255, 255, 0.9)');
    gradient.addColorStop(0.7, 'rgba(255, 255, 255, 0.9)');
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    
    ctxLaser.fillStyle = gradient;
    ctxLaser.fillRect(0, 0, width, height);
    
    scene.textures.addCanvas('void-sphere-texture', canvasLaser);
    
   //scene.textures.addCanvas('void-sphere-texture', canvasFloatCore);
   

  

  }

  static common = {
    damage: 1,
    heightUnits: 1,
    widthUnits: 1,
    texture: 'bullet-texture',
    velocity: 800,
    follow: true,
    destroyAfterHit: true,
    unitsToSetVisible: 1,
    unitsToDestroy: 16,

    afterVisible: (that) => {
      const muzzleFlash = that.scene.add.particles(that.x, that.y, 'bullet-texture', {
        speed: { min: 200, max: 400 },
        lifespan: 100,
        scale: { start: 0.5, end: 0 },
        tint: [0xffff00, 0xff5500],
        blendMode: 'ADD'
      });
      that.scene.time.delayedCall(100, () => muzzleFlash.destroy());
    },

    afterHit: (that, enemy) => {
      const impactParticles = that.scene.add.particles(that.x, that.y, 'bullet-texture', {
        speed: { min: 50, max: 200 },
        angle: { min: 0, max: 360 },
        lifespan: 150,
        scale: { start: 0.4, end: 0 },
        tint: [0xffff00, 0xff5500],
        blendMode: 'ADD'
      });

      that.scene.time.delayedCall(350, () => impactParticles.destroy());
      that.destroy();
      that.group.remove(that);
    }
  };

  static energyOrb = {
    damage: 1,
    heightUnits: 1.2,
    widthUnits: 1.2,
    texture: 'energy-orb-texture',
    velocity: 1500,
    follow: false,
    destroyAfterHit: false,
    unitsToSetVisible: 1,
    unitsToDestroy: 16,
    
    afterUpdate: (that, delta) => {
      // Hacer que el orbe pulse ligeramente
      const pulseFactor = 0.1;
      const pulseSpeed = 0.003;
      that.scaleX = 1 + Math.sin(that.scene.time.now * pulseSpeed) * pulseFactor;
      that.scaleY = that.scaleX;
      
      // Rotar el orbe lentamente para efecto visual
      that.angle += 1;
    },

    afterVisible: (that) => {
      // Estela principal del orbe (colores vibrantes)
      that.trailEmitter = that.scene.add.particles(0, 0, 'orb-particle-texture', {
        follow: that,
        followOffset: { x: 0, y: 0 },
        frequency: 15,
        quantity: 2,
        scale: { start: 0.8, end: 0.2 },
        alpha: { start: 0.8, end: 0 },
        lifespan: 400,
        speed: { min: 10, max: 30 },
        angle: { min: 0, max: 360 },
        blendMode: 'ADD',
        tint: [0xFF00FF, 0x8A2BE2, 0x4B0082, 0xB31BE2, 0xC71585],
        rotate: { min: -180, max: 180 }
      });
      
      // Partículas de energía dispersas
      that.sparkleEmitter = that.scene.add.particles(0, 0, 'sparkle-texture', {
        follow: that,
        followOffset: { x: 0, y: 0 },
        frequency: 40,
        quantity: 1,
        scale: { start: 0.3, end: 0 },
        alpha: { start: 0.7, end: 0 },
        lifespan: 300,
        speed: { min: 60, max: 120 },
        angle: { min: 0, max: 360 },
        blendMode: 'ADD',
        tint: [0xFFFFFF, 0xFF00FF, 0xEE82EE]
      });
      
      // Efecto de aura luminosa
      that.auraEmitter = that.scene.add.particles(0, 0, 'orb-particle-texture', {
        follow: that,
        quantity: 1,
        frequency: 60,
        scale: { start: 1.5, end: 0.3 },
        alpha: { start: 0.2, end: 0 },
        lifespan: 200,
        blendMode: 'ADD',
        tint: 0x9400D3
      });
      
      // Limpiar cuando se destruya el orbe
      that.on('destroy', () => {
        if (that.trailEmitter) that.trailEmitter.destroy();
        if (that.sparkleEmitter) that.sparkleEmitter.destroy();
        if (that.auraEmitter) that.auraEmitter.destroy();
      });
    },

    afterHit: (that, enemy) => {
      // Explosión de energía en el impacto
      const impactBurst = that.scene.add.particles(that.x, that.y, 'orb-particle-texture', {
        speed: { min: 100, max: 250 },
        angle: { min: 0, max: 360 },
        scale: { start: 0.8, end: 0.1 },
        alpha: { start: 0.8, end: 0 },
        lifespan: 350,
        blendMode: 'ADD',
        tint: [0xFF00FF, 0x8A2BE2, 0x9400D3, 0xB31BE2],
        quantity: 20,
        emitting: false
      });
      
      // Ondas de energía que se expanden
      const energyWave = that.scene.add.particles(that.x, that.y, 'orb-particle-texture', {
        speed: { min: 50, max: 150 },
        scale: { start: 0.1, end: 2 },
        alpha: { start: 0.7, end: 0 },
        lifespan: 400,
        blendMode: 'ADD',
        tint: 0xC71585,
        quantity: 5,
        emitting: false
      });
      
      // Chispas brillantes
      const sparkles = that.scene.add.particles(that.x, that.y, 'sparkle-texture', {
        speed: { min: 150, max: 300 },
        angle: { min: 0, max: 360 },
        scale: { start: 0.3, end: 0 },
        alpha: { start: 1, end: 0 },
        lifespan: 350,
        blendMode: 'ADD',
        tint: [0xFFFFFF, 0xFF00FF],
        quantity: 15,
        emitting: false
      });
      
      // Emitir todas las partículas a la vez para el efecto de explosión
      impactBurst.explode();
      energyWave.explode();
      sparkles.explode();
      
      // Limpieza
      that.scene.time.delayedCall(400, () => {
        impactBurst.destroy();
        energyWave.destroy();
        sparkles.destroy();
      });
    }
  };

  static bouncer = {

    damage: 1,
    heightUnits: 1,
    widthUnits: 1,
    texture: 'bouncer-texture',
    velocity: 2300,
    follow: true,
    destroyAfterHit: false,
    unitsToSetVisible: 1,
    unitsToDestroy: 15,

    afterVisible: (that) => {
      that.setAngularVelocity(1500);
      const particles = that.scene.add.particles(0, 0, 'bouncer-texture', {
        lifespan: 300,
        speed: { min: -20, max: 20 },
        scale: { start: 0.3, end: 0 },
        alpha: { start: 0.3, end: 0 },
        frequency: 100,
        quantity: 1,
        follow: that,
        tint: [0xffaa00, 0xffff00]
      });
      that.once('destroy', () => particles.destroy());
    },

    afterHit: (that, enemy) => {

      const burst = that.scene.add.particles(that.x, that.y, 'bouncer-texture', {
        speed: { min: 50, max: 120 },
        angle: { min: 0, max: 360 },
        scale: { start: 0.8, end: 0.2 },
        alpha: { start: 1, end: 0 },
        lifespan: 600,
        blendMode: 'SCREEN',
        tint: [0xFFA500, 0xFF4500, 0xFFD700], // naranja, rojo fuego, dorado
        rotate: { min: -90, max: 90 },
        quantity: 8,
        emitting: false
      });
      
      burst.explode();
      
      that.scene.time.delayedCall(800, () => {
        burst.destroy();
      });
  
      that.follow = false;
      if(!that.rebounds) that.rebounds = 1;
      if(that.enemy !== enemy) {
        that.enemy = enemy;
        let nextEnemy =  Utils.getClosestEnemy(that.enemy, that.scene.enemies, that.x, that.y);
        if(!nextEnemy) {
          that.destroy();
          that.group.remove(that);
          return;
        } else {
          const distance = Phaser.Math.Distance.Between(that.startX, that.startY, nextEnemy.getCenter().x, nextEnemy.getCenter().y);
          if (distance > that.unitsToDestroy * that.scene.unitSize) {
            that.destroy();
            that.group.remove(that);
            return;
          }
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

  static bomb = {
    damage: 1,
    heightUnits: 0.2,
    widthUnits: 1,
    texture: 'void-sphere-texture',
    velocity: 800,
    follow: true,
    destroyAfterHit: true,
    unitsToSetVisible: 1,
    unitsToDestroy: 16,

    afterVisible: (that) => {
      // Estela principal del orbe (colores vibrantes)
      that.trailEmitter = that.scene.add.particles(0, 0, 'void-sphere-texture', {
        follow: that,
        followOffset: { x: 0, y: 0 },
        frequency: 15,
        quantity: 2,
        scale: { start: 0.8, end: 0.2 },
        alpha: { start: 0.8, end: 0 },
        lifespan: 400,
        speed: { min: 10, max: 30 },
        angle: { min: 0, max: 360 },
        blendMode: 'ADD',
        tint: [0xFF00FF, 0x8A2BE2, 0x4B0082, 0xB31BE2, 0xC71585],
        rotate: { min: -180, max: 180 }
      });
      
      // Partículas de energía dispersas
      that.sparkleEmitter = that.scene.add.particles(0, 0, 'void-sphere-texture', {
        follow: that,
        followOffset: { x: 0, y: 0 },
        frequency: 40,
        quantity: 1,
        scale: { start: 0.3, end: 0 },
        alpha: { start: 0.7, end: 0 },
        lifespan: 300,
        speed: { min: 60, max: 120 },
        angle: { min: 0, max: 360 },
        blendMode: 'ADD',
        tint: [0xFFFFFF, 0xFF00FF, 0xEE82EE]
      });
      
      // Efecto de aura luminosa
      that.auraEmitter = that.scene.add.particles(0, 0, 'void-sphere-texture', {
        follow: that,
        quantity: 1,
        frequency: 60,
        scale: { start: 1.5, end: 0.3 },
        alpha: { start: 0.2, end: 0 },
        lifespan: 200,
        blendMode: 'ADD',
        tint: 0x9400D3
      });
      
      // Limpiar cuando se destruya el orbe
      that.on('destroy', () => {
        if (that.trailEmitter) that.trailEmitter.destroy();
        if (that.sparkleEmitter) that.sparkleEmitter.destroy();
        if (that.auraEmitter) that.auraEmitter.destroy();
      });
    },

    afterHit: (that, enemy) => {

      // Explosión de energía en el impacto
      const impactBurst = that.scene.add.particles(that.x, that.y, 'void-sphere-texture', {
        speed: { min: 100, max: 250 },
        angle: { min: 0, max: 360 },
        scale: { start: 0.8, end: 0.1 },
        alpha: { start: 0.8, end: 0 },
        lifespan: 350,
        blendMode: 'ADD',
        tint: [0xFF00FF, 0x8A2BE2, 0x9400D3, 0xB31BE2],
        quantity: 20,
        emitting: false
      });

      // Ondas de energía que se expanden
      const energyWave = that.scene.add.particles(that.x, that.y, 'void-sphere-texture', {
        speed: { min: 50, max: 150 },
        scale: { start: 0.1, end: 2 },
        alpha: { start: 0.7, end: 0 },
        lifespan: 400,
        blendMode: 'ADD',
        tint: 0xC71585,
        quantity: 5,
        emitting: false
      });

      // Chispas brillantes
      const sparkles = that.scene.add.particles(that.x, that.y, 'void-sphere-texture', {
        speed: { min: 150, max: 300 },
        angle: { min: 0, max: 360 },
        scale: { start: 0.3, end: 0 },
        alpha: { start: 1, end: 0 },
        lifespan: 350,
        blendMode: 'ADD',
        tint: [0xFFFFFF, 0xFF00FF],
        quantity: 15,
        emitting: false
      });

      // Emitir todas las partículas a la vez para el efecto de explosión
      impactBurst.explode();
      energyWave.explode();
      sparkles.explode();

      // Limpieza
      that.scene.time.delayedCall(400, () => {
        impactBurst.destroy();
        energyWave.destroy();
        sparkles.destroy();
      });

      for (let i = 0; i < 360; i+=30) {
          const angle = Phaser.Math.DegToRad(i) + that.angle;        
          new Bullet(that.scene, that.group, that.getCenter().x, that.getCenter().y, Bullet.bomb_child, null, that.range, angle);
      }    
      that.destroy();
      that.group.remove(that);
    }
  }

  static bomb_child = {
    damage: 1,
    heightUnits: 0.2,
    widthUnits: 1,
    texture: 'void-sphere-texture',
    velocity: 800,
    follow: true,
    destroyAfterHit: true,
    unitsToSetVisible: 1,
    unitsToDestroy: 16,
    afterVisible: (that) => {
      // Estela principal del orbe (colores vibrantes)
      that.trailEmitter = that.scene.add.particles(0, 0, 'void-sphere-texture', {
        follow: that,
        followOffset: { x: 0, y: 0 },
        frequency: 15,
        quantity: 2,
        scale: { start: 0.8, end: 0.2 },
        alpha: { start: 0.8, end: 0 },
        lifespan: 400,
        speed: { min: 10, max: 30 },
        angle: { min: 0, max: 360 },
        blendMode: 'ADD',
        tint: [0xFF00FF, 0x8A2BE2, 0x4B0082, 0xB31BE2, 0xC71585],
        rotate: { min: -180, max: 180 }
      });
      
      // Partículas de energía dispersas
      that.sparkleEmitter = that.scene.add.particles(0, 0, 'void-sphere-texture', {
        follow: that,
        followOffset: { x: 0, y: 0 },
        frequency: 40,
        quantity: 1,
        scale: { start: 0.3, end: 0 },
        alpha: { start: 0.7, end: 0 },
        lifespan: 300,
        speed: { min: 60, max: 120 },
        angle: { min: 0, max: 360 },
        blendMode: 'ADD',
        tint: [0xFFFFFF, 0xFF00FF, 0xEE82EE]
      });
      
      // Efecto de aura luminosa
      that.auraEmitter = that.scene.add.particles(0, 0, 'void-sphere-texture', {
        follow: that,
        quantity: 1,
        frequency: 60,
        scale: { start: 1.5, end: 0.3 },
        alpha: { start: 0.2, end: 0 },
        lifespan: 200,
        blendMode: 'ADD',
        tint: 0x9400D3
      });
      
      // Limpiar cuando se destruya el orbe
      that.on('destroy', () => {
        if (that.trailEmitter) that.trailEmitter.destroy();
        if (that.sparkleEmitter) that.sparkleEmitter.destroy();
        if (that.auraEmitter) that.auraEmitter.destroy();
      });
    }
  }

}

/*

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

*/