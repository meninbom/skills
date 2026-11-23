# Demo · Globo explicativo

Pré-requisitos: Node 18+, Google Chrome (ou Edge/Chromium) instalado e FFmpeg no PATH. Não precisa de GPU nem de Python para o demo.

```
npm install
npm run demo
```

Sai `saida/demo.mp4`: 3 s do trecho "o mar escorre para os polos", 540×960, 30 qps, mudo, yuv420p.
Tempo esperado: 14 s com placa de vídeo (medido com RTX 4070 Ti 12 GB); cerca de 1 a 2 minutos por software (medido: 68 s com `DEMO_CPU=1`).

Variáveis opcionais: `CHROME_PATH` (outro navegador), `FFMPEG_PATH`, `DEMO_CPU=1` (força render por software, SwiftShader).

Depois do demo: `npm run stills` (quadros soltos em `stills/`), `npm run video` (os 34 s em 1080×1920, ~16 min por software).
Para trocar paleta, biomas ou dados: `pip install -r requirements.txt` e `python gen_mapas.py` (refaz o `mapas.js` em ~25 s).

Este motor só renderiza em 9:16: o globo, os relógios e os textos são desenhados em medidas fixas de 1080×1920. Para outro tamanho no mesmo formato, use `--largura`.
