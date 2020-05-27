import Phaser from 'phaser';

const ASSETS = {
  LOGO: require('./assets/logo.png') as string,
};

export default class Demo extends Phaser.Scene {
  constructor() {
    super('demo');
  }

  preload() {
    this.load.image('logo', ASSETS.LOGO);
  }

  create() {
    this.add.image(400, 440, 'logo');
  }

  update() {}
}

const config : Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'phaser-game-canvas',
  width: 800,
  height: 600,
  scene: Demo,
};

const game = new Phaser.Game(config);
