package main

import (
	"context"
	"crypto/rand"
	"encoding/base32"
	"fmt"
	"log"
	"net/http"
	"os"
	"sync"

	"nhooyr.io/websocket"
)

const MAX_PLAYERS = 2

var (
	games   = make(map[string]*game)
	gamesMu = sync.Mutex{}

	infoLog  = log.New(os.Stdout, "INFO\t", log.Ldate|log.Ltime)
	errorLog = log.New(os.Stderr, "ERROR\t", log.Ldate|log.Ltime|log.Lshortfile)
)

func main() {
	router := http.NewServeMux()

	router.HandleFunc("/new-game", newGameHandler)
	router.HandleFunc("/ws", wsHandler)

	infoLog.Println("starting server on port 4000")
	err := http.ListenAndServe(":4000", router)
	if err != nil {
		infoLog.Println("error starting server")
	}
}

func newGameHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		w.Header().Set("Access-Control-Allow-Methods", "POST")
		errorResponse(w, http.StatusMethodNotAllowed, fmt.Errorf("method not allowed"))
		return
	}

	randomBytes := make([]byte, 16)
	_, err := rand.Read(randomBytes)
	if err != nil {
		serverErrorResponse(w, err)
		return
	}

	id := base32.StdEncoding.WithPadding(base32.NoPadding).EncodeToString(randomBytes)

	_, ok := games[id]
	if ok {
		errorResponse(w, http.StatusConflict, fmt.Errorf("same id already exists, this should never happen"))
		return
	}

	gamesMu.Lock()

	games[id] = &game{
		players: make([]player, 0, MAX_PLAYERS),
		id:      id,
	}

	gamesMu.Unlock()

	err = writeJSON(w, http.StatusCreated, envelope{"game_id": id}, nil)
	if err != nil {
		serverErrorResponse(w, err)
	}
}

func wsHandler(w http.ResponseWriter, r *http.Request) {
	vals := r.URL.Query()
	gameID := vals.Get("game_id")

	game, ok := games[gameID]
	if !ok {
		errorResponse(w, http.StatusNotFound, fmt.Errorf("game with id: %q does not exist", gameID))
		return
	}

	if len(game.players) >= MAX_PLAYERS {
		errorResponse(w, http.StatusNotAcceptable, fmt.Errorf("there are already two players in this game"))
		return
	}

	ws, err := websocket.Accept(w, r, nil)
	if err != nil {
		serverErrorResponse(w, fmt.Errorf("cloud not upgrade connection"))
		return
	}

	ctx := context.Background()

	p := player{conn: ws, channel: make(chan string), ctx: ctx}

	game.players = append(game.players, p)

	if len(game.players) == MAX_PLAYERS {
		go game.start()
	} else {
		p.send(JsonMessage{Message: "waiting for other player", Typ: InfoMessage})
	}
}