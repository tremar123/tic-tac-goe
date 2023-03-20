package main

import (
	"context"
	"fmt"

	"nhooyr.io/websocket"
)

type player struct {
	conn    *websocket.Conn
	channel chan string
	ctx     context.Context
}

// func (p *player) playerListener(ctx context.Context, game *game) {
// 	for {
// 		// NOTE: do I need to break when theres an error?
// 		typ, msg, err := p.conn.Reader(ctx)
// 		if err != nil {
// 			log.Println(err)
// 			break
// 		}
//
// 		if typ != websocket.MessageText {
// 			continue
// 		}
//
// 		message, err := io.ReadAll(msg)
// 		if err != nil {
// 			log.Println(err)
// 			break
// 		}
//
// 		p.channel <- string(message)
// 	}
//
// 	p.conn.Close(websocket.StatusInternalError, "server error")
// 	// this finds and removes player from slice when it disconnects
// 	for i := range game.players {
// 		if game.players[i] == *p {
// 			game.players = append(game.players[:i], game.players[i+1:]...)
// 			fmt.Println(game.players, len(game.players), cap(game.players))
// 			return
// 		}
// 	}
// 	panic("player not found in slice")
// }

func (p *player) send(msg string) error {
	return p.conn.Write(p.ctx, websocket.MessageText, []byte(msg))
}

func (p *player) read() (string, error) {
	typ, msg, err := p.conn.Read(p.ctx)
	if typ != websocket.MessageText {
		return "", fmt.Errorf("only accepted type of message is text")
	}
	return string(msg), err
}
