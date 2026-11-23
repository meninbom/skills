# 73 · Globo explicativo em código

> Vitrine: "E se a Terra parasse de girar?" (34 s, muda) · Custo: R$ 0 · Ferramentas: WebGL (shader num HTML único), Natural Earth, NASA Blue Marble, Node + Chrome do sistema (puppeteer-core), Python (só para refazer os mapas), FFmpeg

## O que é
Um explicativo em que o herói é um globo desenhado por shader, com geografia real: continentes do Natural Earth, biomas chapados, nuvens, terminador dia/noite e cidades que acendem pela população real. Os eventos (parada, vento, mar escorrendo) entram junto com a legenda, e dois relógios correm no topo: o tempo real do vídeo e o tempo da história.
Funciona porque o dado é de verdade (o mar migra por uma conta de conservação de volume) e a tela mostra a consequência em vez de só narrar. Estilo inspirado nos explicativos de planeta do Kurzgesagt.

## Exemplo e arquivos
- Prévia do catálogo: `catalogo/previas/73_orig.mp4` (capa em `catalogo/previas/73_orig.jpg`).
- Motor completo da peça: `motores/73/` (o `globo.html` é a peça inteira de 34 s; `npm run video` refaz ela).
- Demo de 3 s: `motores/73/DEMO.md`.
- Origem e licença dos dados e das fontes: `motores/73/FONTES.md`.

## Ferramentas e instalação
Tudo grátis.
- **Node 18+** e `npm install` dentro da cópia do motor (instala só o `puppeteer-core`, que usa o Chrome já instalado; não baixa navegador). Outro navegador: variável `CHROME_PATH`.
- **Google Chrome**, Edge ou Chromium instalado.
- **FFmpeg** no PATH (o render manda os quadros por pipe). Outro caminho: variável `FFMPEG_PATH`.
- **Python 3.10+** com `pip install -r requirements.txt` (numpy, scipy, pillow): só para refazer os mapas com `gen_mapas.py`. O demo e o render não precisam de Python, porque o `mapas.js` já vem gerado.
- **Dados** (domínio público, já em `motores/73/dados/`): Natural Earth em GeoJSON (terra 50m, lagos 110m, cidades com população) e o Blue Marble topo-batimetria da NASA reduzido para 2048×1024 (usado como aproximação de profundidade do mar).
- **Fontes** (OFL, em `motores/73/fonts/`): Bricolage Grotesque e JetBrains Mono.
- Não precisa de GPU: roda por software (SwiftShader) com `DEMO_CPU=1`.

## Motor
Em `motores/73/` (~6 MB, a maior parte é o `mapas.js` e os dados):
- `motores/73/globo.html`: o motor inteiro. Globo em WebGL, objeto `T` com os tempos dos eventos, lista `KEYS` da câmera (t, lon, lat, raio, centro y), relógios, legendas, pinos presos a lon/lat. Cada quadro é função pura de t: expõe `seek`, `renderFrame`, `still`, `END` e `READY`.
- `motores/73/gen_mapas.py`: gera os mapas equirretangulares 4096×2048 (albedo com biomas na paleta da peça, auxiliar com nuvens/cidades/máscara, geo com profundidade e altitude), o `mapas.js` em data URI e a constante de conservação de volume (`agua.js`).
- `motores/73/agua.js`: a tabela da constante, por etapa do escoamento.
- `motores/73/render.mjs`: `stills` (quadros soltos) e `video` (pipe para o FFmpeg, 2 subquadros por quadro para o motion blur, saída yuv420p muda). Aceita `--de`, `--dur`, `--fps` e `--largura`.
- `motores/73/lib/chrome.mjs`: acha o Chrome do sistema e abre o encoder.
- `motores/73/sheet.py`: folha de conferência com vários stills lado a lado (precisa de pillow).
- `motores/73/dados/`, `motores/73/fonts/`, `motores/73/licencas/`, `motores/73/FONTES.md`.

## Passo a passo (ponta a ponta)
Copie `motores/73/` para a pasta do seu projeto e trabalhe na cópia.

1. **Demo primeiro** (prova que o ambiente está de pé):
   ```
   npm install
   npm run demo            # saida/demo.mp4, 3 s, 540x960, mudo
   ```
