import { GameObject } from './GameObject.js';
import { Utils } from './Utils.js';

export class Enemy extends GameObject {
  constructor(scene, group, x = -50, y = 150, enemyConfig) {
    super(scene, group, x, y, enemyConfig.texture, scene.unitSize * enemyConfig.height, scene.unitSize * enemyConfig.width);
    Object.assign(this, enemyConfig);

    this.speed = Utils.getRandomNumber(this.speed * 0.85, this.speed * 1.15);
    this.scene = scene;
    this.currentPointIndex = 0;
    this.increasedDamagePercent = 0;

    // Posición actual del fuego (para suavizado)
    this.fireX = x;
    this.fireY = y;

    // === Efecto de fuego trasero ===
    this.fireEmitter = scene.add.particles(0, 0, 'fire-texture', {
      speed: { min: 20, max: 60 },
      angle: { min: 0, max: 0 },
      lifespan: 600,
      scale: { start: 0.5, end: 0 },
      alpha: { start: 1, end: 0 },
      frequency: 80,
      quantity: 1,
      blendMode: 'ADD'
    });

    this.setDepth(10);
    this.fireEmitter.setDepth(5);
  }

  setPath(path) {
    const halfUnitSize = this.scene.unitSize / 2;
    this.path = path.map(point => ({
      x: point.x + Utils.getRandomNumber(-halfUnitSize, halfUnitSize),
      y: point.y + Utils.getRandomNumber(-halfUnitSize, halfUnitSize)
    }));
    this.startMoving();
  }

  takeDamage(bullet, damage) {
    this.health -= damage + (damage * this.increasedDamagePercent / 100);
    if (this.health <= 0) {
      // Sonido de explosión
      this.scene.audioManager.play(`explosion${Utils.getRandomNumber(1, 2)}`, { volume: 0.3 });

      // Recompensa de oro
      this.scene.changeGold(this.gold);

      // Efecto de explosión direccional
      const angle = Phaser.Math.RadToDeg(
        Phaser.Math.Angle.Between(
          bullet.getCenter().x, bullet.getCenter().y, this.getCenter().x, this.getCenter().y
        )
      );

      const explosion = this.scene.add.particles(this.x, this.y, 'explosion-texture', {
        speed: { min: 100, max: 400 },
        angle: { min: angle - 30, max: angle + 30 },
        lifespan: { min: 300, max: 600 },
        scale: { start: 0.5, end: 0 },
        alpha: { start: 1, end: 0 },
        quantity: 10,
        blendMode: 'ADD',
        tint: [...this.fuselageColors]
      });

      explosion.explode(20);
      this.scene.time.delayedCall(600, () => explosion.destroy());
      this.destroy();

    }
  }

  hitWithMainTower(mainTower) {
    this.scene.audioManager.play(`explosion${Utils.getRandomNumber(1, 2)}`, { volume: 0.3 });
    const angleToTower = Phaser.Math.RadToDeg(
        Phaser.Math.Angle.Between(mainTower.x, mainTower.y, this.x, this.y)
    );

    let maxAngleSpread = 30;

    const explosion = this.scene.add.particles(this.x, this.y, 'explosion-texture', {
        speed: { min: 150, max: 350 },
        angle: { min: angleToTower - maxAngleSpread, max: angleToTower + maxAngleSpread },
        lifespan: { min: 400, max: 800 },
        scale: { start: 0.6, end: 0 },
        alpha: { start: 1, end: 0 },
        quantity: 15,
        blendMode: 'ADD',
        tint: [...this.fuselageColors]
    });

    explosion.explode(25);
    this.scene.time.delayedCall(600, () => explosion.destroy());
    this.destroy();
}

  destroy() {
    if (!this.scene) return;
    this.scene.time.delayedCall(100, () => this.fireEmitter.destroy());
    this.group.remove(this);
    super.destroy();
  }

