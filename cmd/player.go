package main

import (
	"io"
	"log"
	"net/http"

	"nhooyr.io/websocket"
)

type player struct {
	conn *websocket.Conn
}

func (p *player) playerHandler(game *game, r *http.Request) {

	go func() {
		msg := <-game.channel
		err := p.conn.Write(r.Context(), websocket.MessageText, []byte(msg))
		if err != nil {
			log.Print(err)
		}
	}()

	for {
		// NOTE: do I need to break when theres an error?
		typ, msg, err := p.conn.Reader(r.Context())
		if err != nil {
			log.Println("error")
			break
		}
		message, err := io.ReadAll(msg)
		if err != nil {
			log.Println("error")
			break
		}
		log.Println(string(message), typ)
	}
}
