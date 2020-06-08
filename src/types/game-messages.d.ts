interface IGameMessage {
  action: 'connected' | 'connection_id' | 'current_connections' | 'disconnected' | 'movement';
  data: object | string | string[];
}

interface IGameConnectedMessage extends IGameMessage {
  action: 'connected';
  data: string;
}

interface IGameDisconnectedMessage extends IGameMessage {
  action: 'disconnected';
  data: string;
}

interface IGameConnectionIdMessage extends IGameMessage {
  action: 'connection_id';
  data: string;
}

interface IGameCurrentConnectionsMessage extends IGameMessage {
  action: 'current_connections';
  data: string[];
}

interface IGameMovementMessage extends IGameMessage {
  action: 'movement';
  data: {
    connectionId: string;
    x: number;
    y: number;
    directionFacing?: string;
    velocityX?: number;
    velocityY?: number;
  };
}