package main

import (
	"context"
	"crypto/rand"
	"encoding/base32"
	"flag"
	"fmt"
	"log"
	"net/http"
	"os"
	"sync"
	"time"

	"nhooyr.io/websocket"
)

const MAX_PLAYERS = 2

const DEV_ENV = "development"
const PROD_ENV = "production"

var (
	games   = make(map[string]*game)
	gamesMu = sync.Mutex{}

	infoLog  = log.New(os.Stdout, "INFO\t", log.Ldate|log.Ltime)
	errorLog = log.New(os.Stderr, "ERROR\t", log.Ldate|log.Ltime|log.Lshortfile)

	config = struct {
		port       int
		enviroment string
	}{}
)

func main() {
	flag.IntVar(&config.port, "port", 4000, "Server listening port")
	flag.StringVar(&config.enviroment, "env", DEV_ENV, "development | production")

	router := http.NewServeMux()

	router.Handle("/api/new-game", CORS(newGameHandler))
	router.Handle("/api/ws", CORS(wsHandler))

	go gamesCleanup()

	infoLog.Println("starting server on port 4000")
	err := http.ListenAndServe(":4000", router)
	if err != nil {
		errorLog.Println(err)
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
		serverErrorResponse(w, r, err)
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
		players:   make([]player, 0, MAX_PLAYERS),
		id:        id,
		state:     CREATED_STATE,
		timestamp: time.Now(),
	}

	gamesMu.Unlock()

	err = writeJSON(w, http.StatusCreated, envelope{"game_id": id}, nil)
	if err != nil {
		serverErrorResponse(w, r, err)
	}

	infoLog.Println("New game created - ", id, r.Header.Get("X-Forwarded-For"))
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

	var wsOptions *websocket.AcceptOptions = nil

	if config.enviroment == DEV_ENV {
		wsOptions = &websocket.AcceptOptions{
			OriginPatterns: []string{"localhost:3000"},
		}
	}

	ws, err := websocket.Accept(w, r, wsOptions)
	if err != nil {
		serverErrorResponse(w, r, fmt.Errorf("could not upgrade connection"))
		return
	}

	ctx := context.Background()

	p := player{conn: ws, channel: make(chan string), ctx: ctx}

	game.players = append(game.players, p)

	infoLog.Printf("Player %v joined game - %v - %v", len(game.players), game.id, r.Header.Get("X-Forwarded-For"))

	if len(game.players) == MAX_PLAYERS {
		go game.start()
		infoLog.Printf("Game %v started", game.id)
	} else {
		p.send(JsonMessage{Message: "waiting for other player", Typ: InfoMessage})
		game.state = WAITING_STATE
		game.timestamp = time.Now()
	}
}

func CORS(next http.HandlerFunc) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		next.ServeHTTP(w, r)
	})
}
