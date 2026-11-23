# Demo do estilo 04 · série voxel com luz assada

Pré-requisitos: Node 18 ou mais novo, FFmpeg no PATH e o Google Chrome instalado (se estiver fora do lugar padrão, aponte a variável `CHROME_PATH` para o executável).

```
npm install
npm run demo
```

O demo faz três coisas: (1) assa a luz do mundo voxel em CPU (só na primeira vez; 10–60 s, grava ~75 MB em `motor/data/`), (2) junta cabeça + comum + planos do EP01 em `motor/shots_cas_ep01.js`, (3) renderiza 3 s do EP01.

Sai `saida/demo.mp4`: 540×960, 15 qps, mudo, yuv420p.

Tempo esperado: 1–2 min com placa de vídeo. Sem placa, rode com `DEMO_CPU=1` (no PowerShell: `$env:DEMO_CPU=1; npm run demo`); aí são ~16 s por quadro, uns 12 min.

Outro trecho ou episódio: `node motor/demo.mjs --ep ep02a --ini 6 --seg 3`. Stills e o episódio inteiro: veja o passo a passo da receita (`node render.mjs still ...` e `node render.mjs video ...`, dentro de `motor/`).

O que o demo NÃO traz: vozes, trilha e efeitos sonoros. As linhas do tempo `motor/timeline_cas_*.json` (tempos das falas) vêm prontas, então a legenda e os cortes funcionam sem áudio.

Este motor só renderiza em 9:16: a câmera, as legendas em pixel e os planos do episódio foram montados para 1080×1920. Para outro tamanho no mesmo formato, use a variável `LARGURA` (ex.: `LARGURA=540`).
