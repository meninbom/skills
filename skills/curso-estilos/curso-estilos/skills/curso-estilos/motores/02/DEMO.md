# Demo do estilo 02 · sobrevivência "DIA 1"

Pré-requisitos: Node 18 ou mais novo, FFmpeg no PATH e o Google Chrome instalado (se estiver fora do lugar padrão, aponte a variável `CHROME_PATH` para o executável).

```
npm install
npm run demo
```

Sai `saida/demo.mp4`: 3 s do filme (21 s a 24 s: o Zé enchendo a banheira, com o cronômetro no HUD e a legenda), 540×960, 15 qps, mudo, yuv420p.

Tempo esperado: 15–40 s com placa de vídeo. Sem placa, rode com `DEMO_CPU=1` (no PowerShell: `$env:DEMO_CPU=1; npm run demo`); aí leva alguns minutos.

Depois do demo: `npm run folha` (7 quadros do filme), `npm run prancha` (o trator em 2 vistas) e `npm run filme` (o corte inteiro, retemporizado pelos tempos de palavra de `voz/narr_A.words.json`).

O que o demo NÃO traz: o áudio da narração e o boneco de malha gerada (`?z3` / `?z4`, centenas de MB). O demo usa o Zé em primitivas (`?z2=1`). Para usar o seu boneco gerado, siga o `METODO_MOVIMENTO.md` e ponha os arquivos em `malha/` e `mov2/`. As texturas em `tex/` estão reduzidas para 768 px; troque pelas suas em tamanho cheio (mesmo nome de arquivo).

Este motor só renderiza em 9:16: legendas, placas e pós-produção são desenhados em medidas fixas de 1080×1920 (`--vw`/`--vh` do `render.mjs` mudam só a janela do navegador, não o quadro). Para outro tamanho no mesmo formato, use `--largura`.
