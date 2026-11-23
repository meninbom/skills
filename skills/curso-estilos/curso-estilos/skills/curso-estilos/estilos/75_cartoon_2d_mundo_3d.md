# 75 · Cartoon 2D em mundo 3D (three.js + Remotion) · BETA

> Vitrine: "Os primeiros passageiros" (27,5 s, muda no pacote) · Custo: grátis (atenção à licença do Remotion para empresas; voz para postar é à parte) · Ferramentas: Remotion 4.0.532, three.js 0.178, React 19, TypeScript, Node, Chrome; Python + numpy/scipy para a trilha

**Este estilo é beta.** O resultado fica em uns 60–65% das referências do gênero: os bonecos estão bons, o cenário é vazio e a luz é chapada. Fazer uma história nova é reescrever código à mão (a linha do tempo e a função que põe os personagens em cena). Leia "Limites conhecidos" antes de começar.

## O que é
Curta de curiosidade narrada em que bonecos 2D de cabeça redonda, com contorno de tinta e membros de palito, vivem dentro de um cenário 3D pintado. Os personagens são cartões desenhados em Canvas 2D que sempre encaram a câmera; o mundo é three.js com texturas pintadas em código e modelos low-poly recoloridos. Por cima vêm um traço de tinta nas arestas 3D, desfoque de lente por plano e grade de cor. A câmera é de cinema: empurra devagar em todo plano, gira um pouco nas ênfases e corta na palavra. Tudo é cronometrado pela voz: cada reação entra de 0 a 3 quadros antes da palavra que a provoca.

## Exemplo e arquivos
- Prévia do catálogo: `catalogo/previas/75_orig.mp4` e `catalogo/previas/75_orig.jpg` (trechos do curta do balão).
- Projeto Remotion completo: `motores/75/` (o curta de 27,5 s sai dele com `npm run filme`).
- Demo de um comando: `motores/75/DEMO.md`
- Notas da peça (os 6 planos, o que é do curso e o que veio do motor aberto, notas): `motores/75/NOTAS.md`
- Fatos do roteiro e licença de cada arquivo de terceiros: `motores/75/FONTES.md`
- Voz, tempo das palavras e checagem: `motores/75/extras/LEIA.md`
- Origem do motor: repositório público `mromidev/claude-animated-shorts` (MIT).

## Ferramentas e instalação
- **Node 18+** e **Google Chrome** (Edge ou Chromium servem). O render usa o Chrome do sistema: os scripts procuram nos caminhos padrão de Windows, macOS e Linux, ou no que você puser em `CHROME_PATH`. Nenhum navegador é baixado.
- **Remotion 4.0.532 + three.js 0.178 + React 19:** `npm install` dentro da cópia de `motores/75/` (~600 MB em `node_modules`, menos de 1 min numa internet boa).
- **AVISO DE LICENÇA DO REMOTION:** não é software livre comum. Pelo texto que vem no pacote (`node_modules/remotion/LICENSE.md`, versão 4.0.532), o uso é gratuito, inclusive comercial, para pessoa física, organização com fins lucrativos de **até 3 funcionários**, organização sem fins lucrativos e quem está só avaliando. Empresa maior que isso precisa comprar a Company License (remotion.pro/license). Leia a licença da versão que você instalar antes de usar em trabalho de empresa.
- **Modelos 3D:** 26 modelos dos kits Nature e Fantasy Town da Kenney (CC0, uso livre) vão junto em `motores/75/public/bridge/kenney/`. O render não precisa de internet.
- **Sem placa de vídeo:** tudo roda em CPU. `DEMO_CPU=1` força o GL por software do Chrome (`swiftshader`). É o caminho recomendado para PC sem placa forte.
- **Python 3.10+ com numpy e scipy:** só para a trilha de música e efeitos (`audio/balao_mix.py`). Para medir o tempo das palavras da sua voz: `faster-whisper` (ver `extras/LEIA.md`).
- **FFmpeg no PATH:** para os comandos de entrega do passo 9.

