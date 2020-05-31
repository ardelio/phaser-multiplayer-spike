import Phaser, { Physics, GameObjects } from 'phaser';

import * as ASSETS from './assets'

const FPS = 60;
const FIRST_FRAME = 1;

export default class Demo extends Phaser.Scene {
  private platforms: Phaser.Physics.Arcade.StaticGroup;
  private player: Phaser.Physics.Arcade.Sprite;
  private connectionId: string;
  private enemies: { [connectionId: string]: Phaser.Physics.Arcade.Sprite };
  private stars: Phaser.Physics.Arcade.Group;
  private score: number;
  private scoreText: GameObjects.Text;
  private messagesSent: number;
  private messagesSentText: GameObjects.Text;
  private lastDirectionFacing: string;
  private frame: number;
  private websocket: WebSocket;
  private bombs: Phaser.Physics.Arcade.Group;

  constructor() {
    super('demo');
    this.score = 0;
    this.messagesSent = 0;
    this.frame = FIRST_FRAME;
    this.enemies = {};
    this.lastDirectionFacing = 'turn';
  }

  preload() {
    this.websocket = new WebSocket('wss://o26ozxm4vj.execute-api.ap-southeast-2.amazonaws.com/dev');
    this.websocket.onopen = event => {
      console.debug('* Connection opened');
      console.debug('* Retrieving Connection ID'                                           );
      this.websocket.send(JSON.stringify({ action: 'connection_id' }));
    };
    this.websocket.onmessage = this.onMessage.bind(this);

    this.load.image('ground', ASSETS.GROUND);
    this.load.spritesheet('player', ASSETS.PLAYER, { frameWidth: 32, frameHeight: 48 });
    this.load.spritesheet('enemy', ASSETS.ENEMY, { frameWidth: 32, frameHeight: 48 });
    this.load.image('star', ASSETS.STAR);
    this.load.image('sky', ASSETS.SKY);
    this.load.image('bomb', ASSETS.BOMB);
  }

  create() {
    this.physics.world.setFPS(FPS);
    this.platforms = this.physics.add.staticGroup()
    this.add.image(400, 300, 'sky');
    this.scoreText = this.add.text(16, 16, 'Score: 0', { fontSize: '32px', fill: '#000' });
    this.messagesSentText = this.add.text(250, 16, 'Messages sent: 0', { fontSize: '32px', fill: '#000' });
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

    this.bombs = this.physics.add.group();
    this.physics.add.collider(this.bombs, platforms);
    this.physics.add.collider(player, this.bombs, this.hitBomb, null, this);

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

    this.anims.create({
      key: 'left_enemy',
      frames: this.anims.generateFrameNumbers('enemy', { start: 0, end: 3 }),
      frameRate: 10,
      repeat: -1
    });

    this.anims.create({
        key: 'turn_enemy',
        frames: [ { key: 'enemy', frame: 4 } ],
        frameRate: 20
    });

    this.anims.create({
        key: 'right_enemy',
        frames: this.anims.generateFrameNumbers('enemy', { start: 5, end: 8 }),
        frameRate: 10,
        repeat: -1
    });
  }

  update() {
    this.updateFrame();
    const { player } = this;
    const cursors = this.input.keyboard.createCursorKeys();

    if (cursors.left.isDown) {
      this.sendMessage('left', player.x, player.y, -160);
      player.setVelocityX(-160);
      player.anims.play('left', true);
    } else if (cursors.right.isDown) {
      this.sendMessage('right', player.x, player.y, 160);
      player.setVelocityX(160);
      player.anims.play('right', true);
    } else {
      this.sendMessage('turn', player.x, player.y, 0);
      player.setVelocityX(0);
      player.anims.play('turn');
    }

    if (cursors.up.isDown && player.body.touching.down) {
      player.setVelocityY(-330);
      this.sendMessage(undefined, player.x, player.y, undefined, -330);
    }
  }

  collectStar(player: Physics.Arcade.Sprite, star: Physics.Arcade.Image) {
    star.disableBody(true, true);

    this.score += 10;
    this.scoreText.setText('Score: ' + this.score);

    if (this.stars.countActive(true) === 0)
    {
        this.stars.children.iterate((child: Physics.Arcade.Image) => {
            child.enableBody(true, child.x, 0, true, true);
        });

        const x = (player.x < 400) ? Phaser.Math.Between(400, 800) : Phaser.Math.Between(0, 400);

        var bomb = this.bombs.create(x, 16, 'bomb');
        bomb.setBounce(1);
        bomb.setCollideWorldBounds(true);
        bomb.setVelocity(Phaser.Math.Between(-200, 200), 20);
    }
  }

  sendMessage(directionFacing:string, x:number, y: number, velocityX?: number, velocityY?: number) {
    if (this.lastDirectionFacing === directionFacing) {
      return
    }
    console.debug('Direction facing (last, next):', this.lastDirectionFacing, directionFacing)
    if (typeof directionFacing !== 'undefined') {
      this.lastDirectionFacing = directionFacing;
    }

    let data;

    data = { x, y };

    if (typeof directionFacing !== 'undefined') {
      data = {...data, directionFacing };
    }

    if (typeof velocityX !== 'undefined') {
      data = {...data, velocityX }
    }

    if (typeof velocityY !== 'undefined') {
      data = {...data, velocityY }
    }

    this.messagesSent += 1;
    this.messagesSentText.setText('Messages sent: ' + this.messagesSent);
    this.websocket.send(JSON.stringify({ action: 'movement', data }));
  }

  updateFrame() {
    const shouldResetFrame = this.frame % FPS === 0;
    this.frame = shouldResetFrame ? 1 : this.frame + 1;
  }

  onMessage(event: MessageEvent) {
    try {
      const data = JSON.parse(event.data);
      console.debug('* Received message event:', event.data);
      if (data.action === 'connection_id') {
        this.connectionId = data.data;
        console.debug('* Received Connection ID:', this.connectionId);
        this.websocket.send(JSON.stringify({ action: 'join_game' }));
      }

      if (data.action === 'movement') {
        const { connectionId, directionFacing, x, y, velocityX, velocityY } = data.data;
        if ( connectionId === this.connectionId) {
          return
        }
        if (typeof this.enemies[connectionId] === 'undefined') {
          console.log('Adding enemy', x, y)
          const enemy = this.physics.add.sprite(x, y, 'enemy');
          enemy.setBounce(0.2);
          enemy.setCollideWorldBounds(true);
          this.physics.add.collider(enemy, this.platforms);
          this.enemies[connectionId] = enemy;
        } else {
          this.enemies[connectionId].setX(x);
          this.enemies[connectionId].setY(y);
        }

        if (typeof velocityX !== 'undefined') {
          this.enemies[connectionId].setVelocityX(velocityX);
        }

        if (typeof velocityY !== 'undefined') {
          this.enemies[connectionId].setVelocityY(velocityY);
        }

        if (typeof directionFacing !== 'undefined') {
          if(directionFacing === 'left' || directionFacing === 'right') {
            this.enemies[connectionId].anims.play(`${directionFacing}_enemy`, true);
          } else {
            this.enemies[connectionId].anims.play(`${directionFacing}_enemy`);
          }
        }
      }
    } catch (error) {}
  }

  hitBomb (player: Physics.Arcade.Sprite, bomb: Physics.Arcade.Image) {
    this.physics.pause();
    player.setTint(0xff0000);
    player.anims.play('turn');
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

new Phaser.Game(config);
