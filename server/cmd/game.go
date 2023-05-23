package main

import (
	"math/rand"
	"time"
)

const BOARD_LENGTH = 9

const (
	CREATED_STATE = iota
	WAITING_STATE
	GETTING_READY_STATE
	PLAYING_STATE
)

type game struct {
	id        string
	players   []player
	board     []string
	turn      int8
	state     int
	timestamp time.Time
}

// TODO: when one player loses connection, end game and clear it or wait for him to connect back
func (g *game) start() {
	g.board = []string{
		"", "", "",
		"", "", "",
		"", "", "",
	}

	g.state = GETTING_READY_STATE
	g.timestamp = time.Now()

	g.turn = 0

	err := g.messageAllPlayers(JsonMessage{Message: "Get ready!", Typ: GetReadyMessage})
	if err != nil {
		g.end()
		return
	}

	// is there a better way to recieve msg from both?
	// NOTE: put one of these to goroutine, but is it worth it?
	for {
		msg, err := g.players[0].read()
		if err != nil {
			g.end()
			return
		}
		if msg.Message == "Ready" {
			break
		}
		g.players[0].send(JsonMessage{Message: "Enter \"Ready\"", Typ: ErrorMessage})
		if err != nil {
			g.end()
			return
		}
	}

	for {
		msg, err := g.players[1].read()
		if err != nil {
			g.end()
			return
		}
		if msg.Message == "Ready" {
			break
		}
		g.players[0].send(JsonMessage{Message: "Enter \"Ready\"", Typ: ErrorMessage})
		if err != nil {
			g.end()
			return
		}
	}

	g.state = PLAYING_STATE
	g.timestamp = time.Now()

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
			g.end()
			return
		}
		err = g.players[waiting].send(JsonMessage{Message: "Other player's turn", Typ: TurnMessage})
		if err != nil {
			g.end()
			return
		}

		for {
			msg, err := g.players[playing].read()
			if err != nil {
				g.end()
				return
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

		g.turn++

		err = g.messageAllPlayers(JsonMessage{Message: g.board, Typ: BoardMessage})
		if err != nil {
			g.end()
			return
		}

		end, winner, pattern := g.checkGameEnd(playing)
		if end {
			if winner {
				err = g.messageAllPlayers(JsonMessage{Message: pattern, Typ: WinningPatternMessage})
				if err != nil {
					g.end()
					return
				}

				err = g.players[playing].send(JsonMessage{Message: "You won", Typ: ResultMessage})
				if err != nil {
					g.end()
					return
				}
				err = g.players[waiting].send(JsonMessage{Message: "You lost", Typ: ResultMessage})
				if err != nil {
					g.end()
					return
				}
			} else {
				err = g.messageAllPlayers(JsonMessage{Message: "Draw", Typ: ResultMessage})
				if err != nil {
					g.end()
					return
				}
			}

			g.end()
			return
		}

		playing, waiting = waiting, playing
	}
}

func (g *game) end() {
	for _, player := range g.players {
		err := player.closeConnection()
		if err != nil {
			errorLog.Printf("game %q - %v", g.id, err)
		}
	}

	infoLog.Printf("Game %v ended", g.id)

	gamesMu.Lock()
	delete(games, g.id)
	gamesMu.Unlock()
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

func (g *game) checkGameEnd(playing int) (end bool, winner bool, pattern []int) {
	for _, pattern := range winningPatterns {
		if g.board[pattern[0]] != "" && g.board[pattern[1]] == g.board[pattern[0]] && g.board[pattern[2]] == g.board[pattern[0]] {
			return true, true, pattern
		}
	}

	if g.turn == BOARD_LENGTH {
		return true, false, nil
	}

	return false, false, nil
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
