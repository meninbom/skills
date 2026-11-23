#!/bin/bash
# H3 completo de UM plano (20 passos, sem LoRA, 768x1344, 24 qps) + RIFE pra 60 qps.
# Pega a trava da GPU (mkdir), espera o comando gpu.antes_de_subir liberar, espera ComfyUI de outro desligar,
# sobe o ComfyUI, gera, DESLIGA (quem sobe desliga), passa no RIFE e solta a trava.
#
# uso: bash h3_um.sh <pasta h3 do ep> <PLANO> [trava] [--seco] [--forcar]
#   <pasta h3 do ep>  ep01/h3 (tem clipes.json e placas/<PLANO>.png)
#   [trava]           opcional: troca a gpu.trava do kit.config.json
#   --seco            só confere e mostra o que faria. Não sobe nada, não usa a GPU.
#   --forcar          roda mesmo depois de 3 tentativas do plano
# saídas: clips/<PLANO>.mp4 (24 qps, com o som do H3) e clips60/<PLANO>.mp4 (60 qps, mudo, crf 14, yuv420p)
# cada clipe gerado conta 1 tentativa (tentativas/<PLANO>.txt). A semente muda a cada tentativa (1, 2, 3),
# a não ser que o clipes.json traga "seed". Depois de 3, use a reserva (ver SKILL.md).
set -u
export PYTHONUTF8=1 PYTHONIOENCODING=utf-8
AQUI="$(cd "$(dirname "$0")" && pwd)"
SECO=0; FORCAR=0; POS=()
for a in "$@"; do case "$a" in --seco) SECO=1;; --forcar) FORCAR=1;; *) POS+=("$a");; esac; done
D="${POS[0]:-}"; T="${POS[1]:-}"; TRAVA_ARG="${POS[2]:-}"
[ -n "$D" ] && [ -n "$T" ] || { echo "uso: bash h3_um.sh <pasta h3 do ep> <PLANO> [trava] [--seco] [--forcar]"; exit 2; }
[[ "$T" =~ ^[A-Za-z0-9_.-]+$ ]] || { echo "PAREI: nome de plano inválido: $T"; exit 2; }
cd "$D" 2>/dev/null || { echo "PAREI: não achei a pasta $D"; exit 1; }
D="$(pwd)"
PY="$(command -v python || command -v python3 || command -v py)" || { echo "PAREI: não achei o python no PATH"; exit 1; }
# python no Windows solta \r\n no pipe: pyo tira o \r e devolve o codigo de saida do python
pyo() { "$PY" "$@" | tr -d '\r'; return "${PIPESTATUS[0]}"; }

# ---- config (kit.config.json, pela kitcfg.py da skill) ----
CFG="$(pyo - "$AQUI" <<'EOF'
import sys, os, shlex
from urllib.parse import urlparse
sys.path.insert(0, sys.argv[1]); import kitcfg
c = kitcfg.carrega()
g = lambda k, p=None: kitcfg.get(k, p, c)
url = str(g('h3.comfyui_url', 'http://127.0.0.1:8188')).rstrip('/')
u = urlparse(url)
cam = lambda x: str(x or '').replace('\\', '/')
v = {'CFG_ARQ': cam(c['_arquivo']), 'COMFY_DIR': cam(g('h3.comfyui_dir', '')), 'URL': url,
     'HOST': u.hostname or '127.0.0.1', 'PORTA': str(u.port or 8188), 'FPS': str(g('h3.fps', 24)),
     'TRAVA': cam(g('gpu.trava', os.path.join(kitcfg.pasta_serie(c), '.gpu.lock'))),
     'RIFE_DIR': cam(g('rife.dir', '')), 'RIFE_MODELO': str(g('rife.modelo', 'rife-v4.6')),
     'FF': cam(g('ferramentas.ffmpeg', 'ffmpeg')), 'PYK': cam(g('ferramentas.python', '')),
     'ANTES': str(g('gpu.antes_de_subir', ''))}
