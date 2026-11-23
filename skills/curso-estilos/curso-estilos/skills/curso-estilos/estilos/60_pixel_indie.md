# 60 · Pixel de jogo indie com sprites de artista

> Vitrine: "Só mais um baú" (Bira), 43,2 s narrado · Custo: grátis + voz ElevenLabs (~600 caracteres de narração) · Ferramentas: Node (buffer de pixels na CPU, sem navegador), sprites grátis do itch.io, pixelfx (MIT, já vendorizada), ElevenLabs (opcional), FFmpeg

## O que é
Um micro-episódio com cara de jogo indie de pixel: cavaleiro e cenário de packs grátis de artista, efeitos e objetos novos desenhados em 1 px no mesmo tamanho, HUD de inventário e relógio. Tudo é desenhado num quadro nativo de 135×240 e só no final ampliado 8× (vizinho mais próximo) para 1080×1920. Cada cena é presa à palavra da narração e fecha com uma escolha "comenta 1 ou 2". Funciona porque a arte é de artista de verdade e a regra "um pixel só na tela" mantém tudo coerente.

## Exemplo e arquivos
- Prévia no catálogo: `catalogo/previas/60.mp4` (capa: `catalogo/previas/60.jpg`).
- Demo de um comando: `motores/60/DEMO.md` (sai `saida/demo.mp4`, 3,6 s, com bonecos-placeholder).
- Roteiro de exemplo (fala × tela): `motores/60/ROTEIRO_bau.md`.
- Episódio (cenas + linha do tempo presa às palavras): `motores/60/ep_bau/ep.mjs`.
- Texto da narração: `motores/60/ep_bau/voz/narracao.txt` e `motores/60/ep_bau/voz/narracao_intro.txt`.
- Tempos de palavra de exemplo (medidos na narração da peça de referência): `motores/60/ep_bau/voz/exemplo.words.json`. Com eles o episódio inteiro renderiza sem gastar com voz.
- Licenças e origens: `motores/60/FONTES.md`.

## Ferramentas e instalação
- **Node 18 ou mais novo (grátis):** o motor é JS puro escrevendo num `Uint32Array`; não usa navegador nem GPU, e não tem dependência de npm.
- **FFmpeg** no PATH (ou aponte a variável de ambiente `FFMPEG`).
- **Python + Pillow (grátis, só para os sprites reais e a prancha):** `pip install -r requirements.txt`. O `ep_bau/junta_voz.py` usa numpy e soundfile.
- **Sprites (grátis, você baixa):** do itch.io, "Fantasy Knight - Free Pixelart Animated Character" e "Free Pixelart Platformer Tileset" (aamatniekss) e "Free Treasure Chest" (Otsoga). Uso comercial livre e sem crédito, mas **não pode redistribuir os arquivos**: por isso não vêm no motor. Descompacte os três em `motores/60/sprites/packs/` e rode `python sprites/prep.py`. Sempre leia a licença de cada pack e anote no FONTES.
- **Placeholders:** sem os packs, `node sprites/placeholder.mjs` gera bonecos de retângulo com os mesmos nomes, tamanhos de quadro e número de quadros. Dá para escrever e cronometrar o episódio inteiro com eles e trocar pela arte depois.
- **pixelfx (MIT, grátis):** o núcleo já vem em `motores/60/vendor/pixelfx/` (só `src/core`). Não use a fonte "Patch Pixel" do repositório original: ela não é MIT.
- **Fonte dos títulos:** Pixelify Sans 13 (OFL), já rasterizada em `motores/60/motor/fonte_titulo.json` (o traço tem 1 px nesse tamanho).
- **Voz (PAGO, opcional):** a API da ElevenLabs com a sua chave (`ELEVENLABS_API_KEY`) e a sua voz (`ELEVENLABS_VOICE_ID`), pelo `ep_bau/gerar_voz.mjs`. Ele só gasta com `--confirmo-custo`. Velocidade 1,1 é o teto.
- **Som:** sua biblioteca de efeitos, ou um pack CC0, em `ep_bau/som/sfx/`; trilha opcional em `ep_bau/som/trilha.wav`. O `ep_bau/mixar.mjs` faz um mix simples com FFmpeg.

