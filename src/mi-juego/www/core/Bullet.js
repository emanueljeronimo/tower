import { GameObject } from './GameObject.js';
import { Utils } from './Utils.js';

export class Bullet extends GameObject {

  constructor(scene, group, x, y, config, target, range, angle) {
    super(scene, group, x, y, config.texture, config.heightUnits * scene.unitSize, config.widthUnits * scene.unitSize);
    this.target = target;
    Object.assign(this, config);

    if (this.target) {
      this.initAngle = Phaser.Math.Angle.Between(this.getCenter().x, this.getCenter().y, this.target.getCenter().x, this.target.getCenter().y);
      this.setDirection(this.initAngle);
    } else if (angle) {
      this.initAngle = angle;
      this.setDirection(angle);
    }

    this.startX = x;
    this.startY = y;
    this.range = range;
    this.scene = scene;
    this.visible = !this.unitsToSetVisible;
  }

  destroy() {
    super.destroy();
    this.group.remove(this);
  }

  hit(enemy) {
    enemy.takeDamage(this.damage);
    this.afterHit && this.afterHit(this, enemy);
    if (this.destroyAfterHit) {
      this.destroy();
    }
  }

  update(delta) {
    const distance = Phaser.Math.Distance.Between(this.startX, this.startY, this.getCenter().x, this.getCenter().y);

    if (distance > this.unitsToDestroy * this.scene.unitSize) {
      this.destroy();
      return;
    }

    if (!this.unitsToSetVisible && !this.afterVisibleWasForced) {
      this.afterVisible && this.afterVisible(this);
      this.afterVisibleWasForced = true;
    }

    if (!this.visible && distance > this.unitsToSetVisible * this.scene.unitSize) {
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
    const realVelocity= this.velocity * this.scene.unitSize;
    this.setAngle(Phaser.Math.RAD_TO_DEG * angle);
    this.setVelocityX(Math.cos(angle) * realVelocity);
    this.setVelocityY(Math.sin(angle) * realVelocity);
  }

  setVelocity(velocity) {
    this.setAngle(0);
    this.velocity = velocity;
    this.setDirection(this.initAngle);
  }

  static initTextures(scene) {
    // Textura de bala original
    const canvasBullet = document.createElement('canvas');
    const radiusBullet = scene.unitSize;
    canvasBullet.width = radiusBullet * 2;
    canvasBullet.height = radiusBullet * 2;
    const contextBullet = canvasBullet.getContext('2d');

    const gradientBullet = contextBullet.createLinearGradient(0, 0, 0, 30);
    gradientBullet.addColorStop(0, '#FFFF00');
    gradientBullet.addColorStop(1, '#FF5500');

    contextBullet.fillStyle = gradientBullet;
    contextBullet.beginPath();
    contextBullet.arc(radiusBullet, radiusBullet, radiusBullet, 0, Math.PI * 2, false);
    contextBullet.fill();

    scene.textures.addCanvas('bullet-texture', canvasBullet);

    const canvasTripleArrow = document.createElement('canvas');
    canvasTripleArrow.width = scene.unitSize * 2;
    canvasTripleArrow.height = scene.unitSize * 2;
    const ctxTripleArrow = canvasTripleArrow.getContext('2d');

    // Gradiente azul cian -> violeta
    const gradientTripleArrow = ctxTripleArrow.createLinearGradient(0, 0, 0, scene.unitSize * 2);
    gradientTripleArrow.addColorStop(0, '#ff2121ff');
    gradientTripleArrow.addColorStop(1, '#fa82f4ff');

    ctxTripleArrow.fillStyle = gradientTripleArrow;
    ctxTripleArrow.beginPath();
    ctxTripleArrow.moveTo(-scene.unitSize, -scene.unitSize); // Punta superior
    ctxTripleArrow.lineTo(-scene.unitSize, scene.unitSize * 2); // Esquina inferior izquierda
    ctxTripleArrow.lineTo(scene.unitSize * 2, scene.unitSize); // Esquina inferior derecha
    ctxTripleArrow.closePath();
    ctxTripleArrow.fill();

    scene.textures.addCanvas('bullet-triple-texture', canvasTripleArrow);

    // Nueva textura para el orbe de energía
    const canvasEnergyOrb = document.createElement('canvas');
    const sizeOrb = scene.unitSize * 1.2;
    canvasEnergyOrb.width = sizeOrb;
    canvasEnergyOrb.height = sizeOrb;
    const contextOrb = canvasEnergyOrb.getContext('2d');

    // Crear un degradado radial para el orbe
    const gradientOrb = contextOrb.createRadialGradient(
      sizeOrb / 2, sizeOrb / 2, 0,
      sizeOrb / 2, sizeOrb / 2, sizeOrb / 2
    );

    // Colores vibrantes para el centro del orbe
    gradientOrb.addColorStop(0, '#FF00FF');    // Magenta brillante en el centro
    gradientOrb.addColorStop(0.3, '#8A2BE2');  // Azul violeta
    gradientOrb.addColorStop(0.6, '#4B0082');  // Índigo
    gradientOrb.addColorStop(1, '#000066');    // Azul oscuro en el borde

    contextOrb.fillStyle = gradientOrb;
    contextOrb.beginPath();
    contextOrb.arc(sizeOrb / 2, sizeOrb / 2, sizeOrb / 2, 0, Math.PI * 2, false);
    contextOrb.fill();

    // Agregar un brillo alrededor
    contextOrb.globalCompositeOperation = 'lighter';
    const glowGradient = contextOrb.createRadialGradient(
      sizeOrb / 2, sizeOrb / 2, sizeOrb * 0.4,
      sizeOrb / 2, sizeOrb / 2, sizeOrb * 0.7
    );
    glowGradient.addColorStop(0, 'rgba(255, 0, 255, 0.5)');
    glowGradient.addColorStop(1, 'rgba(255, 0, 255, 0)');

    contextOrb.fillStyle = glowGradient;
    contextOrb.beginPath();
    contextOrb.arc(sizeOrb / 2, sizeOrb / 2, sizeOrb / 2, 0, Math.PI * 2, false);
    contextOrb.fill();

    scene.textures.addCanvas('energy-orb-texture', canvasEnergyOrb);

    // Textura para partículas del orbe
    const canvasOrbParticle = document.createElement('canvas');
    const particleSize = scene.unitSize * 0.7;
    canvasOrbParticle.width = particleSize;
    canvasOrbParticle.height = particleSize;
    const ctxParticle = canvasOrbParticle.getContext('2d');

    const gradientParticle = ctxParticle.createRadialGradient(
      particleSize / 2, particleSize / 2, 0,
      particleSize / 2, particleSize / 2, particleSize / 2
    );

    gradientParticle.addColorStop(0, 'rgba(255, 255, 255, 1)');
    gradientParticle.addColorStop(0.5, 'rgba(230, 0, 255, 0.7)');
    gradientParticle.addColorStop(1, 'rgba(100, 0, 255, 0)');

    ctxParticle.fillStyle = gradientParticle;
    ctxParticle.beginPath();
    ctxParticle.arc(particleSize / 2, particleSize / 2, particleSize / 2, 0, Math.PI * 2);
    ctxParticle.fill();

    scene.textures.addCanvas('orb-particle-texture', canvasOrbParticle);

    // Textura para chispas de impacto
    const canvasSparkle = document.createElement('canvas');
    const sparkleSize = scene.unitSize;
    canvasSparkle.width = sparkleSize;
    canvasSparkle.height = sparkleSize;
    const ctxSparkle = canvasSparkle.getContext('2d');

    const gradientSparkle = ctxSparkle.createRadialGradient(
      sparkleSize / 2, sparkleSize / 2, 0,
      sparkleSize / 2, sparkleSize / 2, sparkleSize / 2
    );
    gradientSparkle.addColorStop(0, 'rgba(255, 255, 255, 1)');
    gradientSparkle.addColorStop(0.4, 'rgba(255, 255, 200, 0.8)');
    gradientSparkle.addColorStop(1, 'rgba(255, 255, 200, 0)');

    ctxSparkle.fillStyle = gradientSparkle;
    ctxSparkle.beginPath();
    ctxSparkle.arc(sparkleSize / 2, sparkleSize / 2, sparkleSize / 2, 0, Math.PI * 2);
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


    const canvasSlow = document.createElement('canvas');
    const radiusSlow = scene.unitSize;
    canvasSlow.width = radiusSlow * 2;
    canvasSlow.height = radiusSlow * 2;
    const contextSlow = canvasSlow.getContext('2d');

    // Fondo azul hielo con degradado radial transparente
    const gradientSlow = contextSlow.createRadialGradient(
      radiusSlow, radiusSlow, radiusSlow * 0.2,
      radiusSlow, radiusSlow, radiusSlow
    );
    gradientSlow.addColorStop(0, 'rgba(170, 238, 255, 1)');
    gradientSlow.addColorStop(1, 'rgba(0, 68, 102, 0)');

    contextSlow.fillStyle = gradientSlow;
    contextSlow.beginPath();
    contextSlow.arc(radiusSlow, radiusSlow, radiusSlow, 0, Math.PI * 2, false);
    contextSlow.fill();

    // Dibujar líneas en forma de copo de nieve
    contextSlow.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    contextSlow.lineWidth = 2;
    contextSlow.translate(radiusSlow, radiusSlow);

    for (let i = 0; i < 6; i++) {
      contextSlow.beginPath();
      contextSlow.moveTo(0, 0);
      contextSlow.lineTo(0, -radiusSlow * 0.9);
      contextSlow.stroke();
      contextSlow.rotate(Math.PI / 3);
    }

    scene.textures.addCanvas('slow-bullet-texture', canvasSlow);

    // Crear canvas para textura de disparo tipo aro energético
    const canvasBulletRing = document.createElement('canvas');
    const outerRadiusBulletRing = scene.unitSize * 2;
    const innerRadiusBulletRing = scene.unitSize * 1.2;

    canvasBulletRing.width = outerRadiusBulletRing * 2;
    canvasBulletRing.height = outerRadiusBulletRing * 2;

    const ctxBulletRing = canvasBulletRing.getContext('2d');

    // Gradiente radial desde el centro del aro hacia el borde
    const gradientBulletRing = ctxBulletRing.createRadialGradient(
      outerRadiusBulletRing, outerRadiusBulletRing, innerRadiusBulletRing * 0.5,
      outerRadiusBulletRing, outerRadiusBulletRing, outerRadiusBulletRing
    );

    gradientBulletRing.addColorStop(0, 'rgba(255,255,100,0.8)');
    gradientBulletRing.addColorStop(0.5, 'rgba(255,120,0,0.6)');
    gradientBulletRing.addColorStop(1, 'rgba(255,50,0,0.2)');

    // Dibujar círculo exterior con gradiente
    ctxBulletRing.fillStyle = gradientBulletRing;
    ctxBulletRing.beginPath();
    ctxBulletRing.arc(outerRadiusBulletRing, outerRadiusBulletRing, outerRadiusBulletRing, 0, Math.PI * 2);
    ctxBulletRing.fill();

    // Recortar el centro para formar un aro
    ctxBulletRing.globalCompositeOperation = 'destination-out';
    ctxBulletRing.beginPath();
    ctxBulletRing.arc(outerRadiusBulletRing, outerRadiusBulletRing, innerRadiusBulletRing, 0, Math.PI * 2);
    ctxBulletRing.fill();

    // Restaurar modo normal
    ctxBulletRing.globalCompositeOperation = 'source-over';

    // Registrar la textura en Phaser con nombre único
    scene.textures.addCanvas('texture-bullet-energy-ring', canvasBulletRing);

    const canvasRedCrosshair = document.createElement('canvas');
    const sizeRedCrosshair = scene.unitSize * 2; // Más grande que la bala
    canvasRedCrosshair.width = sizeRedCrosshair;
    canvasRedCrosshair.height = sizeRedCrosshair;
    const ctxRedCrosshair = canvasRedCrosshair.getContext('2d');

    ctxRedCrosshair.clearRect(0, 0, sizeRedCrosshair, sizeRedCrosshair);

    const centerX = sizeRedCrosshair / 2;
    const centerY = sizeRedCrosshair / 2;
    const lineLength = sizeRedCrosshair * 0.4; // Longitud de las líneas
    const gapSize = sizeRedCrosshair * 0.1; // Espacio sin trazar en el centro
    const lineThickness = 4; // Grosor de la cruz

    ctxRedCrosshair.strokeStyle = '#FF0000';
    ctxRedCrosshair.lineWidth = lineThickness;
    ctxRedCrosshair.lineCap = 'round';

    // Línea vertical (parte superior)
    ctxRedCrosshair.beginPath();
    ctxRedCrosshair.moveTo(centerX, centerY - gapSize - lineLength);
    ctxRedCrosshair.lineTo(centerX, centerY - gapSize);
    ctxRedCrosshair.stroke();

    // Línea vertical (parte inferior)
    ctxRedCrosshair.beginPath();
    ctxRedCrosshair.moveTo(centerX, centerY + gapSize);
    ctxRedCrosshair.lineTo(centerX, centerY + gapSize + lineLength);
    ctxRedCrosshair.stroke();

    // Línea horizontal (izquierda)
    ctxRedCrosshair.beginPath();
    ctxRedCrosshair.moveTo(centerX - gapSize - lineLength, centerY);
    ctxRedCrosshair.lineTo(centerX - gapSize, centerY);
    ctxRedCrosshair.stroke();

    // Línea horizontal (derecha)
    ctxRedCrosshair.beginPath();
    ctxRedCrosshair.moveTo(centerX + gapSize, centerY);
    ctxRedCrosshair.lineTo(centerX + gapSize + lineLength, centerY);
    ctxRedCrosshair.stroke();

    // Agregar la textura
    scene.textures.addCanvas('scope-red-texture', canvasRedCrosshair);

    // Textura de mina
    const canvasMine = document.createElement('canvas');
    const radiusMine = scene.unitSize;
    canvasMine.width = radiusMine * 2;
    canvasMine.height = radiusMine * 2;
    const ctxMine = canvasMine.getContext('2d');

    // Fondo circular (cuerpo de la mina)
    ctxMine.fillStyle = '#333333'; // gris oscuro
    ctxMine.beginPath();
    ctxMine.arc(radiusMine, radiusMine, radiusMine, 0, Math.PI * 2);
    ctxMine.fill();

    // Borde metálico
    ctxMine.lineWidth = 3;
    ctxMine.strokeStyle = '#777777'; // gris claro
    ctxMine.stroke();

    // Picos alrededor (8 protuberancias)
    ctxMine.fillStyle = '#555555';
    for (let i = 0; i < 8; i++) {
      const angle = (Math.PI * 2 / 8) * i;
      const x = radiusMine + Math.cos(angle) * (radiusMine + 3);
      const y = radiusMine + Math.sin(angle) * (radiusMine + 3);
      ctxMine.beginPath();
      ctxMine.arc(x, y, 3, 0, Math.PI * 2);
      ctxMine.fill();
    }

    // Centro rojo brillante
    const gradientCenter = ctxMine.createRadialGradient(
      radiusMine, radiusMine, 0,
      radiusMine, radiusMine, radiusMine / 2
    );
    gradientCenter.addColorStop(0, '#FF0000');
    gradientCenter.addColorStop(1, '#800000');
    ctxMine.fillStyle = gradientCenter;
    ctxMine.beginPath();
    ctxMine.arc(radiusMine, radiusMine, radiusMine / 3, 0, Math.PI * 2);
    ctxMine.fill();

    // Registrar textura
    scene.textures.addCanvas('mine-texture', canvasMine);

    // Crear textura para partículas de explosión
    const canvasExplosion = document.createElement('canvas');
    const r = scene.unitSize;
    canvasExplosion.width = r * 2;
    canvasExplosion.height = r * 2;
    const ctxExplosion = canvasExplosion.getContext('2d');

    const gradientExplosion = ctxExplosion.createRadialGradient(r, r, 0, r, r, r);
    gradientExplosion.addColorStop(0, 'rgba(255,255,0,1)');   // amarillo brillante
    gradientExplosion.addColorStop(0.3, 'rgba(255,165,0,0.9)'); // naranja
    gradientExplosion.addColorStop(0.6, 'rgba(255,0,0,0.8)');   // rojo
    gradientExplosion.addColorStop(1, 'rgba(50,50,50,0)');      // borde transparente (humo)
    ctxExplosion.fillStyle = gradientExplosion;
    ctxExplosion.beginPath();
    ctxExplosion.arc(r, r, r, 0, Math.PI * 2);
    ctxExplosion.fill();

    scene.textures.addCanvas('mine-explosion-particle', canvasExplosion);

    // Textura de "sangrado" (señal de debuff)
    const canvasBleed = document.createElement('canvas');
    const radiusBleed = scene.unitSize;
    canvasBleed.width = radiusBleed * 2;
    canvasBleed.height = radiusBleed * 2;
    const contextBleed = canvasBleed.getContext('2d');

    // Degradado rojo a púrpura oscuro
    const gradientBleed = contextBleed.createRadialGradient(
      radiusBleed, radiusBleed, radiusBleed * 0.2,
      radiusBleed, radiusBleed, radiusBleed
    );
    gradientBleed.addColorStop(0, '#FF0000');   // rojo intenso
    gradientBleed.addColorStop(0.5, '#AA0033'); // sangre oscura
    gradientBleed.addColorStop(1, '#550022');   // borde púrpura oscuro

    contextBleed.fillStyle = gradientBleed;
    contextBleed.beginPath();
    contextBleed.arc(radiusBleed, radiusBleed, radiusBleed, 0, Math.PI * 2, false);
    contextBleed.fill();

    // Algunas gotas simuladas
    contextBleed.fillStyle = '#880000';
    for (let i = 0; i < 3; i++) {
      const dx = radiusBleed + (Math.random() - 0.5) * radiusBleed * 1.2;
      const dy = radiusBleed + (Math.random() - 0.5) * radiusBleed * 1.2;
      contextBleed.beginPath();
      contextBleed.arc(dx, dy, radiusBleed * 0.2, 0, Math.PI * 2, false);
      contextBleed.fill();
    }

    scene.textures.addCanvas('bleed-texture', canvasBleed);

    // Textura de bala eléctrica
    const canvasBulletElectricity = document.createElement('canvas');
    const radiusBulletElectricity = scene.unitSize;
    canvasBulletElectricity.width = radiusBulletElectricity * 2;
    canvasBulletElectricity.height = radiusBulletElectricity * 2;
    const contextBulletElectricity = canvasBulletElectricity.getContext('2d');

    // Fondo circular base
    const gradientBulletElectricity = contextBulletElectricity.createRadialGradient(
      radiusBulletElectricity, radiusBulletElectricity, 2,
      radiusBulletElectricity, radiusBulletElectricity, radiusBulletElectricity
    );
    gradientBulletElectricity.addColorStop(0, '#FFFFFF');   // centro brillante
    gradientBulletElectricity.addColorStop(0.3, '#00FFFF'); // cian intenso
    gradientBulletElectricity.addColorStop(1, '#0033FF');   // azul eléctrico oscuro

    contextBulletElectricity.fillStyle = gradientBulletElectricity;
    contextBulletElectricity.beginPath();
    contextBulletElectricity.arc(radiusBulletElectricity, radiusBulletElectricity, radiusBulletElectricity, 0, Math.PI * 2, false);
    contextBulletElectricity.fill();

    // Agregar algunas "chispas" aleatorias en la textura
    for (let i = 0; i < 8; i++) {
      const x = radiusBulletElectricity + (Math.random() - 0.5) * radiusBulletElectricity * 1.5;
      const y = radiusBulletElectricity + (Math.random() - 0.5) * radiusBulletElectricity * 1.5;
      contextBulletElectricity.strokeStyle = ['#FFFFFF', '#00FFFF', '#66CCFF'][Math.floor(Math.random() * 3)];
      contextBulletElectricity.lineWidth = Math.random() * 2;
      contextBulletElectricity.beginPath();
      contextBulletElectricity.moveTo(x, y);
      contextBulletElectricity.lineTo(
        x + (Math.random() - 0.5) * 10,
        y + (Math.random() - 0.5) * 10
      );
      contextBulletElectricity.stroke();
    }

    scene.textures.addCanvas('bullet-electric', canvasBulletElectricity);
  }

  static common = {
    damage: 1,
    heightUnits: 1,
    widthUnits: 1,
    texture: 'bullet-texture',
    velocity: 30,
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
    }
  };

