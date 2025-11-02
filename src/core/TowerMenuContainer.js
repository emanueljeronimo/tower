import { ButtonTower } from './ButtonTower.js'
import { Tower } from './Tower.js'
import { Enemy } from './Enemy.js'
import { config } from './config.js'

export class TowerMenuContainer extends Phaser.GameObjects.Container {
  constructor(scene, x, y) {
    super(scene, x, y);
    this.selectedTower = null;
    this.scene = scene;
    this.enemies = scene.physics.add.group();
    this.bullets = scene.physics.add.group();
    this.towers = scene.add.group();
    this.buttonTowers = scene.add.group();

    scene.physics.add.overlap(this.enemies, this.bullets, function (enemy, bullet) {
      bullet.hit(enemy);
    });

    this.offset = this.scene.unitSize * 1;

    let mainFrame = this.scene.add.sprite(this.x + config.width/2 - this.scene.unitSize * 0.9 , this.y + this.scene.unitSize*1.5 , 'mainFrame');
    mainFrame.setSize(config.width, this.scene.unitSize * 11);
    mainFrame.setDisplaySize(config.width, this.scene.unitSize * 11);

    this.backgroundDemo = this.scene.add.sprite(this.scene.unitSize*5, this.scene.unitSize * 83, 'backgroundDemo');
    this.backgroundDemo.setSize(this.scene.unitSize * 10, this.scene.unitSize * 10);
    this.backgroundDemo.setDisplaySize(this.scene.unitSize * 10, this.scene.unitSize * 10);

    this.buttonTower = new ButtonTower(this.scene, this.buttonTowers, this.towers, this.enemies, this.bullets, this.scene.unitSize * 5, this.scene.unitSize * 83);
    this.buttonTowers.add(this.buttonTower);

    const buyButton = this.scene.add.sprite(scene.unitSize * 35, this.offset +  scene.unitSize * 3, 'buy');
    buyButton.setDisplaySize(scene.unitSize * 5, scene.unitSize * 2);
    this.add(buyButton);

    buyButton.setInteractive();
    buyButton.on('pointerdown', () => {
      this.scene.buy();
    });

    this.reset = this.scene.add.text(this.scene.unitSize * 45, this.offset +  this.scene.unitSize * 3, 'Reset', {
      fontSize: '24px',
      fill: '#ffffff'
    });
    this.add(this.reset);
    this.reset.setInteractive();
    this.reset.on('pointerdown', () => {
      window.location.reload();
    });

    // Create a description text
    this.arrTowerConfig = [Tower.commonTower, Tower.tripleShotTower, Tower.energyOrbTower, Tower.bouncerTower, Tower.bombTower, Tower.slowerTower, Tower.circleTower,
                           Tower.teleportTower, Tower.mineTower, Tower.damageTower, Tower.electricityTower/*, Tower.slowerTower,*/];

    let borderGraphics;
    for(let i=0; i<2; i++) {
      for(let j=0; j<6; j++) {
        
        if (!this.arrTowerConfig[j+(6*i)]) break;

        let tower = this.arrTowerConfig[j+(6*i)];
        let xoffset= this.scene.unitSize*3;
        let selectButton = this.scene.add.sprite(this.x + xoffset + this.scene.buttonTowerSize * j , this.y - this.scene.unitSize/2 + this.scene.buttonTowerSize * i , 'buttonTower');
        selectButton.setSize(this.scene.buttonTowerSize, this.scene.buttonTowerSize);
        selectButton.setDisplaySize(this.scene.buttonTowerSize, this.scene.buttonTowerSize);
        selectButton.setInteractive();    

        const pointerdown = ()=>{
          if (borderGraphics) {
              borderGraphics.destroy();
          }
      
          borderGraphics = this.scene.add.graphics();
          borderGraphics.lineStyle(2, 0xffffff);
          borderGraphics.strokeRect(
              selectButton.x - selectButton.displayWidth / 2,
              selectButton.y - selectButton.displayHeight / 2,
              selectButton.displayWidth,
              selectButton.displayHeight
          );
          this.selectedTower = tower;
          this.updateTower();
        }

        selectButton.on('pointerdown', () => {
          pointerdown();
        });

        
        let towerTexture = this.scene.add.sprite(this.x + xoffset + this.scene.buttonTowerSize * j , this.y - this.scene.unitSize/2 + this.scene.buttonTowerSize * i , tower.texture);
        towerTexture.setInteractive();  
        towerTexture.setSize(this.scene.unitSize * tower.widthRatio, this.scene.unitSize * tower.heightRatio);
        towerTexture.setDisplaySize(this.scene.unitSize * tower.widthRatio, this.scene.unitSize * tower.heightRatio);
        towerTexture.on('pointerdown', () => {
          pointerdown();
        });

      }
    }

    /*this.towerDesc = scene.add.text(scene.unitSize * 7, this.offset + scene.unitSize * 4, '', {
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
    */

    //left rigth buy

    /*
    const buttonLeft = scene.add.sprite(scene.unitSize, this.offset + scene.unitSize * 3, 'left');
    buttonLeft.setDisplaySize(scene.unitSize * 1.5, scene.unitSize * 1.5);
    this.add(buttonLeft);

    buttonLeft.setInteractive();
    buttonLeft.on('pointerdown', () => {
      const firstElement = this.arrTowerConfig.shift();
      this.arrTowerConfig.push(firstElement);
      this.updateTower();
    });

    const buttonRight = scene.add.sprite(scene.unitSize * 15, this.offset + scene.unitSize * 3, 'right');
    buttonRight.setDisplaySize(scene.unitSize * 1.5, scene.unitSize * 1.5);
    this.add(buttonRight);

    buttonRight.setInteractive();
    buttonRight.on('pointerdown', () => {
      const lastElement = this.arrTowerConfig.pop();
      this.arrTowerConfig.unshift(lastElement);
      this.updateTower();
    });
    */

    /*var rectangle = this.scene.add.rectangle(this.x + scene.unitSize * 8, this.y+ this.offset + scene.unitSize, scene.unitSize * 15, scene.unitSize * 8, null); // x, y, width, height, color
    var thickness = 1;
    rectangle.setStrokeStyle(thickness, 0xffffff);
    */

    scene.add.existing(this);
  }

  updateTower() {
    /*this.towerDesc.setText(this.arrTowerConfig[0].description);
    this.towerPrice.setText(`Price: ${this.arrTowerConfig[0].price}`);
    this.towerRange.setText(`Range: ${this.arrTowerConfig[0].range}`);
    this.towerVelocity.setText(`Velocity: ${this.arrTowerConfig[0].attackVelocity}`);
    */
    this.scene.setSelectedTowerConfig(this.selectedTower);
    this.buttonTower.destroyTower();
    if (this.enemy != null) this.enemy.destroy();
    let x = this.x + this.scene.unitSize * 8;
    let y = this.scene.unitSize * 83
    this.enemy = new Enemy(this.scene, this.enemies, x, y, Enemy.dummyEnemy);
    this.enemy.setPath([{x:x+this.scene.unitSize*20,y:y},{x:x+this.scene.unitSize*10,y:y},{x:x,y:y}]);
    this.buttonTower.createTower(false);
  }

  update(time, delta) {
    this.towers.getChildren().forEach(function (tower) {
      tower.update(time);
    });
    this.bullets.getChildren().forEach(function (bullet) {
      bullet.update(delta);
    });
    this.enemy && this.enemy.update();
  }

}