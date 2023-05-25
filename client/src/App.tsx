import { useContext, useEffect, useState } from "react";
import { GamePage } from "./Game";
import { WelcomePage } from "./WelcomePage";
import { BsMoonFill, BsSunFill } from "react-icons/bs";
import { ThemeContext, ThemeProvider } from "./ThemeContext";

export default function App() {
  const [gameId, setGameId] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("game_id");
    setGameId(id);
  }, []);

  return (
    <ThemeProvider>
      <DarkModeSwitch className="absolute right-5 top-5 text-black dark:text-white" />
      {gameId === null ? <WelcomePage setGame={setGameId} /> : <GamePage gameId={gameId} setGame={setGameId} />}
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
        "rounded-xl border-2 border-sky-900 p-2 dark:bg-slate-900  dark:hover:bg-slate-900 bg-sky-300 z-10 " +
        props.className
      }
    >
      {ctx?.theme ? <BsMoonFill size={20} /> : <BsSunFill size={20} />}
    </button>
  );
}
