# Demo · Impact frame de anime

**Precisa de:** Node 18+, Google Chrome (ou Edge/Chromium; `CHROME_PATH` se não estiver no lugar padrão) e FFmpeg no PATH.

```
npm install
npm run demo
```

**O que sai:** `saida/demo.mp4` (540×960, 30 qps, 3 s, mudo): dois volumes numa cena three.js simples, um golpe de marreta em 1,3 s, os 4 desenhos do impact frame (clarão → preto com pincel e arco dourado → papel invertido → volta com zoom), hit-stop de 0,36 s e a tremida depois.

**Tempo:** ~15 s em CPU (`DEMO_CPU=1 npm run demo`); 6 s com placa de vídeo (medido com RTX 4070 Ti 12 GB).

**Mais:**
- `npm run folha`: os 4 desenhos lado a lado em `saida/folha.jpg` (é assim que se confere)
- `npm run demo60`: a 60 qps, cada desenho com a duração real (2, 4, 4 e 2 quadros)
- `npm run gelo`: a mesma cena com a cor de destaque azul (`cor=5fd6ff` na URL)

**No seu motor:** importe `criarImpactFrame` de `impactFrame2.js` (o cabeçalho do arquivo explica o que passar). `cena.js` é o exemplo completo, com ~90 linhas.

Horizontal (16:9): `node render.mjs --pagina index.html --vw 960 --vh 540 --fps 30 --saida saida/demo_horizontal.mp4` (ou `--vw 1920 --vh 1080`). A câmera e o impact frame se ajustam ao formato, nada estica.