  update() {
    if (!this.active) return;
    if (!this.path || this.currentPointIndex >= this.path.length) return;

    const targetPoint = this.path[this.currentPointIndex];
    const distance = Phaser.Math.Distance.Between(this.x, this.y, targetPoint.x, targetPoint.y);

    // Cambiar al siguiente punto si está lo suficientemente cerca
    if (distance < this.scene.unitSize * 0.5) {
      this.currentPointIndex++;
      if (this.currentPointIndex < this.path.length) {
        this.startMoving();
      }
    }

    // === Actualización del fuego trasero (suavizado manual) ===
    const tailOffset = this.scene.unitSize / 2;
    const targetTailX = this.x + Math.cos(this.rotation + Math.PI) * tailOffset;
    const targetTailY = this.y + Math.sin(this.rotation + Math.PI) * tailOffset;

    // Interpolación suave de la posición del fuego
    this.fireX = Phaser.Math.Linear(this.fireX, targetTailX, 0.2);
    this.fireY = Phaser.Math.Linear(this.fireY, targetTailY, 0.2);
    this.fireEmitter.setPosition(this.fireX, this.fireY);

    // Interpolación suave del ángulo del fuego
    const desiredAngle = Phaser.Math.RadToDeg(this.rotation) + 180;
    this.fireAngle = this.fireAngle ?? desiredAngle; // inicializa si no existe
    this.fireAngle = Phaser.Math.Linear(this.fireAngle, desiredAngle, 0.25);
    this.fireEmitter.setAngle(this.fireAngle);

    // Activar partículas solo si se está moviendo
    this.fireEmitter.active = this.body && this.body.speed > 0;
  }

  startMoving() {
    const targetPoint = this.path[this.currentPointIndex];
    const angleToTarget = Phaser.Math.Angle.Between(this.x, this.y, targetPoint.x, targetPoint.y);

    this.rotation = angleToTarget;
    this.setAngle(Phaser.Math.RadToDeg(angleToTarget));
    this.setVelocityX(Math.cos(angleToTarget) * (this.speed * this.scene.unitSize));
    this.setVelocityY(Math.sin(angleToTarget) * (this.speed * this.scene.unitSize));
  }

  static initTextures(scene) {
    scene.load.svg('enemy', 'assets/enemy-7.svg', {height: Enemy.commonEnemy.height * scene.unitSize, width: Enemy.commonEnemy.width * scene.unitSize });
    //scene.load.image('enemy', 'assets/enemy-7.png');

    // === Textura de explosión ===
    const g1 = scene.make.graphics({ x: 0, y: 0, add: false });
    g1.fillStyle(0xffffff, 1);
    g1.fillCircle(scene.unitSize / 2, scene.unitSize / 2, scene.unitSize / 2);
    g1.generateTexture('explosion-texture', 16, 16);
    g1.destroy();

    // === Textura del fuego ===
    const g2 = scene.make.graphics({ x: 0, y: 0, add: false });
    g2.fillStyle(0x00ffff, 1);
    g2.fillCircle(8, 8, 8);
    g2.fillStyle(0xffffff, 1);
    g2.fillCircle(8, 8, 4);
    g2.fillStyle(0x00ffff, 0.3);
    g2.fillCircle(8, 8, 12);
    g2.generateTexture('fire-texture', 16, 16);
    g2.destroy();

    // Suavizar texturas
    scene.textures.get('fire-texture').setFilter(Phaser.Textures.FilterMode.LINEAR);
  }

  static commonEnemy = {
    texture: 'enemy',
    height: 1.8,
    width: 1.8,
    health: 100,
    speed: 8,
    gold: 15,
    fuselageColors: [0x182134,0xAB372C, 0xE9AB32]
  };

  static dummyEnemy = {
    texture: 'enemy',
    height: 1,
    width:1,
    health: 100,
    speed: 10,
    gold: 0,
    fuselageColors: [0x182134,0xAB372C, 0xE9AB32]
  };
}
