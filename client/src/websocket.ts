export function connectWebsocket(
  gameId: string,
  ws: React.MutableRefObject<WebSocket | null>
) {
  console.log("Connecting to ws...");
}

export function disconnectWebsocket(
  ws: React.MutableRefObject<WebSocket | null>
) {
  console.log("Disconnecting ws...");
}
