# Demo do motor 07 (explicativo ilustrado)

- **Pré-requisitos:** Node 18+, Google Chrome (ou Edge) instalado e `ffmpeg` no PATH. Se o Chrome estiver fora do lugar padrão, aponte a variável `CHROME_PATH` para o executável.
- **Comando** (dentro de uma cópia desta pasta): `npm install` e depois `npm run demo`.
- **O que sai:** `saida/demo.mp4`, 3 s, 540×960, 30 qps, mudo, yuv420p. Duas cenas (mascote cai na clareira; vira vapor e surfa o rio do céu) ligadas por uma transição de zoom.
- **Tempo:** ~25 s no nosso teste (render por software). Sem placa de vídeo: `DEMO_CPU=1 npm run demo` (no PowerShell: `$env:DEMO_CPU=1; npm run demo`).
- **A arte do demo é substituta, desenhada por código** em `demo/arte_demo.js`. As ilustrações do filme original vieram de um modelo de imagem e não vêm no pacote. Para pôr a sua: gere placas (sem personagem) e folhas de poses no fundo magenta, recorte com `utilitarios/recortar_folha.py` e troque, em `demo/filme_demo.html`, os canvas por caminhos de arquivo dentro desta pasta (`iniciar({ floresta: 'arte/placas/floresta.png' }, { gota: 'arte/sprites/pose_00.png' })`).
- **Outros comandos:** `node render.mjs demo/filme_demo.html --folha saida/folha.jpg --times 0.3,0.9,1.6,2.5` (quadros parados para aprovar) e `node render.mjs demo/filme_demo.html --video saida/filme.mp4` (1080×1920).
- `gerar_voz.mjs` (voz paga, pede `--confirmo-custo`) e `mixar.mjs` não rodam no demo.

Este motor só renderiza em 9:16: o motor desenha num canvas 2D de 1080×1920 com medidas fixas. Para outro tamanho no mesmo formato, use `--largura`.
