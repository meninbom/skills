# 01 · Toon 3D em primeira pessoa

> Vitrine: "O elevador que para no 13º andar" · Custo: R$ 0 (100% código, muda) · Ferramentas: three.js r160 (vendorizado), Node + puppeteer-core com o Chrome do sistema, FFmpeg; Python (numpy, scikit-image) só para poses novas de mão

## O que é
Terror em POV: a câmera é o olho do personagem, as mãos dele entram no quadro, e o mundo é um desenho 3D de 2 tons com contorno preto de espessura constante e lente olho de peixe. A legenda entra palavra a palavra em Rubik 800, com pílula "EPISÓDIO N" no topo. Funciona porque o espectador "é" quem está no elevador: a tremida de mão, o viradão com desfoque e o corte para o preto fazem o susto, e a peça termina numa escolha para os comentários. Estilo inspirado em contas de terror em POV.

## Exemplo e arquivos
- Prévia do catálogo: `catalogo/previas/01_orig.mp4` (capa em `catalogo/previas/01_orig.jpg`)
- A peça inteira em código (15 s, 30 qps): `motores/01/`
- Notas da peça, com o roteiro batida a batida: `motores/01/NOTAS.md`
- Como rodar: `motores/01/DEMO.md`; origem e licença dos arquivos: `motores/01/FONTES.md`
- Ferramentas para medir uma referência (câmera, tremida, legenda, lado a lado): `motores/01/medir/`

## Ferramentas e instalação
Tudo grátis. Nada pago neste estilo (a peça é muda; se quiser voz, é a API ou o site da ElevenLabs com a sua chave).
- **Node 18+** e `npm install` dentro da cópia de `motores/01/` (instala só o `puppeteer-core`, que usa o Chrome já instalado; nenhum navegador é baixado). Chrome fora do lugar padrão: variável `CHROME_PATH`.
- **FFmpeg** no PATH (o `motores/01/render.mjs` manda os quadros por pipe).
- **three.js r160**: já vem em `motores/01/vendor/three.module.js` (MIT), por import map no `motores/01/index.html`.
- **Fonte**: `motores/01/fontes/Rubikwght800.woff2` (licença OFL).
- **Python 3.10+** (opcional): `pip install -r requirements.txt` para o `motores/01/maos_sdf.py` e para as ferramentas de `motores/01/medir/`.
- Pegadinha: com placa de vídeo, o Chrome sem janela precisa do WebGL acelerado (o `render.mjs` já pede); se ele cair em software, fica dezenas de vezes mais lento. Para forçar o software de propósito (máquina sem placa), `DEMO_CPU=1`.

## Motor (dentro do plugin)
Em `motores/01/` (4,2 MB com three.js e as mãos):
- `motores/01/cena.js`: o pipeline por quadro. Renderiza a cena num cubemap de cor (toon próprio) e num cubemap de normal + distância; o passe final monta o olho de peixe (`uTan` = tan 46°, `uK` = 0,7), detecta o contorno em pixels de saída e desenha por cima o texto 2D (pílula, título, legenda). Expõe `window.seek(t)`, `window.END`, `window.velAng(t)`, `window.READY`. Qualidade por parâmetro: `?ss=1&cube=1024` (rápida) ou o padrão `ss=1.5`, `cube=2048` (final).
- `motores/01/elevador.js`: o cenário (cabine de inox, display e painel em canvas que mudam com o tempo, corredor em 22 segmentos com luz própria, silhueta, mão na porta).
- `motores/01/camera.js`: chaves `(t, x, y, z, yaw°, pitch°)` em Catmull-Rom + a tremida medida (`motores/01/tremida_ref.json`).
- `motores/01/texturas.js`: texturas pintadas em canvas (carpete, papel de parede, porta numerada, piso xadrez).
- `motores/01/maos3.js` + `motores/01/maos.json` + `motores/01/maos_sdf.py`: mãos de desenho por SDF (palma + dedos em cápsulas com união suave → marching cubes → `maos.json`). O JSON traz as poses "aponta" e "agarra"; o script tem também "borda", "celular" e "parede".
- `motores/01/render.mjs`: render determinístico (folha de quadros ou vídeo), com desfoque de movimento nos viradões.
- `motores/01/medir/`: `lado.py` (folha com a referência em cima e o seu vídeo embaixo), `ocr_leg.py` (tempos da legenda por OCR), `rastrear_cam.py` + `euler.py` + `tremida.py` (medem a tremida de mão de uma referência).
- `motores/01/index.html`, `motores/01/package.json`, `motores/01/requirements.txt`, `motores/01/NOTAS.md`, `motores/01/DEMO.md`, `motores/01/FONTES.md`.

