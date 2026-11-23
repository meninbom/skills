# Demo · 62 Poderes e game feel

**Precisa de:** Node 18+, Google Chrome (ou Edge/Chromium; `CHROME_PATH` se não estiver no lugar padrão) e FFmpeg no PATH.

```
npm install
npm run demo
```

**O que sai:** `saida/demo.mp4` (540×960, 30 qps, 3 s, mudo): o poder de gelo da Ina, do fim da carga à quebra dos cristais (anel de soltura, onda no chão, clarão, hit-stop, número de dano, selo, barra que mente).

**Tempo:** ~25 s em CPU (`DEMO_CPU=1 npm run demo`, render por software); 8 s com placa de vídeo (medido com RTX 4070 Ti 12 GB).

**Mais:**
- `npm run poder -- fogo` (ou `raio`, `cura`, `gelo`): o poder inteiro, 8,7 s → `saida/poder_fogo.mp4`
- `npm run modulos`: 3 s de cada um dos 11 módulos do kit → `saida/modulos/`. Um só: `npm run modulos -- hitstop`
- `npm run probe` / `npm run folha` / `npm run filme`: a peça "Ina contra a Sentinela" (1080×1920; o filme leva ~12 min em CPU)

Nada aqui tem som. Efeitos sonoros entram depois, da sua biblioteca ou de um pack CC0.

Este motor só renderiza em 9:16: a interface de jogo e os módulos 2D do kit são desenhados em medidas fixas de 1080×1920. Para outro tamanho no mesmo formato, use `esc=` na `--query` (0.5 = 540×960).