## Motor (o que vem na pasta)
Em `motores/75/` (cerca de 1 MB sem `node_modules`):
- `package.json`, `tsconfig.json`, `remotion.config.ts`, `.npmrc`: projeto pronto para `npm install`.
- `render.mjs`: `npm run demo` (3 s em 540×960), `npm run filme` (o curta em 1080×1920) e `node render.mjs filme --2k` (1440×2560). Sempre mudo e em `yuv420p`.
- `stills.mjs`: `npm run prancha` (um quadro por plano) e `node stills.mjs quadros 60,400,700` (quadros avulsos).
- `chrome.mjs`: acha o Chrome do sistema e liga o GL por software quando `DEMO_CPU=1`.
- `src/videos/balao/story.ts`: **a história.** Tabela de planos (`SHOTS`, em quadros), o estado do balão em cada instante (`balloonAt`), a câmera de cada plano e o foco (`dofAt`). Os tempos das palavras ficam anotados em comentário no topo da tabela.
- `src/videos/balao/cast.ts`: o elenco. A função `stage(id, t, ...)` diz quem está em cena, onde e com que expressão em cada plano. Também tem o rei, a corte e os bichos.
- `src/videos/balao/toon.ts`: o traço. A caneta `Pen`, a cabeça (`headBlob`), as 14 expressões (`Expr`), corpo de frente e de perfil (`bodyFront`, `bodySide`), roupas (`Outfit`) e os bichos.
- `src/videos/balao/balloon.ts`: o balão (forma de revolução com textura pintada), o cesto, as cordas, o fogo e a fumaça.
- `src/videos/balao/world.ts`, `build.ts`, `paint.ts`: o mundo (parque, casas, bosque, céu, nuvens) e as texturas pintadas em Canvas.
- `src/videos/balao/lights.ts`, `grade.ts`, `shade.ts`, `cardshade.ts`: luz por horário (`day` e `golden`), grade de cor, sombreamento do mundo e dos cartões.
- `src/videos/balao/ink.ts`, `lensblur.ts`: o traço de tinta nas arestas 3D e o desfoque de lente.
- `src/videos/balao/Bridge.tsx`: a composição (monta o mundo, a cadeia de pós e a transição entre lugares).
- `public/bridge/kenney/`: os 26 modelos `.glb` e a textura de cores.
- `audio/`: `balao_mix.py` (a trilha do exemplo), `dsp.py`, `instruments.py`, `sfx_gen.py` (síntese) e `voice/` (texto e tempo das palavras; a voz não vem).
- `extras/`: `tts_onecore.ps1`, `voz_prep.py`, `short_qa.py`, `LEIA.md`.
- `DEMO.md`, `NOTAS.md`, `FONTES.md`, `LICENCA_MOTOR_MIT.txt`, `licencas/`.

Não vêm: `node_modules`, renders prontos, a voz de teste e os quadros de referência do repositório de origem (são só para estudo de estilo e não podem ser redistribuídos).

## Passo a passo (ponta a ponta)
Todos os comandos rodam de dentro da sua cópia de `motores/75/`.

1. **Rode o demo.**
   ```bash
   npm install
   DEMO_CPU=1 npm run demo      # saida/demo.mp4, 3 s, 540×960, mudo
   ```
   PowerShell: `$env:DEMO_CPU = '1'; npm run demo`. Medido: 41 s em CPU.
2. **Fato e roteiro.** Um fato real e curioso com causa e efeito que dá para **ver** (aqui: fogo → ar quente → balão sobe). Fórmula do gênero, a ~3,7 palavras por segundo:
   - gancho: o paradoxo dito como fato na primeira frase;
   - cenário em 1 ou 2 frases, depois 3 ou 4 batidas que escalam;
   - a virada e a consequência, com uma piada que também é fato;
   - o vídeo acaba na última palavra. Sem legenda, um narrador só.
   Confira cada dado e escreva o seu `FONTES.md`. Feche o roteiro com quem aprova antes de gravar.
3. **Voz primeiro.** Grave um rascunho e tire o tempo de cada palavra (`extras/LEIA.md`). Sai `audio/voice/words.json`.
4. **Planos na palavra.** Em `story.ts`, anote os tempos das palavras-chave no comentário e reescreva `SHOTS` (quadro = segundo × 30), com o corte no quadro em que a palavra começa. Ajuste `TOTAL` (duração em quadros).
5. **Quem está em cena.** Reescreva a função `stage()` no fim de `cast.ts`: para cada plano, quem aparece, onde, olhando para onde e com que expressão. Personagem novo é um `Outfit` (roupa, chapéu, cor); bicho ou objeto novo é um desenho novo com a `Pen` em `toon.ts`.
6. **Objeto principal e lugar.** O balão é o exemplo de objeto 3D próprio (`balloon.ts`). Os lugares saem de `world.ts`/`build.ts`: reaproveite o parque e o bosque ou monte o seu com os modelos de `public/bridge/kenney/`.
7. **Prancha antes do render.**
   ```bash
   DEMO_CPU=1 npm run prancha                       # um quadro por plano
   DEMO_CPU=1 node stills.mjs quadros 60,400,700    # quadros que você escolher
   ```
   Troque a lista `PRANCHA` do `stills.mjs` pelos quadros-chave da sua história. Mostre a prancha e só renderize com o ok.
