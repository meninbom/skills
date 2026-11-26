# 35 · Herói 3D PBR a partir de arte de conceito

> Vitrine: "A guarda do passo" (30,5 s, muda) · Custo: grátis (gerador de imagem local + CPU) · Ferramentas: Z-Image Turbo no ComfyUI (ou outro gerador de imagem), three.js r160, Node + puppeteer-core com o Chrome do sistema, Python + Pillow/numpy (só para o estúdio de comparação), FFmpeg

## O que é
Um personagem 3D montado inteiro em código (three.js, material PBR) copiando uma folha de conceito gerada por IA. O truque não é "modelar de olho": é medir a arte em pixels, montar o corpo nessas medidas com superfícies paramétricas e comparar modelo × conceito num estúdio de 3 vistas, rodada a rodada. O espectador vê um herói de filme de animação numa cena com luz de cinema (sol baixo, névoa, desfoque, grão) e um golpe com impact frame de anime.

## Exemplo e arquivos
- Prévia do catálogo: `catalogo/previas/35_orig.mp4` (a pedra descendo, o golpe e a pedra se partindo).
- Notas da peça de exemplo: `motores/35/NOTAS.md`
- Conceito: `motores/35/conceito/folha_conceitos.jpg` (as 4 opções), `motores/35/conceito/escolhido.jpg` (a escolhida) e `motores/35/conceito/prompts.txt`
- Texturas pintadas, já reduzidas para 768 px: `motores/35/tex_novo/` (as da peça) e `motores/35/tex/` (reserva: aço, couro, madeira, pedra etc.), com os prompts em `motores/35/tex_novo/prompts.txt`
- Grade de medição da arte: `motores/35/recon/exemplo_grade_de_medicao.jpg`
- Comparação conceito × modelo final, com a sobreposição de contornos: `motores/35/recon/exemplo_conceito_x_modelo.jpg`
- Origem e licença de tudo: `motores/35/FONTES.md`

## Ferramentas e instalação
Tudo grátis. A peça é muda. Se você quiser narrar, use a API ou o site da ElevenLabs com a sua chave, depois de estimar o custo em caracteres.
- **Node 18+**, **Google Chrome** (ou Edge/Chromium) e **FFmpeg** no PATH: é o que o demo e o filme precisam. O render usa `puppeteer-core` com o Chrome que já está no PC (não baixa navegador); se ele estiver fora do lugar padrão, aponte a variável `CHROME_PATH`.
- **three.js r160:** já vem em `motores/35/vendor/three.module.js` (as páginas importam daí por importmap; sem CDN).
- **Python 3.10+** com Pillow e numpy (`pip install -r requirements.txt`): só para o estúdio de comparação (`estudio.py` e `medir.py`).
- **Gerador de imagem** para o conceito e as texturas do SEU herói: a peça usou o Z-Image Turbo no ComfyUI local (placa de ~12 GB). Serve qualquer gerador que entregue um turnaround de 3 vistas em 1536×1024 e texturas quadradas. Sem placa forte, gere num serviço online ou desenhe a folha: o resto do estilo roda em CPU.

**Neste setup:** gere conceito e texturas com a skill `codex-image` (`../CODEX_IMAGE.md`), sem ComfyUI e sem placa. Folha de turnaround: `--aspect 3:2`. Texturas: `--aspect 1:1`. Exemplo: `python3 ~/.agents/skills/codex-image/scripts/codex_image.py "<brief>" -o assets/conceito.png --aspect 3:2 --crop`. Salve em `assets/`, copie para `conceito/` (e a pasta de texturas) como a receita pede, e continue o pipeline em CPU.

