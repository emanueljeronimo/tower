export class SellPopUp extends Phaser.GameObjects.Container {
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
