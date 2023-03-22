import { useEffect, useRef, useState } from "react";
import { GamePage } from "./Game";
import { connectWebsocket } from "./websocket";
import { WelcomePage } from "./WelcomePage";

function App() {
  const [gameId, setGameId] = useState<string | null>(null);
  const ws = useRef<WebSocket | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("game_id");
    if (id !== null) {
      connectWebsocket(id);
    }
    setGameId(id);
    return () => {
      console.log("disconnect...");
    };
  }, []);

  return gameId === null ? <WelcomePage ws={ws} /> : <GamePage />;
}

export default App;
