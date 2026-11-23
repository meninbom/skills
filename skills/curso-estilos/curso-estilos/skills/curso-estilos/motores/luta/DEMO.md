# Demo do estilo luta · luta 2D em código

Pré-requisitos: Node 18 ou mais novo, FFmpeg no PATH e o Google Chrome instalado (se estiver fora do lugar padrão, aponte a variável `CHROME_PATH` para o executável).

```
npm install
npm run demo
```

Sai `saida/demo.mp4`: 3 s da luta (6,5 s a 9,5 s: chute forte, congelamento e impact frame), 540×960, 30 qps, mudo, yuv420p.

Tempo esperado: 20–60 s. É Canvas 2D, não precisa de placa de vídeo; `DEMO_CPU=1` força o render por software (no PowerShell: `$env:DEMO_CPU=1; npm run demo`).

Depois do demo: `npm run folha` (6 acertos lado a lado), `npm run raiox` (o raio-X dos acertos) e `npm run filme` (os 27,4 s a 60 qps).

Trava das articulações (opcional, em Python): `pip install -r requirements.txt` e `python trava.py --page lab_luta.html --qps 30 --out TRAVA_luta.md`.

Este motor só renderiza em 9:16: o palco 2D (chão, câmera, impact frames) é desenhado em medidas fixas de 1080×1920 (`--vw`/`--vh` do `render.mjs` mudam só a janela do navegador, não o quadro). Para outro tamanho no mesmo formato, use `--largura`.
