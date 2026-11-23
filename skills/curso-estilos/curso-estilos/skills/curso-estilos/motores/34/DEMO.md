# Demo do estilo 34 · floresta low-poly

Pré-requisitos: Node 18 ou mais novo, FFmpeg no PATH e o Google Chrome instalado (se estiver fora do lugar padrão, aponte a variável `CHROME_PATH` para o executável).

```
npm install
npm run demo
```

Sai `saida/demo.mp4`: 3 s do plano lateral contra o sol (8 s a 11 s da peça), 540×960, 15 qps, mudo, yuv420p.

Tempo esperado: 15–40 s com placa de vídeo. Sem placa, rode com `DEMO_CPU=1` (no PowerShell: `$env:DEMO_CPU=1; npm run demo`); aí leva alguns minutos.

Depois do demo: `npm run folha` (folha de quadros da peça inteira) e `npm run filme` (os 31 s em 1080×1920 a 30 qps).

Este motor só renderiza em 9:16: a pós-produção 2D (chuva, brilhos, vinheta) é desenhada em medidas fixas de 1080×1920 (`--vw`/`--vh` do `render.mjs` mudam só a janela do navegador, não o quadro). Para outro tamanho no mesmo formato, use `--largura`.
