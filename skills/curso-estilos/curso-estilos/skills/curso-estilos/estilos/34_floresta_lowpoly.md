# 34 · Boneco 3D chapado em floresta low-poly

> Vitrine: "Corrida contra a chuva" (a mensageira Ivi, 31 s, muda) · Custo: R$ 0 (as texturas de casca e madeira já vêm no motor) · Ferramentas: three.js r160 (vendorizado), Node + puppeteer-core com o Chrome do sistema, FFmpeg

## O que é
Um boneco de formas simples, pintado em 2 tons com fio de luz e trama de tecido, corre por uma mata low-poly com luz de cinema: sol baixo lateral com sombra, névoa, desfoque por camada, bloom, vinheta e grão. O modelo é modesto; o que segura a imagem é a luz e o tratamento. A peça conta uma história em 8 planos em que o tempo vira: do dourado da tarde até a chuva, com a lanterna assumindo como luz principal. Estilo inspirado em contas de isekai/RPG em animação.

## Exemplo e arquivos
- Prévia do catálogo: `catalogo/previas/34_orig.mp4` (capa em `catalogo/previas/34_orig.jpg`)
- A peça inteira em código: `motores/34/` (31 s, 8 planos)
- Notas da peça, com a lista de planos e os tempos: `motores/34/NOTAS.md`
- Como rodar: `motores/34/DEMO.md`; origem e licença dos arquivos: `motores/34/FONTES.md`

## Ferramentas e instalação
Tudo grátis.
- **Node 18+** e `npm install` dentro da cópia de `motores/34/` (instala só o `puppeteer-core`, que usa o Chrome já instalado; nenhum navegador é baixado). Chrome fora do lugar padrão: variável `CHROME_PATH`.
- **FFmpeg** no PATH.
- **three.js r160**: já vem em `motores/34/vendor/three.module.js` (licença MIT), carregado por import map no `motores/34/index.html`. Nada de CDN.
- **Texturas pintadas**: `motores/34/tex/bark.jpg` e `motores/34/tex/wood.jpg` (1024 px). Para fazer as suas, qualquer gerador de imagem serve (nós usamos um modelo local, 1536², 12 passos, ~18 s cada); o prompt que funciona está em "Pegadinhas".
- Sem placa de vídeo: `DEMO_CPU=1` renderiza por software (mais lento, mesmo resultado).

## Motor (dentro do plugin)
Em `motores/34/` (1,8 MB com three.js e texturas):
- `motores/34/cena34.js`: a peça inteira. Terreno facetado por função de altura (vale, leito do riacho, clareira), troncos torneados (lathe) com casca pintada, copas em cartões de folha instanciados, capim, samambaia, pedras, ponte, cabana com janelas acesas e fumaça; céu de tempestade em shader; chuva instanciada, folhas caindo, gotas na lente; os 8 planos de câmera; 3 passes de profundidade com desfoque; bloom, grade petróleo/âmbar, vinheta, retícula e grão em 2D. Expõe `window.seek`, `window.END`, `window.READY`.
- `motores/34/mensageira3d.js`: o boneco (`criaIvi`). Cilindros afunilados, caixas e esferas com um único shader de 2 tons + fio de luz para o lado do sol + trama de tecido presa no objeto + brilho de capa encerada + poça de luz da lanterna. Aba da capa que voa na corrida, cachecol em corrente de 4 elos, lanterna em pêndulo, caminhada por IK.
- `motores/34/render.mjs`: render determinístico, quadro a quadro (folha de quadros ou vídeo, yuv420p, mudo).
- `motores/34/index.html`, `motores/34/package.json`, `motores/34/NOTAS.md`, `motores/34/DEMO.md`, `motores/34/FONTES.md`.

## Passo a passo (ponta a ponta)
1. **Rodar o demo.** Copie `motores/34/` para a pasta do seu projeto e, dentro dela:
   ```
   npm install
   npm run demo
   ```
   Sai `saida/demo.mp4` (3 s do plano lateral contra o sol, 540×960, mudo). Se isso funcionou, o resto funciona.
