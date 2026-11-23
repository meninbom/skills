# Demo do motor de mapa (3 s, mudo)

Pré-requisitos: Node 18+, ffmpeg no PATH e Chrome (ou Edge/Chromium) instalado. Se o Chrome não estiver no lugar padrão, aponte `CHROME_PATH` para o executável.

```
npm install
npm run demo
```

Sai `saida/demo.mp4`: 540×960, 30 qps, 3 s, sem áudio. A câmera voa até o Brasil, o país é pintado por varredura, entra a faixa do litoral, um rótulo, um número, um pino e uma ilustração-placeholder (cartão desenhado por código em `demo/cena_demo.js`).

Tempo: ~1 a 2 min. O render é por CPU (SwiftShader) por padrão e não usa placa de vídeo. Com placa, `npm run demo -- --gpu` sai em 14 s (medido com RTX 4070 Ti 12 GB); `DEMO_CPU=1` força CPU mesmo se você passar `--gpu`.

Quadros parados em ~10 s (é assim que se testa ideia): `npm run quadros` → `saida/quadros.jpg`.

Para pôr a sua ilustração: salve um PNG com fundo transparente em `dados/ilus/` e troque o placeholder na cena (o comentário no topo de `demo/cena_demo.js` mostra como). Mapa em resolução cheia: `npm run baixar` (ver `FONTES.md`).
