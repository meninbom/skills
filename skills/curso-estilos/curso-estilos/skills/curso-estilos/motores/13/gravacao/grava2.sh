#!/bin/bash
# Grava o viewport do Roblox Studio com a câmera deitada (Windows, FFmpeg com gdigrab), em segundo plano.
# Uso: bash grava2.sh NOME SEGUNDOS      -> bruto_NOME.mp4 na pasta atual
# Depois o montar.py gira (transpose=2) e recorta para 9:16.
# A região da tela depende do SEU monitor: ajuste com as variáveis de ambiente abaixo.
#   Medido num monitor 2560x1080 com o Studio maximizado: X=664 Y=208 TAM=1336x752.
#   Para achar a sua: tire um print da tela inteira e meça o canto de cima à esquerda e o tamanho do viewport 3D.
X="${GRAVA_X:-664}"; Y="${GRAVA_Y:-208}"; TAM="${GRAVA_TAM:-1336x752}"
[ -n "$1" ] && [ -n "$2" ] || { echo "uso: bash grava2.sh NOME SEGUNDOS"; exit 1; }
nohup ffmpeg -v error -f gdigrab -framerate 30 -offset_x "$X" -offset_y "$Y" -video_size "$TAM" -draw_mouse 0 -t "$2" -i desktop \
  -c:v libx264 -crf 14 -preset ultrafast -pix_fmt yuv420p -y "bruto_$1.mp4" > "ff_$1.log" 2>&1 &
echo "gravando $1 por $2 s (regiao $TAM em $X,$Y)"
