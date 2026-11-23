# Demo · Mapa que vira mangá

Pré-requisitos: Node 18+, Google Chrome (ou Edge/Chromium) instalado e FFmpeg no PATH. O demo não precisa de Python, de GPU nem de internet: a cena da Avenida Paulista já vem em `cena/paulista.json`.

```
npm install
npm run demo
```

Sai `saida/demo.mp4`: voo de 3 s descendo sobre a avenida, 540×960, 12 desenhos por segundo entregues a 24 qps, mudo, yuv420p.
Tempo esperado: 2 a 3 minutos por software (medido: 130 s com `DEMO_CPU=1`); 10 s com placa de vídeo (medido com RTX 4070 Ti 12 GB).

Variáveis opcionais: `CHROME_PATH` (outro navegador), `FFMPEG_PATH`, `DEMO_CPU=1` (força render por software, SwiftShader).

Depois do demo: `npm run fotos` (stills 2400×1920 em `saida/`), `npm run voo` (voo de 7 s em 1080×1920).
Para o seu lugar: `pip install -r requirements.txt` e `python scripts/baixar_dados.py minha_rua <lat> <lon> 450`, depois troque `paulista` por `minha_rua` nos comandos.
Ao publicar, ponha na legenda: "© OpenStreetMap contributors · relevo: Terrain Tiles (AWS Open Data)".

Horizontal (16:9): o tamanho é o terceiro argumento, largura x altura. Ex.: `node scripts/render.mjs voo paulista 1920x1080 7 "eixo=Avenida%20Paulista&ss=3"` (ou `960x540` para um teste rápido). A câmera se ajusta ao formato, nada estica.