for k, x in v.items(): print(f'{k}={shlex.quote(x)}')
EOF
)" || exit 1
eval "$CFG"
[ -n "$TRAVA_ARG" ] && TRAVA="$TRAVA_ARG"
[ -n "$PYK" ] && PY="$PYK"

# ---- o plano (clipes.json) ----
mkdir -p prompts
INFO="$(pyo - "$D/clipes.json" "$T" "$D/prompts/$T.txt" <<'EOF'
import sys, json, os
arq, t, saida = sys.argv[1:4]
if not os.path.isfile(arq): sys.exit(f'PAREI: não achei {arq}')
J = json.load(open(arq, encoding='utf-8'))
c = J.get(t)
if not c: sys.exit(f'PAREI: o plano {t} não está no clipes.json')
p = (c.get('prompt') or '').strip()
if not p: sys.exit(f'PAREI: o plano {t} está sem prompt no clipes.json')
open(saida, 'w', encoding='utf-8').write(p)
print(int(c.get('q', 97)), c.get('seed', ''))
EOF
)" || exit 1
read -r Q SEED_FIXA <<< "$INFO"
NT=0; [ -f "tentativas/$T.txt" ] && NT=$(grep -c . "tentativas/$T.txt")
SEED="${SEED_FIXA:-$((NT + 1))}"

PYC="$COMFY_DIR/python_embeded/python.exe"; MAIN="$COMFY_DIR/ComfyUI/main.py"
RIFE_EXE="$RIFE_DIR/rife-ncnn-vulkan.exe"; [ -f "$RIFE_EXE" ] || RIFE_EXE="$RIFE_DIR/rife-ncnn-vulkan"
no_ar() { curl -s -m 3 "$URL/system_stats" >/dev/null 2>&1; }

if [ "$SECO" = 1 ]; then
  F=0
  ok() { echo "[ok]    $*"; }; ruim() { echo "[FALTA] $*"; F=$((F + 1)); }
  echo "== h3_um --seco: $T (nada sobe, nada usa a GPU) =="
  ok "config: $CFG_ARQ"
  ok "plano $T: $Q quadros (~$((Q / FPS)) s), tentativa $((NT + 1)), seed $SEED"
  [ -f "placas/$T.png" ] && ok "placa: placas/$T.png" || ruim "placa: falta placas/$T.png (rode o placa.py)"
  if [ -z "$COMFY_DIR" ]; then ruim "h3.comfyui_dir vazio no kit.config.json"
  elif [ ! -d "$COMFY_DIR" ]; then ruim "ComfyUI: a pasta \"$COMFY_DIR\" não existe (h3.comfyui_dir)"
  else
    [ -f "$PYC" ] && ok "python do ComfyUI: $PYC" || ruim "python do ComfyUI portátil: falta $PYC"
    [ -f "$MAIN" ] && ok "ComfyUI: $MAIN" || ruim "ComfyUI: falta $MAIN"
  fi
  if [ -z "$RIFE_DIR" ]; then ruim "rife.dir vazio no kit.config.json"
  elif [ ! -d "$RIFE_DIR" ]; then ruim "RIFE: a pasta \"$RIFE_DIR\" não existe (rife.dir)"
  else
    [ -f "$RIFE_EXE" ] && ok "RIFE: $RIFE_EXE" || ruim "RIFE: não achei rife-ncnn-vulkan(.exe) em $RIFE_DIR"
    [ -d "$RIFE_DIR/$RIFE_MODELO" ] && ok "modelo do RIFE: $RIFE_MODELO" || ruim "modelo do RIFE: falta a pasta $RIFE_DIR/$RIFE_MODELO (rife.modelo)"
  fi
  command -v "$FF" >/dev/null 2>&1 || [ -f "$FF" ] && ok "ffmpeg: $FF" || ruim "ffmpeg: não achei \"$FF\" (ferramentas.ffmpeg)"
  command -v curl >/dev/null 2>&1 && ok "curl" || ruim "curl (vem com o Git Bash)"
  [ "$NT" -ge 3 ] && echo "[aviso] $T já teve $NT tentativas: sem --forcar eu não rodo. Use a reserva."
  echo
  echo "O que eu faria:"
  if [ -n "$ANTES" ]; then echo " 1. esperar o gpu.antes_de_subir dar ok (exit 0): $ANTES"; else echo " 1. gpu.antes_de_subir vazio: pulo"; fi
  if [ -d "$TRAVA" ]; then echo " 2. pegar a trava $TRAVA (OCUPADA agora: $(cat "$TRAVA/quem.txt" 2>/dev/null); eu esperaria)"
  else echo " 2. pegar a trava: mkdir $TRAVA (livre agora)"; fi
  if no_ar; then echo " 3. ver se tem ComfyUI no ar em $URL: TEM agora (de outro). Eu soltaria a trava e esperaria ele desligar."
  else echo " 3. ver se tem ComfyUI no ar em $URL: não tem (só olhei)"; fi
  echo " 4. subir: cd \"$COMFY_DIR\" && PYTHONUTF8=1 PYTHONIOENCODING=utf-8 python_embeded/python.exe -s ComfyUI/main.py --listen $HOST --port $PORTA --windows-standalone-build --disable-auto-launch --disable-pinned-memory"
  echo " 5. gerar: $PY h3.py --img placas/$T.png --prompt-file prompts/$T.txt --out clips/$T.mp4 --frames $Q --seed $SEED"
  echo " 6. DESLIGAR o ComfyUI da porta $PORTA (quem sobe desliga)"
  echo " 7. RIFE: $RIFE_EXE -m $RIFE_DIR/$RIFE_MODELO -n <quadros x 60 / $FPS>"
  echo " 8. $FF -framerate 60 ... -c:v libx264 -crf 14 -pix_fmt yuv420p clips60/$T.mp4"
  echo " 9. soltar a trava"
  echo
  "$PY" "$AQUI/h3.py" --img "placas/$T.png" --prompt-file "prompts/$T.txt" --out "clips/$T.mp4" --frames "$Q" --seed "$SEED" --seco || F=$((F + 1))
  echo
  if [ "$F" -gt 0 ]; then echo "SECO: falta coisa ($F). Nada subiu."; exit 1; fi
  echo "SECO: tudo pronto pra rodar. Nada subiu."; exit 0
