#!/usr/bin/env bash
# Fila de animação (imagem -> clipe) no ComfyUI local, um plano por vez. NÃO roda no demo.
# Se o ComfyUI já estiver ligado, só enfileira e NÃO desliga no fim. Se foi esta fila que ligou, desliga no fim (com a fila vazia).
# Regra: uma tarefa de GPU por vez. Não rode junto com outro render de GPU nem com o RIFE.
# uso: COMFY_DIR=/caminho/ComfyUI_windows_portable SEED=23 bash fila_flash.sh A1 A2 A4
#   COMFY_DIR   pasta do ComfyUI portátil (tem python_embeded/ e ComfyUI/). Obrigatória.
#   COMFY_YAML  opcional: yaml de pesos fora da pasta (ver ../h3_flash/extra_model_paths_flash.yaml)
# Entradas: quadros/<plano>.png e prompts/<plano>.txt. Saída: clipes/<plano>.mp4. Escrito para Windows + Git Bash.
cd "$(dirname "$0")"
: "${COMFY_DIR:?defina COMFY_DIR com a pasta do seu ComfyUI portátil}"
PY="$COMFY_DIR/python_embeded/python.exe"
FLASH="../h3_flash/flash.py"
export COMFY_INPUT="${COMFY_INPUT:-$COMFY_DIR/ComfyUI/input}"
ram() { powershell -NoProfile -Command "[math]::Round((Get-CimInstance Win32_OperatingSystem).FreePhysicalMemory/1MB,1)" | tr ',' '.'; }
derruba() { powershell -NoProfile -Command "\$c=Get-NetTCPConnection -LocalPort 8188 -State Listen -ErrorAction SilentlyContinue; if(\$c){\$c|Select -Expand OwningProcess -Unique|%{Stop-Process -Id \$_ -Force}}" ; }
# quadros por plano (24 qps): plano curto pede clipe curto. Ajuste para os SEUS planos; o padrão é 73 (~3 s).
quadros() { case $1 in A1|A4|F1|N3|M2) echo 90;; N1) echo 107;; C1|C2|G1|G2|G3) echo 39;; D2|F2|J1|K1|K3|L1|M1|E1) echo 56;; *) echo 73;; esac; }
mkdir -p _h3_in clipes
LIGUEI=0
if curl -s -m 3 http://127.0.0.1:8188/queue >/dev/null; then
  echo "$(date +%T) ComfyUI já ligado: só enfileiro, não desligo" | tee -a fila.log
else
  LIGUEI=1; AQUI="$(pwd)"
  (cd "$COMFY_DIR" && PYTHONUTF8=1 PYTHONIOENCODING=utf-8 ./python_embeded/python.exe -s ComfyUI/main.py --listen 127.0.0.1 --port 8188 \
     --windows-standalone-build --disable-auto-launch --disable-pinned-memory ${COMFY_YAML:+--extra-model-paths-config "$COMFY_YAML"} > "$AQUI/comfy.log" 2>&1 &)
  for i in $(seq 1 100); do curl -s -m 3 http://127.0.0.1:8188/queue >/dev/null && break; sleep 3; done
fi
for P in "$@"; do
  [ -f "clipes/$P.mp4" ] && { echo "$P já existe" | tee -a fila.log; continue; }
  [ -f "quadros/$P.png" ] || { echo "$P sem quadro, pulando" | tee -a fila.log; continue; }
  F=$(quadros $P); cp "quadros/$P.png" "_h3_in/ep_$P.png"
  r=$(ram); echo "$(date +%T) $P início (RAM livre ${r} GB, $F quadros)" | tee -a fila.log
  awk "BEGIN{exit !($r < 4)}" && { echo "FREIO: RAM < 4 GB, parando" | tee -a fila.log; break; }
  PYTHONIOENCODING=utf-8 "$PY" -s "$FLASH" --img "_h3_in/ep_$P.png" --prompt-file prompts/$P.txt \
     --out clipes/$P.mp4 --w 768 --h 1344 --frames $F --seed ${SEED:-7} --steps 6 2>&1 | tail -1 | tee -a fila.log
done
if [ $LIGUEI = 1 ]; then
  for i in $(seq 1 200); do q=$(curl -s http://127.0.0.1:8188/queue); echo "$q" | grep -q '"queue_running": \[\]' && echo "$q" | grep -q '"queue_pending": \[\]' && break; sleep 15; done
  derruba; echo "$(date +%T) fila terminada; ComfyUI desligado (esta fila ligou)" | tee -a fila.log
else
  echo "$(date +%T) fila terminada; o ComfyUI já estava ligado, ficou ligado" | tee -a fila.log
fi
