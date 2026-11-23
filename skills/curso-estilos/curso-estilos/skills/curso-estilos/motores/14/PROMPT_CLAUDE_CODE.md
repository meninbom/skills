# Caminho com código (Claude Code + HyperFrames)

## O que tem aqui
| arquivo | o que é |
|---|---|
| `kit_template/index.html` | composição de 12 s que já renderiza. É o motor inteiro do estilo: câmera contínua com zoom em log, quadriculado que não some no zoom, pouso, linha por máscara, adesivo de pixel em SVG, folha em onda, confete e laço. **Para um vídeo novo, só mudam o bloco "ROTEIRO NA PÁGINA" e a lista `K`.** |
| `kit_template/fonts/` | Bricolage Grotesque e Departure Mono (as duas com licença OFL) |
| `kit_template/vendor/gsap.min.js` | GSAP 3.12.5 (licença padrão gratuita da GSAP) |
| `kit_template/img/foto_exemplo.png` | um foto-adesivo pronto (Shibuya, gerado por IA) |
| `kit_template/icones.json` | as 10 grades 12×12 (as mesmas que já estão dentro do index.html), para editar ou gerar PNG |
| `kit_ferramentas/adesivo_foto.py` | foto → retícula duotone com borda branca (`pip install -r requirements.txt`) |
| `kit_ferramentas/adesivo_pixel.py` | grade 12×12 → PNG de adesivo (para quem monta em AE ou CapCut) |
| `render.mjs` | render quadro a quadro no Chrome do sistema (não baixa navegador) |

## Requisitos
- Node 18+ e Google Chrome instalado; `npm install` nesta pasta (instala só o `puppeteer-core`).
- Python 3 só para as ferramentas de adesivo e para a mixagem.
- FFmpeg no PATH.

## Testar o template
```
npm install
npm run demo                                   # 3 s, 540x960, mudo -> saida/demo.mp4
node render.mjs kit_template --saida saida/teste.mp4     # os 12 s em 1080x1920
```
Alternativa: a mesma pasta é um projeto HyperFrames (Apache 2.0). `cd kit_template && npx --yes hyperframes@0.8.162 render -o ../saida/teste.mp4 .` renderiza igual (o HyperFrames baixa um Chromium próprio na primeira vez) e `npx --yes hyperframes@0.8.162 preview` mostra ao vivo no navegador.

---

## Prompt para colar no Claude Code
Abra o Claude Code numa cópia desta pasta do motor, com: a sua narração (`narracao.mp3`), as fotos e o seu roteiro com o mapa de atenção (`ROTEIRO_TEMPLATE.md` preenchido). Depois cole:

