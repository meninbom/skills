# 71 · Boneco de blocos no Blockbench pelo MCP

> Vitrine: "A encomenda do cânion" · Custo: grátis · Ferramentas: Blockbench 5.x, plugin MCP do Blockbench, three.js r186, Node + puppeteer-core (render com o Chrome do sistema), FFmpeg, Python + Pillow (textura)

## O que é
O Claude modela, pinta e anima um boneco de cubos dentro do Blockbench, conversando com o programa pelo MCP, e exporta um GLB. O GLB entra numa cena three.js em código, que vira vídeo. O espectador vê um personagem de blocos com textura pintada à mão (rosto, zíper, cadarço) e um rig com mecânica de verdade. Funciona porque o Blockbench resolve o que código puro faz mal (textura por face e animação por osso) e a cena em código resolve luz e câmera.

## Exemplo e arquivos
- Prévia do catálogo: `catalogo/previas/71_orig.mp4`
- Notas da peça: `motores/71/NOTAS.md`
- Projeto e modelo: `motores/71/modelo/mensageira.bbmodel` (16 ossos, 25 cubos, 5 animações) e `motores/71/cena/mensageira.glb` (94 KB)
- Textura: `motores/71/modelo/mensageira_tex.png` (128×128) e a ampliada `motores/71/modelo/tex_x4.png`
- Cena: `motores/71/cena/cena.js`
- Demo: `motores/71/DEMO.md` · licenças: `motores/71/FONTES.md`

## Ferramentas e instalação
Tudo grátis. **Para o demo e para a cena** basta Node 18+, Chrome e FFmpeg (o three.js r186 já vem em `vendor/`). **Para modelar**, mais:
- **Blockbench 5.x** (blockbench.net ou o GitHub oficial, JannisX11/blockbench). No Windows existe a versão portátil (.exe); atenção ao baixar da página de releases: o zip "x64" é o de Mac.
- **Plugin MCP do Blockbench** (github.com/jasonjgardner/blockbench-mcp-plugin, GPL-3.0; testado com a v1.10.1): baixe o `mcp.js` da release.
  - Carregar pelo ARQUIVO: File → Plugins → Load Plugin from File. Evite "from URL" (puxa versão nova sem você revisar).
  - Com o Blockbench aberto, o servidor fica em http://localhost:3000/bb-mcp, só na sua máquina.
  - Conectar o Claude Code:
    ```bash
    claude mcp add blockbench --transport http http://localhost:3000/bb-mcp
    ```
- **Python + Pillow** para a textura (`pip install -r modelo/requirements.txt`).
- **Blender** só se precisar de cabelo esculpido (ver pegadinhas).
- Quem abre o Blockbench é você: o MCP só existe com a janela do programa aberta.

## Motor
Em `motores/71/`:
- `modelo/textura.py` — pinta o atlas 128×128 retângulo a retângulo, grava a versão de 64 cores, o `tiles.json` (UV de cada face) e o base64.
- `modelo/tiles.json` e `modelo/tex_b64.txt` — saída da textura (o base64 tem 872 caracteres).
- `modelo/modelo_spec.py` — a ficha do boneco (ossos com pivô e rotação; cubos com de/até e face → pedaço do atlas) que gera o script do Blockbench.
- `modelo/build_model.js` — o script gerado: roda inteiro num `risky_eval` e monta textura, grupos e cubos.
- `modelo/mensageira.bbmodel`, `modelo/mensageira_tex.png`, `modelo/tex_x4.png` — o resultado, para abrir e estudar.
- `cena/cena.js`, `cena/index.html`, `cena/mensageira.glb` — a cena do cânion com o GLB.
- `render.mjs` (vídeo e `--folha`), `package.json`, `vendor/` (three r186, MIT).
- `NOTAS.md` — notas da peça.

## Passo a passo (ponta a ponta)
1. **Rodar o demo** (não precisa do Blockbench). Copie `motores/71/` para a pasta do seu projeto:
   ```bash
   npm install
   npm run demo
   ```
   Sai `saida/demo.mp4`: 3 s do salto com a mochila virando asa.
