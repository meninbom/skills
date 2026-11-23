# Demo do estilo 35 · Herói 3D PBR

**Pré-requisitos:** Node 18+, Google Chrome (ou Edge/Chromium) e FFmpeg no PATH. Nada de Python, GPU ou gerador de imagem para o demo.

```bash
npm install
npm run demo
```

**O que sai:** `saida/demo.mp4`, 3 s em volta do golpe da marreta (com o impact frame), 540×960, 12 qps, mudo, `yuv420p`.

**Tempo esperado:** 36 quadros. Com placa de vídeo, 11 s (medido com RTX 4070 Ti 12 GB). Por software (`DEMO_CPU=1 npm run demo`; no PowerShell: `$env:DEMO_CPU=1; npm run demo`), 3 a 5 min (medido: 294 s com o PC ocupado).

- Chrome fora do lugar padrão: aponte `CHROME_PATH` para o executável. FFmpeg fora do PATH: `FFMPEG_PATH`.
- O demo não gera imagem: o modelo é código (`_heroi_body.js`) e as texturas pintadas já vêm reduzidas em `tex/` e `tex_novo/` (768 px). Para o seu herói, troque os JPG dessas pastas pelos seus, com o mesmo nome (o código aceita qualquer tamanho quadrado), e as medidas no topo de `_heroi_body.js`.
- Depois do demo: `npm run folha` (3 quadros lado a lado) e `npm run filme` (30,5 s em 1080×1920; na CPU leva perto de 1 h).

Este motor só renderiza em 9:16: a composição 2D por cima do 3D (impact frames, brilhos, capim de primeiro plano) usa medidas fixas de 1080×1920. Para outro tamanho no mesmo formato, use `--largura`.
