# 02 · Sobrevivência "DIA 1"

> Vitrine: "SURTO ZUMBI · DIA 1 no sítio" · Custo: ~1.100 caracteres de narração por tomada na ElevenLabs (gravamos 2 tomadas); todo o resto R$ 0 · Ferramentas: three.js r160 (vendorizado), Node + puppeteer-core com o Chrome do sistema, FFmpeg, um gerador de imagem para as texturas, ElevenLabs para a voz; opcionais para o boneco gerado: imagem → 3D e texto → movimento no ComfyUI, Blender, conjunto 100STYLE

## O que é
Formato "se o mundo acabasse hoje": um narrador calmo explica, passo a passo, como um personagem sobrevive ao primeiro dia (aqui, o Zé num sítio brasileiro com o caramelo). Corte a cada ~3 s, legenda palavra a palavra, e **todo número falado vira HUD** (cronômetro, litros de água, raio do barulho do gerador, ficha de suprimentos). Formato inspirado em contas de sobrevivência com boneco de palito ("DIA 1"); a estética é outra: 3D em código com sol baixo, névoa, desfoque e textura pintada. Termina em gancho ("PARTE 2").

## Exemplo e arquivos
- Prévia do catálogo: `catalogo/previas/02.mp4` (capa em `catalogo/previas/02.jpg`)
- O filme em código (31 planos): `motores/02/cena.js` + os blocos `motores/02/b2.js` … `motores/02/b5.js`
- Roteiro de estudo, com a lista "Números que viram HUD": `motores/02/ROTEIRO.md`
- Método do boneco gerado + movimento real: `motores/02/METODO_MOVIMENTO.md`
- Como rodar: `motores/02/DEMO.md`; origem e licença: `motores/02/FONTES.md`

## Ferramentas e instalação
- **Node 18+** e `npm install` dentro da cópia de `motores/02/` (instala só o `puppeteer-core`, que usa o Chrome já instalado; `CHROME_PATH` se estiver fora do lugar padrão). **FFmpeg** no PATH. Grátis.
- **three.js r160** (grátis, MIT): já vem em `motores/02/vendor/three.module.js`, por import map.
- **Texturas de superfície** (grátis se o gerador for local): as 17 do filme vêm em `motores/02/tex/`, reduzidas para 768 px. Os prompts estão em `motores/02/tex/prompts.txt`; os das pranchas de conceito, em `motores/02/conceito/prompts.txt`. Gerador local ocupa a placa de vídeo: uma tarefa de GPU por vez.
- **ElevenLabs** (PAGO): `motores/02/gerar_vozes.py` usa a API com a sua chave na variável `ELEVENLABS_API_KEY`. Sem `--confirmo-custo` ele só mostra a conta de caracteres e para.
- **Opcionais do boneco gerado** (grátis, pesados): um modelo de imagem → 3D (nós usamos o Pixal3D, ~10 GB) e um de texto → movimento (HY-Motion Lite, ~10 GB de VRAM) no ComfyUI; Blender 4 ou mais novo; captura 100STYLE (CC BY 4.0, exige crédito). Python: `pip install -r requirements.txt`.

