#!/bin/bash
# Fila de animação: vários planos, um por vez (cada um sobe o ComfyUI, gera, desliga e passa o RIFE). Deixe rodando de noite.
# Só roda planos que já têm placa (placas/<PLANO>.png) e ainda não têm clipe; dá várias voltas pra pegar placa que chegar depois.
# uso: COMFY_DIR=... RIFE_DIR=... bash fila.sh <pasta h3 do episódio> S01 S02 S03
D="$(cd "$1" && pwd)" || exit 1; shift; AQUI="$(cd "$(dirname "$0")" && pwd)"; cd "$D" || exit 1
for volta in 1 2 3 4; do
  for T in "$@"; do
    [ -f "clips/$T.mp4" ] && continue
    [ -f "placas/$T.png" ] || continue
    t0=$(date +%s); echo "$(date +%T) $T inicio" >> fila.log
    bash "$AQUI/../ciclo/h3_um.sh" "$D" "$T" >> fila.log 2>&1
    echo "$(date +%T) $T fim $(( $(date +%s) - t0 ))s $( [ -f "clips/$T.mp4" ] && echo OK || echo FALHOU)" >> fila.log
  done
  n_ok=0; for T in "$@"; do [ -f "clips/$T.mp4" ] && n_ok=$((n_ok+1)); done; [ $n_ok -ge $# ] && break
  sleep 120
done
echo "$(date +%T) FIM" >> fila.log
