import Phaser from 'phaser';

import * as ASSETS from '../assets';
import { ConnectScene } from '.';

class LogoScene extends Phaser.Scene {
  constructor() {
    super('LogoScene');
  }

  preload() {
    this.load.image('logo', ASSETS.LOGO);
  }

  create() {
    this.addLogo();
    this.loadNextScene();
  }

  addLogo() {
    const { height, width } = this.game.config;
    const xPosition = parseInt(width.toString()) / 2
    const yPosition = parseInt(height.toString()) / 2;
    this.add.image(xPosition, yPosition, 'logo');
  }

  loadNextScene() {
    const delayInMs = 3000;
    const config: Phaser.Types.Time.TimerEventConfig = {
      delay: delayInMs,
      callback: () => {
        this.scene.switch(ConnectScene.key());
      },
    };

    this.time.addEvent(config);
  }
}

export default LogoScene;