## Motor (dentro do plugin)
Em `motores/02/` (3,6 MB com three.js e texturas):
- `motores/02/cena.js`: o filme. Monta o sítio e a cozinha, os planos 1–5, o pós 2D (HUD, legenda, grade, grão), carrega os tempos da voz (`?voz=A`) e retemporiza os planos pelas palavras. Expõe `window.seek`, `window.END`, `window.READY`.
- `motores/02/b2.js` … `motores/02/b5.js`: um bloco de planos cada; recebem o objeto `CTX`.
- `motores/02/kit3d.js`: kit de material e formas (`mat()`, `cyl`, `ball`, `box`, `paint()` que põe a textura pintada por baixo do desenho, IK de perna, `PBR` por `?pbr`).
- `motores/02/gente.js` (Zé em primitivas), `motores/02/gente2.js` (Zé a partir da arte de conceito, `?z2`), `motores/02/gente3.js` (malha gerada + 18 ossos, `?z3`), `motores/02/gente4.js` (22 juntas SMPL, retarget relativo ao neutro, IK de pé, "em dois" e gramática de anime, `?z4`). Mesma API `pose()` / `poseMov()`. Os dois últimos pedem as SUAS malhas e movimentos (não vêm no pacote).
- `motores/02/cao.js`, `motores/02/bichos.js`, `motores/02/trator2.js`, `motores/02/glb.js` (leitor mínimo de GLB).
- `motores/02/estudio.html` + `motores/02/estudio.js`: prancha neutra de 2 vistas para julgar boneco e objeto fora do filme. `motores/02/teste_ze.html`, `motores/02/teste_cao.html`.
- `motores/02/malha/`: ferramentas Python do boneco gerado (`mede.py`, `rig_blender.py`, `bvh2mov.py`, `npz2mov.py`, `neutro.py`, `palitos.py`, `pega_100s.py`, `fbx2mov.py`, `pinta.py`).
- `motores/02/voz/narracao.txt` (o texto), `motores/02/voz/narr_A.words.json` (os tempos de cada palavra de uma tomada, sem áudio), `motores/02/gerar_vozes.py`, `motores/02/vozes_config.exemplo.json`.
- `motores/02/mov/sel.json`, `motores/02/mov/jobs.json`, `motores/02/mov2/sel4.json`: qual movimento toca em qual plano e os prompts de movimento.
- `motores/02/render.mjs`, `motores/02/index.html`, `motores/02/package.json`.

## Passo a passo (ponta a ponta)
1. **Rodar o demo.** Copie `motores/02/` para a pasta do seu projeto e, dentro dela:
   ```
   npm install
   npm run demo
   ```
   Sai `saida/demo.mp4` (3 s: o Zé enchendo a banheira, cronômetro no HUD e legenda; 540×960, mudo).
2. **Roteiro**: ~165 palavras para ~62 s, voz calma e grave, sem sussurro. Estrutura: gancho ("não corre pra cidade") → um erro bobo por vez → inventário → perigo revelado no fim → "PARTE 2". Liste à parte os números que viram HUD. Feche o texto antes de voz e render. O `motores/02/ROTEIRO.md` é roteiro de ESTUDO (segue a referência frase a frase): para publicar, escreva o seu e mantenha só o formato.
3. **Um plano no look final antes dos 31**: sol baixo, névoa, câmera baixa de lente longa (fov 24–34), desfoque de primeiro plano, raios, grade e grão. Julgue esse plano em tamanho grande antes de multiplicar.
4. **Texturas** (1536², ~12 passos): peça "extreme macro close-up of a <material> surface filling the entire image edge to edge, tileable, uniform pattern, no <object> silhouette". Salve em `tex/` com o nome da chave usada no `motores/02/kit3d.js` (lista `KEYS`), em JPG.
5. **Peças de cenário com passe de detalhe** (copa em cartões de folha, casa com varanda, janelas acesas) e prancha neutra:
   ```
   node render.mjs --pagina "estudio.html?pbr=1&o=trator" --tempos 0 --saida saida/prancha.jpg --lt 1080
   ```
6. **Planos**: um bloco por arquivo (`motores/02/b2.js`…). Folha de quadros em tamanho grande para julgar:
   ```
   node render.mjs --pagina "index.html?pbr=1&z2=1" --tempos 2,8,14,22,31,40,52 --saida saida/folha.jpg --lt 420
   ```
7. **Voz** (PAGO): escreva `voz/narracao.txt`, copie `vozes_config.exemplo.json` para "vozes_config.json" com o `voice_id` da sua conta, confira a conta e só então gere:
   ```
   python gerar_vozes.py --texto voz/narracao.txt --id narr_A --palavras
   python gerar_vozes.py --texto voz/narracao.txt --id narr_A --palavras --confirmo-custo
   ```
   Sai "voz/narr_A.wav" (−16 LUFS) e "voz/narr_A.words.json" (tempo de cada palavra). Escolha a tomada de ouvido.
