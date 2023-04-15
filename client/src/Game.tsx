import { useEffect, useRef, useState } from "react";

type Message = {
  message: string;
  type: "board" | "error" | "turn" | "result" | "ready" | "info";
};

export function GamePage({
  gameId,
}: React.PropsWithChildren<{ gameId: string }>) {
  const ws = useRef<WebSocket | null>(null);
  const [errors, setErrors] = useState<string[]>([
    "Something went wrong!",
    "work pls",
  ]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setErrors(prev => [...prev, "pokazím to?"]);
    }, 5000);

    return () => {
      clearTimeout(timeout);
    }
  }, [])

  useEffect(() => {
    const conn = new WebSocket("ws://localhost:4000/ws?game_id=" + gameId);

    conn.addEventListener("message", (event) => {
      const data = JSON.parse(event.data) as Message;
      switch (data.type) {
        case "info": // TODO: show info (waiting for other player etc.)
          break;

        case "ready":
          // TODO: get ready
          break;

        case "turn":
          // TODO: whose turn?
          break;

        case "board":
          // TODO: update board
          break;

        case "result":
          // TODO: show results, end game
          break;

        case "error":
          // TODO: show error
          setErrors((prev) => [...prev, data.message]);
          break;
      }
    });

    ws.current = conn;

    return () => {
      conn.close();
    };
  }, [gameId]);

  return (
    <div className="absolute bottom-5 right-5 flex flex-col gap-2">
      {errors.map((err) => (
        <Error error={err} setErrors={setErrors} key={err} />
      ))}
    </div>
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
    console.log(progress);
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
