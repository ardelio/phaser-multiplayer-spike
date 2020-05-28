import Phaser, { Physics, GameObjects } from 'phaser';

import * as ASSETS from './assets'

export default class Demo extends Phaser.Scene {
  private platforms: Phaser.Physics.Arcade.StaticGroup;
  private player: Phaser.Physics.Arcade.Sprite;
  private stars: Phaser.Physics.Arcade.Group;
  private score: number;
  private scoreText: GameObjects.Text;

  constructor() {
    super('demo');
    this.score = 0;
  }

  preload() {
    this.load.image('ground', ASSETS.GROUND);
    this.load.spritesheet('player', ASSETS.PLAYER, { frameWidth: 32, frameHeight: 48 });
    this.load.image('star', ASSETS.STAR);
    this.load.image('sky', ASSETS.SKY);
  }

  create() {
    this.platforms = this.physics.add.staticGroup()
    this.add.image(400, 300, 'sky');
    this.scoreText = this.add.text(16, 16, 'score: 0', { fontSize: '32px', fill: '#000' });
    this.player = this.physics.add.sprite(100, 450, 'player');

    const { platforms, player } = this;

    platforms.create(400, 568, 'ground').setScale(2).refreshBody();
    platforms.create(600, 400, 'ground');
    platforms.create(50, 250, 'ground');
    platforms.create(750, 220, 'ground');

    player.setBounce(0.2);
    player.setCollideWorldBounds(true);

    this.physics.add.collider(player, platforms);

    this.stars = this.physics.add.group({
      key: 'star',
      repeat: 11,
      setXY: { x: 12, y: 0, stepX: 70 }
    });

    const { stars } = this;

    stars.children.iterate(child => {
        (child.body as Phaser.Physics.Arcade.Body).setBounceY(Phaser.Math.FloatBetween(0.4, 0.8));
    });

    this.physics.add.collider(stars, platforms);

    this.physics.add.overlap(player, stars, this.collectStar, null, this);

    this.anims.create({
        key: 'left',
        frames: this.anims.generateFrameNumbers('player', { start: 0, end: 3 }),
        frameRate: 10,
        repeat: -1
    });

    this.anims.create({
        key: 'turn',
        frames: [ { key: 'player', frame: 4 } ],
        frameRate: 20
    });

    this.anims.create({
        key: 'right',
        frames: this.anims.generateFrameNumbers('player', { start: 5, end: 8 }),
        frameRate: 10,
        repeat: -1
    });
  }

  update() {
    const { player } = this;
    const cursors = this.input.keyboard.createCursorKeys();

    if (cursors.left.isDown) {
      player.setVelocityX(-160);
      player.anims.play('left', true);
    } else if (cursors.right.isDown) {
      player.setVelocityX(160);
      player.anims.play('right', true);
    } else {
      player.setVelocityX(0);
      player.anims.play('turn');
    }

    if (cursors.up.isDown && player.body.touching.down) {
      player.setVelocityY(-330);
    }
  }

  collectStar(player: Physics.Arcade.Sprite, star: Physics.Arcade.Image) {
    star.disableBody(true, true);

    this.score += 10;
    this.scoreText.setText('Score: ' + this.score);
  }
}

const config : Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'phaser-game-canvas',
  width: 800,
  height: 600,
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 300 },
      debug: false,
    },
  },
  scene: Demo,
};

const game = new Phaser.Game(config);
