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

    scene.load.audio('shoot', 'assets/audio/shoot.mp3');
    scene.load.audio('explosion1', 'assets/audio/explosion1.mp3');
    scene.load.audio('explosion2', 'assets/audio/explosion2.mp3');
    scene.load.audio('explosion3', 'assets/audio/explosion3.mp3');
    scene.load.audio('music1', 'assets/audio/music1.mp3');
    scene.load.audio('music2', 'assets/audio/music2.mp3');
  }

  setup() {
    this.sounds['shoot'] = this.scene.sound.add('shoot');
    this.sounds['explosion1'] = this.scene.sound.add('explosion1');
    this.sounds['explosion2'] = this.scene.sound.add('explosion2');
    this.sounds['explosion3'] = this.scene.sound.add('explosion3');
    this.sounds['music1'] = this.scene.sound.add('music1');
    this.sounds['music2'] = this.scene.sound.add('music2');

    this.sounds['music1'].once('complete', () => {
      this.sounds['music2'].play();
    });

    this.sounds['music2'].once('complete', () => {
      this.sounds['music1'].play();
    });

  }

  play(key, opt) {
    this.sounds[key].play(opt);
  }

  stop(key) {
    this.sounds[key].stop();
  }

  static sounds =
    {
      shoot: 'shoot'
    }
}
