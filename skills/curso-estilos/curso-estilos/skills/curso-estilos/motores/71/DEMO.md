# Demo · 71 Boneco de blocos (Blockbench pelo MCP)

**Precisa de:** Node 18+, Google Chrome (ou Edge/Chromium; `CHROME_PATH` se não estiver no lugar padrão) e FFmpeg no PATH. **Não precisa do Blockbench:** o demo usa o GLB já exportado (`cena/mensageira.glb`).

```
npm install
npm run demo
```

**O que sai:** `saida/demo.mp4` (540×960, 15 qps, 3 s, mudo): a mensageira salta da beira do cânion e a mochila se desdobra em asa (animações `salto`, `abrir_asas` e `planar` do GLB tocando na cena three.js).

**Tempo:** ~20 s em CPU (`DEMO_CPU=1 npm run demo`, render por software); 6 s com placa de vídeo (medido com RTX 4070 Ti 12 GB).

**Mais:** `npm run folha` (6 quadros-chave em `saida/folha.jpg`) · `npm run filme` (os 28,5 s em 1080×1920; em CPU demora bastante, prefira GPU).

**A parte do Blockbench** (modelar, pintar, animar e exportar pelo MCP) não roda no demo: precisa do programa aberto na sua máquina. O passo a passo está na receita (`estilos/71_blockbench_mcp.md`) e os arquivos em `modelo/`: abra `modelo/mensageira.bbmodel` no Blockbench para ver o rig e as 5 animações.

Horizontal (16:9): `node render.mjs --pagina cena/index.html --vw 1920 --vh 1080 --fps 30 --saida saida/filme_horizontal.mp4` (para um teste rápido: `--vw 960 --vh 540 --ini 9.6 --fim 12.6 --fps 15`). A câmera se ajusta ao formato e nada estica, mas os planos foram pensados para o vertical: confira o enquadramento na folha (`--vw 960 --vh 540 --folha 2,6.5,10.9,14,20.5,26.8`).
