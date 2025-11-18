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

    // Carga de audios
    scene.load.audio('shoot', 'assets/audio/shoot.mp3');
    scene.load.audio('explosion1', 'assets/audio/explosion1.mp3');
    scene.load.audio('explosion2', 'assets/audio/explosion2.mp3');
    scene.load.audio('explosion3', 'assets/audio/explosion3.mp3');
    scene.load.audio('music1', 'assets/audio/music1.mp3');
    scene.load.audio('music2', 'assets/audio/music2.mp3');
  }

  setup() {
    // Agrega los sonidos al sistema de audio
    this.sounds['shoot'] = this.scene.sound.add('shoot');
    this.sounds['explosion1'] = this.scene.sound.add('explosion1');
    this.sounds['explosion2'] = this.scene.sound.add('explosion2');
    this.sounds['explosion3'] = this.scene.sound.add('explosion3');
    this.sounds['music1'] = this.scene.sound.add('music1');
    this.sounds['music2'] = this.scene.sound.add('music2');

    // Reproducción alternada entre músicas
    this.sounds['music1'].once('complete', () => {
      this.scene.time.delayedCall(15000, () => this.sounds['music2'].play({ volume: 0.5 }));
    });

    this.sounds['music2'].once('complete', () => {
      this.scene.time.delayedCall(15000, () => this.sounds['music1'].play({ volume: 0.5 }));
    });
  }

  play(key, opt = {}) {
    const sound = this.sounds[key];
    if (!sound) return;

    if (opt.volume !== undefined) sound.setVolume(opt.volume);
    if (opt.loop !== undefined) sound.setLoop(opt.loop);
    if (opt.rate !== undefined) sound.setRate(opt.rate);

    sound.play();
  }

  stop(key) {
    const sound = this.sounds[key];
    if (sound && sound.isPlaying) {
      sound.stop();
    }
  }

  stopAll() {
    Object.values(this.sounds).forEach(sound => {
      if (sound.isPlaying) sound.stop();
    });
  }

  // ejemplo de volumen global si lo querés usar más adelante
  setGlobalVolume(volume) {
    this.scene.sound.volume = Phaser.Math.Clamp(volume, 0, 1);
  }

  static sounds = {
    shoot: 'shoot',
    explosion1: 'explosion1',
    explosion2: 'explosion2',
    explosion3: 'explosion3',
    music1: 'music1',
    music2: 'music2'
  };
}
