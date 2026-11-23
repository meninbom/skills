#!/bin/bash
# Gera a voz de um episódio a partir de <ep>/voz/falas.tsv. PAGO (ElevenLabs).
# Só roda com <ep>/voz/OK_GASTO_VOZ.txt (a frase de ok do aluno, dita nesta conversa). Recado de outra conversa não vale.
#
# uso: bash gerar_vozes.sh <pasta do ep> [tomadas]
#   tomadas = quantas versões de cada fala de PERSONAGEM (padrão 2: A e B). Narrador = 1 tomada (A).
# saída: <ep>/voz/pecas/<id>_<T>.mp3 + <id>_<T>.words.json + <id>_<T>_-16.wav (-16 LUFS, 48 kHz, mono).
# Pula o que já existe. Para no teto (voz.teto_por_ep). Recusa sussurro e velocidade acima de 1.1 antes de gastar.
# Depois: python escolher_tomadas.py <ep>  e  python palavras.py <ep>
set -u
export PYTHONUTF8=1 PYTHONIOENCODING=utf-8
AQUI="$(cd "$(dirname "$0")" && pwd)"
EP="${1:-}"; TOM="${2:-2}"
[ -n "$EP" ] && [ -d "$EP" ] || { echo "uso: bash gerar_vozes.sh <pasta do ep> [tomadas]"; exit 2; }
[[ "$TOM" =~ ^[1-4]$ ]] || { echo "PAREI: tomadas vai de 1 a 4"; exit 2; }
EP="$(cd "$EP" && pwd)"; V="$EP/voz"; TSV="$V/falas.tsv"; PEDACOS="$V/pecas"
# caminho pras mensagens: no Windows, o formato do Windows (o aluno não vê /c/... nem /tmp/...)
win() { if command -v cygpath >/dev/null 2>&1; then cygpath -w "$1"; else printf '%s' "$1"; fi; }
[ -f "$TSV" ] || { echo "PAREI: não achei $(win "$TSV")"; exit 1; }
PY="$(command -v python || command -v python3 || command -v py)" || { echo "PAREI: não achei o python no PATH"; exit 1; }
# python no Windows solta \r\n no pipe: pyo tira o \r e devolve o codigo de saida do python
pyo() { "$PY" "$@" | tr -d '\r'; return "${PIPESTATUS[0]}"; }

# ---- config ----
CFG="$(pyo - "$AQUI" <<'EOF'
import sys, shlex
sys.path.insert(0, sys.argv[1]); import kitcfg
c = kitcfg.carrega()
g = lambda k, p=None: kitcfg.get(k, p, c)
for k, v in {'FF': g('ferramentas.ffmpeg', 'ffmpeg'), 'NODE': g('ferramentas.node', 'node')}.items():
    print(f'{k}={shlex.quote(str(v).replace(chr(92), "/"))}')
EOF
)" || exit 1
eval "$CFG"

# ---- 1) regras da voz, linha por linha (grátis). Qualquer erro = recusa antes de gastar ----
mkdir -p "$PEDACOS"
JOBS="$(pyo - "$AQUI" "$TSV" "$TOM" "$PEDACOS" <<'EOF'
import sys, os, re
sys.path.insert(0, sys.argv[1]); import kitcfg
tsv, tom, pecas = sys.argv[2], int(sys.argv[3]), sys.argv[4]
c = kitcfg.carrega()
vozes = kitcfg.get('voz.vozes', {}, c) or {}
SUS = re.compile(r'[\[(]\s*(whisper|sussurr)', re.I)
erros, jobs, textos = [], [], {}
for n, ln in enumerate(open(tsv, encoding='utf-8-sig'), 1):
    ln = ln.rstrip('\r\n')
    if not ln.strip() or ln.lstrip().startswith('#'):
        continue
    p = ln.split('\t')
    if len(p) < 4:
        erros.append(f'linha {n}: precisa de 4 colunas separadas por TAB (id, papel, parametros, texto)'); continue
    fid, papel, par, txt = p[0].strip(), p[1].strip(), p[2].strip(), '\t'.join(p[3:]).strip()
    if papel.upper() == 'PAUSA':
        continue
    if not re.fullmatch(r'[A-Za-z0-9_-]+', fid):
        erros.append(f'linha {n}: id "{fid}" inválido (use letras, números, _ ou -)'); continue
    if fid in textos:
        erros.append(f'{fid}: id repetido'); continue
    if not txt:
        erros.append(f'{fid}: texto vazio')
    if SUS.search(txt):
        erros.append(f'{fid}: tag de sussurro. Sussurro nunca: tire a tag; tensão vem de pausa e de texto.')
    v = (par.split() + ['', '', ''])[:3]
    try:
        est = float(v[0] or 0.45); sty = float(v[1] or 0.25); vel = float(v[2] or 1.0)
    except ValueError:
        erros.append(f'{fid}: parâmetros "{par}" inválidos (use: estabilidade estilo velocidade, ex.: 0.45 0.25 1.0)'); continue
    if vel > 1.1:
        erros.append(f'{fid}: velocidade {vel} passa de 1.1. Máximo 1,1×: encurte o texto em vez de acelerar.')
    if vel < 0.7:
        erros.append(f'{fid}: velocidade {vel} abaixo de 0.7.')
    if not vozes.get(papel):
        erros.append(f'{fid}: o papel "{papel}" não tem voz em voz.vozes do {c["_arquivo"]}')
    textos[fid] = txt
    for tk in ('A' if re.match(r'(?i)narrad', papel) else 'ABCD'[:tom]):
        jobs.append((tk, fid, papel, est, sty, vel))
