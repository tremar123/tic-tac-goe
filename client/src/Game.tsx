import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

type Message = {
  message: string;
  type: "board" | "error" | "turn" | "result" | "ready" | "info" | "pattern";
};

const wsUrl = `${import.meta.env.PROD ? "wss://" : "ws://"}${
  import.meta.env.VITE_API_URL
}`;

export function GamePage({
  gameId,
  setGame,
}: React.PropsWithChildren<{
  gameId: string;
  setGame: React.Dispatch<React.SetStateAction<string | null>>;
}>) {
  const ws = useRef<WebSocket | null>(null);
  const [errors, setErrors] = useState<string[]>([]);

  const [modal, _setModal] = useState<string | null>(null);
  const modalRef = useRef(modal);
  const [readyButton, setReadyButton] = useState(false);
  const [goBackButton, setGoBackButton] = useState(false);
  const [board, setBoard] = useState<string[] | null>(null);
  const [winningPattern, setWinningPattern] = useState<number[] | null>(null);
  const [playingPlayer, setPlayingPlayer] = useState<
    "Your turn" | "Other player's turn" | null
  >(null);

  function setModal(value: string | null) {
    modalRef.current = value;
    _setModal(value);
  }

  useEffect(() => {
    const conn = new WebSocket(`${wsUrl}/api/ws?game_id=` + gameId);

    conn.addEventListener("message", (event) => {
      const data = JSON.parse(event.data) as Message;
      switch (data.type) {
        case "info":
          setModal(data.message);
          break;

        case "ready":
          setReadyButton(true);
          setModal(data.message);
          break;

        case "turn":
          // @ts-ignore
          setPlayingPlayer(data.message);

          // if game did not start yet
          if (modalRef.current) {
            setModal(null);
            setBoard(Array(9).fill(""));
          }
          break;

        case "board":
          // @ts-ignore - how to do types on fetch?
          setBoard(data.message);
          break;

        case "pattern":
          // @ts-ignore
          setWinningPattern(data.message);
          break;

        case "result":
          setModal(data.message);
          setGoBackButton(true);
          ws.current = null;
          window.history.replaceState({}, document.title, "/");
          break;

        case "error":
          setErrors((prev) => [...prev, data.message]);
          break;
      }
    });

    ws.current = conn;

    return () => {
      conn.close();
    };
  }, [gameId]);

  function goBackHandler() {
    setGame(null);
  }

  function readyHandler() {
    ws.current?.send(
      JSON.stringify({
        message: "Ready",
      })
    );
    setModal("Waiting for other player to get ready");
    setReadyButton(false);
  }

  function playHandler(index: number) {
    ws.current?.send(
      JSON.stringify({
        message: index,
      })
    );
  }

  return (
    <>
      {modal && (
        <Modal>
          <p>{modal}</p>
          {readyButton || goBackButton ? (
            <button
              onClick={readyButton ? readyHandler : goBackHandler}
              className="mx-auto block rounded-xl border-2 border-sky-900 bg-blue-500 p-1 text-xl dark:bg-slate-900 px-5 text-white dark:hover:bg-slate-900"
            >
              {readyButton ? "Ready" : "Go back"}
            </button>
          ) : null}
        </Modal>
      )}
      {errors.length !== 0 && (
        <ErrorsList errors={errors} setErrors={setErrors} />
      )}
      <h1 className="text-white">{playingPlayer}</h1>
      {board && (
        <Board
          winningPattern={winningPattern}
          board={board}
          playHandler={playHandler}
          playingPlayer={playingPlayer!}
        />
      )}
    </>
  );
}

function ErrorsList(props: {
  errors: string[];
  setErrors: React.Dispatch<React.SetStateAction<string[]>>;
}) {
  return createPortal(
    <div className="absolute bottom-5 right-5 z-50 flex flex-col gap-2">
      {props.errors.map((err, index) => (
        <Error error={err} setErrors={props.setErrors} key={index} />
      ))}
    </div>,
    document.querySelector("#errors")!
  );
}

function Error(props: {
  error: string;
  setErrors: React.Dispatch<React.SetStateAction<string[]>>;
}) {
  const [progress, setProgress] = useState(100);
  const interval = useRef<number>();

  useEffect(() => {
    interval.current = setInterval(() => setProgress((prev) => prev - 1), 100);

    return () => {
      clearInterval(interval.current);
    };
  }, []);

  useEffect(() => {
    if (progress === 0) {
      props.setErrors((prev) => {
        const newArr = prev.filter((err) => err !== props.error);
        return newArr;
      });
      clearInterval(interval.current);
    }
  }, [progress]);

  return (
    <div className="relative overflow-hidden rounded-xl bg-red-500 p-3 text-lg text-white">
      {props.error}
      <div
        style={{ width: `${progress}%` }}
        className="absolute bottom-0 left-0 h-1 bg-white transition-all duration-100"
      ></div>
    </div>
  );
}

function Modal(props: React.PropsWithChildren) {
  return createPortal(
    <div className="absolute left-0 top-0 z-40 flex h-full w-full items-center justify-center bg-white dark:bg-black !bg-opacity-30">
      <div className="rounded-2xl bg-sky-300 dark:bg-slate-700 p-8 dark:text-white text-2xl fotn-bold flex flex-col gap-8 shadow text-center">
        {props.children}
      </div>
    </div>,
    document.querySelector("#overlay")!
  );
}

function Board({
  board,
  playHandler,
  playingPlayer,
  winningPattern,
}: {
  board: string[];
  playHandler: (index: number) => void;
  playingPlayer: "Your turn" | "Other player's turn";
  winningPattern: number[] | null;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!winningPattern) {
      return;
    }

    const firstField = document.querySelector(
      `[data-index="${winningPattern[0]}"]`
    )!;
    const lastField = document.querySelector(
      `[data-index="${winningPattern[2]}"]`
    )!;

    const firstFieldRect = firstField.getBoundingClientRect();
    const lastFieldRect = lastField.getBoundingClientRect();

    const firstFieldCenter = {
      x: firstFieldRect.x + firstFieldRect.width / 2,
      y: firstFieldRect.y + firstFieldRect.height / 2,
    };
    const lastFieldCenter = {
      x: lastFieldRect.x + lastFieldRect.width / 2,
      y: lastFieldRect.y + lastFieldRect.height / 2,
    };

    window.requestAnimationFrame(draw);

    function draw() {
      const canvas = canvasRef.current!;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      const context = canvas.getContext("2d")!;
      context.strokeStyle = "blue";
      context.lineWidth = 4;

      context.beginPath();
      context.moveTo(firstFieldCenter.x, firstFieldCenter.y);
      context.lineTo(lastFieldCenter.x, lastFieldCenter.y);
      context.stroke();
    }
  }, [winningPattern]);

  return (
    <div className="grid grid-cols-3 grid-rows-3 text-black dark:text-white border-2 border-black dark:border-white h-fit mt-28 w-fit mx-auto">
      {board.map((field, index) => (
        <button
          className="h-20 w-20 border-2 dark:border-white border-black p-3 text-6xl"
          key={index}
          onClick={(event) => {
            if (
              event.currentTarget.innerHTML !== "" ||
              playingPlayer !== "Your turn"
            )
              return;
            playHandler(+event.currentTarget.dataset.index!);
          }}
          data-index={index}
        >
          {field}
        </button>
      ))}
      <canvas
        ref={canvasRef}
        className="h-full w-full absolute pointer-events-none left-0 top-0"
      />
    </div>
  );
}
