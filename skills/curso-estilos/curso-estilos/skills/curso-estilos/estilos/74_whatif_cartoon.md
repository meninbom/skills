# 74 · What-if em desenho 2D (Remotion)

> Vitrine: "E se você ficasse 11 dias sem dormir?" (35,6 s, muda) · Custo: grátis (atenção à licença do Remotion para empresas) · Ferramentas: Remotion 4.0.530, React 19 (SVG desenhado em código), TypeScript, Node, Chrome

## O que é
Explicativo "E se...?" em cartoon 2D: um personagem de capuz atravessa uma pergunta concreta dentro de um cômodo em perspectiva de 1 ponto, com luz de fonte visível (abajur, lua, porta), cards com números reais e um relógio global no HUD que corre por cima de todos os cortes. Cada quadro é SVG desenhado em React e renderizado pelo Remotion. Funciona pela fórmula: pergunta concreta, uma pessoa, fatos com número e uma virada real no fim.

## Exemplo e arquivos
- Prévia do catálogo: `catalogo/previas/74_orig.mp4` (6 s: o microssono na mesa e a sombra virando jogador) e `catalogo/previas/74_orig.jpg`.
- Projeto Remotion completo: `motores/74/` (o filme de 35,6 s sai dele com `npm run filme`).
  - episódio: `motores/74/src/episodes/insone/` (`hero.tsx` personagem, `quarto.tsx` cenário, `ui.tsx` HUD e cards, `shots.tsx` os 10 planos, `index.tsx` montagem e cortes)
  - motor de cena: `motores/74/src/engine/`
- Notas da peça (os 10 planos, nossa nota, problemas conhecidos): `motores/74/NOTAS.md`
- Fontes de cada número da tela e licenças dos arquivos de terceiros: `motores/74/FONTES.md`
- Demo de um comando: `motores/74/DEMO.md`
- Origem do motor de cena: repositório público `kelano86/what-if-animation` (MIT). Estilo inspirado em contas de curiosidade em cartoon (explicativo com HUD, insert de planta e cards com o mundo atrás).

## Ferramentas e instalação
- **Node 18+** e **Google Chrome** (Edge ou Chromium servem). O render usa o Chrome do sistema: os scripts procuram nos caminhos padrão de Windows, macOS e Linux, ou no que você puser em `CHROME_PATH`. Nenhum navegador é baixado.
- **Remotion 4.0.530 + React 19 + TypeScript 5.8:** `npm install` dentro da cópia de `motores/74/` (~260 MB em `node_modules`, uns 3 min). O Remotion já traz o FFmpeg dele; você só precisa de um FFmpeg no PATH para os comandos de entrega do passo 8.
- **AVISO DE LICENÇA DO REMOTION:** não é software livre comum. Pelo texto que vem no pacote (`node_modules/remotion/LICENSE.md`, versão 4.0.530), o uso é gratuito, inclusive comercial, para pessoa física, organização com fins lucrativos de até 3 funcionários, organização sem fins lucrativos e quem está só avaliando. Fora desses casos é preciso comprar a Company License (remotion.pro/license). O arquivo avisa que os termos mudam um pouco no Remotion 5.0. Leia a licença da versão que você instalar antes de usar em trabalho de empresa.
- **Fontes:** Bricolage Grotesque, Fragment Mono e Kalam (todas OFL) vão junto em `motores/74/public/vendor/fontes/` e carregam do disco. O render não precisa de internet.
- **Sem placa de vídeo:** tudo roda em CPU. `DEMO_CPU=1` força o GL por software do Chrome (`swiftshader`; `DEMO_GL=swangle` como alternativa).
- **Scripts de voz e som** (`motores/74/extras/narrado/`): opcionais, fora do demo. Os que chamam a ElevenLabs leem a chave só da variável `ELEVENLABS_API_KEY` (a sua conta) e param sem `--confirmo-custo`. Detalhes em `motores/74/extras/narrado/LEIA.md`.

