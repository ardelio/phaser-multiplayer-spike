import Phaser from 'phaser';

import * as ASSETS from '../assets'

class GameScene extends Phaser.Scene {
  private connectionId: string;
  private enemies: { [connectionId: string]: Phaser.Physics.Arcade.Sprite };
  private lastDirectionFacing: string;
  private messagesSent: number;
  private messagesSentText: Phaser.GameObjects.Text;
  private platforms: Phaser.Physics.Arcade.StaticGroup;
  private player: Phaser.Physics.Arcade.Sprite;

  constructor() {
    super(GameScene.key());
    this.enemies = {};
    this.lastDirectionFacing = 'turn';
    this.messagesSent = 0;
  }

  static key() {
    return 'GameScene';
  }

  preload() {
    window.addEventListener('gameMessage', this.onGameMessage.bind(this));
    this.getExistingPlayers();

    this.load.image('sky', ASSETS.SKY);
    this.load.image('ground', ASSETS.GROUND);
    this.load.spritesheet('player', ASSETS.PLAYER, { frameWidth: 32, frameHeight: 48 });
    this.load.spritesheet('enemy', ASSETS.ENEMY, { frameWidth: 32, frameHeight: 48 });
  }

  create() {
    this.add.image(400, 300, 'sky');
    this.messagesSentText = this.add.text(0, 16, 'Messages sent: 0', { fontSize: '32px', fill: '#000' });

    this.player = this.physics.add.sprite(100, 450, 'player');
    this.player.setBounce(0.2);
    this.player.setCollideWorldBounds(true);

    this.platforms = this.physics.add.staticGroup();
    this.platforms.create(400, 568, 'ground').setScale(2).refreshBody();
    this.platforms.create(600, 400, 'ground');
    this.platforms.create(50, 250, 'ground');
    this.platforms.create(750, 220, 'ground');

    this.physics.add.collider(this.player, this.platforms);

    this.createAnimations('player');
    this.createAnimations('enemy');
  }

  update() {
    this.handlePlayerMovement();
  }

  handlePlayerMovement() {
    const { player } = this;
    const cursors = this.input.keyboard.createCursorKeys();

    if (cursors.left.isDown) {
      this.sendMovementMessage({ directionFacing: 'left', x: player.x, y: player.y, velocityX: -160 });
      player.setVelocityX(-160);
      player.anims.play('player-left', true);
    } else if (cursors.right.isDown) {
      this.sendMovementMessage({ directionFacing: 'right', x: player.x, y: player.y, velocityX: 160 });
      player.setVelocityX(160);
      player.anims.play('player-right', true);
    } else {
      this.sendMovementMessage({ directionFacing: 'turn', x: player.x, y: player.y, velocityX: 0 });
      player.setVelocityX(0);
      player.anims.play('player-turn');
    }

    if (cursors.up.isDown && player.body.touching.down) {
      player.setVelocityY(-330);
      this.sendMovementMessage({ x: player.x, y: player.y, velocityY: -330 });
    }
  }

  createAnimations(characterKey: string) {
    this.anims.create({
      key: `${characterKey}-left`,
      frames: this.anims.generateFrameNumbers(characterKey, { start: 0, end: 3 }),
      frameRate: 10,
      repeat: -1
    });

    this.anims.create({
        key: `${characterKey}-turn`,
        frames: [ { key: characterKey, frame: 4 } ],
        frameRate: 20
    });

    this.anims.create({
        key: `${characterKey}-right`,
        frames: this.anims.generateFrameNumbers(characterKey, { start: 5, end: 8 }),
        frameRate: 10,
        repeat: -1
    });
  }

  sendMovementMessage(movementData: Omit<IGameMovementMessage['data'], 'connectionId'>) {
    const playerHasNotChangeDirection = this.lastDirectionFacing === movementData.directionFacing;
    if (playerHasNotChangeDirection) {
      return
    }

    console.debug('* Player changed direction');

    if (typeof movementData.directionFacing !== 'undefined') {
      this.lastDirectionFacing = movementData.directionFacing;
    }

    const data: IGameMovementMessage['data'] = { ...movementData, connectionId: this.connectionId };
    window.websocket.send(JSON.stringify({ action: 'movement', data }));

    this.messagesSent += 1;
    this.messagesSentText.setText('Messages sent: ' + this.messagesSent);
  }

  onGameMessage(event: CustomEvent) {
    try {
      const data = JSON.parse(event.detail.data);

      console.debug('* Received websocket message:', data);

      if (data.action === 'connected') {
        const gameConnectedMessage: IGameConnectedMessage = data;
        const { data: connectionId } = gameConnectedMessage;

        const isWeirdlyThisConnectionId = connectionId === this.connectionId;
        const alreadyExistsInGame = typeof this.enemies[connectionId] !== 'undefined';

        if (isWeirdlyThisConnectionId || alreadyExistsInGame) {
          return;
        }

        this.addEnemy(connectionId);
      }

      if (data.action === 'current_connections') {
        const gameCurrentConnectionsMessage: IGameCurrentConnectionsMessage = data;
        const { data: connectionIds } = gameCurrentConnectionsMessage;

        connectionIds.forEach(connectionId => {
          const isWeirdlyThisConnectionId = connectionId === this.connectionId;
          const alreadyExistsInGame = typeof this.enemies[connectionId] !== 'undefined';

          if (isWeirdlyThisConnectionId || alreadyExistsInGame) {
            return;
          }

          this.addEnemy(connectionId);
        });
      }

      if (data.action === 'movement') {
        const gameMovementMessage: IGameMovementMessage = data;
        const { connectionId, directionFacing, x, y, velocityX, velocityY } = gameMovementMessage.data;

        if ( connectionId === this.connectionId) {
          return;
        }

        this.enemies[connectionId].setX(x);
        this.enemies[connectionId].setY(y);

        if (typeof velocityX !== 'undefined') {
          this.enemies[connectionId].setVelocityX(velocityX);
        }

        if (typeof velocityY !== 'undefined') {
          this.enemies[connectionId].setVelocityY(velocityY);
        }

        if (typeof directionFacing !== 'undefined') {
          if(directionFacing === 'left' || directionFacing === 'right') {
            this.enemies[connectionId].anims.play(`enemy-${directionFacing}`, true);
          } else {
            this.enemies[connectionId].anims.play(`enemy-${directionFacing}`);
          }
        }
      }

      if (data.action === 'disconnected') {
        const gameConnectedMessage: IGameDisconnectedMessage = data;
        const { data: connectionId } = gameConnectedMessage;

        if ( connectionId === this.connectionId) {
          return;
        }

        console.log('* Enemy left the game with Connection ID:', connectionId);

        this.enemies[connectionId].destroy();
        delete this.enemies[connectionId];
      }
    } catch (error) {
      console.error(error);
    }
  }

  addEnemy(connectionId: string) {
    console.log('* Enemy joined the game with Connection ID:', connectionId);

    const enemy = this.physics.add.sprite(100, 450, 'enemy');
    enemy.setBounce(0.2);
    enemy.setCollideWorldBounds(true);
    this.physics.add.collider(enemy, this.platforms);
    this.enemies[connectionId] = enemy;
  }

  getExistingPlayers() {
    console.log('* Retrieving existing players.');
    window.websocket.send(JSON.stringify({ action: 'current_connections' }));
  }
}

export default GameScene;