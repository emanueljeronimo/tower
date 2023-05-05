// Initialize Phaser game object
var config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 }
        }
    },
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

var game = new Phaser.Game(config);

// Global variables
var tower;
var enemy;
var bullets;

function preload() {
    // Load rectangle sprites
    this.load.image('tower', 'assets/tower.png');
    this.load.image('bullet', 'assets/bullet.png');
    this.load.image('enemy', 'assets/enemy.png');
}

function create() {
    // Create tower sprite
    tower = this.physics.add.sprite(100, 300, 'tower');
    tower.setCollideWorldBounds(true);
    tower.setImmovable(true);

    // Create enemy sprite
    enemy = this.physics.add.sprite(700, 300, 'enemy');
    enemy.setCollideWorldBounds(true);
    enemy.setBounce(1);
    enemy.setVelocityX(-100);

    // Create bullet group
    bullets = this.physics.add.group({
        defaultKey: 'bullet',
        maxSize: 10,
        collideWorldBounds: true,
        runChildUpdate: true
    });

    // Set up collision between bullets and enemy
    this.physics.add.overlap(bullets, enemy, hitEnemy, null, this);

    // Set up input to fire bullets
    this.input.on('pointerdown', fireBullet, this);
}

function update() {
    // Rotate tower to face enemy
    var angle = Phaser.Math.Angle.BetweenPoints(tower, enemy);
    tower.rotation = angle;

    // Keep enemy moving left to right
    if (enemy.body.touching.right) {
        enemy.setVelocityX(-100);
    }
    else if (enemy.body.touching.left) {
        enemy.setVelocityX(100);
    }
}

function fireBullet() {
    // Get bullet from pool
    var bullet = bullets.get(tower.x, tower.y);

    // Fire bullet towards enemy
    var angle = Phaser.Math.Angle.BetweenPoints(tower, enemy);
    bullet.setVelocity(Phaser.Math.GetSpeed(500, 1), angle);

    // Set lifespan of bullet
    bullet.lifespan = 2000;
}

function hitEnemy(bullet, enemy) {
    // Destroy bullet and enemy
    bullet.destroy();
    enemy.destroy();
}