## Motor
Em `motores/35/` (~5 MB, com as texturas reduzidas). Copie a pasta inteira para o seu projeto e trabalhe na cópia.
- `motores/35/DEMO.md`: o demo de um comando. Comece por ele.
- `motores/35/_heroi_helpers.js`: carga das texturas (`IMG`, `paint`), materiais PBR (`mat`, aço/bronze em 3 mapas casados), geometria paramétrica (`surfGeo`, `tube`, `horn`), IK de perna (`ik`) e IK 3D de braço com polo (`ik3`).
- `motores/35/_heroi_body.js`: o corpo da heroína. As medidas em metros tiradas da arte ficam no topo. Exporta `criaHeroi`.
- `motores/35/heroi.js`: a junção dos dois acima (não editar à mão; `npm run juntar` refaz).
- `motores/35/_cena_a.js`, `motores/35/_cena_b.js`, `motores/35/_cena_imp.js`, `motores/35/_cena_d.js`: o filme em 4 partes (cenário e luz, planos, `impactFrame2`, linha do tempo e pós). `motores/35/filme.js` é a junção nessa ordem (também pelo `npm run juntar`).
- `motores/35/filme.html`, `motores/35/estudio.html`, `motores/35/estudio.js`: páginas do filme (1080×1920) e do estúdio de comparação (3072×2048, 3 vistas).
- `motores/35/render.mjs`: servidor local + Chrome + FFmpeg. Faz o demo (`--demo`), folha de quadros (`--times`), vídeo (`--video`), um quadro cru de qualquer página (`--shot`) e depuração de um tempo (`--dbg`).
- `motores/35/estudio.py`: pede as 3 vistas ao `render.mjs` e monta conceito em cima, modelo embaixo, mais as faixas cabeça/tronco/pernas.
- `motores/35/medir.py`: sobrepõe os contornos (conceito vermelho, modelo azul) e imprime a largura por faixa de altura.
- `motores/35/package.json`, `motores/35/requirements.txt`, `motores/35/juntar.mjs`: dependências e atalhos (`npm run demo`, `juntar`, `folha`, `filme`).

Não vêm no pacote: as imagens em tamanho cheio (conceito em PNG e texturas 1536 px, ~50 MB), as rodadas intermediárias de comparação e o MP4 final. O código aceita textura de qualquer tamanho; as de 768 px deixam o aço e o granito um pouco mais lisos que na prévia.

## Passo a passo (ponta a ponta)
Todos os comandos rodam de dentro da sua cópia de `motores/35/`.

1. **Demo.** Prova que o ambiente está de pé antes de mexer em qualquer coisa:
   ```bash
   npm install
   npm run demo          # sai saida/demo.mp4: 3 s do golpe, 540×960, mudo
   ```
   Com placa de vídeo o demo sai em 11 s (medido com RTX 4070 Ti 12 GB). Sem placa (ou com ela ocupada), renderize por software: `DEMO_CPU=1 npm run demo` (PowerShell: `$env:DEMO_CPU=1; npm run demo`).
2. **Ideia e desenho do herói.** Uma situação de um gesto só (aqui: partir um matacão). Cabeça sempre coberta (capuz, elmo, chapéu) e roupa aberta onde o membro mexe. Sem texto na tela.
3. **Conceito no gerador de imagem (GPU).** Escreva 4 prompts de turnaround (frente, 3/4 e costas na mesma folha, pose A) seguindo `conceito/prompts.txt` e gere em 1536×1024 (no Z-Image Turbo, 12 passos). Monte uma folha com as 4, escolha 1 e salve como `conceito/escolhido.jpg`. Uma tarefa de GPU por vez: não gere imagem com outro render pesado rodando.
4. **Texturas pintadas.** Um prompt por material, 1536×1536, sempre "extreme macro close-up of a ... surface filling the entire image edge to edge, tileable, no ... silhouette" (modelos em `tex_novo/prompts.txt`). Salve em `tex_novo/` com os mesmos nomes (`rock`, `road`, `quilt`, `wool`, `bronze`, `drygrass`), em JPG. O fundo é uma pintura larga (2048×768) em `tex_novo/serra.jpg`.
5. **Medir a arte em pixels.** Abra a vista de frente com uma grade (qualquer editor de imagem), fixe a altura total (882 px = 1,80 m nesta peça) e anote largura e altura de cada peça em metros. Escreva as medidas no topo de `_heroi_body.js`. O exemplo está em `recon/exemplo_grade_de_medicao.jpg`.
6. **Montar o modelo** só com superfícies paramétricas e de revolução. A cada mudança:
   ```bash
   npm run juntar
   ```