2. **Pergunta e fatos**: uma pergunta "e se" em escala de planeta. Cada número com fonte anotada num arquivo de notas do seu projeto. Separe o que é dado do que é aproximação ou licença narrativa. Feche o roteiro antes de mexer no código.
3. **Linha do tempo**: uma linha por evento (tempo, legenda, o que acontece no globo). Cada evento entra junto com a sua legenda. Defina os dois relógios (quanto de história cabe no vídeo).
4. **Mapas** (~25 s; só se for trocar paleta, biomas ou dados):
   ```
   pip install -r requirements.txt
   python gen_mapas.py
   ```
5. **Editar o motor**: no `globo.html`, os tempos em `T`, as chaves de câmera em `KEYS`, as legendas e os pinos. Paleta e biomas ficam no `gen_mapas.py`.
6. **Stills** dos beats (~0,4 s cada) e folha, até fechar a composição:
   ```
   node render.mjs stills 1.0,5.3,12.0,22.0,30.0
   python sheet.py folha_teste.jpg stills/s_01.00.jpg stills/s_05.30.jpg
   ```
7. **Render**:
   ```
   node render.mjs video saida/video_mudo.mp4
   ```
8. **Entrega** (1080 e versão leve para celular):
   ```
   ffmpeg -i saida/video_mudo.mp4 -c:v libx264 -crf 18 -pix_fmt yuv420p -an -movflags +faststart saida/final_1080.mp4
   ffmpeg -i saida/final_1080.mp4 -vf scale=720:1280 -c:v libx264 -crf 21 -pix_fmt yuv420p -an -movflags +faststart saida/final_celular.mp4
   ```
9. **Com voz** (opcional): grave ou gere a voz em 1 take, meça os tempos por palavra, prenda cada evento do objeto `T` à palavra que o anuncia e só então renderize. Voz paga (ElevenLabs etc.) usa a sua chave e custa por caractere: confira o preço antes. Na mixagem, a música fica bem abaixo da voz (high-pass ~140 Hz na música, +2 dB em 3 kHz na voz ajudam no alto-falante do celular).
10. `/checar-video` no 1080.

## Pegadinhas medidas
- **Fundo e tela limpa:** fundo chapado liso vira slide (dê profundidade, luz ou textura); nota de produção nunca vai dentro do quadro (nome de arquivo, versão, crédito de ferramenta); nada de rótulo "imagem gerada" por cima da arte.
- Imagem carregada por `file://` contamina o canvas WebGL: os mapas entram como data URI dentro do `mapas.js`. Por isso ele tem 3,8 MB e é gerado.
- Render: 947 s para 1.020 quadros × 2 subquadros em CPU (~0,93 s por quadro em 1080×1920). O demo de 90 quadros leva ~68 s por software e 14 s com placa de vídeo (medido com RTX 4070 Ti 12 GB).
- Still solto: ~0,4 s. Dá para iterar a composição sem renderizar vídeo.
- O `render.mjs` já converte de faixa cheia para yuv420p de TV (`in_range=full:out_range=tv`). JPEG por pipe sem isso sai `yuvj420p`, que alguns celulares não abrem.
- Legendas secundárias a 42 px e rótulos a 28–32 px geram aviso de texto pequeno no checador (pede ≥52 px). Em vertical, suba os tamanhos.
- Maior tempo parado da peça: 0,07 s. Uma deriva senoidal na câmera garante que nada congele.
- Modelo da água: `h(lat) = 21,385·(1/3 − sen²lat)` km, com uma constante resolvida por bisseção para conservar o volume. Calibração: 72,6% de água hoje no modelo (real ~71%).
- A batimetria é aproximada pela cor do Blue Marble, calibrada em 4 pontos; a altitude da terra vem de polígonos desenhados à mão. A costa nova é ilustrativa, e o fundo exposto mostra bandas de calibração.
- Impacto da parada: anel chapado de 1 cor + tranco de câmera. Nada de estrela pontuda.
- Pino preso a lon/lat real pela função `toScreen(lon, lat)`: o rótulo acompanha o giro.
- Os mapas têm 4096×2048: se a sua placa (ou o SwiftShader) recusar textura desse tamanho, baixe `W, H` no topo do `gen_mapas.py` e gere de novo.