  static triple = {
    damage: 0.7,
    heightUnits: 1,
    widthUnits: 1,
    texture: 'bullet-triple-texture',
    velocity: 40,
    follow: true,
    destroyAfterHit: true,
    unitsToSetVisible: 1,
    unitsToDestroy: 16,
    afterHit: (that, enemy) => {
      const impactParticles = that.scene.add.particles(that.x, that.y, 'bullet-triple-texture', {
        speed: { min: 0, max: 550 },
        angle: { min: 0, max: 360 },
        lifespan: 180,
        scale: { start: 0.3, end: 0 },
        tint: [0x00ffff, 0x5500ff],
        blendMode: 'ADD'
      });

      that.scene.time.delayedCall(300, () => impactParticles.destroy());
      that.destroy();
    }
  };

  static energyOrb = {
    damage: 1,
    heightUnits: 1.2,
    widthUnits: 1.2,
    texture: 'energy-orb-texture',
    velocity: 60,
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
    velocity: 80,
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
      if (!that.rebounds) that.rebounds = 1;
      if (that.enemy !== enemy) {
        that.enemy = enemy;
        let nextEnemy = Utils.getClosestEnemy(that.enemy, that.scene.enemies, that.x, that.y);
        if (!nextEnemy) {
          that.destroy();
          return;
        } else {
          const distance = Phaser.Math.Distance.Between(that.startX, that.startY, nextEnemy.getCenter().x, nextEnemy.getCenter().y);
          if (distance > that.unitsToDestroy * that.scene.unitSize) {
            that.destroy();
            return;
          }
        }

        const angle = Phaser.Math.Angle.Between(that.body.x, that.body.y, nextEnemy.x, nextEnemy.y);
        that.setDirection(angle);
        that.rebounds++;
      }

      if (that.rebounds == 8) {
        that.destroy();
      }
    }

  }

  static bomb = {
    damage: 1,
    heightUnits: 0.2,
    widthUnits: 1,
    texture: 'void-sphere-texture',
    velocity: 60,
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
        tint: [0xFF0000, 0xFF3300, 0xFF4444, 0xCC0000, 0xFF6666],
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
        tint: 0x990000,
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
        tint: [0xFFFFFF, 0xFF0000, 0xFF4444],
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

      for (let i = 0; i < 360; i += 30) {
        const angle = Phaser.Math.DegToRad(i) + that.angle;
        new Bullet(that.scene, that.group, that.getCenter().x, that.getCenter().y, Bullet.bomb_child, null, that.range, angle);
      }
      that.destroy();
    }
  }

  static bomb_child = {
    damage: 1,
    heightUnits: 0.2,
    widthUnits: 1,
    texture: 'void-sphere-texture',
    velocity: 60,
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
        tint: [0xFF0000, 0xFF3300, 0xFF4444, 0xCC0000, 0xFF6666],
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
        tint: [0xFFFFFF, 0xFF0000, 0xFF4444]
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
        tint: 0x990000
      });

      // Limpiar cuando se destruya el orbe
      that.on('destroy', () => {
        if (that.trailEmitter) that.trailEmitter.destroy();
        if (that.sparkleEmitter) that.sparkleEmitter.destroy();
        if (that.auraEmitter) that.auraEmitter.destroy();
      });
    }
  }

  static slower = {
    damage: 1,
    heightUnits: 1,
    widthUnits: 1,
    texture: 'slow-bullet-texture',
    velocity: 100,
    follow: false,
    destroyAfterHit: true,
    unitsToSetVisible: 1,
    unitsToDestroy: 16,

    afterVisible: (that) => {
      that.setAngularVelocity(150);
      that.setVelocity(3);
      const muzzleFlash = that.scene.add.particles(that.x, that.y, 'slow-bullet-texture', {
        speed: { min: 200, max: 400 },
        lifespan: 100,
        scale: { start: 0.5, end: 0 },
        //tint: [0xffff00, 0xff5500],
        blendMode: 'ADD'
      });
      that.scene.time.delayedCall(100, () => muzzleFlash.destroy());
    },

    afterHit: (that, enemy) => {
      const impactParticles = that.scene.add.particles(that.x, that.y, 'slow-bullet-texture', {
        speed: { min: 50, max: 200 },
        angle: { min: 0, max: 360 },
        lifespan: 150,
        scale: { start: 0.4, end: 0 },
        //tint: [0xffff00, 0xff5500],
        blendMode: 'ADD'
      });

      if (enemy.active) {
        enemy.speed = enemy.speed * 0.8;
        //enemy.body.velocity.x *= 0.90;
        //enemy.body.velocity.y *= 0.90;
        /*that.scene.time.delayedCall(1000, () => {
          if (enemy && enemy.body) {
            enemy.body.velocity.x *= 1.05;
            enemy.body.velocity.y *= 1.05;
          }
        });*/
      }

      that.scene.time.delayedCall(350, () => impactParticles.destroy());
      that.destroy();
    }
  };

  static circle = {
    damage: 1,
    heightUnits: 6,
    widthUnits: 6,
    texture: 'texture-bullet-energy-ring',
    velocity: 15,
    follow: false,
    destroyAfterHit: false,
    unitsToSetVisible: 2,
    unitsToDestroy: 16,

    afterVisible: (that) => {
      const diameter = that.scene.unitSize * that.widthUnits;
      const radius = diameter / 2;
      that.body.setCircle(radius, that.width / 2 - radius, that.height / 2 - radius);
      that.setAngularVelocity(50);
      that.setVelocity(20);
    }

  };

  static teleport = {
    damage: 1,
    heightUnits: 1,
    widthUnits: 1,
    texture: 'scope-red-texture',
    velocity: 20,
    follow: true,
    destroyAfterHit: false,
    unitsToSetVisible: 1,
    unitsToDestroy: 16,

    afterVisible: (that) => {
      if (that.target.active) {
        that.x = that.target.x
        that.y = that.target.y
      }

    },

    afterHit: (that, enemy) => {
      if(that.alreadyHit) return;
      that.alreadyHit = true;
      enemy.setTintFill(0xFFFFFF);
      that.scene.time.delayedCall(800, () => {
        enemy.clearTint();
      });
      that.scene.time.delayedCall(500, () => {
        that.destroy();
        enemy.currentPointIndex = Utils.getRandomNumber(0, enemy.currentPointIndex);
        if (enemy.active) {
          enemy.x = enemy.path[enemy.currentPointIndex].x;
          enemy.y = enemy.path[enemy.currentPointIndex].y;
          enemy.startMoving();
        }
      });
    }
  };

  static mine = {
    damage: 1,
    heightUnits: 1,
    widthUnits: 1,
    texture: 'mine-texture',
    velocity: 25,
    follow: true,
    destroyAfterHit: true,
    unitsToSetVisible: 0,
    unitsToDestroy: 16,

    afterUpdate: (that, delta) => {
      that.rotation += 0.2;
    },

    afterVisible: (that) => {
      that.setVelocityX(0);
      that.setVelocityY(0);
      that.scene.time.delayedCall(3500, () => {
        that.destroy();
      });
    },

    afterHit: (that, enemy) => {
      const explosion = that.scene.add.particles(that.x, that.y, 'mine-explosion-particle', {
        speed: { min: 150, max: 350 }, // un poco más rápida
        angle: { min: 0, max: 360 },
        lifespan: { min: 50, max: 100 }, // más corta
        scale: { start: 0.3, end: 0 }, // más pequeña
        gravityY: 250, // que caiga un poco más rápido
        alpha: { start: 1, end: 0 },
        blendMode: 'ADD',
        quantity: 10 // menos partículas
      });

      that.scene.time.delayedCall(350, () => explosion.destroy());
    }
  };

  static damage = {
    damage: 0,
    heightUnits: 0.3,
    widthUnits: 0.3,
    texture: 'bleed-texture',
    velocity: 100,
    follow: false,
    destroyAfterHit: false,
    unitsToSetVisible: 1,
    unitsToDestroy: 25,


    afterVisible: (that) => {

      that.trailEmitter = that.scene.add.particles(0, 0, 'bleed-texture', {
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

      that.on('destroy', () => {
        if (that.trailEmitter) that.trailEmitter.destroy();
      });
    },


    afterHit: (that, enemy) => {
      that.glued = true;
      that.enemy = enemy;
      enemy.setTint(0xff2222);

      if (enemy) {
        enemy.increasedDamagePercent += 10;
        setTimeout(() => {
          enemy.increasedDamagePercent -= 10;
          that.destroy();
          enemy.clearTint();
        }, 1000)
      }

    },

    afterUpdate: (that, delta) => {
      if (that.glued && that.enemy.body) {
        that.body.x = (that.enemy.getCenter().x - that.body.width / 2) + (that.body.width / 2);
        that.body.y = that.enemy.getCenter().y - that.body.height / 2;
      }
    },

  }


  static electricity = {
    damage: 1,
    heightUnits: 0.5,
    widthUnits: 0.5,
    texture: 'bullet-electric',
    velocity: 40,
    follow: false,
    destroyAfterHit: false,
    unitsToSetVisible: 0,
    unitsToDestroy: 6,

    afterVisible: (that) => {
      const sparks = that.scene.add.particles(that.x, that.y, 'bullet-electric', {
        speed: { min: 0, max: 0 },
        angle: { min: 0, max: 0 }, // efecto "descarga adelante"
        lifespan: 120,
        alpha: { start: 1, end: 0 },
        scale: { start: 0.3, end: 0 },
        tint: [0x00ffff, 0xffffff, 0x3399ff],
        blendMode: 'ADD'
      });
      that.scene.time.delayedCall(80, () => sparks.destroy());

     that.trailEmitter = that.scene.add.particles(0, 0, 'bullet-electric', {
        follow: that,
        followOffset: { x: 0, y: 0 },
        frequency: 35,
        quantity: 6,
        scale: { start: 0.2, end: 0.2 },
        alpha: { start: 0.2, end: 0 },
        lifespan: 600,
        speed: { min: 10, max: 30 },
        angle: { min: 0, max: 360 },
        blendMode: 'ADD',
        rotate: { min: -180, max: 180 }
      });

      that.on('destroy', () => {
        if (that.trailEmitter) that.trailEmitter.destroy();
      });

    },

    afterHit: (that, enemy) => {
      const explosion = that.scene.add.particles(that.x, that.y, 'bullet-electric', {
        speed: { min: 100, max: 400 },
        angle: { min: 0, max: 360 },
        lifespan: { min: 80, max: 200 },
        alpha: { start: 1, end: 0 },
        scale: { start: 0.2, end: 0 },
        tint: [0x00ffff, 0xffffff, 0x3399ff],
        blendMode: 'ADD',
        quantity: 8
      });

      that.scene.time.delayedCall(250, () => explosion.destroy());
      that.destroy();
    },

    afterUpdate: (that, delta) => {
      if (!that.lastAngleChange) {
        that.lastAngleChange = delta;
      } else {
        that.lastAngleChange += delta;
        if (that.lastAngleChange > 50) {
          that.setDirection(Utils.getRandomAngle());
          that.lastAngleChange = 0;
        }
      }

    },
  };


}