2. **Ideia e ficha.** Escolher um boneco com uma MECÂNICA no rig (aqui: mochila que vira asa em 2 gomos). Pose de repouso = asa fechada; abrir = zerar as rotações.
3. **Textura em código:**
   ```bash
   cd modelo
   python textura.py
   ```
   Sai o PNG, a versão de 64 cores, o `tiles.json` e o `tex_b64.txt`.
4. **Gerar o script do modelo:**
   ```bash
   python modelo_spec.py
   ```
   Sai o `build_model.js`.
5. **Abrir o Blockbench** e carregar o plugin pelo arquivo. No Claude Code, conferir a conexão com `get_project_info` ou `list_outline`.
6. **Criar o projeto** (`create_project`, formato Generic) e **montar tudo de uma vez**: mandar o conteúdo do `build_model.js` num `risky_eval`. Resposta esperada: 16 grupos, 25 cubos, textura 128x128.
7. **Conferir** com `capture_screenshot` em 3–4 ângulos (`set_camera_angle`).
8. **Animar:** `create_animation` por clipe e keyframes de rotação por osso, amostrados a 24 qps (`getBoneAnimator().addKeyframe` dentro de `risky_eval`, ou `manage_keyframes`). Na peça: `andar`, `olhar_oculos`, `salto`, `abrir_asas`, `planar`.
9. **Antes de exportar**, sair da pré-visualização de animação (via `risky_eval`): `Modes.options.edit.select()`.
10. **Exportar:** `export_model` em gltf com `result_format: embedded`. O GLB volta como recurso da ferramenta; salve como `cena/mensageira.glb` (ou o nome do seu boneco). O bbmodel volta como texto: salve só o JSON (do primeiro `{` em diante).
11. **Cena em three.js:** carregar o GLB com GLTFLoader, `AnimationMixer` com uma ação por clipe; a cada quadro definir peso e tempo de cada ação em função de t (determinístico). Escala usada: 1,65 / (33,4 / 16). A cena expõe `window.seek(t)`, `window.DUR` e `window.READY`, que é o que o `render.mjs` espera.
12. **Folha de quadros e render** (na pasta do motor):
    ```bash
    npm run folha
    npm run filme
    ```
13. **Entrega:** já sai `yuv420p`. Rodar a checagem objetiva (`estilos/29_checagem_objetiva.md`).

## Pegadinhas medidas
- **Fundo e tela limpa:** fundo chapado liso vira slide (dê profundidade, luz ou textura); nota de produção nunca vai dentro do quadro (nome de arquivo, versão, crédito de ferramenta); nada de rótulo "imagem gerada" por cima da arte.
- **Caminho de arquivo TRAVA o MCP.** `create_texture` com caminho abre a janela "Plugin Permission" e o servidor inteiro para até alguém responder. Mandar a textura como **data URL** (PNG de 64 cores: ~4 KB de base64 num boneco pixel-pintado; 872 caracteres na mensageira).
- **Exportar sem disco:** `result_format: embedded`. Com caminho, mesma janela de permissão.
- **O GLB sai com a pose que está NA TELA.** Com animação em pré-visualização, ela vira o repouso: na v0 os óculos já saíram abaixados.
- **Sinal da rotação do keyframe = three.js:** x positivo leva o pé para trás.
- **Frente do boneco = +z (south).** Unidade: 16 px do Blockbench = 1 unidade no GLB.
- **Dobra em 2 gomos:** gomo 1 a −90° no z; gomo 2 a 180°, girando em torno do próprio meio para não atravessar o gomo 1.
- **Textura a 2 texels por px** do modelo: rosto de 8×8 px vira 16×16 texels. Cor magenta de fundo denuncia face sem UV.
- **`risky_eval` roda qualquer código dentro do Blockbench.** Só para quem está conectado localmente; não rode script que não é seu.
- **Cabelo de esferas parece "bolinhas".** Num teste de boneco estilo R6, a nota subiu de 55% para 65% com cabelo feito no Blender (39 mechas em gomos, ~27 mil triângulos, preso ao osso da cabeça). A touca tem que conter a quina de cima da cabeça (centro y 6,3, raio 5,95), senão a cabeça fura o cabelo. Mais simples: capuz ou capacete.
- **Cena:** o relevo das mesas tem que ficar fora do cânion, senão sobe o fundo e a casa vai parar num degrau. Terreno com 266 mil triângulos em flat shading.
- **Chrome headless sem GPU cai no SwiftShader (CPU).** Funciona, mas é bem mais lento em 1080×1920: o demo em 540×960 leva ~0,25 s por quadro em CPU (com placa de vídeo, o demo inteiro sai em 6 s, medido com RTX 4070 Ti 12 GB); o filme inteiro pede GPU.
- **Limites do estilo:** perna sem joelho (andar mais duro) e rosto fixo na textura (não pisca nem fala).
- Na peça: cortada na borda no plano do ombro (5–7 s); pequena e de costas no voo.