## Motor
Em `motores/60/` (cerca de 400 KB). Copie a pasta inteira para o seu projeto; todos os caminhos são relativos a ela.
- `motores/60/demo.mjs`, `motores/60/package.json`, `motores/60/DEMO.md`: o demo de um comando.
- `motores/60/motor/core.mjs`: `Tela` (buffer de pixels, `px`, `rect`, `sprite` em strings com contorno automático, `texto`), `hex`, `hash`, `salvarNativo`, `usarPixelfx`. `motores/60/motor/fonte.mjs` (fonte bitmap com acentos), `motores/60/motor/png.mjs` (PNG sem dependência), `motores/60/motor/util.mjs` (`mistura`, `textoBorda`).
- `motores/60/fx/base.mjs`, `motores/60/fx/golpe.js`, `motores/60/fx/poeira.js`, `motores/60/fx/brilho.js`, `motores/60/fx/levelup.js`: efeitos próprios no formato da pixelfx, com rampa dura e cores tiradas do cavaleiro e do chão.
- `motores/60/sprites/prep.py`: PNG dos packs → `sprites/assets/*.rgba` + `sprites/assets/index.json`. `motores/60/sprites/placeholder.mjs`: o mesmo índice, com bonecos feitos por código. `motores/60/sprites/tira.mjs`: tira de quadros de uma animação, para conferir o recorte.
- `motores/60/ep_bau/ep.mjs`: o episódio. `T(palavra, depois)` acha o tempo de cada palavra; `TEMPOS`, `PLANOS`, `quadro(t)`, `DUR`.
- `motores/60/ep_bau/provisorio.mjs`: tempos provisórios das palavras (~2,9 palavras/s) para animar antes da voz.
- `motores/60/ep_bau/prints.mjs`, `motores/60/ep_bau/prancha.py`: 1 print por plano e a prancha.
- `motores/60/ep_bau/lab.mjs`: laboratório de efeito (tira de quadros recortados, ×3).
- `motores/60/ep_bau/render.mjs`: quadros crus → FFmpeg → MP4 mudo (`--de`, `--ate`, `--escala`, `--saida`).
- `motores/60/ep_bau/gerar_voz.mjs`, `motores/60/ep_bau/junta_voz.py`: voz do corpo, voz da intro e a junção com as palavras deslocadas.
- `motores/60/ep_bau/gen_mix.mjs`: gera `ep_bau/som/deixas.json` (lista de efeitos sonoros) a partir dos mesmos `TEMPOS` do episódio. `motores/60/ep_bau/mixar.mjs`: voz + efeitos + trilha → final e versão de celular.

Não vem no motor: os sprites dos packs (licença), voz, trilha e efeitos sonoros.

## Passo a passo (ponta a ponta)
Todos os comandos rodam dentro da sua cópia de `motores/60/`.
1. **Demo primeiro:**
   ```bash
   npm run demo          # saida/demo.mp4, 3,6 s, 540x960, mudo
   ```
2. **Roteiro** no formato de `ROTEIRO_bau.md`: uma ideia só, um fato real (aqui Skinner e o pombo), tabela fala × tela, escolha 1/2 no fim, estimativa de caracteres. Narração corrida, no seu jeito de falar. Feche o texto antes de qualquer voz. Salve em `ep_bau/voz/narracao.txt` (e a intro, se houver, em `ep_bau/voz/narracao_intro.txt`).
3. **Sprites:** escolha packs de UM autor só, leia a licença, anote no FONTES e converta:
   ```bash
   python sprites/prep.py        # sprites/assets/*.rgba + sprites/assets/index.json
   node sprites/tira.mjs kRun    # confere o recorte de uma animação
   ```
   Para outro pack, adapte os recortes no `sprites/prep.py` e mantenha os nomes das animações (ou troque-os no `ep.mjs`).
4. **Tempos provisórios** para animar sem voz: `node ep_bau/provisorio.mjs` (grava `ep_bau/voz/provisorio.words.json`, que passa a valer no lugar do exemplo).
5. **Escreva as cenas** em `ep_bau/ep.mjs` no quadro nativo 135×240. Objetos novos (bota, pedra, pombo) desenhados em 1 px no tamanho dos sprites. Prenda cada evento a uma palavra com `T("palavra", depois)`.
6. **Prints numerados e prancha** para revisar antes do render:
   ```bash
   node ep_bau/prints.mjs && python ep_bau/prancha.py 7
   ```