fi

# ---- de verdade ----
[ -f "clips60/$T.mp4" ] && { echo "$T: clips60/$T.mp4 já existe. Nada a fazer."; exit 0; }
if [ ! -f "clips/$T.mp4" ] && [ "$NT" -ge 3 ] && [ "$FORCAR" = 0 ]; then
  echo "PAREI: $T já teve $NT tentativas. Use a reserva (placa parada ou trecho limpo de um clipe). Pra tentar mesmo assim: --forcar"; exit 3
fi
[ -f "placas/$T.png" ] || { echo "PAREI: falta placas/$T.png (rode o placa.py)"; exit 1; }
[ -n "$RIFE_DIR" ] && [ -f "$RIFE_EXE" ] && [ -d "$RIFE_DIR/$RIFE_MODELO" ] || { echo "PAREI: RIFE não encontrado (rife.dir / rife.modelo). Rode com --seco pra ver o que falta."; exit 1; }
if [ ! -f "clips/$T.mp4" ]; then
  [ -f "$PYC" ] && [ -f "$MAIN" ] || { echo "PAREI: ComfyUI portátil não encontrado em \"$COMFY_DIR\". Rode com --seco pra ver o que falta."; exit 1; }
fi

PEGUEI=0; SUBI=0; CPID=""
desliga() {
  echo "$(date +%T) desligando o ComfyUI da porta $PORTA (quem sobe desliga)"
  if command -v powershell >/dev/null 2>&1; then
    powershell -NoProfile -Command "Get-NetTCPConnection -LocalPort $PORTA -State Listen -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id \$_.OwningProcess -Force }" >/dev/null 2>&1
  fi
  [ -n "$CPID" ] && kill "$CPID" 2>/dev/null
  SUBI=0
}
limpa() {
  [ "$SUBI" = 1 ] && desliga
  if [ "$PEGUEI" = 1 ]; then rm -f "$TRAVA/quem.txt"; rmdir "$TRAVA" 2>/dev/null; PEGUEI=0; fi
}
trap limpa EXIT
trap 'exit 130' INT TERM

