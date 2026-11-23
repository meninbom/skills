#!/bin/bash
# Roda o h3_um.sh em todo plano do h3/clipes.json que tem placa e ainda não tem clips60. Um por vez, na ordem do clipes.json.
# Para quando aparecer o arquivo h3/PARAR (crie com: touch <ep>/h3/PARAR). Apague o PARAR pra voltar.
# Plano com 3 tentativas fica de fora (vai pra reserva). Duas falhas seguidas = para (ComfyUI ou GPU com problema).
#
# uso: bash rodar_ep.sh <pasta do ep> [--seco]
#   --seco  lista o que rodaria e confere o 1º plano com h3_um.sh --seco. Não sobe nada.
set -u
export PYTHONUTF8=1 PYTHONIOENCODING=utf-8
AQUI="$(cd "$(dirname "$0")" && pwd)"
SECO=0; EP=""
for a in "$@"; do case "$a" in --seco) SECO=1;; *) EP="$a";; esac; done
[ -n "$EP" ] || { echo "uso: bash rodar_ep.sh <pasta do ep> [--seco]"; exit 2; }
H="$EP/h3"
[ -f "$H/clipes.json" ] || { echo "PAREI: não achei $H/clipes.json"; exit 1; }
H="$(cd "$H" && pwd)"
PY="$(command -v python || command -v python3 || command -v py)" || { echo "PAREI: não achei o python no PATH"; exit 1; }
# python no Windows solta \r\n no pipe: pyo tira o \r e devolve o codigo de saida do python
pyo() { "$PY" "$@" | tr -d '\r'; return "${PIPESTATUS[0]}"; }
PLANOS=$(pyo -c "import json,sys;print(' '.join(json.load(open(sys.argv[1],encoding='utf-8'))))" "$H/clipes.json") || exit 1
log() { echo "$(date '+%d/%m %H:%M:%S') $*" | tee -a "$H/rodar.log"; }

FAZER=(); RESERVA=(); SEM_PLACA=(); PRONTOS=0; TOTAL=0
for P in $PLANOS; do
  TOTAL=$((TOTAL + 1))
  if [ -f "$H/clips60/$P.mp4" ]; then PRONTOS=$((PRONTOS + 1)); continue; fi
  if [ ! -f "$H/placas/$P.png" ]; then SEM_PLACA+=("$P"); continue; fi
  nt=0; [ -f "$H/tentativas/$P.txt" ] && nt=$(grep -c . "$H/tentativas/$P.txt")
  if [ "$nt" -ge 3 ] && [ ! -f "$H/clips/$P.mp4" ]; then RESERVA+=("$P"); continue; fi
  FAZER+=("$P")
done
echo "clipes: $TOTAL · prontos: $PRONTOS · a fazer: ${#FAZER[@]} (${FAZER[*]:-})"
[ ${#SEM_PLACA[@]} -gt 0 ] && echo "sem placa (rode o placa.py): ${SEM_PLACA[*]}"
[ ${#RESERVA[@]} -gt 0 ] && echo "3 tentativas, vão pra reserva: ${RESERVA[*]}"

if [ "$SECO" = 1 ]; then
  [ ${#FAZER[@]} -eq 0 ] && { echo "SECO: nada pra rodar."; exit 0; }
  echo; echo "SECO: confiro só o 1º (${FAZER[0]}); os outros seguem o mesmo caminho."; echo
  bash "$AQUI/h3_um.sh" "$H" "${FAZER[0]}" --seco; exit $?
fi

FALHAS=0
for P in "${FAZER[@]}"; do
  [ -f "$H/PARAR" ] && { log "achei h3/PARAR: paro antes de $P"; break; }
  log "== $P =="
  bash "$AQUI/h3_um.sh" "$H" "$P"; r=$?
  if [ "$r" = 0 ] && [ -f "$H/clips60/$P.mp4" ]; then log "$P ok"; FALHAS=0
  else
    log "$P falhou (código $r)"; FALHAS=$((FALHAS + 1))
    [ "$FALHAS" -ge 2 ] && { log "duas falhas seguidas: paro. Veja $H/h3.log e $H/comfy_h3.log"; break; }
  fi
done
n=0; for P in $PLANOS; do [ -f "$H/clips60/$P.mp4" ] && n=$((n + 1)); done
log "fim: $n de $TOTAL com clips60. Próximo passo: folha de deriva (revisor-quadros/deriva.py) e olhar cada clipe."
