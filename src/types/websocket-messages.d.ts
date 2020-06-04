interface IWebsocketConnectionIdMessage {
  action: 'connection-id';
  data: string;
}

interface IWebsocketMovementMessage {
  action: 'connection-id';
  data: IMovementData;
}

interface IMovementData {
  x: number,
  y: number,
  velocityX?: number,
  velocityY?: number,
  directionFacing?: string,
  connectionId?: string,
}