mkdir -p "$(dirname "$TRAVA")"
while true; do
  if [ -n "$ANTES" ]; then
    avisei=0
    until bash -c "$ANTES" >/dev/null 2>&1; do
      [ "$avisei" = 0 ] && { echo "$(date +%T) esperando o gpu.antes_de_subir liberar a GPU..."; avisei=1; }; sleep 60
    done
  fi
  avisei=0
  until mkdir "$TRAVA" 2>/dev/null; do
    [ "$avisei" = 0 ] && { echo "$(date +%T) trava ocupada ($(cat "$TRAVA/quem.txt" 2>/dev/null)). Esperando..."; avisei=1; }; sleep 15
  done
  PEGUEI=1; echo "animar-local $T $(date)" > "$TRAVA/quem.txt"
  if [ ! -f "clips/$T.mp4" ] && no_ar; then
    rm -f "$TRAVA/quem.txt"; rmdir "$TRAVA"; PEGUEI=0
    echo "$(date +%T) já tem ComfyUI no ar em $URL (de outro). Não uso nem derrubo: espero 2 min."; sleep 120
  else break; fi
done

mkdir -p clips clips60 tentativas
if [ ! -f "clips/$T.mp4" ]; then
  echo "$(date +%T) subindo o ComfyUI (log em $D/comfy_h3.log)"
  ( cd "$COMFY_DIR" && export PYTHONUTF8=1 PYTHONIOENCODING=utf-8 && exec ./python_embeded/python.exe -s ComfyUI/main.py --listen "$HOST" --port "$PORTA" \
      --windows-standalone-build --disable-auto-launch --disable-pinned-memory ) > "$D/comfy_h3.log" 2>&1 &
  CPID=$!; SUBI=1
  for i in $(seq 1 100); do no_ar && break; sleep 3; done
  no_ar || { echo "PAREI: o ComfyUI não subiu em 5 min. Veja $D/comfy_h3.log"; exit 1; }
  echo "$(date +%T) gerando $T ($Q quadros, seed $SEED, tentativa $((NT + 1)))"
  "$PY" "$AQUI/h3.py" --img "placas/$T.png" --prompt-file "prompts/$T.txt" --out "clips/$T.mp4" --frames "$Q" --seed "$SEED" 2>&1 | tee -a h3.log
  desliga
  sleep 5
  [ -f "clips/$T.mp4" ] || { echo "PAREI: o H3 não gerou clips/$T.mp4. Veja h3.log e comfy_h3.log"; exit 1; }
  echo "$(date '+%d/%m %H:%M') seed $SEED" >> "tentativas/$T.txt"
fi

echo "$(date +%T) RIFE $FPS -> 60 qps"
W="_rife_$T"
rm -rf "$W"; mkdir -p "$W/src" "$W/out"
"$FF" -v error -i "clips/$T.mp4" -start_number 1 "$W/src/%04d.png" || { echo "PAREI: ffmpeg não abriu clips/$T.mp4"; exit 1; }
n=$(ls "$W/src" | wc -l); alvo=$(( n * 60 / FPS ))
"$RIFE_EXE" -i "$W/src" -o "$W/out" -m "$RIFE_DIR/$RIFE_MODELO" -n "$alvo" >/dev/null 2>&1
"$FF" -v error -y -framerate 60 -i "$W/out/%08d.png" -c:v libx264 -crf 14 -pix_fmt yuv420p "clips60/$T.mp4" && rm -rf "$W"
[ -f "clips60/$T.mp4" ] || { echo "PAREI: o RIFE não gerou clips60/$T.mp4 (a pasta $W ficou pra conferir)"; exit 1; }
echo "$(date +%T) pronto: clips60/$T.mp4. Agora confira a deriva (revisor-quadros/deriva.py) antes de aprovar."