7. **Estúdio de comparação (CPU), em rodadas:**
   ```bash
   pip install -r requirements.txt
   python estudio.py --out recon/e1 --q "yc=0.918&d=5.93&v=0.45,0.62,2.8"
   python medir.py recon/e1_full.jpg recon/e1_sil.jpg
   ```
   Olhe `recon/e1_full.jpg` e as faixas, corrija a maior diferença, repita (a peça levou 5 rodadas mais a final). O `--q` é o enquadramento: altura do alvo, distância da câmera e rotação das 3 vistas; ajuste até o modelo cair em cima da sua folha.
8. **Filme.** Escreva cenário, planos e linha do tempo nas 4 partes (`_cena_*.js`) e junte:
   ```bash
   npm run juntar
   node render.mjs --times 2,9,19.05 --out saida/folha.jpg      # folha de quadros para aprovar
   node render.mjs --video saida/_raw.mp4 --fps 30               # filme inteiro, 1080×1920
   ```
   Para testar um trecho: `node render.mjs --video saida/trecho.mp4 --ini 17 --fim 21 --fps 30`.
9. **Entrega:**
   ```bash
   ffmpeg -y -i saida/_raw.mp4 -an -c:v libx264 -crf 16 -preset slow -pix_fmt yuv420p -movflags +faststart NOME_1080.mp4
   ffmpeg -y -i NOME_1080.mp4 -vf scale=720:-2 -c:v libx264 -profile:v main -level 3.1 -crf 24 -pix_fmt yuv420p -movflags +faststart NOME_celular.mp4
   ffprobe -v error -show_entries stream=pix_fmt -of csv=p=0 NOME_1080.mp4     # tem que dar yuv420p
   ```
10. **Conferir** com a skill `checar-video` do pacote (preset genérico, sem transcrição: a peça é muda).

## Pegadinhas medidas
- **Fundo e tela limpa:** fundo chapado liso vira slide (dê profundidade, luz ou textura); nota de produção nunca vai dentro do quadro (nome de arquivo, versão, crédito de ferramenta); nada de rótulo "imagem gerada" por cima da arte.
- **Render na CPU (SwiftShader):** ~3,5 s por quadro em 1080×1920, ~55 min para 915 quadros (30,5 s a 30 qps). Não usa a placa de vídeo, mas é um trabalho pesado: um por vez no PC.
- **Z-Image Turbo:** 1536×1024 em 12 passos para conceito; texturas 1536×1536, 12 passos, ~18 s cada numa placa de 12 GB. Uso de GPU de ~4 min no total nesta peça.
- **Prompt de textura:** se nomear o objeto ("wool cloak"), ele pinta o objeto. Peça superfície em macro. Metal e couro ainda vêm com moldura e rebite: recorte o centro (crop de 16–30% na função `paint`).
- **Relevo (bump) quase não aparece** depois de baixado; em força cheia o aço vira "papel-alumínio amassado".
- **Ambiente refletido:** céu laranja como environment deixa pele e bronze "acesos" no filme, e no estúdio o bronze sai escuro (reflete cinza). Controle por plano com `metalEnv(kMetal, kFosco)` e `LOOK`.
- **Silhueta:** contorno a menos de ~5% do conceito na maior parte das faixas; mesmo assim o modelo vale ~55–60% da arte (elmo virou bola, acolchoado parece azulejo, mãos e botas de massinha).
- **Impact frame:** a máscara de silhueta é renderizada de uma câmera alta para pedra e pessoa lerem juntas. Uma primeira versão, em outra peça, reprovou na checagem com "Flashes 4/s": o 1º desenho do impacto não pode ser quase branco.
- **Cenário:** pedras grandes nas encostas, vistas de baixo, parecem soltas no ar; granito fica granulado quando chega perto da câmera; a marreta erguida some atrás do corpo no plano 6.
- **checar-video:** a peça passou com 2 avisos esperados ("sem áudio" e "5 quadros vazios" = fade do preto + clarão do impacto).
- **Pixels fixos:** o pós (blur do bloom, raios, vinheta, grão) está escrito em pixels para 1080×1920. Para sair menor, renderize em 1080 e reduza no FFmpeg (`--largura 540`), como o demo faz; não mude o tamanho do canvas.

