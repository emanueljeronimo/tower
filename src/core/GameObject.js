export class GameObject extends Phaser.Physics.Arcade.Sprite {
    group = null;
    constructor(scene, group, x, y, texture, height, width) {
      super(scene, x, y, texture);
      this.group = group;
      group.add(this);
      scene.add.existing(this);
      scene.physics.add.existing(this);
      //this.setSize(width, height);
      this.setDisplaySize(width, height);
      //this.body.setSize(width,height);
      this.setOrigin(0.5);
    }
  }