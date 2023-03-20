package main

import (
	"fmt"
	"math/rand"
	"strconv"
	"time"

	"nhooyr.io/websocket"
)

type game struct {
	players []player
	state   int
	id      string
}

func (g *game) start() {
	err := g.messageAllPlayers("Get ready!")
	if err != nil {
		// TODO: handle this
	}

	// is there a better way to recieve msg from both
	// NOTE: put one of these to goroutine, but is it worth it?
	for {
		msg, err := g.players[0].read()
		if err != nil {
			continue
		}
		fmt.Println(msg)
		if msg == "Ready" {
			break
		}
	}

	for {
		msg, err := g.players[1].read()
		if err != nil {
			continue
		}
		fmt.Println(msg)
		if msg == "Ready" {
			break
		}
	}

	rand.Seed(time.Now().UnixMilli())

	playing := rand.Intn(MAX_PLAYERS)
	var waiting int

	if playing == 0 {
		waiting = 1
	} else {
		waiting = 0
	}

	for {
		g.players[playing].send("Your turn")
		g.players[waiting].send("Other player's turn")

		for {
			msg, err := g.players[playing].read()
			if err != nil {
				continue
			}
			// TODO: update board
			g.state, err = strconv.Atoi(msg)
			if err != nil {
				fmt.Print(err)
				continue
			}

			break
		}

		// TODO: check for winner, close connections and clean game
		if g.state == 69 {
			g.messageAllPlayers("winner is player 2")
			for _, player := range g.players {
				player.conn.Close(websocket.StatusNormalClosure, "Game ended")
			}
			delete(games, g.id)
		}

		// TODO: send new board state to all players
		g.messageAllPlayers(fmt.Sprint(g.state))

		playing, waiting = waiting, playing
	}
}

func (g *game) messageAllPlayers(msg string) error {
	for _, player := range g.players {
		err := player.send(msg)
		if err != nil {
			return err
		}
	}
	return nil
}
