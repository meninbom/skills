#!/usr/bin/env bash
# junta a cabeça e o comum do motor da série (personagem, props, HUD) com o rabo do jogo
cd "$(dirname "$0")"; M=../motor
cat $M/shots_cas_head.js $M/shots_cas_common.js game_tail.js > game_shots.js && echo ok