8. **Render do curta e trilha.**
   ```bash
   DEMO_CPU=1 npm run filme          # saida/filme.mp4, 1080×1920, mudo, yuv420p
   python audio/balao_mix.py         # audio/mix.wav (música + efeitos; com voice.wav, entra a voz)
   ```
   A trilha do exemplo marca os efeitos pelos tempos da história do balão: para a sua história, copie o arquivo e troque os instantes.
9. **Entrega.**
   ```bash
   ffmpeg -y -i saida/filme.mp4 -i audio/mix.wav -map 0:v:0 -map 1:a:0 -c:v copy -c:a aac -b:a 192k -ar 48000 -shortest -movflags +faststart NOME_1080.mp4
   ffmpeg -y -i NOME_1080.mp4 -vf scale=720:-2 -c:v libx264 -profile:v main -level 3.1 -crf 24 -pix_fmt yuv420p -c:a aac -b:a 128k -ar 48000 -movflags +faststart NOME_celular.mp4
   ffprobe -v error -select_streams v:0 -show_entries stream=pix_fmt -of csv=p=0 NOME_1080.mp4     # tem que dar yuv420p
   ```
10. **Conferir** com a skill `checar-video` do pacote e, se quiser a checagem quadro a quadro do motor de origem, `python extras/short_qa.py NOME_1080.mp4 saida/qa`.

## Pegadinhas medidas
- **Fundo e tela limpa:** fundo chapado liso vira slide (dê profundidade, luz ou textura); nota de produção nunca vai dentro do quadro (nome de arquivo, versão, crédito de ferramenta); nada de rótulo "imagem gerada" por cima da arte.
- **Escala para 1440×2560:** pela linha de comando do Remotion, `--scale 1.3333` dá erro ("height must be an integer, 2559.936"). Use `--scale 1.3333333333333333`. O `render.mjs` já passa `4 / 3`.
- **Abas em paralelo e tempo limite:** com 8 abas e o limite padrão de 30 s, o render estourou num quadro de transição (são dois canvases 3D ao mesmo tempo). Use `--concurrency 4 --timeout=240000`. O `render.mjs` já faz isso.
- **`yuvj420p` em vez de `yuv420p`:** com quadros em JPEG (padrão do Remotion) o vídeo sai em faixa cheia, que alguns celulares e apps recusam. O `render.mjs` e o `remotion.config.ts` forçam quadros em PNG, e aí sai `yuv420p`. Se você renderizar de outro jeito e o `ffprobe` mostrar `yuvj420p`, converta: `ffmpeg -i ENTRADA.mp4 -vf "scale=in_range=full:out_range=tv,format=yuv420p" -color_range tv -c:v libx264 -crf 18 SAIDA.mp4`.
- **História nova = reescrever `story.ts` e o `stage()` de `cast.ts`.** Não existe arquivo de configuração: a história mora no código. O curta de 27 s levou cerca de 1 h 30 com o Claude.
- **Render só na CPU:** o curta de 825 quadros em 1080×1920 saiu em 6 minutos com GL por software (4 abas). Serve para PC sem placa forte. Com placa, 1440×2560 fez ~2,9 quadros por segundo no teste.
- **Stills:** uns 4 s cada, depois de ~40 s de preparo na primeira chamada.
- **Tipos do TypeScript:** `npm run typecheck` acusa erro no `<EffectComposer>` (React 19). O render funciona mesmo assim.
- **Chrome do sistema:** a linha de comando `npx remotion render` sozinha baixa um navegador próprio. Use os scripts da pasta.
- **Whisper erra nomes próprios** na grafia ("Versales"). O tempo sai certo.
- **Disco:** cada render cria arquivos temporários grandes (centenas de MB) na pasta temporária do sistema.

