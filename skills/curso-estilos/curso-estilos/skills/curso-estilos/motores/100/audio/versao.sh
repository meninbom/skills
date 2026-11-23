#!/bin/bash
# bash audio/versao.sh <voz> [luz|kurz]
# Precisa de audio/<voz>.mp3 e audio/<voz>.words.json. Faz: tempos da voz -> cues -> render -> mix -> vídeo final + versão de celular.
set -e
V=$1; E=${2:-luz}; cd "$(dirname "$0")"
[ -f "$V.mp3" ] && [ -f "$V.words.json" ] || { echo "faltam audio/$V.mp3 e audio/$V.words.json"; exit 1; }
LEAD=0.30; echo $LEAD > $V.lead.txt
node voz.mjs tempos $V
python -I -c "
import json,sys
t=json.load(open(sys.argv[1]+'.tempos.json')); L=float(sys.argv[2])
json.dump([[round(a+L,3),round(b+L,3)] for a,b in t],open(sys.argv[1]+'.tempos_lead.json','w'))" $V $LEAD
cd .. && node gerar_cues.mjs audio/$V.tempos_lead.json
echo "window.ESTILO = '$E';" > estilo.js
mkdir -p renders
t0=$(date +%s)
npx -y hyperframes@0.8.162 render -q looks -o renders/_${E}_${V}_mudo.mp4 2>&1 | tail -2 | cut -c1-70
echo "render $E $V: $(( $(date +%s) - t0 )) s"
(cd audio && PYTHONUTF8=1 python -I mix.py $V)
ffmpeg -v error -y -i renders/_${E}_${V}_mudo.mp4 -i audio/$V.mix.wav -c:v copy -af volume=1.5dB -c:a aac -b:a 192k -shortest -movflags +faststart renders/ep_${E}_voz$V.mp4
ffmpeg -v error -y -i renders/ep_${E}_voz$V.mp4 -vf scale=720:-2 -c:v libx264 -crf 20 -pix_fmt yuv420p -c:a copy -movflags +faststart renders/ep_${E}_voz${V}_celular.mp4
ffprobe -v error -show_entries format=duration:stream=codec_name,pix_fmt -of csv=p=0 renders/ep_${E}_voz${V}_celular.mp4