8. **Retemporizar pela voz**: abra com `?voz=A`. O `motores/02/cena.js` ancora cada plano na frase e monta a legenda das palavras; a voz nunca é acelerada. O pacote já traz um `narr_A.words.json` para você ver isso funcionando sem pagar.
9. **Render** (o look PBR e o boneco entram por parâmetro):
   ```
   node render.mjs --pagina "index.html?pbr=1&z2=1&voz=A" --video saida/filme_video.mp4 --qps 60
   ```
10. **Juntar a voz** (sem `-shortest`, que corta a tela "PARTE 2") e gerar o celular:
   ```
   ffmpeg -i saida/filme_video.mp4 -itsoffset 0.3 -i voz/narr_A.wav -map 0:v -map 1:a -c:v libx264 -crf 17 -pix_fmt yuv420p -c:a aac -b:a 192k saida/filme.mp4
   ffmpeg -i saida/filme.mp4 -c:v libx264 -profile:v main -level 3.1 -pix_fmt yuv420p -vf scale=720:-2 -crf 24 -c:a aac -b:a 128k -ar 48000 -ac 2 -movflags +faststart saida/filme_celular.mp4
   ```
   (o atraso de 0,3 s é o `OFF` do `motores/02/cena.js`; confira o valor no arquivo).
11. **Checagem objetiva** com o roteiro, para conferir fala × texto.

## Pegadinhas medidas
- **Fundo e tela limpa:** fundo chapado liso vira slide (dê profundidade, luz ou textura); nota de produção nunca vai dentro do quadro (nome de arquivo, versão, crédito de ferramenta); nada de rótulo "imagem gerada" por cima da arte.
- **Copiar a estética da referência não funciona.** Da referência vêm batidas, ritmo e ideias de HUD; luz, paleta e pele do HUD são suas (aqui: painel escuro com filete dourado, não os cards creme da referência).
- **Primitiva chapada lê como feio**: copa-bola, capim-cone, casa-caixa. O que funcionou: copa em tufos de cartões de folha virados para fora, 4 verdes por altura, galhos visíveis, tronco grosso alargado.
- **Objeto herói com Lambert chapado** (`L(null, cor)`) foi a maior causa do ar de rascunho; herói pede `mat()` com textura e brilho.
- **31 planos em 17 min depois de validar só 1** = filme inteiro fraco. Julgue cada plano contra o plano validado, em folha grande, antes da voz. A voz retemporizada ainda estica os planos fracos.
- **Boneco**: feito à mão em primitivas não convenceu em três tentativas. O que funcionou foi arte de conceito → malha gerada por imagem → 3D (160–205 s por personagem, 477 mil vértices, UV 4096) → rig. Julgue em close grande, nunca em miniatura de 540 px.
- **Movimento por fórmula fica duro**, mesmo com 18 ossos. Troque por captura real (100STYLE) e texto → movimento (~25 s por lote de 3), sempre subtraindo o neutro da mesma fonte e tocando em tempo real.
- **Proporção do boneco = proporção da fonte de movimento** (8 cabeças, perna longa, roupa justa); roupa inflada quebra todo contato.
- **Tempos**: um bloco de 10 s levou 10 min de produção com look errado e várias refações; render do corte inteiro ~4 min 17 s a 60 qps com placa de vídeo.
- **Voz**: grave e calma, estabilidade 0,5 / estilo 0,4 / velocidade 1,0; as nossas tomadas deram 74,9 s e 76,6 s para o mesmo texto.

