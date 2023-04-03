import { useEffect, useRef } from "react";

export function GamePage({
  gameId,
}: React.PropsWithChildren<{ gameId: string }>) {
  const ws = useRef<WebSocket | null>(null);

  useEffect(() => {
    const conn = new WebSocket("ws://localhost:4000/ws?game_id=" + gameId);

    conn.addEventListener("message", (event) => {
      console.log(event.data);
    });

    ws.current = conn;

    return () => {
      conn.close();
    };
  }, [gameId]);

  return <div>Game page</div>;
}