## Passo a passo (ponta a ponta)
1. **Rodar o demo.** Copie `motores/01/` para a pasta do seu projeto e, dentro dela:
   ```
   npm install
   npm run demo
   ```
   Sai `saida/demo.mp4` (3 s da porta abrindo no 13º andar, 540×960, mudo).
2. **Roteiro em 6 linhas com tempo.** Uma situação comum que quebra (elevador, escorregador, corredor), 1 frase por batida, susto no fim, cartela de escolha. Modelo: o bloco "Roteiro" do `motores/01/NOTAS.md`. Feche o texto antes de qualquer render.
3. **Cenário**: reescreva o `motores/01/elevador.js` (função `montar(scene, K)`). Tudo é função de `t`; nada de `Math.random()` solto nem relógio real.
4. **Câmera**: edite a tabela `K` do `motores/01/camera.js` e o `END`. Altura do olho 1,60–1,62 m. Viradão = duas chaves a 0,3 s uma da outra.
5. **Mãos**: se precisar de pose nova, acrescente em `POSES` do `motores/01/maos_sdf.py`, inclua o nome na lista do fim do arquivo e rode:
   ```
   python maos_sdf.py
   ```
6. **Legenda e título**: no fim do `motores/01/cena.js` (bloco 2D). Uma frase por batida, palavra a palavra.
7. **Folha de quadros rápida** (qualidade baixa, segundos):
   ```
   node render.mjs --pagina "index.html?ss=1&cube=1024" --tempos 0.5,5,9,12,13.5 --saida saida/folha.jpg
   ```
8. **Render final** (supersampling 1,5 e cubo 2048 são o padrão do `motores/01/cena.js`):
   ```
   node render.mjs --video saida/filme.mp4 --qps 30
   ```
9. **Versão de celular** e conferência do formato:
   ```
   ffmpeg -i saida/filme.mp4 -c:v libx264 -profile:v main -level 3.1 -pix_fmt yuv420p -vf scale=720:-2 -crf 24 -movflags +faststart saida/filme_celular.mp4
   ffprobe -v error -show_entries stream=pix_fmt -of csv=p=0 saida/filme.mp4
   ```
10. **Checagem objetiva** no arquivo final e correção do que reprovar. Se estiver estudando uma referência, monte o lado a lado: `python medir/lado.py 0.5,2.5,6 REFERENCIA.mp4 saida/filme.mp4 lado.jpg`.

