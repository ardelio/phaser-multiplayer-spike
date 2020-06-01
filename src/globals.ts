declare global {
  interface Window {
    websocket: WebSocket;
    connectionId: string;
   }
}

export default {};