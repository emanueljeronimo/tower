// AudioManager.js
export class AudioManager {
  static instance;

  constructor(scene) {
    if (AudioManager.instance) {
      return AudioManager.instance;
    }

    this.scene = scene;
    this.sounds = {};
    AudioManager.instance = this;
    
    scene.load.audio('shoot', 'assets/audio/shoot.wav');
    scene.load.audio('explosion1', 'assets/audio/explosion1.wav');
    scene.load.audio('explosion2', 'assets/audio/explosion2.wav');
    scene.load.audio('explosion3', 'assets/audio/explosion3.wav');
    /*scene.load.audio('explosion', 'assets/audio/explosion.mp3');
    scene.load.audio('music', 'assets/audio/music.mp3');*/  
  }

  setup() {
    this.sounds['shoot'] = this.scene.sound.add('shoot');
    this.sounds['explosion1'] = this.scene.sound.add('explosion1');
    this.sounds['explosion2'] = this.scene.sound.add('explosion2');
    this.sounds['explosion3'] = this.scene.sound.add('explosion3');
    /*this.sounds['explosion'] = this.scene.sound.add('explosion');
    this.sounds['music'] = this.scene.sound.add('music', { loop: true });*/
  }

  play(key) {
    this.sounds[key].play();
  }

  stop(key) {
    this.sounds[key].stop();
  }

  static sounds =
  {
    shoot: 'shoot'
  }
}
