import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

type Message = {
  message: string;
  type: "board" | "error" | "turn" | "result" | "ready" | "info";
};

export function GamePage({
  gameId,
}: React.PropsWithChildren<{ gameId: string }>) {
  const ws = useRef<WebSocket | null>(null);
  const [errors, setErrors] = useState<string[]>([]);

  const [modal, _setModal] = useState<string | null>(null);
  const modalRef = useRef(modal);
  const [readyButton, setReadyButton] = useState(false);
  const [board, setBoard] = useState<string[] | null>(null);
  const [playingPlayer, setPlayingPlayer] = useState<
    "Your turn" | "Other player's turn" | null
  >(null);

  function setModal(value: string | null) {
    modalRef.current = value;
    _setModal(value);
  }

  useEffect(() => {
    const conn = new WebSocket("ws://localhost:4000/ws?game_id=" + gameId);

    conn.addEventListener("message", (event) => {
      const data = JSON.parse(event.data) as Message;
      console.log(data);
      switch (data.type) {
        case "info":
          setModal(data.message);
          break;

        case "ready":
          setModal(data.message);
          setReadyButton(true);
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

        case "result":
          // TODO: show results, end game, go back home
          setModal(data.message);
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

  function readyHandler() {
    console.log(ws.current);
    ws.current?.send(
      JSON.stringify({
        message: "Ready",
      })
    );
    console.log(modal);
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
          {readyButton && (
            <button
              onClick={readyHandler}
              className="mx-auto block rounded-xl border-2 border-sky-900 bg-sky-300 p-1  dark:bg-slate-900 dark:text-white dark:hover:bg-slate-900"
            >
              Ready
            </button>
          )}
        </Modal>
      )}
      {errors.length !== 0 && (
        <ErrorsList errors={errors} setErrors={setErrors} />
      )}
      <h1 className="text-white">{playingPlayer}</h1>
      {board && (
        <Board
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
    <div className="absolute left-0 top-0 z-40 flex h-full w-full items-center justify-center bg-black bg-opacity-30">
      <div className="rounded-2xl bg-slate-700 p-5 dark:text-white">
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
}: {
  board: string[];
  playHandler: (index: number) => void;
  playingPlayer: "Your turn" | "Other player's turn";
}) {
  return (
    <div className="grid grid-cols-3 grid-rows-3 text-white pt-28 w-fit mx-auto">
      {board.map((field, index) => (
        <button
          className="h-20 w-20 border-2 border-white p-3 text-6xl"
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
    </div>
  );
}
