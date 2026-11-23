#!/usr/bin/env bash
# Vídeo com HUD -> mix -> mp4 final + _celular (720p, crf 20) -> checagem. uso: bash finalizar_v2.sh v5 [nome_do_arquivo]
# Precisa de: clipes/ (animados), ../voz/dialogo.wav + ../voz/timeline.json e um mix.json (copie de mix_exemplo.json).
cd "$(dirname "$0")"; V=${1:-v1}; OUT=final/${2:-EP01}_$V
python montar_v2.py || exit 1
python mix.py mix.json || exit 1
ffmpeg -v error -y -i final/_video.mp4 -i final/mix.wav -map 0:v -map 1:a -c:v copy -c:a aac -b:a 192k -ar 48000 -shortest -movflags +faststart $OUT.mp4
ffmpeg -v error -y -i $OUT.mp4 -vf scale=720:1280:flags=lanczos -c:v libx264 -profile:v main -level 3.1 -crf 20 -pix_fmt yuv420p \
  -c:a aac -b:a 128k -ar 48000 -movflags +faststart ${OUT}_celular.mp4
ls -la $OUT.mp4 ${OUT}_celular.mp4
# checagem objetiva: a skill irmã checar-video do pacote. Aponte CHECAR_VIDEO para a pasta dela (tem scripts/ e presets/).
if [ -n "$CHECAR_VIDEO" ]; then
  python "$CHECAR_VIDEO/scripts/checar.py" $OUT.mp4 --config "$CHECAR_VIDEO/presets/generico.json"
else
  echo "checagem pulada: defina CHECAR_VIDEO com a pasta da skill checar-video"
fi
