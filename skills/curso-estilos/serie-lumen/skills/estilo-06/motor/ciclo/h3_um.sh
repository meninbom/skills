#!/bin/bash
# Animação de UM plano no MiniMax H3 pelo ComfyUI local (20 passos, sem LoRA, 768x1344) + RIFE para 60 qps. Usado pelo ciclo.py e pela h3/fila.sh.
# NÃO roda no demo: precisa de ComfyUI com os pesos do H3 e placa de vídeo (~11,5 GB de VRAM).
# Uma tarefa de GPU por vez: pega uma trava (pasta criada com mkdir) e só solta no fim. Quem sobe o ComfyUI desliga.
# uso: COMFY_DIR=<pasta do ComfyUI portátil> RIFE_DIR=<pasta do rife-ncnn-vulkan> bash h3_um.sh <pasta h3 do episódio> <PLANO> [pasta-trava]
#   <pasta h3>: tem placas/<PLANO>.png e clipes.json (feito pelo h3/def_clipes.py). Saem clips/<PLANO>.mp4 (24 qps) e clips60/<PLANO>.mp4.
#   COMFY_PY (opcional): o python que roda o ComfyUI. Padrão: $COMFY_DIR/python_embeded/python.exe (portátil do Windows).
set -u
D="$(cd "$1" && pwd)" || exit 1; T="$2"; L="${3:-$D/.gpu_em_uso}"; cd "$D" || exit 1
AQUI="$(cd "$(dirname "$0")" && pwd)"
: "${COMFY_DIR:?defina COMFY_DIR com a pasta do ComfyUI (a que tem a pasta ComfyUI/ dentro)}"
PY="${COMFY_PY:-$COMFY_DIR/python_embeded/python.exe}"
PORTA="${COMFY_PORTA:-8188}"
no_ar() { curl -s -m 3 "http://127.0.0.1:$PORTA/system_stats" >/dev/null; }
mkdir -p prompts clips clips60
while true; do
  until python "$AQUI/../h3/pausa.py" >/dev/null; do sleep 60; done
  until mkdir "$L" 2>/dev/null; do sleep 15; done; echo "h3 $T $(date)" > "$L/quem.txt"
  if no_ar; then rm -f "$L/quem.txt"; rmdir "$L"; sleep 120; else break; fi    # ComfyUI de outra tarefa no ar: espera ela terminar
done
# --disable-pinned-memory: sem ela o ComfyUI chega a 27 GB de RAM com o H3; com ela fica em 16-17 GB
( cd "$COMFY_DIR" && PYTHONUTF8=1 PYTHONIOENCODING=utf-8 nohup "$PY" -s ComfyUI/main.py --listen 127.0.0.1 --port "$PORTA" --disable-auto-launch --disable-pinned-memory > "$D/comfy.log" 2>&1 & )
for i in $(seq 1 100); do no_ar && break; sleep 3; done
python -c "import json,sys;print(json.load(open('clipes.json',encoding='utf8'))[sys.argv[1]]['prompt'])" "$T" > "prompts/$T.txt"
Q=$(python -c "import json,sys;print(json.load(open('clipes.json',encoding='utf8'))[sys.argv[1]]['q'])" "$T")
COMFY_INPUT="$COMFY_DIR/ComfyUI/input" COMFY_API="http://127.0.0.1:$PORTA" "$PY" "$AQUI/../comfy/h3.py" --img "placas/$T.png" --prompt-file "prompts/$T.txt" --out "clips/$T.mp4" --w 768 --h 1344 --frames "$Q" --steps 20 --lora "" >> h3.log 2>&1
# desliga o ComfyUI que este script subiu (só o processo que escuta na porta)
if command -v powershell >/dev/null 2>&1; then
  powershell -NoProfile -Command "Get-NetTCPConnection -LocalPort $PORTA -State Listen -ErrorAction SilentlyContinue | % { Stop-Process -Id \$_.OwningProcess -Force }"
else
  pid=$(lsof -ti tcp:"$PORTA" 2>/dev/null); [ -n "$pid" ] && kill $pid
fi
sleep 5
if [ -f "clips/$T.mp4" ] && [ -n "${RIFE_DIR:-}" ]; then      # RIFE: 24 -> 60 qps (também usa a GPU, por isso ainda com a trava)
  RIFE_EXE="$RIFE_DIR/rife-ncnn-vulkan"; [ -f "$RIFE_EXE.exe" ] && RIFE_EXE="$RIFE_EXE.exe"; W="_rife_$T"
  rm -rf "$W"; mkdir -p "$W/src" "$W/out"
  ffmpeg -v error -i "clips/$T.mp4" -start_number 1 "$W/src/%04d.png"
  n=$(ls "$W/src" | wc -l); alvo=$(( n * 60 / 24 ))
  "$RIFE_EXE" -i "$W/src" -o "$W/out" -m "$RIFE_DIR/rife-v4.6" -n $alvo >/dev/null 2>&1
  ffmpeg -v error -y -framerate 60 -i "$W/out/%08d.png" -c:v libx264 -crf 14 -pix_fmt yuv420p "clips60/$T.mp4" && rm -rf "$W"
fi
rm -f "$L/quem.txt"; rmdir "$L"
[ -f "clips/$T.mp4" ] && echo "$T ok" || { echo "$T FALHOU (ver h3.log e comfy.log)"; exit 1; }
