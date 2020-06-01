import Phaser from 'phaser';

import * as ASSETS from '../assets';
import { ConnectScene } from '.';

const NEXT_SCENE_DELAY_IN_MILLISECONDS = 3000;

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
    const config: Phaser.Types.Time.TimerEventConfig = {
      delay: NEXT_SCENE_DELAY_IN_MILLISECONDS,
      callback: () => {
        this.scene.switch(ConnectScene.key());
      },
    };

    this.time.addEvent(config);
  }
}

export default LogoScene;