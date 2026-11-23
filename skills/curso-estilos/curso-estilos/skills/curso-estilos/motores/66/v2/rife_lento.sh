#!/usr/bin/env bash
# Câmera lenta 2x de um clipe com RIFE (rife-ncnn-vulkan, modelo rife-v4.6; usa GPU): clipes/<P>.mp4 -> clipes/<P>_lento.mp4
# (24 qps, o dobro da duração). Uma tarefa de GPU por vez: rode com o ComfyUI desligado. NÃO roda no demo.
# uso: RIFE_DIR=/caminho/rife-ncnn-vulkan bash rife_lento.sh N3      (baixe em github.com/nihui/rife-ncnn-vulkan/releases)
set -e
cd "$(dirname "$0")"; P=$1
: "${RIFE_DIR:?defina RIFE_DIR com a pasta do rife-ncnn-vulkan}"
EXE=rife-ncnn-vulkan; [ -f "$RIFE_DIR/rife-ncnn-vulkan.exe" ] && EXE=rife-ncnn-vulkan.exe
TMP="$(pwd)/_rife_$P"; rm -rf "$TMP"; mkdir -p "$TMP/in" "$TMP/out"
ffmpeg -v error -y -i "clipes/$P.mp4" "$TMP/in/%08d.png"
(cd "$RIFE_DIR" && ./$EXE -i "$TMP/in" -o "$TMP/out" -m rife-v4.6 > /dev/null)
ffmpeg -v error -y -framerate 24 -i "$TMP/out/%08d.png" -c:v libx264 -crf 14 -pix_fmt yuv420p "clipes/${P}_lento.mp4"
echo "$(ls "$TMP/in" | wc -l) -> $(ls "$TMP/out" | wc -l) quadros: clipes/${P}_lento.mp4"
rm -rf "$TMP"
