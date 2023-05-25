package main

import (
	"encoding/json"
	"net/http"
	"time"
)

func errorResponse(w http.ResponseWriter, status int, message error) {
	err := writeJSON(w, status, envelope{"error": message}, nil)
	if err != nil {
		errorLog.Println("error sending response")
	}
}

func serverErrorResponse(w http.ResponseWriter, r *http.Request, message error) {
	errorLog.Println(message.Error(), r.Header.Get("X-Forwarded-For"))
	errorResponse(w, http.StatusInternalServerError, message)
}

type envelope map[string]any

func writeJSON(w http.ResponseWriter, status int, data envelope, headers http.Header) error {
	js, err := json.MarshalIndent(data, "", "\t")
	if err != nil {
		return err
	}

	js = append(js, '\n')

	for key, value := range headers {
		w.Header()[key] = value
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	w.Write(js)

	return nil
}

func gamesCleanup() {
	ticker := time.NewTicker(1 * time.Minute)

	for range ticker.C {
		for _, game := range games {
			switch {
			case game.state == CREATED_STATE && timeDiff(game.timestamp, 10*time.Minute):
				game.end()
				infoLog.Printf("game %q cleaned up after created for more than 10 minutes", game.id)
			case game.state == WAITING_STATE && timeDiff(game.timestamp, 10*time.Minute):
				game.end()
				infoLog.Printf("game %q cleaned up after waiting for more than 10 minutes", game.id)
			case game.state == GETTING_READY_STATE && timeDiff(game.timestamp, 5*time.Minute):
				game.end()
				infoLog.Printf("game %q cleaned up after getting ready for more than 5 minutes", game.id)
			case game.state == PLAYING_STATE && timeDiff(game.timestamp, 30*time.Minute):
				infoLog.Printf("game %q cleaned up after playing for more than 30 minutes", game.id)
				game.end()
			}
		}
	}
}

func timeDiff(timestamp time.Time, diff time.Duration) bool {
	if time.Now().Sub(timestamp) > diff {
		return true
	}
	return false
}