## Custo e tempo
- Grátis: sem geração por IA e sem placa de vídeo. Música e efeitos são sintetizados no seu PC.
- **Voz:** o exemplo foi cronometrado com a voz de leitura do Windows, que não serve para postar. Voz boa é a sua gravada ou a de um serviço pago na sua conta. Antes de gerar voz paga, calcule o custo (o texto do exemplo tem cerca de 370 caracteres para 27 s) e veja quanto o seu plano ainda cobre.
- **Remotion:** grátis para pessoa e para empresa de até 3 funcionários; acima disso, licença paga.
- Tempo: instalar ~1 min, demo 41 s, curta inteiro 6 min de render na CPU. O trabalho de verdade é escrever a história no código (horas).

## O que funcionou e o que não funcionou
- **Personagens: ~80% da referência.** Cabeça redonda, palito, contorno de tinta e expressões leem bem de primeira, e bicho novo desenhado com a mesma caneta entra no mesmo traço.
- **Mundo e luz: ~50%.** As referências do gênero têm cenário cheio de objetos, interiores, noite e fim de tarde com poças de luz quente. O exemplo é um gramado aberto com luz de meio-dia.
- **Cor.** A primeira versão saiu com verde-limão e azul estourados (croma quase o dobro da referência). A do pacote já vem com a saturação do mundo baixada (`sat` em `lights.ts` e em `grade.ts`); os bonecos ficam com a cor cheia, e por isso saltam do fundo.
- **Câmera pronta ajuda muito.** Empurrão em todo plano, giro nas ênfases, tranco no impacto e corte na palavra já vêm no motor.
- **O que quebra no exemplo:** o galo deitado lê como uma mancha vermelha; os bichos são cartões de perfil e não giram (o motor só tem frente e perfil); o plano aberto do jardim fica uns 3,5 s quase parado; a fumaça ao fundo é grande demais.
- **A luz `golden` não é só trocar uma palavra.** No plano do bosque, com a câmera de costas para o sol, a cena inteira caiu em sombra azul. Fim de tarde pede reposicionar câmera e sol.
- **Nossa nota:** 60–65% das referências. Para subir: voz de verdade, cenário mais cheio, luz quente, bichos com mais de uma vista.

## Roteiro de aula
- **Objetivo:** o aluno sai sabendo como um curta de cartoon 2D em mundo 3D é montado em código (cartão que encara a câmera, mundo pintado, traço, lente, grade) e consegue trocar a história de um exemplo pronto.
- **Demonstração (~30 min):**
  1. A fórmula do roteiro e o fato com causa e efeito visível (4 min).
  2. Voz primeiro: do texto ao `words.json` (4 min).
  3. `story.ts`: a tabela de planos e o corte na palavra (6 min).
  4. `cast.ts`: quem está em cena; trocar uma expressão e uma roupa ao vivo (6 min).
  5. O mesmo quadro com e sem tinta, lente e grade (4 min).
  6. Prancha, render na CPU, trilha e entrega (6 min).
- **Exercício:** no curta do exemplo, trocar a roupa do rei, mudar a expressão dos três bichos na subida e mover o corte do plano 4 para outra palavra. Deu certo se a prancha mostrar as três mudanças e o `ffprobe` do render der `yuv420p`.
- **Pré-requisitos:** estilo 34 (cena 3D em código) para o básico de three.js; estilo 74 para o básico de Remotion; a aula de roteiro (fato + virada).

## Limites conhecidos
- **Beta:** resultado em 60–65% das referências. Cenário vazio e luz chapada são o que mais pesa.
- **História nova é trabalho manual de código:** reescrever `story.ts` e o `stage()` de `cast.ts`, e desenhar o que não existe. Não há editor nem arquivo de configuração.
- **Restos da história de origem no código:** o motor veio de um curta sobre uma ponte. A ponte continua no mundo (aparece lá embaixo no primeiro plano), e sobram nomes e constantes dela (`BridgeShort`, `BridgeState`, a pasta `public/bridge/`).
- **Só frente e perfil:** personagem não gira nem aparece de costas.
- **Sem texto na tela:** o estilo não tem legenda nem tipografia. Se precisar, é por fora (no editor de vídeo).
- **Voz não vem:** o pacote sai mudo e a trilha sai sem voz. A voz de rascunho do `tts_onecore.ps1` é só para Windows e só para cronometrar.
- **A trilha é da história do balão:** os efeitos estão marcados nos instantes dela. O som não foi avaliado de ouvido por nós, só medido (-14,5 LUFS com voz).
- **Remotion tem licença própria:** empresa com mais de 3 funcionários precisa pagar.
- Testado só no Windows com Chrome. Os caminhos de macOS e Linux em `chrome.mjs` seguem o padrão dessas plataformas, mas não foram testados.