2. **História em 6–8 planos com destino de câmera** e um arco de luz (aqui: sol → tempestade → lanterna). Modelo: a lista de planos do `motores/34/NOTAS.md`. Escreva o roteiro e aprove uma prancha dos quadros-chave antes de animar tudo.
3. **Personagem com a cabeça coberta** (capuz, capacete, chapéu) e roupa aberta onde o membro mexe. Paleta de 2 tons por peça; sombra saturada, nunca cinza. Edite `motores/34/mensageira3d.js`.
4. **Um plano primeiro**, no look final: sol baixo de lado (sombra 4096), névoa tingida pela luz, câmera baixa de lente longa (aqui fov 36), silhueta desfocada na frente. Folha rápida:
   ```
   node render.mjs --tempos 1,6,13 --saida saida/folha.jpg --lt 360
   ```
5. **Cenário com passe de detalhe**: copa em cartões de folha (não esfera), terreno facetado, objetos pequenos. Casca e chão com textura pintada em repetição espelhada para esconder a emenda.
6. **Os outros planos**: cortes dentro do `draw(t)` do `motores/34/cena34.js`; o desfoque de cada camada sai da distância entre a câmera e o personagem.
7. **Clima**: chuva instanciada, cortinas de chuva ao longe, luz fechando ao longo do tempo.
8. **Render do filme** (1080×1920, 30 qps):
   ```
   node render.mjs --video saida/filme.mp4 --qps 30
   ```
9. **Versão de celular**:
   ```
   ffmpeg -i saida/filme.mp4 -c:v libx264 -profile:v main -level 3.1 -pix_fmt yuv420p -vf scale=720:-2 -crf 24 -movflags +faststart saida/filme_celular.mp4
   ```
10. **Checagem objetiva** do arquivo final (formato yuv420p, quadro parado, flash, texto cortado). A peça original passou com 0 falha e 1 aviso (sem faixa de áudio).

## Pegadinhas medidas
- **Fundo e tela limpa:** fundo chapado liso vira slide (dê profundidade, luz ou textura); nota de produção nunca vai dentro do quadro (nome de arquivo, versão, crédito de ferramenta); nada de rótulo "imagem gerada" por cima da arte.
- **O que faz a floresta funcionar não é o modelo, é a luz e o tratamento.** Cenário novo já nasce com o passe cinematográfico; luz de meio-dia, céu azul e câmera na altura do olho deixam tudo cru.
- **Empilhar multiplicação + vinheta + degradês escurece demais**: o primeiro passe do tratamento ficou escuro. Confira o total, não cada camada.
- **Paralaxe 2D não chega lá**: a primeira versão em camadas 2D perdia feio para a referência. Passar para three.js de verdade (troncos torneados, sol com shadow map, névoa, passes de profundidade borrados em 2D) resolveu profundidade e luz.
- **O que levou o boneco de ~70% para "pronto"**: trama e dobras de tecido no shader, tronco arredondado com barra de túnica que acompanha as coxas, bloom, e vento como fios finos curvos em vez de tracinhos.
- **Cabelo em código fica ruim** (duas rodadas perdidas: testa careca, depois franja de cacos). Capuz desde o desenho.
- **Relevo por textura quase não aparece**; com força total o aço vira "papel alumínio amassado". A textura pintada, sim, muda capa, casca e chão. O tempo de render não muda.
- **Prompt de textura**: nomear o objeto ("redwood tree bark") faz o gerador pintar o objeto inteiro. Peça "extreme macro close-up of a <material> surface filling the entire image edge to edge, tileable, uniform pattern, no <object> silhouette". Metal e couro vêm com moldura: corte o centro (16–30%).
- **Personagem secundário precisa de boneco próprio**: o rig do protagonista recolorido lê como boneco quebrado.
- **Leia a luz e o tamanho do boneco no quadro da referência antes de construir**: um estudo saiu de noite laranja quando a referência era dia verde.
- **Aviso de método**: medindo quadro a quadro, o boneco das contas de referência é recorte 2D articulado, não modelo 3D. Este estilo (boneco 3D chapado) é um caminho próprio; para história com muito plano e ação rápida, o estilo 03 (boneco vetor) rende mais.
- Fraquezas declaradas da peça: capuz liso de costas vira bola, rosto de bebê, cabana chapada nos planos 6–8, ponte escura.

