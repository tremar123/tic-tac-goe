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

  const [modal, setModal] = useState<string | null>(null);
  const [readyButton, setReadyButton] = useState(false);
  const [board, setBoard] = useState<string[] | null>(null);
  const [playingPlayer, setPlayingPlayer] = useState<
    "Your turn" | "Other player's turn" | null
  >(null);

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
          // TODO: whose turn?
          // @ts-ignore
          setPlayingPlayer(data.message);
          if (modal) setModal(null);
          break;

        case "board":
          // TODO: update board
          break;

        case "result":
          // TODO: show results, end game
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
    console.log(ws.current)
    ws.current?.send("Ready");
    setModal("Waiting for other player to get ready");
    setReadyButton(false);
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
    </>
  );
}

function ErrorsList(props: {
  errors: string[];
  setErrors: React.Dispatch<React.SetStateAction<string[]>>;
}) {
  return createPortal(
    <div className="absolute bottom-5 right-5 flex flex-col gap-2 z-50">
      {props.errors.map((err) => (
        <Error error={err} setErrors={props.setErrors} key={err} />
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
    <div className="absolute left-0 top-0 w-full h-full bg-black bg-opacity-30 flex justify-center items-center z-40">
      <div className="rounded-2xl bg-slate-700 dark:text-white p-5">
        {props.children}
      </div>
    </div>,
    document.querySelector("#overlay")!
  );
}
