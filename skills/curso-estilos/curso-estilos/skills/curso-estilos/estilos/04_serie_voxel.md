# 04 · Série voxel com escolha nos comentários

> Vitrine: "O Caseiro" (EP01 "As Regras", 35,1 s) · Custo: ~1.350 caracteres de fala na ElevenLabs para os 3 episódios (25 falas) + tema musical e efeitos, se você gerar em vez de usar biblioteca; render R$ 0 · Ferramentas: three.js 0.186 (npm), Node + puppeteer-core com o Chrome do sistema, FFmpeg, Python (numpy) para montar o diálogo, ElevenLabs para a voz

## O que é
Série em capítulos num mundo voxel com luz assada: Caio, de parka laranja, aceita R$ 15 mil para cuidar de uma cabana na neve com 3 regras. Cada episódio testa uma regra e termina congelado em 2 cartões: "Comenta 1 ou 2. O mais votado decide o que eu faço." As duas continuações são produzidas antes; você posta a vencedora. Funciona porque a premissa se entende em 2 s, o voto dá motivo para comentar e o mundo único vira identidade da conta. Mecânica inspirada em séries diárias em voxel com voto do público.

## Exemplo e arquivos
- Prévia do catálogo: `catalogo/previas/04.mp4` (capa em `catalogo/previas/04.jpg`)
- Os 3 episódios em código (EP01, EP02A, EP02B): `motores/04/motor/shots_cas_ep01_tail.js` e irmãos, com as linhas do tempo `motores/04/motor/timeline_cas_ep01.json` e irmãs
- Conceito da série (referência medida, personagem, mecânica do voto, roteiros dos 4 caminhos do EP03): `motores/04/CONCEITO.md`
- Postagem (legenda, hashtags, comentário fixado, regra do voto): `motores/04/episodios/POST_ep01.md`, `motores/04/episodios/POST_ep02a.md`, `motores/04/episodios/POST_ep02b.md`
- Jogo no mesmo mundo (código de estudo): `motores/04/jogo/README.md`
- Como rodar: `motores/04/DEMO.md`; origem e licença: `motores/04/FONTES.md`

## Ferramentas e instalação
- **Node 18+ e npm** (grátis): na cópia de `motores/04/`, `npm install` (instala `three` 0.186.1 e `puppeteer-core`).
- **Chrome instalado** (grátis): o `motores/04/motor/render.mjs` usa o Chrome do sistema; `CHROME_PATH` troca o caminho. Com placa de vídeo, o ANGLE é obrigatório (o script já escolhe `d3d11` no Windows, `metal` no Mac, `gl` no Linux; a variável `ANGLE` troca): sem ele o Chrome sem janela cai em software e fica 50–100× mais lento. Sem placa, `DEMO_CPU=1` assume o software de propósito.
- **FFmpeg** no PATH (grátis).
- **Python** (grátis): `numpy` para o `motores/04/voz/montar.py`.
- **ElevenLabs** (PAGO): `motores/04/voz/gerar_vozes.py` usa a API com a sua chave na variável `ELEVENLABS_API_KEY`. Sem `--confirmo-custo` ele só mostra a conta de caracteres e para.
- Pegadinha: import map não funciona em `file://`; o `motores/04/motor/render.mjs` sobe um servidor http local na pasta do motor.

