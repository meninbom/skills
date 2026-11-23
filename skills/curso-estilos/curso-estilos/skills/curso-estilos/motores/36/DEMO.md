# Demo: 3 s do plano caro de "Fisgada"

**Pré-requisitos:** Node 18 ou mais novo, Google Chrome (ou Edge/Chromium) instalado e FFmpeg no PATH. O `npm install` baixa o `puppeteer-core` e o `gsap` (copiado para `vendor/`), que usa o Chrome que você já tem. O GSAP vai junto em `vendor/`; o render não usa internet.

```bash
npm install
npm run demo
```

**O que sai:** `saida/demo.mp4`, 3 s, 540×960, 24 qps, mudo, yuv420p: a pescadora dá o puxão (antecipação, smear, impact frame) e o rapaz sai voando da névoa.

**Tempo esperado:** ~1 min (medido: 58 s com `DEMO_CPU=1`, em CPU de desktop). É SVG: a placa de vídeo quase não muda o tempo.

- Chrome fora do lugar padrão: aponte `CHROME_PATH` para o executável. FFmpeg fora do PATH: `FFMPEG_PATH`.
- Folha de quadros para revisar: `npm run folha`. Filme inteiro em 1080×1920 (30 s): `npm run filme`. A réplica de estudo de 12 s: `npm run chuva`.
- Para renderizar pelo HyperFrames em vez do `render.mjs`: `npx hyperframes render --fps 24 --quality looks --output saida/filme.mp4` na pasta do motor (opcional; não faz parte do demo).

As duas peças deste motor só renderizam em 9:16 (o desenho é fixo em 1080×1920; `--esc` muda só a densidade). Numa composição sua, o tamanho vem do HTML: ponha `data-width="1920" data-height="1080"` no `#root`, desenhe o palco nessa medida e o `render.mjs` acompanha sozinho.