## Motor (o que vem na pasta)
Em `motores/74/` (cerca de 0,6 MB sem `node_modules`):
- `package.json`, `package-lock.json`, `remotion.config.ts`, `tsconfig.json`: projeto pronto para `npm install`.
- `render.mjs`: `npm run demo` (3 s em 540×960) e `npm run filme` (o filme inteiro em 1080×1920), sempre mudo e em `yuv420p`.
- `chrome.mjs`: acha o Chrome do sistema e liga o GL por software quando `DEMO_CPU=1`.
- `stills.mjs`: stills pelo renderer (`board` = quadro-chave de cada plano; `frames N M` = quadros avulsos; `cast` = ficha do personagem), em escala 0,5.
- `src/index.ts`, `src/Root.tsx`: composições `Insone` (filme), `InsoneBoard` (prancha) e `VCast` (ficha do personagem).
- `src/engine/room.tsx`: perspectiva de 1 ponto (`makeRoom`, `Box`, `RoomShell`, `BackWindow`).
- `src/engine/light.tsx`: LightVeil, Glow, Cone, Dust e filtros de rim light.
- `src/engine/rig.tsx`, `src/engine/anim.ts`: `Pose`/`poseAt` e easing.
- `src/engine/props.tsx`, `furnish.tsx`, `kit.tsx`, `ui.tsx`, `episode.tsx`, `fonts.ts`, `sets/`: props, móveis, UI, motor de episódio/looks e 7 sets do motor aberto (MIT).
- `src/episodes/insone/hero.tsx`: o personagem (capuz, olheira que cresce com `tired`, barba e rugas com `age`).
- `src/episodes/insone/quarto.tsx`, `ui.tsx`, `shots.tsx`, `index.tsx`, `cast.tsx`: cenário vertical, HUD com relógio global, 10 planos e a tabela de cortes `SEGS`.
- `public/vendor/fontes/`: as 3 famílias de fonte com os textos da OFL.
- `extras/narrado/`: `plan.py` (cortes ancorados em palavra + ritmo), `mixcheck.py` (efeito a 3 dB da voz), `board.py`, `motiongrid.py`, `master.py`, `voice.py`, `sfx.py`, `voz_kokoro.py` (voz local grátis) e `wi.py` (funções comuns).
- `NOTAS.md`, `FONTES.md`, `DEMO.md`, `LICENCA_MOTOR_MIT.txt`.

Não vem: `node_modules`, renders prontos, e a biblioteca de áudio do repositório de origem (licença de reuso comercial não confirmada).

## Passo a passo (ponta a ponta)
1. **Rode o demo.** Copie `motores/74/` para a pasta do seu projeto e, lá dentro:
   ```bash
   npm install
   npm run demo            # saida/demo.mp4, 3 s, 540×960, mudo
   ```
   Sem placa de vídeo: `DEMO_CPU=1 npm run demo` (PowerShell: `$env:DEMO_CPU = '1'; npm run demo`). Medido: ~1 min 45 s em CPU, com GL por software.
2. **Pergunta + fatos.** Uma pergunta concreta com pessoa real por trás. Confira cada número na web e escreva o seu `FONTES.md` (card → dado → fonte) antes de animar. Dado frágil vira texto prudente ("quase 15 horas").
3. **Roteiro em planos** (10 aqui): alterne tamanho (aberto, insert, médio, câmera baixa), 1 demonstração por plano, virada no fim. Feche o roteiro antes de desenhar.
4. **Personagem e cenário:** adapte `src/episodes/insone/hero.tsx` (cabeça coberta) e `src/episodes/insone/quarto.tsx`; confira a ficha:
   ```bash
   node stills.mjs cast                  # saida/cast.png
   ```
5. **Planos:** um componente por plano em `src/episodes/insone/shots.tsx`; cortes na tabela `SEGS` de `src/episodes/insone/index.tsx` (quadro inicial, final e quadro-chave). HUD com relógio global que não reinicia no corte.
6. **Prancha antes de animar** (olhe os quadros-chave numerados antes de gastar render):
   ```bash
   node stills.mjs board                 # saida/board/S1..S10.png
   node stills.mjs frames 100 300        # saida/frames/f0100.png, f0300.png
   ```
