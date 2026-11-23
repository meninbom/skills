# Demo do estilo 74 · What-if em desenho 2D (Remotion)

**Pré-requisitos:** Node 18 ou mais novo e o Google Chrome instalado (Edge ou Chromium também servem). Não precisa de placa de vídeo, FFmpeg nem internet na hora do render (o Remotion traz o próprio FFmpeg e as fontes vão junto na pasta).

```bash
npm install        # uma vez; baixa ~260 MB de dependências para node_modules
npm run demo
```

**O que sai:** `saida/demo.mp4`, 3 s, 540×960, 30 qps, mudo, H.264 `yuv420p`: o plano 3 do filme (o microssono na mesa, com o card do fato e o relógio do HUD correndo).

**Tempo esperado:** cerca de 1 min e meio em CPU comum (medido: 90 quadros por software).

- O demo usa o Chrome do sistema e não baixa navegador. Se ele não for achado, aponte o executável: `CHROME_PATH="/caminho/do/chrome" npm run demo`.
- Sem placa de vídeo (ou em máquina remota): `DEMO_CPU=1 npm run demo` liga o GL por software (`swiftshader`). Se o seu Chrome recusar, tente `DEMO_GL=swangle`.
- No PowerShell: `$env:DEMO_CPU = '1'; npm run demo`.
- Filme inteiro (35,6 s, 1080×1920, uns 20 min de CPU): `npm run filme`. Prancha dos 10 planos: `npm run prancha`.
- Nada aqui gasta dinheiro. Os scripts de voz e som em `extras/narrado/` não fazem parte do demo (leia o `extras/narrado/LEIA.md` antes).

## Aviso de licença do Remotion

O Remotion **não é software livre comum**. Pelo texto da licença que vem no pacote instalado (`node_modules/remotion/LICENSE.md`, versão 4.0.530), o uso é gratuito, inclusive comercial, para: pessoa física, organização com fins lucrativos de até 3 funcionários, organização sem fins lucrativos e quem ainda está avaliando a ferramenta sem uso comercial. Quem não se encaixa nesses casos precisa comprar a **Company License** (preço e compra em remotion.pro/license). O próprio arquivo avisa que os termos mudam um pouco no Remotion 5.0. Leia o arquivo da versão que você instalar antes de usar em trabalho de empresa: vale o texto de lá, não este resumo.