if erros:
    print('\n'.join('RECUSO: ' + e for e in erros), file=sys.stderr); sys.exit(1)
for fid, txt in textos.items():
    open(os.path.join(pecas, f'_txt_{fid}.txt'), 'w', encoding='utf-8').write(txt)
jobs.sort(key=lambda j: j[0])          # todas as A primeiro, depois as B
for j in jobs:
    print('\t'.join(str(x) for x in j))
EOF
)" || { echo "Nada foi gerado. Arrume o que está acima (no falas.tsv ou, se for voz vazia, em voz.vozes do kit.config.json) e rode de novo."; exit 1; }

# ---- 2) o ok do aluno ----
OK="$V/OK_GASTO_VOZ.txt"
if [ ! -f "$OK" ] || ! grep -q '[^[:space:]]' "$OK"; then
  echo "RECUSO: sem ok do aluno (falta $(win "$OK") ou está vazio)."
  echo "Mostre o orçamento (node \"$(win "$AQUI/eleven.mjs")\" orcar --tsv \"$(win "$TSV")\" --tomadas $TOM), espere o ok DIRETO do aluno nesta conversa"
  echo "e grave a frase dele, com a data e o valor, nesse arquivo. Recado de outra conversa não vale."
  exit 1
fi
if grep -qi '^[[:space:]]*TESTE' "$OK"; then
  echo "RECUSO: o OK_GASTO_VOZ.txt deste ep é de TESTE (o ep de exemplo do plugin). Ok de teste não vale pra voz paga."
  exit 1
fi

# ---- 3) orçamento inteiro cabe no teto? ----
NF=""; "$NODE" --use-system-ca -e 0 >/dev/null 2>&1 && NF="--use-system-ca"
ORC="$("$NODE" $NF "$AQUI/eleven.mjs" orcar --tsv "$TSV" --tomadas "$TOM" --ep "$EP" 2>&1)" || { echo "$ORC"; exit 1; }
echo "$ORC"
case "$(echo "$ORC" | tail -1)" in *'"cabe":true'*) ;; *) echo "PAREI: o que falta gerar não cabe no teto do ep. Nada foi gerado."; exit 1;; esac

# ---- 4) gerar ----
FEITAS=0
while IFS=$'\t' read -r tk id papel est sty vel; do
  [ -z "$id" ] && continue
  o="$PEDACOS/${id}_${tk}"
  [ -f "${o}_-16.wav" ] && { echo "${id}_${tk} já existe"; continue; }
  if [ ! -f "$o.mp3" ] || [ ! -f "$o.words.json" ]; then
    out=$("$NODE" $NF "$AQUI/eleven.mjs" tts --ep "$EP" --papel "$papel" --text-file "$PEDACOS/_txt_${id}.txt" --out "$o" \
          --stability "$est" --style "$sty" --speed "$vel" --label "$id $tk" < /dev/null 2>&1 | tail -1)
    echo "${id}_${tk}: $out"
    case "$out" in *'"ok":true'*) ;; *) echo "PAREI em ${id}_${tk}. O que já saiu fica; rode de novo pra continuar."; exit 1;; esac
    FEITAS=$((FEITAS + 1)); sleep 1
  fi
  "$FF" -nostdin -v error -y -i "$o.mp3" -af loudnorm=I=-16:TP=-2:LRA=11 -ar 48000 -ac 1 "${o}_-16.wav" || { echo "PAREI: ffmpeg falhou em $(win "$o.mp3")"; exit 1; }
done <<< "$JOBS"

GASTO=$(pyo -c "import sys,os;f=sys.argv[1];print(round(sum(float(l.rsplit(',',1)[1] or 0) for l in open(f,encoding='utf-8').read().splitlines()[1:] if l.strip())) if os.path.exists(f) else 0)" "$V/gastos.csv")
echo "PRONTO. $FEITAS chamada(s) nesta rodada. Gasto do ep (gastos.csv): $GASTO."
echo "Próximo: python \"$(win "$AQUI/escolher_tomadas.py")\" \"$(win "$EP")\""