## Custo e tempo
- R$ 0. Se for gerar texturas novas num modelo local, ele ocupa a placa de vídeo enquanto gera: uma tarefa de GPU por vez.
- Render: WebGL no Chrome, leve. 31 s a 30 qps = 930 quadros; numa cena da mesma família, ~36 s de render para 9,8 s de vídeo a 60 qps (com placa de vídeo). Por software (`DEMO_CPU=1`) medimos ~5,5 s por quadro.
- Produção: o motor levou 5 versões em 2 dias; a peça original saiu numa sessão em cima do motor pronto.

## O que funcionou e o que não funcionou
- Funcionou: tratar a cena como fotografia (sol baixo, névoa, desfoque de primeiro plano, bloom, grade). Foi isso que virou o jogo, não mais polígonos.
- Funcionou: textura pintada por baixo do desenho em código, em casca, chão e madeira.
- Funcionou: boneco de cabeça coberta, 2 tons, trama de tecido e fio de luz.
- Não funcionou: paralaxe 2D para este look; modelo 3D sem textura ("3D feio, sem textura"); recolorir o protagonista para fazer o coadjuvante; cabelo em código.
- Não funcionou: copiar o personagem da referência. A referência serve para refinar o estilo; personagem e história são seus.
- Nossa nota para a peça da vitrine: 7 de 10 contra o melhor estudo do motor. Ganha em história (começo, meio e fim, arco de luz); perde no boneco (cabeça-bola, braços cilíndricos, capuz liso de costas) e na cabana, que fica chapada nos planos finais.

## Roteiro de aula
- **Objetivo**: o aluno sai sabendo transformar uma cena three.js "crua" em cinematográfica (sol baixo, névoa, desfoque por camada, bloom, grade) e vestir um boneco de formas com shader de 2 tons e trama.
- **Demonstração (~30 min)**: (1) a evolução paralaxe 2D → 3D → versão final, lado a lado com a referência, 4 min; (2) a mesma cena com luz de meio-dia e depois ligando um item por vez: sol baixo, névoa, desfoque de frente, bloom, grade, grão, 10 min; (3) o shader do boneco: 2 tons, fio de luz, trama, 6 min; (4) copa em cartões de folha × esfera, 4 min; (5) um corte de câmera com destino e o arco de luz da peça, 4 min; (6) render e checagem, 2 min.
- **Exercício**: partir de `motores/34/` e fazer 8 s próprios: outro personagem de cabeça coberta (trocar paleta e 2 peças), 2 planos, uma mudança de luz. Deu certo se: nenhum quadro com luz de meio-dia, o personagem lê em 3/4 com volume, há silhueta desfocada na frente em pelo menos 1 plano e a checagem passa.
- **Pré-requisitos**: nenhum. Serve de base para o 02 (DIA 1) e o 35 (herói PBR).

## Limites conhecidos
- Peça muda e sem legenda: este estilo não traz receita de som nem de texto.
- O boneco é o ponto fraco declarado (rosto, mãos, capuz de costas).
- O chão usa textura desenhada em código; só casca e madeira são pintadas.
- O tempo de render do filme inteiro com placa de vídeo não foi cronometrado nesta peça; o número acima é de uma cena parecida.
- O demo por software é lento (minutos para 3 s). Com placa de vídeo é questão de segundos.
