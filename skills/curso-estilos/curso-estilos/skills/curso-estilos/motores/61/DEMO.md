# Demo: masmorra KayKit em 3 s

**Pré-requisitos:** Node 18 ou mais novo, Google Chrome (ou Edge/Chromium) instalado e FFmpeg no PATH. Nada é baixado além do `puppeteer-core` (que usa o Chrome que você já tem).

```bash
npm install
npm run demo
```

**O que sai:** `saida/demo.mp4`, 3 s, 540×960, 30 qps, mudo, yuv420p: a maga carrega o gelo, solta, e os três esqueletos congelam (hit-stop, clarão, números de dano e selo).

**Tempo esperado:** segundos com placa de vídeo; ~45 s sem placa (`DEMO_CPU=1 npm run demo`, medido em CPU de desktop).

- Chrome fora do lugar padrão: aponte `CHROME_PATH` para o executável. FFmpeg fora do PATH: `FFMPEG_PATH`.
- Folha de quadros para revisar: `npm run folha`. Cena inteira em 1080×1920 a 60 qps: `npm run final`.
- Outras páginas: `node render.mjs --pagina cenas/poder_kk --q p=fogo --video saida/fogo.mp4` (1 personagem + 1 poder), `--pagina cenas/ep01_kk` (episódio narrado, 55 s), `--pagina kit_juice/demo --q d=hitstop` (um módulo do kit).
- Personagem seu: ponha o GLB em `personagem/kaykit/`, veja os clipes com `node scripts/listar_animacoes.mjs arquivo.glb` e, se quiser deixar leve, `node scripts/aparar_glb.mjs entrada.glb saida.glb Idle,Cheer,...`.

Este motor só renderiza em 9:16: a interface de jogo (barras, roleta, textos) é desenhada em medidas fixas de 1080×1920. Para outro tamanho no mesmo formato, use `--esc` (0.5 = 540×960).