## Custo e tempo
- Voz: ~1.100 caracteres por tomada (na ElevenLabs, 1 caractere ≈ 1 crédito). Duas tomadas para escolher de ouvido = ~2.200. É o único gasto; ponha um teto com `--teto`.
- Gerador de imagem, imagem → 3D e texto → movimento: locais e grátis, mas ocupam a placa de vídeo (12 GB bastaram); um por vez.
- Render three.js: leve, ~4 min o filme com placa de vídeo. Por software (`DEMO_CPU=1`), ~2 s por quadro.
- Tempo real do projeto: 2 dias e 7 versões, a maior parte em boneco e movimento.

## O que funcionou e o que não funcionou
- Não funcionou: o primeiro bloco, que puxou a estética da referência junto com o formato. Formato sim, estética não.
- Funcionou: refazer a luz (sol baixo, névoa, câmera baixa, desfoque). Luz de meio-dia deixa a cena crua; o relight sozinho mudou a leitura do bloco.
- Funcionou: árvores com passe de detalhe (cartões de folha, galhos) e a casa com varanda e janelas acesas. É esse nível de detalhe que a cena pede.
- Funcionou: o roteiro (um erro bobo por vez, números no HUD, gancho no fim).
- Não funcionou: multiplicar planos antes de validar o look; o corte com voz saiu fraco duas vezes seguidas. E o zumbi reaproveitando o modelo do protagonista: o espectador percebe.
- Boneco: primitivas à mão, não; malha gerada da arte de conceito, sim. Andar por fórmula, duro; captura real, sim, desde que o boneco tenha a proporção da fonte (senão anda curvado).
- No lado a lado movimento contínuo × "em dois" (12 poses/s), o "em dois" lê melhor para este boneco.
- Nossa nota: receita parcial. As primeiras versões do filme completo foram refeitas e a última (v7) não teve avaliação final; os blocos de cenário e o método do boneco são a parte sólida.

## Roteiro de aula
- **Objetivo**: o aluno sai sabendo separar formato de estética numa referência e montar um vídeo "DIA 1" em que cada número falado vira HUD, com planos retemporizados pela voz.
- **Demonstração (~30 min)**: (1) uma referência do formato: o que se aproveita (batidas, HUD) e o que não (look), 5 min; (2) o antes/depois de um bloco, cru × cinematográfico, 6 min; (3) textura pintada por baixo do código, com o prompt de "superfície em macro", 5 min; (4) um plano com HUD preso à palavra (cronômetro 30:00, litros), 6 min; (5) `?voz=A`, retemporização e render, 5 min; (6) checagem, 3 min.
- **Exercício**: escrever um "DIA 1" de 20 s (60 palavras) em outro cenário brasileiro, com 3 números virando HUD, e montar 3 planos no look cinematográfico. Deu certo se: todo número falado aparece na tela no instante da fala, nenhum plano com luz de meio-dia, a checagem passa.
- **Pré-requisitos**: estilo 34 (luz e profundidade no three.js). O boneco gerado por IA é assunto do estilo 35.

## Limites conhecidos
- **Receita parcial**: o filme completo não teve avaliação final; trate como motor + método, não como peça aprovada.
- O pacote não traz o boneco de malha gerada nem os movimentos (centenas de MB): `?z3` e `?z4` só funcionam com os seus arquivos em `malha/` e `mov2/`. O demo e o `npm run filme` usam o Zé de primitivas (`?z2=1`), que é o boneco que NÃO convenceu; serve para estudar cenário, luz, HUD e retemporização.
- Texturas reduzidas para 768 px no pacote; em close perdem definição.
- Sem sound design (só voz; sem música nem efeitos).
- Zumbi e bichos ainda são os modelos antigos; o rosto do boneco gerado é textura (não pisca, não fala); dedos fechados.
- O texto do `motores/02/ROTEIRO.md` segue a referência frase a frase; para publicar precisa de roteiro próprio.
- Não exercitados neste pacote: `motores/02/gerar_vozes.py` contra a API (é pago) e o `motores/02/malha/rig_blender.py` depois que a pele passou a usar os pesos automáticos do próprio Blender. Confira no primeiro uso.