## Custo e tempo
- Grátis: gerador de imagem local (~4 min de GPU) e o resto em CPU.
- Render final ~55 min na CPU. O grosso do tempo humano é a comparação em rodadas (5 nesta peça).
- Sem voz. Se narrar um vídeo de 30 s, conte ~450–500 caracteres de texto no seu plano da ElevenLabs e confirme o custo antes de gerar.

## O que funcionou e o que não funcionou
- **Personagem e situação próprios.** A primeira peça deste estilo tinha uma premissa parecida demais com a de uma obra publicada e foi trocada. Use herói, cenário e situação seus; a peça serve para ensinar o método, não para ser copiada.
- **Textura pintada por baixo do desenho em código funciona,** e vale refinar: como a geração é rápida, gere variações e escolha, em vez de aceitar a primeira.
- **Cabelo em código fica ruim.** Cobrir a cabeça por padrão (capuz, capacete, chapéu) é o caminho seguro, e a roupa fica aberta onde o membro mexe.
- **Impact frame de anime, não de quadrinho.** Estrela pontuda com raios lê como "explosão de história em quadrinhos", aguda demais. Funciona: silhueta chapada + pincelada na direção da força + respingo + 1 cor.
- **Luz de meio-dia deixa a cena crua.** A cena nova já nasce com sol baixo, névoa, câmera baixa, desfoque, grade de cor e grão; não é acabamento para depois.
- **Um gesto só.** A história curta e clara (subir, ver a pedra, partir a pedra, seguir) lê melhor que uma sequência de luta longa, e dispensa legenda.
- **Nossa nota:** modelo ~55–60% do conceito; como filme, 6,5 de 10. A luz e o tratamento seguram; o modelo ainda parece boneco de massinha de perto.

## Roteiro de aula
- **Objetivo:** o aluno sai sabendo transformar uma folha de conceito em um personagem 3D em código medindo a arte, e colocar esse personagem numa cena com luz de cinema.
- **Demonstração (~25 min):**
  1. A folha de 4 conceitos e por que a A ganhou (3 min).
  2. A grade de medição e as medidas no topo do corpo (4 min).
  3. Uma peça nascendo: o capuz como calota sobre eixo inclinado (5 min).
  4. Rodar o estúdio e o `motores/35/medir.py`, ler a sobreposição vermelha × azul, corrigir uma faixa ao vivo (6 min).
  5. A mesma heroína crua × com sol baixo, névoa, DOF e grão (4 min).
  6. O impact frame quadro a quadro (3 min).
- **Exercício:** gerar 1 turnaround de um personagem de cabeça coberta, medir 6 cotas (altura, cabeça, ombros, cintura, barra, pés) e montar só tronco + cabeça. Deu certo se a largura do modelo ficar a ≤10% do conceito em todas as faixas do `motores/35/medir.py`.
- **Pré-requisitos:** estilo 34 (cena 3D em código / floresta low-poly) para o básico de three.js e render determinístico; a aula de impact frame/juice para o golpe.

## Limites conhecidos
- O modelo é ~55–60% do conceito; falta receita para mãos, botas e elmo com quilha. Trocar de personagem é reescrever `_heroi_body.js` (trabalho de horas, em rodadas), não trocar um arquivo.
- O demo não gera imagem: usa o modelo e as texturas da peça de exemplo. O conceito e as texturas do seu herói dependem de um gerador de imagem (local com placa de ~12 GB, ou online).
- Não há script que monte a folha de conceitos nem a grade de medição: são feitas à mão num editor de imagem.
- O prompt da pintura de fundo (`tex_novo/serra.jpg`) não ficou anotado; `tex_novo/prompts.txt` tem só os 6 de superfície.
- As faixas do `estudio.py` (cabeça, tronco, pernas) e o `medir.py` assumem folha 1536×1024 com 3 vistas lado a lado e fundo liso claro.
- O pós está em pixels fixos para 1080×1920: outra proporção pede revisar `_cena_d.js`.
- As texturas do pacote estão em 768 px; para a qualidade da prévia, gere as suas em 1536 px.
