export function WelcomePage({
  ws,
}: {
  ws: React.MutableRefObject<WebSocket | null>;
}) {
  return (
    <main className="flex h-screen flex-col items-center justify-center gap-12">
      <Button>Create new game</Button>
      <hr
        style={{
          maskImage: "linear-gradient(to right,transparent,black,transparent)",
        }}
        className="h-0.5 w-full bg-black dark:bg-white md:w-1/2"
      />
      <input
        className="active:border-sky-40 rounded-xl border-2 border-sky-900 bg-sky-100 p-2 text-center text-xl focus-visible:border-sky-400 focus-visible:outline-none active:border-sky-400 dark:bg-slate-900 dark:text-white"
        type="text"
        placeholder="GAME ID"
      />
      <Button>Join game</Button>
    </main>
  );
}

function Button(
  props: React.PropsWithChildren<{ onClick?: () => {}; className?: string }>
) {
  return (
    <button
      onClick={props.onClick}
      className={
        "rounded-xl bg-cyan-400 px-4 py-2 text-white shadow-cyan-500/50 transition-colors hover:bg-cyan-600 hover:shadow-lg " +
        props.className
      }
    >
      {props.children}
    </button>
  );
}