7. **Render do filme** (CPU):
   ```bash
   npm run filme                         # saida/filme.mp4, 1080×1920, mudo, yuv420p
   ```
8. **Entrega.** Alguns apps recusam vídeo sem faixa de áudio; a peça de vitrine levou uma faixa AAC 48 kHz silenciosa. Versão final e versão leve de celular:
   ```bash
   ffmpeg -y -i saida/filme.mp4 -f lavfi -i anullsrc=r=48000:cl=stereo -shortest -c:v libx264 -crf 16 -pix_fmt yuv420p -c:a aac -b:a 128k -ar 48000 -movflags +faststart NOME_1080.mp4
   ffmpeg -y -i NOME_1080.mp4 -vf scale=720:-2 -c:v libx264 -crf 21 -pix_fmt yuv420p -c:a aac -b:a 128k -ar 48000 -movflags +faststart NOME_celular.mp4
   ```
9. **Checagem:** confira com `ffprobe` (duração, `yuv420p`) e monte uma folha de quadros para ler texto pequeno e tempo parado:
   ```bash
   ffprobe -v error -show_entries stream=codec_name,pix_fmt,width,height:format=duration -of default=nw=1 NOME_1080.mp4
   ffmpeg -y -i NOME_1080.mp4 -vf "fps=1/4,scale=270:-2,tile=3x3" -frames:v 1 folha.jpg
   ```
10. **Se for narrado:** a voz vem primeiro (API ou site da ElevenLabs com a sua chave, ou a voz local do `voz_kokoro.py`), e os cortes passam a ser ancorados em palavra (ideia do `extras/narrado/plan.py`: corte 2 quadros antes da palavra, aviso para plano parado acima de 3 s). Esse fluxo usa o formato de episódio do motor de origem; leia o `extras/narrado/LEIA.md`.

## Pegadinhas medidas
- **Fundo e tela limpa:** fundo chapado liso vira slide (dê profundidade, luz ou textura); nota de produção nunca vai dentro do quadro (nome de arquivo, versão, crédito de ferramenta); nada de rótulo "imagem gerada" por cima da arte.
- **Render do filme:** 19 min para 1.068 quadros (35,6 s) na CPU com 8 abas em paralelo. Um teste 16:9 de 18,9 s levou 324 s.
- **Render do demo:** 90 quadros em 540×960 levaram ~1 min 45 s com GL por software e 4 abas.
- **`yuvj420p` em vez de `yuv420p`:** com quadros em JPEG (padrão do renderer) o H.264 sai em faixa cheia (`yuvj420p`), que alguns celulares e apps não abrem. O `render.mjs` força `imageFormat: 'png'`; o `remotion.config.ts` faz o mesmo para a linha de comando.
- **Chrome do sistema:** passar `browserExecutable` + `chromeMode: 'chrome-for-testing'` evita o download do navegador do Remotion (~110 MB). A linha de comando `npx remotion render` sozinha baixa; use os scripts da pasta.
- **Relógio do HUD:** no motor de origem o dial reiniciava a cada segmento (9,5 → 7,2 → 8,9). Aqui o relógio é global ("ACORDADO HÁ 000 h · DIA n") e atravessa os cortes.
- **Conflito de nome:** o motor exporta a paleta `S3` e um plano também se chamava `S3`. Importe como `S3 as PAL`.
- **TSX escrito por heredoc do bash quebra** (aspas): grave os arquivos pelo editor ou pela ferramenta de escrita do agente.
- **Checagem do filme:** maior tempo parado 0,63 s, sem engasgo nem flash. Avisos de texto pequeno: rótulos do HUD em mono e rótulo dos cards (30 px; subir para 36–40). 1 aviso de zona da interface do app (despertador do cenário).
- **Ritmo:** ~17 cortes/min aqui; a referência de mercado faz 20–40; a fórmula do motor de origem pede 35/min (48 nos primeiros 10 s).
- **Limite do estilo:** é 2D em perspectiva falsa; não existe câmera girando no mesmo mundo.
- **Atuação:** poses simples; a queda na cama (plano 8) tem pernas duras; as mãos quase não mexem.
- **Cada plano novo** custa 300–500 linhas de TSX.

