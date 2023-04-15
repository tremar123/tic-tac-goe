package main

import (
	"math/rand"
	"time"
)

const BOARD_LENGTH = 9

type game struct {
	id      string
	players []player
	board   []string
}

// TODO: when one player loses connection, end game and clear it or wait for him to connect back
func (g *game) start() {
	g.board = []string{
		"", "", "",
		"", "", "",
		"", "", ""}

	err := g.messageAllPlayers(JsonMessage{Message: "Get ready!", Typ: GetReadyMessage})
	if err != nil {
		// TODO
	}

	// is there a better way to recieve msg from both?
	// NOTE: put one of these to goroutine, but is it worth it?
	for {
		msg, err := g.players[0].read()
		if err != nil {
			// TODO: handle properly
			g.players[0].send(JsonMessage{Message: "Invalid json", Typ: ErrorMessage})
			continue
		}
		if msg.Message == "Ready" {
			break
		}
		g.players[0].send(JsonMessage{Message: "Enter \"Ready\"", Typ: ErrorMessage})
	}

	for {
		msg, err := g.players[1].read()
		if err != nil {
			// TODO: handle properly
			g.players[1].send(JsonMessage{Message: "Invalid json", Typ: ErrorMessage})
			continue
		}
		if msg.Message == "Ready" {
			break
		}
		g.players[0].send(JsonMessage{Message: "Enter \"Ready\"", Typ: ErrorMessage})
	}

	r := rand.New(rand.NewSource(time.Now().UnixNano()))

	playing := r.Intn(MAX_PLAYERS)
	var waiting int

	if playing == 0 {
		waiting = 1
	} else {
		waiting = 0
	}

	g.players[playing].symbol = "X"
	g.players[waiting].symbol = "O"

	for {
		err := g.players[playing].send(JsonMessage{Message: "Your turn", Typ: TurnMessage})
		if err != nil {
			// TODO
		}
		err = g.players[waiting].send(JsonMessage{Message: "Other player's turn", Typ: TurnMessage})
		if err != nil {
			// TODO
		}

		for {
			msg, err := g.players[playing].read()
			if err != nil {
				// TODO handle properly
				g.players[playing].send(JsonMessage{Message: "There was an error, try again", Typ: ErrorMessage})
				continue
			}

			play := int(msg.Message.(float64))

			if play >= BOARD_LENGTH || play < 0 {
				g.players[playing].send(JsonMessage{Message: "Invalid range", Typ: ErrorMessage})
				continue
			}

			if g.board[play] != "" {
				g.players[playing].send(JsonMessage{Message: "Already occupied", Typ: ErrorMessage})
				continue
			}

			g.board[play] = g.players[playing].symbol

			break
		}

		end, winner := g.checkGameEnd(playing)
		if end {
			if winner {
				err = g.players[playing].send(JsonMessage{Message: "You won", Typ: ResultMessage})
				if err != nil {
					// TODO
				}
				err = g.players[waiting].send(JsonMessage{Message: "You lost", Typ: ResultMessage})
				if err != nil {
					// TODO
				}
			} else {
				err = g.messageAllPlayers(JsonMessage{Message: "Draw", Typ: ResultMessage})
				if err != nil {
					// TODO
				}
			}

			for _, player := range g.players {
				err = player.closeConnection()
				if err != nil {
					// TODO
				}
			}

			delete(games, g.id)
			return
		}

		err = g.messageAllPlayers(JsonMessage{Message: g.board, Typ: BoardMessage})
		if err != nil {
			// TODO
		}

		playing, waiting = waiting, playing
	}
}

func (g *game) messageAllPlayers(msg JsonMessage) error {
	for _, player := range g.players {
		err := player.send(msg)
		if err != nil {
			return err
		}
	}
	return nil
}

func (g *game) checkGameEnd(playing int) (end bool, winner bool) {
	indexes := []int{}
	occupiedFields := 0

	// NOTE: can I keep track of these while player makes play?
	for i, field := range g.board {
		if field != "" {
			occupiedFields++
		}

		if field == g.players[playing].symbol {
			indexes = append(indexes, i)
		}
	}

patternsLoop:
	for _, pattern := range winningPatterns {
		fields := make(map[int]bool)

		for _, num := range pattern {
			fields[num] = false
		}

		for _, idx := range indexes {
			_, ok := fields[idx]
			if ok {
				fields[idx] = true
			}
		}

		for _, field := range fields {
			if !field {
				continue patternsLoop
			}
		}
		return true, true
	}

	if occupiedFields == BOARD_LENGTH {
		return true, false
	}

	return false, false
}

var winningPatterns = [][]int{
	{0, 1, 2},
	{3, 4, 5},
	{6, 7, 8},

	{0, 3, 6},
	{1, 4, 7},
	{2, 5, 8},

	{0, 4, 8},
	{2, 4, 6},
}
