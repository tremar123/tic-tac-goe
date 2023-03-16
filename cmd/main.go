package main

import (
	"crypto/rand"
	"encoding/base32"
	"fmt"
	"log"
	"net/http"
	"sync"

	"nhooyr.io/websocket"
)

type game struct {
	players []player
	state   int
	channel chan string
}

var (
	games   = make(map[string]*game)
	gamesMu = sync.Mutex{}
)

func main() {
	router := http.NewServeMux()

	router.HandleFunc("/new-game", newGameHandler)
	router.HandleFunc("/ws", wsHandler)

	log.Println("starting server on port 4000")
	err := http.ListenAndServe(":4000", router)
	if err != nil {
		log.Println("error starting server")
	}
}

// TODO: make this post only
func newGameHandler(w http.ResponseWriter, r *http.Request) {
	randomBytes := make([]byte, 16)
	_, err := rand.Read(randomBytes)
	if err != nil {
		errorResponse(w, http.StatusInternalServerError, err)
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
		players: make([]player, 0, 2),
		channel: make(chan string),
	}

	gamesMu.Unlock()

	err = writeJSON(w, http.StatusCreated, envelope{"game_id": id}, nil)
	if err != nil {
		errorResponse(w, http.StatusInternalServerError, err)
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

	if len(game.players) >= 2 {
		errorResponse(w, http.StatusNotAcceptable, fmt.Errorf("there are already two players in this game"))
		return
	}

	ws, err := websocket.Accept(w, r, nil)
	if err != nil {
		w.Write([]byte("server error"))
		w.WriteHeader(http.StatusInternalServerError)
		return
	}
	defer ws.Close(websocket.StatusInternalError, "server error")

	p := player{conn: ws}

	game.players = append(game.players, p)
	fmt.Println(game.players, len(game.players), cap(game.players))
	// this finds and removes player from slice when it disconnects
	defer func() {
		for i := range game.players {
			if game.players[i] == p {
				game.players = append(game.players[:i], game.players[i+1:]...)
				fmt.Println(game.players, len(game.players), cap(game.players))
				return
			}
		}
		panic("player not found in slice")
	}()

    // TODO: how to do this?
	go p.playerHandler(game, r)

	if len(game.players) == 2 {
		// TODO: start the game
		game.channel <- "let the game begin"
	} else {
		game.channel <- "waiting for second player"
	}
}