## Motor (dentro do plugin)
Em `motores/04/` (~450 KB de código; os dados assados, ~75 MB, são gerados na sua máquina):
- `motores/04/motor/world.mjs`: o mundo voxel determinístico (176 × 80 × 260; bosque de pinheiros, cabana de toras, lago, trilha).
- `motores/04/motor/bake.mjs` + `motores/04/motor/lighting.mjs`: iluminação global assada em CPU (path tracer sobre a grade, todos os núcleos) → malha + luz por vértice em canais que o shader reescala. Grava em `motor/data/`.
- `motores/04/motor/scene.js` + `motores/04/motor/scene.html`: o renderizador. Lê `?shots=`, `?ep=`, `?data=`, `?norocket`, `?capa=1`.
- `motores/04/motor/shots_cas_head.js` (personagem, vulto, lanternas, bilhete, rádio), `motores/04/motor/shots_cas_common.js` (legenda, cartões do voto, capa), `motores/04/motor/shots_cas_ep01_tail.js`, `motores/04/motor/shots_cas_ep02a_tail.js`, `motores/04/motor/shots_cas_ep02b_tail.js` (os planos de cada episódio), `motores/04/motor/shots_cas_ep02a_juice4_tail.js` (o mesmo com hit-stop, flash e tremor na racha do gelo).
- `motores/04/motor/demo.mjs` (assa, junta os planos e renderiza 3 s) e `motores/04/motor/render.mjs` (still ou vídeo, PNG por pipe direto no FFmpeg).
- Conferência de enquadramento sem renderizar: `motores/04/motor/geo.mjs`, `motores/04/motor/los.mjs`, `motores/04/motor/los2.mjs`, `motores/04/motor/los3.mjs`, `motores/04/motor/frame_calc.mjs`.
- `motores/04/motor/particles.js`, `motores/04/motor/pixelfont.js`.
- `motores/04/voz/falas.json` (texto e personagem de cada fala), `motores/04/voz/gerar_vozes.py`, `motores/04/voz/vozes_config.exemplo.json`, `motores/04/voz/montar.py` (diálogo e linha do tempo).
- `motores/04/jogo/`: `game_tail.js` (o jogo), `game_scene.js`, `server.mjs`, `build.sh`, `index.html`, `README.md`.

## Passo a passo (ponta a ponta)
1. **Rodar o demo.** Copie `motores/04/` para a pasta do seu projeto e, dentro dela:
   ```
   npm install
   npm run demo
   ```
   Ele assa a luz do mundo (só na primeira vez), monta os planos do EP01 e grava `saida/demo.mp4` (3 s, 540×960, mudo).
2. **Conceito em 10 palavras + mecânica de voto.** Premissa adulta (dinheiro, dilema moral), 3 regras, um mundo só. Escreva o EP01 e as DUAS continuações do EP02 (modelo em `motores/04/CONCEITO.md`). Feche o roteiro antes da voz.
3. **Mundo**: edite o `motores/04/motor/world.mjs` e asse a luz de novo (apague `motor/data/` antes):
   ```
   npm run assar
   ```
4. **Falas** (PAGO): uma fala por arquivo. Texto e personagem no `motores/04/voz/falas.json`; vozes em "voz/vozes_config.json" (copie do exemplo). Dentro de `voz/`:
   ```
   python gerar_vozes.py --falas falas.json --ep ep01 --saida ep01 --palavras
   python gerar_vozes.py --falas falas.json --ep ep01 --saida ep01 --palavras --confirmo-custo
   python montar.py ep01
   ```
   Sai "voz/ep01/dialogo.wav" (Caio a −16 LUFS, 1,06×) e "voz/ep01/timeline.json" com blocos e palavras. Copie esse JSON para `motor/timeline_cas_ep01.json` (o pacote já traz as linhas do tempo dos 3 episódios, então dá para estudar os planos sem pagar voz).
5. **Enquadrar sem renderizar**, dentro de `motor/`: `node geo.mjs` (pontos da trilha, altura do chão) e `node los3.mjs` (linha de visada livre) antes de qualquer still.
6. **Planos**: escreva o "shots_cas_<ep>_tail.js" (tempos presos aos blocos e às palavras da fala; `window.EVENTS` lista os eventos físicos para o som) e monte o arquivo final (o `demo.mjs` faz isso sozinho para o episódio pedido):
   ```
   cat shots_cas_head.js shots_cas_common.js shots_cas_ep01_tail.js > shots_cas_ep01.js
   ```
7. **Stills e vídeo**, dentro de `motor/` (variáveis de ambiente antes do comando; no PowerShell, use `$env:Q="..."`):
   ```
   Q="?shots=shots_cas_ep01.js&ep=ep01&norocket&data=data" node render.mjs still 2,9,18,28.5 st_ep01
   OUT=cas_ep01_video.mp4 Q="?shots=shots_cas_ep01.js&ep=ep01&norocket&data=data" node render.mjs video 35.1 30
   ```
