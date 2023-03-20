#!/bin/bash

GAME_ID=$(curl -s localhost:4000/new-game)
GAME_ID=$(echo $GAME_ID | jq ".game_id")
GAME_ID=$(echo $GAME_ID | tr -d '"')

CMD="websocat --linemode-strip-newlines 'ws://localhost:4000/ws?game_id=$GAME_ID'"
tmux split -h "$CMD"
eval $CMD