7. **Efeito no laboratório** (render → olhar a tira → corrigir, 3 rodadas): `node ep_bau/lab.mjs ouro 10`.
8. **Voz (PAGO, só depois do texto fechado):**
   ```bash
   node ep_bau/gerar_voz.mjs corpo                    # só mostra os caracteres
   node ep_bau/gerar_voz.mjs corpo --confirmo-custo   # voz/narr_A.*
   node ep_bau/gerar_voz.mjs intro --confirmo-custo   # voz/narr_I.*
   python ep_bau/junta_voz.py I                       # voz/narr_full_-16.wav + palavras deslocadas
   ```
   Gravou a própria voz? Basta um `voz/narr_A_-16.wav` e um `voz/narr_A.display.words.json` no formato `[{"w": "palavra", "start": 0.0, "end": 0.3}]` (qualquer transcritor com tempo por palavra serve). Depois de juntar, confira que todo `T()` cai DEPOIS do início da sua cena.
9. **Render + mix + celular** (CPU):
   ```bash
   node ep_bau/render.mjs        # saida/ep_bau_mudo.mp4, 1080x1920
   node ep_bau/gen_mix.mjs       # ep_bau/som/deixas.json
   node ep_bau/mixar.mjs         # saida/ep_bau.mp4 + saida/ep_bau_celular.mp4
   ```
   Por dentro: quadros `rgba` 135×240 a 30 qps → `scale=iw*8:ih*8:flags=neighbor,format=yuv420p`, libx264 crf 16, `-tune animation`; celular `scale=720:1280:flags=neighbor` crf 20.
10. **Conferir:** `ffprobe` (pix_fmt yuv420p), ouvir no celular, e comparar a fala com o roteiro.

## Pegadinhas medidas
- **Fundo e tela limpa:** fundo chapado liso vira slide (dê profundidade, luz ou textura); nota de produção nunca vai dentro do quadro (nome de arquivo, versão, crédito de ferramenta); nada de rótulo "imagem gerada" por cima da arte.
- **Um pixel só na tela:** nada ampliado dentro do quadro nativo. Título ou sprite com k > 1 é proibido; os textos e números de dano prontos da pixelfx também vêm ampliados (não usar). Ampliar um sprite com Scale3x para fazer um chefe quebra a regra do mesmo jeito: desenhe em 1 px.
- **Ampliação final:** só inteira e com `flags=neighbor` (8× no 1080; no celular 720×1280 também neighbor).
- **Bug do `T()`:** depois de juntar intro + corpo, `T("abriu")` pegava o "abriu" da intro: o 1º baú já vinha aberto e a bota sumia. Use `T(palavra, depois)`.
- **Golpe com timing de jogo:** preparo, contato congelado 0,12 s, alvo branco por 2 quadros. O sprite de hit do pack do cavaleiro já pisca branco nos quadros 1 e 3: use só 0 e 2.
- **Efeitos:** os prontos de biblioteca (crescente de espada, pilar, fumaça, moedas com glow) destoam da arte; rampa dura, sem brilho suave, cores tiradas dos sprites.
- **Montagem rápida:** um corte a cada 0,42 s com o relógio correndo por baixo.
- **Render:** 1.296 quadros só na CPU, sem navegador: 16 s medidos para os 43,2 s em 1080×1920 (num desktop comum). O MP4 final da peça ficou com 2,25 MB.
- **Mix da peça de referência:** 44 efeitos reais, cada um 10–16 dB abaixo da voz, trilha 14 dB abaixo com duck de 3 dB. Medido: −13,6 LUFS, pico −1,6 dBTP; no alto-falante de celular simulado, −18,5 LUFS (queda de 4,9 dB); fala × roteiro 99%.
- **Checagem automática da peça:** passou com 3 avisos (formato 720p do celular, 3 engasgos, 1 quadro vazio).
- **itch.io por script:** muitas requisições seguidas devolvem 429 e alguns packs dão 403. Baixe à mão.
- **Licenças:** há pack que proíbe "geração automatizada de conteúdo" e pack que não pode ser modificado. Leia antes de escolher.

## Custo e tempo
- Imagem: grátis, só CPU.
- Voz: corpo 479 caracteres + intro ~110 por tomada; reserve ~1.300 caracteres para ter folga de uma segunda tomada. Gere só com o texto fechado.
- Tempo: a história inteira (roteiro → 4ª versão) coube numa noite de trabalho; o render leva segundos.

