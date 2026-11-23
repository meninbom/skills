#!/usr/bin/env bash
# Render final v4 COM A TRAVA da serie (mkdir atomico em .render.lock; espera 60 s se ocupada; libera no fim,
# mesmo com erro). Props = decisao da noite 21-22/10: fecho c (voz nova), rab b, elenco b, amador proni.
# Audio = robot/mix_v4.wav (tools/mix_v4.py: voz nova -16, trilha 12 dB abaixo, SFX parafuso b 20 dB abaixo, master -14).
set -u
PROJ="."
LOCK=".render.lock"
PROPS='{"fecho":"c","rab":"b","elenco":"b","amador":"proni"}'
cd "$PROJ" || exit 1
until mkdir "$LOCK" 2>/dev/null; do
  echo "$(date +%T) trava ocupada ($LOCK), espero 60 s"
  sleep 60
done
echo "robot v4 $(date '+%F %T') pid $$" > "$LOCK/quem.txt"
trap 'rm -f "$LOCK/quem.txt"; rmdir "$LOCK" 2>/dev/null; echo "$(date +%T) trava liberada"' EXIT
echo "$(date +%T) trava pega"
t0=$(date +%s)
npx remotion render src/index.ts Robot out/robot_v4_mudo.mp4 --props="$PROPS" --concurrency=4 --muted --crf=16 || { echo "ERRO render"; exit 2; }
python tools/mix_v4.py --mux out/robot_v4_mudo.mp4 ../robot_v4.mp4 || { echo "ERRO mux"; exit 3; }
# celular: <= 20 MB, CRF 23 com teto de taxa (o grao renovado a cada quadro estoura o tamanho), AAC 48 kHz
for mr in 3.8 3.5 3.2 3.0 2.8; do
  ffmpeg -v error -y -i ../robot_v4.mp4 -c:v libx264 -preset slow -crf 23 -maxrate ${mr}M -bufsize 7M \
    -x264-params aq-mode=3 -pix_fmt yuv420p -profile:v high -level 4.1 -movflags +faststart \
    -c:a aac -b:a 160k -ar 48000 -ac 2 ../robot_v4_celular.mp4 || { echo "ERRO celular"; exit 4; }
  sz=$(stat -c %s ../robot_v4_celular.mp4)
  echo "celular crf 23 teto ${mr}M: $sz bytes"
  [ "$sz" -le 20000000 ] && break
done
echo "FIM $(( $(date +%s) - t0 )) s"
