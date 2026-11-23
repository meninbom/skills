# Demo do estilo 01 · toon 3D em primeira pessoa

Pré-requisitos: Node 18 ou mais novo, FFmpeg no PATH e o Google Chrome instalado (se estiver fora do lugar padrão, aponte a variável `CHROME_PATH` para o executável).

```
npm install
npm run demo
```

Sai `saida/demo.mp4`: 3 s da porta do elevador abrindo no 13º andar (5 s a 8 s da peça), 540×960, 15 qps, mudo, yuv420p. O demo usa a qualidade rápida (`?ss=1&cube=1024`).

Tempo esperado: 10–30 s com placa de vídeo. Sem placa, rode com `DEMO_CPU=1` (no PowerShell: `$env:DEMO_CPU=1; npm run demo`); aí leva alguns minutos.

Depois do demo: `npm run folha` (5 quadros da peça) e `npm run filme` (os 15 s em 1080×1920 a 30 qps, qualidade final, com desfoque nos viradões).

Este motor só renderiza em 9:16: os textos e a moldura são desenhados em medidas fixas de 1080×1920 (`--vw`/`--vh` do `render.mjs` mudam só a janela do navegador, não o quadro). Para outro tamanho no mesmo formato, use `--largura`.
