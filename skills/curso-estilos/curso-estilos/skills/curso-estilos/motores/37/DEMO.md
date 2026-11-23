# Demo do motor 37 (anime 3D com boneco VRM)

**Precisa de:** Node 18+, Google Chrome (ou Edge/Chromium) instalado e FFmpeg no PATH. Nada pago.

```bash
npm install        # instala só o puppeteer-core (usa o Chrome que você já tem)
npm run demo       # sai saida/demo.mp4
```

**O que sai:** `saida/demo.mp4`, 3 s do plano da rua (o boneco VRM em cel andando), 540×960, 15 qps, mudo, yuv420p.

**Tempo:** com placa de vídeo é bem mais rápido (não medimos). Sem placa, use `DEMO_CPU=1 npm run demo` (render por software): ~1,5 a 2 min.

**Se der erro de Chrome:** aponte o executável, ex. `CHROME_PATH="/caminho/do/chrome" npm run demo`.

**Outro trecho ou o seu boneco:** `DEMO_T0=15.6 DEMO_T1=18.6 npm run demo` (segundos do filme; planos em `ep01/BIBLIA.md`).
Para trocar o personagem, ponha o seu `.vrm` (VRoid Studio) em `modelo/` e rode `Q="&vrm=../modelo/seu.vrm" npm run demo`.
O boneco que vem no pacote é o HairSample_Male (CC0, texturas reduzidas); licenças em `FONTES.md`.
Filme inteiro em qualidade final: `cd ep01 && S=2 OUT=raw.mp4 node render.mjs video`.

Este motor só renderiza em 9:16: os planos, as cartelas e a saída do `render.mjs` são fixos em 1080×1920. Para outro tamanho no mesmo formato, use a variável `SAIDA` (ex.: `SAIDA=540x960`).