## O que funcionou e o que não funcionou
- **Sprite de artista vence pixel feito na mão por quem não é pixel artist.** A primeira tentativa, em pixel "chunky" de ~30 px desenhado em código, ficou feia; trocar só a paleta quase não mudou nada. A saída foi usar um pack de artista e tratá-lo como régua para tudo o que é desenhado depois.
- **Misturar tamanhos de pixel estraga tudo.** Uma versão com sprites ampliados ao lado de sprites nativos pareceu "bugada". Daí a regra do pixel único.
- **Misturar autores também.** Efeitos de biblioteca + personagens de vários packs dão cara de colagem. Um autor só para a arte, e efeitos próprios com as cores dos sprites.
- **Escala de jogo, não de ilustração.** Cenário grande e detalhado com personagem pequeno "parece desenho, não joguinho". Personagem, chão e HUD têm de ter a proporção de um jogo jogável.
- **Paleta reduzida de verdade.** Colorir por quantização automática (k-means) de uma imagem comum dá "pixel art falsa". Ou a paleta vem do artista, ou é uma paleta curta escolhida à mão (como as 4 verdes do Game Boy).
- **Voz:** velocidade até 1,1× (acima soa acelerada), sem sussurro, texto fechado antes de gerar.
- **Som:** efeitos reais (gravados), 10 dB ou mais abaixo da voz; efeito sintetizado agudo cansa.
- **História:** o gancho que funcionou foi uma situação concreta de jogo (abrir baú) ligada a um fato real; uma versão anterior sobre um tema do dia a dia ficou sem graça.
- **Nossa nota:** a peça agradou na 2ª e 3ª versões; perde para um jogo de verdade na variedade de animação (o cavaleiro só anda, agacha e fica parado).

## Roteiro de aula
- **Objetivo:** o aluno sai sabendo montar um episódio narrado em pixel com sprites grátis de artista, respeitando o pixel único e prendendo cada cena à palavra da voz.
- **Demonstração (~25 min):**
  1. Pixel feio × pixel de artista, e a regra do pixel único com um contraexemplo ampliado (3 min).
  2. `npm run demo` com placeholders; achar o pack, ler a licença, `sprites/prep.py` e rodar de novo (4 min).
  3. Uma cena no quadro 135×240: chão, cavaleiro andando, baú abrindo (6 min).
  4. Desenhar um objeto novo em 1 px no tamanho do sprite (3 min).
  5. `T("palavra")` e os tempos provisórios; trocar pela voz real (5 min).
  6. `ep_bau/render.mjs` e `ep_bau/mixar.mjs`: neighbor 8×, mix, celular, conferir (4 min).
- **Exercício:** 10 s com 1 personagem de pack CC0, 1 objeto próprio em 1 px e 1 efeito, preso a 3 palavras de uma frase. Deu certo se, ampliando um print 8×, todo pixel tiver o mesmo tamanho e os 3 eventos caírem a ≤2 quadros da palavra.
- **Pré-requisitos:** aula de voz (ElevenLabs) e de mix; nenhuma de 3D.

## Limites conhecidos
- Os sprites não vêm no material (a licença proíbe redistribuir): o demo usa bonecos-placeholder e o aluno baixa os packs do itch.io. Se o autor mudar a estrutura do ZIP, ajuste os caminhos no `sprites/prep.py`.
- O `ep_bau/gerar_voz.mjs` não foi executado neste pacote (é pago). O nome do modelo e os parâmetros podem mudar: confira a documentação da ElevenLabs.
- O `ep_bau/mixar.mjs` é um mix simples (nível por pico, sem duck da trilha). O mix da peça de referência foi feito com medição em LUFS e conferência de ouvido; trate o script como ponto de partida.
- Os trechos de cada efeito sonoro em `ep_bau/gen_mix.mjs` (campo `fatia`) foram escolhidos para os nossos arquivos: com os seus, ajuste.
- O motor traz um episódio só. Efeitos de golpe e poeira (`fx/golpe.js`, `fx/poeira.js`) estão prontos, mas este episódio quase não os usa.
- O episódio depende das palavras do roteiro de exemplo: ao trocar o texto, os `T("palavra")` do `ep.mjs` precisam ser reescritos.
