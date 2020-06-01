import Phaser from 'phaser';
import { LevelOneScene } from '.';

class ConnectScene extends Phaser.Scene {
  private startButton: Phaser.GameObjects.Text;
  private connectionString: string;

  constructor() {
    super(ConnectScene.key());
  }

  static key() {
    return 'ConnectScene';
  }

  preload() {};

  create() {
    this.addConnectionLabel();
    this.addConnectionInputText();
    this.addConnectButton();
  };

  update() {};

  addConnectionLabel() {
    const gameWidth = parseInt(this.game.config.width.toString());
    const elementWidth = gameWidth - 100;
    const elementHeight = 30;
    const x = (elementWidth / 2) + ((gameWidth - elementWidth) / 2);
    const y = 200;
    const element = 'div';
    const style = `background-color: gray; border: 2px solid green; width: ${elementWidth}px; height: ${elementHeight}px; font: 24px Arial; padding: 5px; text-align: center;`;
    const text = 'Please enter the Web Socket connection string';
    this.add.dom(x, y, element, style, text);
  }

  addConnectionInputText() {
    const gameWidth = parseInt(this.game.config.width.toString());
    const elementWidth = gameWidth - 100;
    const elementHeight = 30;
    const x = (elementWidth / 2) + ((gameWidth - elementWidth) / 2);
    const y = 300;
    const element = 'input';
    const style = `background-color: white; border: 2px solid green; width: ${elementWidth}px; height: ${elementHeight}px; font: 24px Arial; padding: 5px; text-align: center;`;
    const connectionInputText = this.add.dom(x, y, element, style);
    connectionInputText.addListener('input');
    connectionInputText.on('input', this.updateConnectionString.bind(this));
  }

  addConnectButton() {
    const gameWidth = parseInt(this.game.config.width.toString());
    const x = (gameWidth / 2) - 130;
    const y = 400;
    const text = 'Connect and Start Game';

    this.startButton = this.add.text(x, y, text, { fill: '#0f0', font: '24px Arial' })
     .setInteractive()
     .on('pointerup', () => this.connectToSocketAndStartGame())
     .on('pointerover', () => this.enterButtonHoverState())
     .on('pointerout', () => this.enterButtonRestState());
  }

  enterButtonHoverState() {
    this.startButton.setStyle({ fill: '#ff0'});
  }

  enterButtonRestState() {
    this.startButton.setStyle({ fill: '#0f0' });
  }

  connectToSocketAndStartGame() {
    window.websocket = new WebSocket(this.connectionString);
    window.websocket.onopen = () => {
      console.debug('* Connection opened');
      console.debug('* Retrieving Connection ID'                                           );
      window.websocket.send(JSON.stringify({ action: 'connection_id' }));
    };

    window.websocket.onmessage = message => {
      const websocketMessageEvent = new CustomEvent('websocketMessage', { detail: message });
      window.dispatchEvent(websocketMessageEvent);
    }

    window.addEventListener('websocketMessage', (event: CustomEvent) => {
      try {
        const data = JSON.parse(event.detail.data);

        if (data.action === 'connection_id') {
          window.connectionId = data.data;
          console.debug('* Received Connection ID:', window.connectionId);
          window.websocket.send(JSON.stringify({ action: 'join_game' }));
          this.scene.switch(LevelOneScene.key());
        }
      } catch (error) {
        console.error(error);
      }
    });
  }

  updateConnectionString(event: { target: { value: string }}) {
    this.connectionString = event.target.value;
  }
}

export default ConnectScene;