8. **Mix** no seu editor ou em código: cama de vento + drone sempre baixa, tema entrando seco no 1º susto e saindo com cauda no congelado, efeitos pequenos e literais nos buracos da fala (passos, gelo, rádio, porta), master a −14 LUFS. Use a sua biblioteca de efeitos ou um pack CC0. Os tempos dos eventos estão em `window.EVENTS` de cada "tail".
9. **Juntar, capa e celular** (dentro de `motor/`, com a sua mix em "mix_ep01.wav"):
   ```
   ffmpeg -v error -y -i cas_ep01_video.mp4 -i mix_ep01.wav -map 0:v -map 1:a -c:v copy -c:a aac -b:a 192k -ar 48000 -shortest EP01.mp4
   Q="?shots=shots_cas_ep01.js&ep=ep01&norocket&data=data&capa=1" node render.mjs still 28.5 capa_ep01
   ffmpeg -i EP01.mp4 -c:v libx264 -profile:v main -level 3.1 -pix_fmt yuv420p -vf scale=720:-2 -crf 24 -c:a aac -b:a 128k -ar 48000 -ac 2 -movflags +faststart EP01_celular.mp4
   ```
10. **Checagem objetiva** com o roteiro, para conferir fala × texto.
11. **Postar**: legenda, hashtags, comentário fixado e regra do voto no `motores/04/episodios/POST_ep01.md`; em ~12 h conte os votos e poste a continuação vencedora, creditando 2–3 @ na legenda.
12. **Bônus, o jogo**: veja `motores/04/jogo/README.md` (precisa dos seus áudios; teste sempre com `?norocket&manual&mute`).

## Pegadinhas medidas
- **Fundo e tela limpa:** fundo chapado liso vira slide (dê profundidade, luz ou textura); nota de produção nunca vai dentro do quadro (nome de arquivo, versão, crédito de ferramenta); nada de rótulo "imagem gerada" por cima da arte.
- **Referência medida** (uma série diária em voxel com voto): 11 episódios em 7 dias; EP01 1,4 mil curtidas, **EP02 15 mil e 1.076 comentários**. O EP02 é o que explode e não pode atrasar: por isso as duas continuações ficam prontas antes.
- **Efeitos sonoros altos demais** foi o único defeito apontado na primeira entrega. Regra: cada efeito ≥ ~10 dB abaixo do nível momentâneo da fala, conferido em caixa de celular; nada de ganho 2× em estalo. Na segunda versão: 59 efeitos → 9, todos foley real, 11,3–14,0 dB abaixo da voz.
- **Tag de emoção com vírgula** (`[uneasy, reading]`) vaza para a legenda: filtre tokens que começam com `[` ou terminam com `]` (o `montar.py` já faz).
- **Uma fala por arquivo**: recortar um take longo por alinhamento cortou uma palavra. Sem `[whispers]`: sussurro sintético soa estranho e some no celular.
- **High-pass de 160 Hz na cama** apaga vento e drone e o celular acusa silêncio entre as falas. Solução: −3 dB abaixo de 250 Hz.
- **Plaquinha 3D perto da lente** aparece enorme e borrada no fade de um cartão 2D.
- **Vulto ajoelhado com parte descolada**: no `vultoKneel` a base (0,07–0,33) estava separada do tronco (0,55–1,17). Emende os blocos.
- **Legenda nunca atravessa um corte.** Cartões do voto no peito, rosto livre: os olhos indo de um lado para o outro são a ação do quadro congelado.
- **Juice** (EP02A, racha do gelo): hit-stop de 3 quadros começando no 1º quadro em que a racha é visível, tremor por trauma² com decaimento 4/s (máximo 8,7 px), flash só nas linhas da racha, volta ao normal em ≤ 0,25 s. Em voz (susto sem impacto físico): tremor sem squash.
- **Números finais dos 3 episódios**: checagem passou; fala × roteiro 99–100%; −13,6 LUFS; em caixa de celular −19,3 a −19,5.
- **Assado**: 6–16 s nesta máquina para o mundo inteiro (310 mil faces, 760 mil vértices); os dados ocupam ~75 MB e não entram em controle de versão.
- Jogo: resolução interna 720×1280, ≈ 16 ms por quadro numa placa intermediária. Aba de navegador oculta trava a animação: use `?norocket&manual` e `window.step()`.