## Custo e tempo
- R$ 0. Dados em domínio público, fontes livres, render em CPU.
- Máquina: ~16 min de render para 34 s em 1080×1920. Uma peça nova do estudo ao MP4 levou perto de 1 hora (4 rodadas de stills + 2 renders), fora o roteiro.
- Não precisa de GPU. Se for usar, uma tarefa de GPU por vez.
- Voz, se houver: um roteiro de 30 s tem ~450–550 caracteres; em serviço pago, calcule ~1 crédito por caractere.

## O que funcionou e o que não funcionou
- **Comparar com a referência lado a lado.** A primeira versão foi feita "de cabeça" e saiu muito abaixo do vídeo que inspirou o estilo. Baixar a referência, montar uma folha beat a beat e corrigir em até 3 rodadas foi o que levou a peça a um nível aceitável. A nota é sempre contra a referência, não contra a versão anterior.
- **Código puro tem teto.** Nossa nota: 7 de 10 nesta peça (7,5 numa réplica com voz no mesmo motor). Perde para a referência por não ter personagem nem piada visual. Em outro explicativo, só passamos de 8 quando entrou ilustração pintada por cima do código. Não prometa "explicativo de estúdio completo" só com shader.
- **Dado de verdade na tela.** O que segura o vídeo é a tela saber mais que a narração: a água migra por uma conta real e os relógios mostram a escala de tempo.
- **Impacto de anime, não de quadrinho.** Anel chapado de uma cor + tranco de câmera funciona; estrela pontuda com raios lê como gibi e fica aguda.
- **Sem palavra pintada de cor.** O destaque vem do tamanho e do tempo de entrada; palavra colorida no meio da legenda barateia.
- **Paleta própria.** Ao estudar uma referência, copie o formato (ritmo, planos, relógios); luz e paleta são suas.

## Roteiro de aula
- **Objetivo**: o aluno sai sabendo gerar um mapa estilizado da Terra a partir de dados abertos, dirigir um globo em shader por uma linha do tempo e prender cada evento à legenda.
- **Demonstração** (~30 min):
  1. A peça, com pausa em cada evento: legenda e mudança no globo entram juntas (4 min).
  2. `motores/73/gen_mapas.py`: de GeoJSON a mapa com biomas em 25 s; trocar a paleta ao vivo (7 min).
  3. `motores/73/globo.html`: `T`, `KEYS`, um pino num lon/lat; tirar stills (8 min).
  4. Os dois relógios e por que eles vendem a escala de tempo (3 min).
  5. O dado de verdade: a conta da água em 5 linhas e o que é aproximação (5 min).
  6. Render por pipe e a pegadinha do yuvj420p (3 min).
- **Exercício**: globo de 12–15 s respondendo outra pergunta com 3 eventos (por exemplo "e se todo o gelo derretesse?"), com 1 pino numa cidade real e os dois relógios. Deu certo se: cada evento entra em até 0,1 s da legenda, cada número tem fonte anotada, nada fica parado no `/checar-video` e o MP4 está em yuv420p.
- **Pré-requisitos**: noção de shader/WebGL. A aula 11 (mapa de satélite) usa os mesmos dados. Aula 29 (checagem objetiva).

## Limites conhecidos
- A peça de vitrine é muda. O motor não traz voz, trilha nem mixagem: o passo 9 descreve o método, mas o script é por sua conta.
- Sem personagem nem ilustração: o teto do código puro neste estilo é perto de 7,5 de 10.
- Batimetria e altitude reais (ETOPO) não entram: a costa nova depois do escoamento é aproximada.
- `globo.html` é um arquivo só, específico da pergunta (24 KB): tema novo reaproveita o globo, a câmera e os mapas, mas os eventos são reescritos à mão.
- Os dados do Natural Earth vêm com coordenadas arredondadas a 3 casas (~100 m) para caber no pacote; para zoom muito fechado, baixe os originais (ver `motores/73/FONTES.md`).
- O `mapas.js` gerado aqui usa o Blue Marble reduzido; a diferença para o de 8k é invisível no globo, mas existe.