## Pegadinhas medidas
- **Fundo e tela limpa:** fundo chapado liso vira slide (dê profundidade, luz ou textura); nota de produção nunca vai dentro do quadro (nome de arquivo, versão, crédito de ferramenta); nada de rótulo "imagem gerada" por cima da arte.
- **Contorno em pixel de saída, não no cubemap**: laplaciano da distância inversa + salto de profundidade + ângulo da normal + id do objeto. É o que deixa a linha com a mesma largura perto e longe (`uLine` = 1,25 × supersampling).
- **Sombra roxa, nunca cinza**: `base × (0,66; 0,56; 0,74)`. Em cena de dia, a força que funcionou foi 0,72 com o sol baixo (y 0,24).
- **Sombras projetadas analíticas** (raio contra esferas e segmentos), sem shadow map.
- **Tremida de mão medida de vídeo real** (LK + Kabsch nos raios do olho de peixe, só a alta frequência). Ruído senoidal fica "mecânico". O rastreador se perde nos viradões: só a tremida vem da medição, o caminho da câmera é escrito à mão.
- **Desfoque nos viradões**: acima de 90°/s o `motores/01/render.mjs` faz a média de 6 a 28 subquadros (obturador de 180°).
- **Mãos**: caixa + cápsulas viram "luva de esqueleto"; só a malha SDF gorda, de dedos fundidos, funcionou. Polegar mal posicionado desenha um "coração".
- **Piscadas de luz**: 6 por segundo reprova em checagem de flash (limite 3/s). Troque por quedas de luz espaçadas.
- **Render**: ~0,4 s por quadro em qualidade final com placa de vídeo (≈ 3 min para 15 s; ≈ 12 min para 60 s). Por software, na qualidade rápida, ~1,2 s por quadro.
- **`maos.json` pesa**: 2,8 MB com 2 poses, já com as casas decimais cortadas. Cada pose nova soma ~1,4 MB.
- Falsos alarmes conhecidos em checagem automática: plaquinhas e cartazes do cenário ("texto na borda/pequeno"), mergulho escuro e flash final de propósito ("quadro vazio").

## Custo e tempo
- R$ 0. Sem IA de imagem, sem voz.
- Placa de vídeo: só o WebGL do Chrome (leve). Não rode junto com geração local pesada: uma tarefa de GPU por vez.
- Tempo de produção: reaproveitando o motor, a peça de 15 s saiu numa sessão. O motor em si levou 3 versões até mãos e câmera convencerem.

## O que funcionou e o que não funcionou
- Funcionou: medir a referência em vez de estimar (tempos de legenda por OCR, tremida por rastreio, folha lado a lado). A cada rodada a nota subia nos itens medidos.
- Funcionou: contorno calculado na imagem final e mãos em malha SDF.
- Não funcionou: tremida por senoide, mãos de caixas e cápsulas, câmera rastreada automaticamente nos viradões, piscada de luz rápida.
- Não funcionou: reaproveitar a história da referência. O estudo serve para aprender o ofício; a peça que vai ao ar tem história própria.
- Luz de meio-dia deixa a cena crua; aqui a luz de teto que apaga de longe para perto faz o papel do sol baixo.
- Nossa nota para a peça da vitrine: ~7,5 de 10 contra a referência. Perde em luz (mais chapada), em variação de plano e na duração (15 s é o mínimo para o formato).

## Roteiro de aula
- **Objetivo**: o aluno sai sabendo montar um plano POV em three.js com contorno de espessura constante, olho de peixe e legenda, e renderizar quadro a quadro para MP4.
- **Demonstração (~25 min)**: (1) a peça final e uma referência do gênero lado a lado, 2 min; (2) o truque do cubemap duplo e do contorno em pixel de saída, ligando e desligando cada termo, 8 min; (3) a tabela de chaves da câmera e a tremida medida, 5 min; (4) mãos por SDF, 4 min; (5) `motores/01/render.mjs`: folha → vídeo → versão de celular → checagem, 6 min.
- **Exercício**: trocar o cenário por um corredor próprio de 8 s com 3 chaves de câmera, 2 legendas e um viradão. Deu certo se: contorno com a mesma largura no perto e no longe, a checagem passa, arquivo em yuv420p.
- **Pré-requisitos**: nenhum estilo anterior; ajuda ter visto a aula de checagem objetiva de vídeo.

## Limites conhecidos
- A peça é muda: este estilo não traz receita de som nem de voz (as referências do gênero têm voz, ambiente e trilha).
- Só um cenário (o elevador) vem pronto; qualquer outro é reescrever o `motores/01/elevador.js`.
- A luz ainda é o ponto fraco declarado.
- `motores/01/tremida_ref.json` é uma curva medida de um vídeo específico; para outro tipo de movimento (correndo, parado), meça de novo com `motores/01/medir/`.
- As ferramentas de `motores/01/medir/` foram adaptadas para receber o vídeo por argumento e não fazem parte do demo testado.