```
Quero um Reel vertical no ESTILO EMOJI ("agenda de purikura"). As regras estão em GUIA_DO_ESTILO.md,
seção 1 (DNA): leia antes de mexer em qualquer coisa. A pasta kit_template/ já renderiza com
`node render.mjs kit_template`. Use ela como base e NÃO reescreva o motor.

Material:
- narração: narracao.mp3
- roteiro + mapa de atenção: roteiro.md (palavra-alvo, tipo FOTO/PX/TX/MERG/REC, cor, lado)
- fotos: fotos/*.jpg

Passos:
1. Transcreva a narração com tempo por palavra (faster-whisper com word_timestamps=True, ou o que
   você tiver) e salve words.json. Os tempos do mapa vêm daí, nunca de chute.
2. Transforme cada foto em foto-adesivo com kit_ferramentas/adesivo_foto.py (cor = cor do bloco do mapa;
   largura = 1,5x o tamanho em tela) e coloque em kit_template/img/.
3. Em kit_template/index.html, troque SÓ o bloco "ROTEIRO NA PÁGINA", a lista K da câmera, PAG e DUR:
   - página de 2400 px de largura, ~200 px de altura por segundo de vídeo, alvos em zigue-zague
     (x≈600 / x≈1800) descendo;
   - cada FOTO/PX com pousa(id, onset da palavra); cada TX com entra(id, onset − 0,06 a 0,1 s);
   - para cada alvo, em K: uma VIAGEM 'mover' de ~0,55 s chegando 0,03–0,08 s depois do onset, seguida
     de uma DERIVA 'sine.inOut' com escala +2–3% até a próxima viagem. A câmera nunca para;
   - no máximo 2–3 mergulhos (power2/power3.inOut) e UM recuo a 0,32x perto do fim, voltando
     ao herói do quadro 0 (laço: último quadro = primeiro);
   - confete: ajuste a quantidade para ~110 a cada 2400x11600 de página;
   - ponha o <audio> do mix com data-duration = DUR.
4. Mix (Python/ffmpeg): voz −16 LUFS; trilha 11,5 dB abaixo com duck de −2,5 dB na fala; 4–5 SFX de
   foley real (papel, teclas, lápis, folha deslizando), passa-baixa de 4,5–6 kHz, 13–19 dB abaixo da voz;
   master −13,5 LUFS, pico ≤ −1,5 dBTP. Não toque nenhum áudio em player.
5. Renderize, tire 8 quadros e uma folha de contato, e confira contra o checklist da seção 6 do
   GUIA_DO_ESTILO.md: texto nunca em cima de objeto, nada parado > 1,5 s, nenhuma palavra pintada,
   nenhum crédito na tela, nenhum card repetindo a voz.
6. Entregue o 1080x1920 e uma cópia de celular:
   ffmpeg -i final.mp4 -vf scale=720:1280 -c:v libx264 -profile:v main -crf 23 -preset slow
          -c:a aac -b:a 128k -ar 48000 -movflags +faststart final_celular.mp4
Antes de gerar qualquer coisa paga (voz, imagem), me diga o custo e espere meu ok.
```

## Como o motor funciona (para quem for editar à mão)
- **Câmera:** `cam = {x, y, l}`, em que `l = log(escala)`. `aplica()` põe o ponto (x, y) da página em (AX, AY) = (540, 1000) da tela. Cada linha de `K` é `[t, x, y, escala, curva]`. Como a escala é interpolada em log, mergulhos de 17× ficam suaves.
- **Quadriculado:** são duas camadas, `gA` (64/2ⁿ px) e `gB` (metade). A fina vai aparecendo conforme o zoom cresce, e a espessura da linha é compensada pela escala. Por isso o papel nunca "some" num mergulho.
- **Texto:** `W(x, y, tamanho, classe, html, 'l'|'c')` cola o texto na página. `B(...)` prende o texto à tela e só se usa dentro de mergulhos. `entra(id, t)` e `sai(id, t)` controlam entrada e saída.
- **Objetos:**
  - `adesivo(id, src, cx, cy, largura, altura/largura, rotação)` + `pousa(id, tContato, rotação)`;
  - `pxAdesivo(id, nome, cx, cy, tamanho)` usa as grades de `ICON`;
  - `descola(id, t)` só no fecho.
- **Tempos:** tudo passa por `Q()`, que arredonda para quadro inteiro a 30 fps.
- **Renderização determinística:** a timeline é `paused` e fica registrada em `window.__timelines["main"]`, que o `render.mjs` (ou o HyperFrames) percorre quadro a quadro. Não use `setTimeout`, `Math.random` sem semente nem animação CSS.

## O que o vídeo original tinha a mais (fora do template, para adicionar se o tema pedir)
- **Objeto com tela viva:** o celular com o LCD em HTML por cima da foto, a digitação presa ao contador e a troca de telas por palavra.
- **Figurinha que vira grade:** mergulho de 17×, a grade 12×12 editável que se redesenha a cada palavra e a régua 1–12.
- **Frase que colapsa** dentro do adesivo e o **grupo de sinais que gira 90°** para virar rosto.

Para fazer qualquer um desses, peça ao Claude no mesmo padrão: um objeto, um gesto por palavra e nenhum carrossel.
