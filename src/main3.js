var config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

var game = new Phaser.Game(config);
var tower;
var enemy;
var bullets;
var lastFired = 0;

function preload() {}

function create() {
    tower = this.add.rectangle(400, 500, 50, 50, 0xff0000);
    enemy = this.physics.add.sprite(00, 100, null);
    enemy.body.width = 50;
    enemy.body.height = 50;
    enemy.health = 100;
    bullets = this.physics.add.group();

    this.physics.add.overlap(bullets, enemy, function(bullet, enemy) {
        enemy.health -= 10;
        bullet.destroy();
    }, null, this);
}

function update(time, delta) {
    if (enemy.health <= 0) {
        enemy.destroy();
    }

    // Move the enemy
    enemy.x += 2;

    // Fire bullets from the tower
    if (time > lastFired + 500) {
        fireBullet();
        lastFired = time;
    }
}

function fireBullet() {
    var bullet = bullets.create(tower.x, tower.y - tower.height / 2, 5, 20, 0xffffff);
    bullet.setVelocity(0, -400);
}
