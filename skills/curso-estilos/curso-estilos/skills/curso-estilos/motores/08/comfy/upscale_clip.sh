#!/bin/bash
# upscale_clip.sh IN.mp4 OUT.mp4 [W H]  -> Real-ESRGAN General WDN x4 e redimensiona para WxH (padrão 1080x1920), mantém o áudio
IN="$1"; OUT="$2"; W=${3:-1080}; H=${4:-1920}
# pasta do Real-ESRGAN ncnn-vulkan (github.com/xinntao/Real-ESRGAN, binario portatil): variavel REALESRGAN_DIR
R="${REALESRGAN_DIR:?defina REALESRGAN_DIR com a pasta do realesrgan-ncnn-vulkan}"
T=$(mktemp -d); mkdir -p "$T/in" "$T/out"
FPS=$(ffprobe -v error -select_streams v:0 -show_entries stream=r_frame_rate -of csv=p=0 "$IN")
ffmpeg -v error -i "$IN" -fps_mode passthrough "$T/in/%05d.png"
"$R/realesrgan-ncnn-vulkan" -i "$T/in" -o "$T/out" -n RealESRGAN_General_WDN_x4_v3 -s 4 -f png -m "$R/models" > /dev/null 2>&1
ffmpeg -v error -y -framerate "$FPS" -i "$T/out/%05d.png" -i "$IN" -map 0:v -map 1:a? -vf "scale=$W:$H:flags=lanczos" \
  -c:v libx264 -preset slow -crf 16 -pix_fmt yuv420p -c:a aac -b:a 192k -shortest "$OUT"
rm -rf "$T"
