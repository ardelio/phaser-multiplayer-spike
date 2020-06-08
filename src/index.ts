import Phaser from 'phaser';

import {
  ConnectScene,
  GameScene,
  LogoScene,
} from './scenes';

const config : Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'phaser-game-canvas',
  width: 800,
  height: 600,
  dom: {
    createContainer: true
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 300 },
      debug: false,
    },
  },
  scene: [ LogoScene, ConnectScene, GameScene ],
};

new Phaser.Game(config);
