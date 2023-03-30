import { useContext, useEffect, useRef, useState } from "react";
import { GamePage } from "./Game";
import { connectWebsocket, disconnectWebsocket } from "./websocket";
import { WelcomePage } from "./WelcomePage";
import { BsMoonFill, BsSunFill } from "react-icons/bs";
import { ThemeContext, ThemeProvider } from "./ThemeContext";

export default function App() {
  const [gameId, setGameId] = useState<string | null>(null);
  const ws = useRef<WebSocket | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("game_id");
    if (id !== null) {
      connectWebsocket(id, ws);
    }
    setGameId(id);
    return () => {
      disconnectWebsocket(ws);
    };
  }, []);

  return (
    <ThemeProvider>
      <DarkModeSwitch className="absolute right-5 top-5 text-black dark:text-white" />
      {gameId === null ? <WelcomePage setGame={setGameId} /> : <GamePage />}
    </ThemeProvider>
  );
}

function DarkModeSwitch(
  props: React.PropsWithChildren<{ className?: string }>
) {
  const ctx = useContext(ThemeContext);

  function handleThemeChange() {
    ctx?.setTheme();
  }

  return (
    <button
      onClick={handleThemeChange}
      className={
        "rounded-xl border-2 border-sky-900 p-2 dark:bg-slate-900  dark:hover:bg-slate-900 " +
        props.className
      }
    >
      {ctx?.theme ? <BsMoonFill size={20} /> : <BsSunFill size={20} />}
    </button>
  );
}