## Custo e tempo
- Voz: 25 falas ≈ 1.350 caracteres para os 3 episódios (na ElevenLabs, 1 caractere ≈ 1 crédito). Tema musical e efeitos gerados por IA nos custaram mais ou menos o mesmo tanto; com biblioteca própria ou pack CC0 esse custo some. Render local, R$ 0.
- Re-render de um episódio: ≈ 5 min com placa de vídeo (medido no EP02A). O assado de luz é CPU; o render usa a placa pelo Chrome (leve), um por vez. Por software, ~16 s por quadro.
- Produção: conceito + 3 episódios numa noite, reaproveitando um motor voxel que já existia. O jogo saiu num dia porque mundo, personagem, vozes e mix já estavam prontos.

## O que funcionou e o que não funcionou
- Funcionou: o voxel como formato de conta própria, com premissa adulta e voto. A qualidade de imagem (luz assada) foi o ponto mais elogiado.
- Funcionou: produzir as duas continuações antes de postar o EP01.
- Funcionou: o jogo no mesmo mundo; reaproveitar mundo, personagem e vozes dá um segundo produto quase de graça.
- Não funcionou: efeitos sonoros no volume da primeira mix (altos demais sobre a voz). Música e efeitos ficam bem abaixo da fala e sobem só nos buracos.
- Não funcionou: sussurro na voz; recorte automático de take; o vulto com blocos descolados.
- O estilo não combinou com uma marca que testou o piloto: voxel de terror é identidade forte, serve melhor a uma conta própria.
- Nossa nota: os 3 episódios passaram na checagem e foram bem recebidos internamente, mas a série não foi postada; não há dado real de voto.

## Roteiro de aula
- **Objetivo**: o aluno sai sabendo desenhar uma série com voto (EP01 + 2 continuações), montar planos presos às palavras da fala num mundo voxel pronto e entregar com som abaixo da voz.
- **Demonstração (~35 min)**: (1) os números da série de referência e por que o EP02 manda, 4 min; (2) conceito em 10 palavras, 3 regras, cartões do voto, 5 min; (3) `motores/04/voz/falas.json` → `motores/04/voz/montar.py` → linha do tempo, 5 min; (4) um plano no "tail" preso a uma palavra, com `motores/04/motor/los3.mjs` antes do still, 8 min; (5) `cat` + `motores/04/motor/render.mjs` still e vídeo, 5 min; (6) mix: medir efeito × voz, 5 min; (7) o jogo rodando no mesmo mundo, 3 min.
- **Exercício**: escrever um EP de 20 s no mundo da cabana (4 falas, 1 susto, 2 cartões) e as duas primeiras frases de cada continuação; montar 3 planos usando uma das linhas do tempo que já vêm. Deu certo se: a legenda não atravessa corte, os cartões não cobrem o rosto, todo efeito ≥ 10 dB abaixo da voz, a checagem passa.
- **Pré-requisitos**: nenhum de código (o mundo vem pronto). Ajuda ter visto as aulas de checagem e de som.

## Limites conhecidos
- **Sem áudio no pacote**: vozes, tema e efeitos ficam de fora. O nosso script de mix também não vem (dependia de biblioteca de efeitos sem licença de redistribuição); o passo 8 descreve o método.
- `motores/04/voz/gerar_vozes.py` não foi exercitado contra a API neste pacote (é pago); o formato de palavras que ele grava é o que o `montar.py` lê, mas confira na primeira fala.
- O jogo é código de estudo: não roda sem os seus áudios nos lugares que o `motores/04/jogo/README.md` lista, e não foi testado neste pacote.
- Só o mundo da neve existe; EP03 roteirizado nos 4 caminhos, não produzido. A série não foi postada.
- Dúvidas de direção ainda abertas: destaque amarelo de palavra na legenda, o vulto como bloco, a porta sem folha, o EP02A curto.
- O demo por software é lento (~12 min para 3 s).