## Custo e tempo
- Grátis. Sem voz, sem IA paga.
- Demo (45 quadros, 540×960, CPU): ~20 s.
- Render do filme com GPU (1080×1920): 855 quadros em 205,5 s = 0,24 s por quadro (~3,5 min). Uma tarefa de GPU por vez.
- Mão de obra medida: 1º boneco de teste ~20 min; boneco R6 ~25 min; cabelo no Blender ~15 min.

## O que funcionou e o que não funcionou
- Não funcionou: boneco pixel-pintado bem pequeno (estilo Minecraft cru) para uma série que já tinha personagem 3D próprio. Ficou feio perto do original; não vale trocar um visual que já funciona por este.
- Funcionou melhor: proporção de boneco de blocos estilo Roblox, com cabelo esculpido fora (Blender) ou cabeça coberta.
- Funcionou: dar ao rig UMA mecânica que só o Blockbench resolve bem (a asa dobrável). É o que justifica sair do código puro.
- Regras que valem aqui: personagem com a cabeça coberta (capuz/capacete); cena nova já nasce com sol baixo, névoa e câmera baixa (luz de meio-dia deixa a cena crua); câmera sempre com destino.
- Nossa nota: 7 de 10 para "A encomenda do cânion". Perde em: personagem cortada na borda no plano do ombro, pequena e de costas no voo, paredes do cânion com facetas listradas, casinha simples, e o salto sem som.

## Roteiro de aula
- **Objetivo:** o aluno sai sabendo ligar o Claude ao Blockbench e tirar de lá um boneco de blocos texturizado e animado, em GLB, pronto para uma cena em código.
- **Demonstração (~20 min):**
  1. Instalar o plugin pelo arquivo e conectar o MCP (3 min).
  2. Textura em código: rodar o `textura.py` e mostrar o atlas ampliado (3 min).
  3. Ficha → script → `risky_eval`: o boneco aparece inteiro de uma vez (4 min).
  4. Errar de propósito: mandar textura por caminho e ver a janela de permissão travar tudo (2 min).
  5. Animar um clipe e exportar em embedded (4 min).
  6. Soltar o GLB na cena e renderizar uma folha de quadros (`npm run folha`) (4 min).
- **Exercício:** fazer um boneco de 6+ ossos com textura própria e 1 animação em loop, exportar e renderizar 5 s numa cena. Deu certo se: o GLB abre na cena com a textura certa (sem magenta), a pose de repouso é a neutra e a animação toca no sentido certo.
- **Pré-requisitos:** uma cena three.js com render (estilos 04 ou 34 do curso); `estilos/29_checagem_objetiva.md`.

## Limites conhecidos
- **O demo só cobre a metade "cena"** (GLB pronto → vídeo). A metade "Blockbench pelo MCP" depende do programa aberto na sua máquina e do plugin de terceiros; foi feita assim por nós, mas não é testada pelo demo.
- **O script das 5 animações não foi guardado em arquivo.** Foi enviado direto pelo MCP; o que existe é o resultado dentro do `.bbmodel` e do `.glb`. Para aprender a animar, abra o `.bbmodel` e leia os keyframes, ou reanime ao vivo.
- O plugin MCP muda de versão: nomes de ferramentas (`risky_eval`, `export_model`...) são os da v1.10.1.
- O modo sem janela (headless) do plugin não foi usado; conte com o Blockbench aberto.
- O teste de boneco estilo R6 e o cabelo no Blender são citados como lição, mas os arquivos deles não vão no pacote.
