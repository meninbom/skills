# 71 · "A encomenda do cânion" (a peça de vitrine)

## História (muda, 28,5 s)
1. Uma mensageira de capuz anda pelo platô até a beira de um cânion ao entardecer.
2. Ela olha para baixo e baixa os óculos de aviador.
3. Ela agacha e salta. A mochila se desdobra em asas de lona em 2 gomos, que abrem com sobra e assentam.
4. Ela plana pelo cânion e passa por baixo de um arco de pedra.
5. Solta a encomenda de paraquedas sobre uma casinha de adobe na beira do rio. Sem o peso, sobe em direção ao sol.
6. A encomenda pousa na porta, a janela acende e a porta se abre.

## O que foi feito no Blockbench, pelo MCP
- O projeto é `modelo/mensageira.bbmodel` (formato Generic). Abre no Blockbench 5.x.
- **Esqueleto:** 16 ossos e 25 cubos, montados por script em `risky_eval`. O script é gerado por `modelo/modelo_spec.py`, que escreve `modelo/build_model.js`.
  - Ossos: raiz, quadril, cabeça, óculos, cachecol em 2 gomos, braços, pernas, mochila, pacote e asas em 2 gomos de cada lado.
- **Asa dobrável:** a pose de repouso é a asa fechada.
  - Gomo 1: −90° no eixo z. Gomo 2: 180°, deitado em cima do gomo 1.
  - Abrir é só zerar as duas rotações. O gomo 2 gira em torno do próprio meio, para não atravessar o gomo 1.
- **Textura:** atlas 128×128 em `modelo/textura.py`, com 2 texels por px. Entrou como data URL; caminho de arquivo trava o MCP.
  - Rosto pintado, zíper, alças e fivelas, bota com cadarço, lona listrada da asa, barbante da encomenda.
- **5 animações** amostradas a 24 qps com easing: `andar`, `olhar_oculos` (mão vai aos óculos e eles descem), `salto`, `abrir_asas` (com sobra) e `planar` (asa flexionando, cachecol batendo).
- **Export:** `cena/mensageira.glb` saiu de `export_model` gltf com `result_format: embedded`.

## Cena (three.js r186)
- Arquivos em `cena/`: `cena.js`, `index.html` e `mensageira.glb`.
- Para renderizar (na pasta do motor): `npm run demo` (3 s), `npm run folha`, `npm run filme` (28,5 s, 1080×1920).
- **Terreno:** cânion procedural com 266 mil triângulos, flat shading e cor por triângulo em estratos de arenito. As paredes têm terraços e o fundo tem rio.
- **Cenário:** arco de pedra, mesas ao longe, arbustos e pedras, pássaros e poeira na luz.
- **Luz:** sol baixo pelo lado e névoa quente. A sombra acompanha o foco.
- **Acabamento:** bloom, grade teal/laranja, vinheta e grão.
- **Voo:** trajetória integrada (balística e depois planeio). O corpo gira em torno do peito, com inclinação nas curvas.
- **Encomenda:** é a cópia do cubo do Blockbench, com paraquedas de gomos.
- **Planos:** 6, sempre com câmera andando.

## Pegadinhas
- O GLB sai com a pose que está NA TELA do Blockbench. Se uma animação estiver em pré-visualização, ela vira o repouso: na v0 os óculos já estavam abaixados.
  - Antes de exportar: `Modes.options.edit.select()`.
- No `create_animation` e no keyframe, o sinal da rotação é o mesmo do three.js: x positivo leva o pé para trás.
- O relevo das mesas tem que ficar fora do cânion, senão sobe o fundo e a casa vai parar num degrau.

## Nossa nota
**7 de 10.** A referência interna era um teste anterior de boneco de blocos numa rua de neve (65%).
- **Ganha:**
  - mostra o que o Blockbench faz de verdade: rig com mecânica (asa que dobra em 2 gomos), 5 animações e textura pintada com detalhe;
  - tem história com começo, virada e fecho;
  - luz de fim de tarde e câmera sempre com destino.
- **Perde:**
  - no plano por cima do ombro (5–7 s) ela fica cortada na borda;
  - no voo ela fica pequena e de costas, sem rosto;
  - as paredes do cânion têm facetas listradas;
  - a casinha é simples;
  - o paraquedas aparece pequeno;
  - mudo tira o peso do salto.

## Checagem
- 28,5 s, yuv420p, mudo. Checagem objetiva: passou, com 1 aviso (sem faixa de áudio).
