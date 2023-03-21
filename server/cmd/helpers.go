package main

import (
	"encoding/json"
	"net/http"
)

func errorResponse(w http.ResponseWriter, status int, message error) {
	err := writeJSON(w, status, envelope{"error": message}, nil)
	if err != nil {
		errorLog.Println("error sending response")
	}
}

func serverErrorResponse(w http.ResponseWriter, message error) {
	errorLog.Println(message.Error())
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
