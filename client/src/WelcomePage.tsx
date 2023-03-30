import { useState } from "react";

export function WelcomePage({
  setGame,
}: {
  setGame: React.Dispatch<React.SetStateAction<string | null>>;
}) {
  const [gameId, setGameId] = useState<string | null>(null);
  const [gameIdInput, setGameIdInput] = useState("");

  function createGameHandler() {
    fetch("http://localhost:4000/new-game", {
      method: "POST",
    }).then((response) => {
      response.json().then((body) => {
        setGameId(body.game_id);
      });
    });
  }

  function joinGameHandler() {
    if (gameId) {
      setGame(gameId);
    } else {
      setGame(gameIdInput);
    }
  }

  return (
    <main className="flex h-screen flex-col items-center justify-center gap-12">
      {gameId ? (
        <p className="dark:text-white">{gameId}</p>
      ) : (
        <>
          <Button onClick={createGameHandler}>Create new game</Button>
          <hr className="line-mask h-0.5 w-full bg-black dark:bg-white md:w-1/2" />
          <input
            className="active:border-sky-40 w-96 rounded-xl border-2 border-sky-900 bg-sky-100 p-2 text-center text-xl focus-visible:border-sky-400 focus-visible:outline-none active:border-sky-400 dark:bg-slate-900 dark:text-white"
            type="text"
            value={gameIdInput}
            onChange={(e) => setGameIdInput(e.currentTarget.value)}
            placeholder="GAME ID"
            readOnly={gameId ? true : false}
          />
        </>
      )}
      <Button onClick={joinGameHandler}>Join game</Button>
    </main>
  );
}

function Button(
  props: React.PropsWithChildren<{ onClick?: () => void; className?: string }>
) {
  return (
    <button
      onClick={props.onClick}
      className={
        "rounded-xl bg-cyan-500 px-4 py-2 text-white transition-colors hover:bg-cyan-600 " +
        props.className
      }
    >
      {props.children}
    </button>
  );
}
