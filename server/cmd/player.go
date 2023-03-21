package main

import (
	"context"

	"nhooyr.io/websocket"
	"nhooyr.io/websocket/wsjson"
)

type JsonMessage struct {
	Message any    `json:"message"`
	Typ     string `json:"type"`
}

const (
	BoardMessage = "board"
	ErrorMessage = "error"
	InfoMessage  = "info"
	PlayMessage  = "play"
)

type player struct {
	conn    *websocket.Conn
	channel chan string
	ctx     context.Context
	symbol  string
}

func (p *player) send(msg JsonMessage) error {
	return wsjson.Write(p.ctx, p.conn, msg)
}

func (p *player) read() (JsonMessage, error) {
	var msg JsonMessage
	return msg, wsjson.Read(p.ctx, p.conn, &msg)
}

func (p *player) closeConnection() error {
	return p.conn.Close(websocket.StatusNormalClosure, "Game ended")
}
