# Demo do estilo 75 · Cartoon 2D em mundo 3D (three.js + Remotion)

**Pré-requisitos:** Node 18 ou mais novo e o Google Chrome instalado (Edge ou Chromium também servem). Não precisa de placa de vídeo, FFmpeg nem internet na hora do render (o Remotion traz o próprio FFmpeg e os modelos 3D vão junto na pasta). Trabalhe numa CÓPIA desta pasta.

```bash
npm install        # uma vez; baixa ~600 MB de dependências para node_modules
npm run demo
```

**O que sai:** `saida/demo.mp4`, 3 s, 540×960, 30 qps, mudo, H.264 `yuv420p`: o plano 3 do curta de exemplo (os dois irmãos acendem a palha e a fumaça sobe para o balão).

**Tempo esperado:** menos de 1 minuto (medido: 41 s com GL por software, sem placa de vídeo).

- O demo usa o Chrome do sistema e não baixa navegador. Se ele não for achado, aponte o executável: `CHROME_PATH="/caminho/do/chrome" npm run demo`.
- Sem placa de vídeo (ou com ela ocupada): `DEMO_CPU=1 npm run demo` liga o GL por software (`swiftshader`). Se o seu Chrome recusar, tente `DEMO_GL=swangle`.
- No PowerShell: `$env:DEMO_CPU = '1'; npm run demo`.
- Curta inteiro (27,5 s, 1080×1920): `npm run filme`. Na CPU levou 6 minutos (medido). Em 1440×2560: `node render.mjs filme --2k`.
- Um quadro de cada plano, para aprovar antes do render: `npm run prancha` (sai em `saida/prancha_*.jpg`, uns 4 s por quadro).
- Nada aqui gasta dinheiro. A trilha de música e efeitos é sintetizada no seu PC (`python audio/balao_mix.py`). A voz não vem no pacote: leia `extras/LEIA.md`.

## Aviso de licença do Remotion

O Remotion **não é software livre comum**. Pelo texto da licença que vem no pacote instalado (`node_modules/remotion/LICENSE.md`, versão 4.0.532), o uso é gratuito, inclusive comercial, para: pessoa física, organização com fins lucrativos de até 3 funcionários, organização sem fins lucrativos e quem ainda está avaliando a ferramenta sem uso comercial. Quem não se encaixa nesses casos precisa comprar a **Company License** (preço e compra em remotion.pro/license). O próprio arquivo avisa que os termos mudam um pouco no Remotion 5.0. Leia o arquivo da versão que você instalar antes de usar em trabalho de empresa: vale o texto de lá, não este resumo.