## Custo e tempo
- Grátis: sem IA, sem voz, sem GPU, sem internet no render.
- Render do filme 19 min; a peça inteira saiu numa noite de trabalho.
- Remotion: licença paga para empresa que não cabe na licença gratuita (veja o aviso acima).
- Narração, se você quiser: ~550 caracteres para 35 s de fala (o teste de 18,9 s tinha 315). Com a voz local do kokoro, zero. Efeitos gerados por IA custam à parte; confira a tabela atual da ElevenLabs antes.

## O que funcionou e o que não funcionou
- **Comparar com o exemplo do autor.** Testar um motor aberto sem pôr o resultado lado a lado com o vídeo de exemplo dele dá peça fraca sem ninguém perceber. Baixe o exemplo, compare, corrija em até 3 rodadas e dê a nota em relação à referência.
- **Nossa nota:** 7,5 de 10 contra o exemplo do motor de origem; 6 de 10 contra a referência de mercado (perde em câmera, que não gira, e em ritmo de corte).
- **Cabeça coberta.** Cabelo desenhado em código costuma ficar ruim; capuz, capacete ou gorro resolvem e ainda dão silhueta.
- **Créditos e fontes fora da tela.** Vão no `FONTES.md`; na tela, só a história.
- **Formato sim, estética não.** Da referência vêm roteiro, tamanhos de plano e HUD; luz e paleta são suas. Copiar a estética junto deixa a peça genérica.
- **Luz com fonte visível.** Toda luz sai de algo que está no quadro (abajur, lua, porta) e o meio-tom fica escuro; o `LightVeil` garante isso. Cena clara por igual parece jogo de celular.
- **Relógio global no HUD.** Um contador que reinicia a cada corte denuncia a montagem; um que atravessa os cortes costura o filme.
- **Remotion para bounce e builds.** Em comparação com animar HTML na mão, o Remotion deu entradas e montagens mais limpas; o preço é o render em CPU e a licença.

## Roteiro de aula
- **Objetivo:** o aluno sai sabendo montar um "E se...?" de 30 s em Remotion: fatos conferidos, personagem próprio, cômodo em perspectiva com luz de fonte, HUD com relógio global e virada final.
- **Demonstração (~30 min):**
  1. A fórmula: pergunta, demonstrações, fato com número, virada (4 min).
  2. `motores/74/FONTES.md` antes de animar (3 min).
  3. `makeRoom` e um cômodo nascendo; ligar abajur e janela (7 min).
  4. O personagem: `Pose`, `tired`, `age` (5 min).
  5. Um plano inteiro e a tabela `SEGS`; o relógio que atravessa o corte (6 min).
  6. Prancha, render e checagem (5 min).
- **Exercício:** 3 planos (aberto, insert, médio) de uma pergunta própria com 1 fato conferido e fonte anotada. Deu certo se o relógio do HUD não reiniciar nos cortes, se toda luz tiver fonte visível no quadro e se nenhum trecho ficar parado mais de 1,5 s.
- **Pré-requisitos:** noção de React; a aula de roteiro (fato + virada). Para narrar, a aula de voz.

## Limites conhecidos
- Peça muda: não há receita testada de voz, legenda palavra a palavra nem som para este estilo. Os scripts de `extras/narrado/` vieram do motor de origem e foram testados só no formato 16:9 dele, não nesta peça vertical.
- Cortes escritos à mão em `SEGS`; a ancoragem em palavra (`extras/narrado/plan.py`) não foi portada para o episódio vertical.
- Nossa nota contra a referência de mercado: 6 de 10. O estilo não alcança câmera girando no mesmo mundo.
- O demo foi testado no Windows com Chrome; os caminhos de macOS e Linux em `chrome.mjs` seguem o padrão dessas plataformas, mas não foram testados.
- Remotion tem licença própria: quem não cabe na licença gratuita precisa pagar.
- A biblioteca de áudio do repositório de origem não tem licença de reuso comercial clara: não vem no pacote e não deve ser usada para postar.
