# 62 · Biblioteca de poderes e game feel

> Vitrine: "Ina contra a Sentinela" (4 poderes: raio, cura, fogo, gelo) · Custo: grátis · Ferramentas: three.js, canvas 2D, Node + puppeteer-core (render com o Chrome do sistema), FFmpeg

## O que é
Um kit de 11 módulos de "juice" (hit-stop, clarão, squash, número de dano, barra que mente, smear, câmera atrasada, item voando, carta, partículas, raio-X, HUD de RPG) e uma biblioteca de poderes em que todo poder tem a mesma anatomia: carga → soltura → impacto → cauda curta. O espectador vê golpe com peso de jogo de verdade. Funciona porque cada valor é função do quadro (render determinístico), o poder vira a fonte de luz da cena e a recompensa chega em camadas, nunca tudo no mesmo quadro.

## Exemplo e arquivos
- Prévia do catálogo: `catalogo/previas/62_orig.mp4`
- As regras: `motores/62/kit_juice/dynamics.md` (12 regras + EVITAR → FAZER) e `motores/62/kit_juice/PODERES.md` (anatomia do poder)
- O kit: `motores/62/kit_juice/`
- Um poder isolado (gelo, fogo, raio, cura): `motores/62/poder/poder.html` + `poder.js`
- A peça de vitrine inteira: `motores/62/arena/` (notas em `motores/62/arena/NOTAS.md`)
- Demo: `motores/62/DEMO.md` · licenças: `motores/62/FONTES.md`

## Ferramentas e instalação
Tudo grátis.
- Node 18+ e `npm install` na pasta do motor (instala só o `puppeteer-core`, que usa o Chrome que você já tem; variável `CHROME_PATH` se ele não estiver no lugar padrão).
- FFmpeg no PATH.
- three.js r160 e a fonte Titan One já vêm no motor (`vendor/`, `fontes/`). Não tem CDN nem bundler: é import map no HTML.
- Roda em CPU com `DEMO_CPU=1` (render por software). Com placa de vídeo o demo sai em 8 s (medido com RTX 4070 Ti 12 GB); uma tarefa de GPU por vez.

## Motor
Em `motores/62/`:
- `kit_juice/juice.js` — os 11 módulos. 2D desenha num contexto em px de 1080×1920; 3D cria objetos e tem atualizar(t).
- `kit_juice/tokens.js` — cores, easings (`out3`, `outBack`, `mola`, `tremor`), `q(n)` (quadros → segundos a 60 qps) e `hash` determinístico.
- `kit_juice/poderes.js` — fogo, raio e cura.
- `kit_juice/demo.html`, `kit_juice/demo.js` — uma demo de 3 s por módulo.
- `poder/poder.js` — a cena de um poder isolado (8,7 s). O **gelo** mora aqui: shader de cristal, onda no chão e a luz do poder. `?p=fogo|raio|cura` troca pelos da biblioteca.
- `arena/arena.js` (81 KB), `arena/arena.html` — a peça inteira: beats, câmera, poses, shader do gelo, impact frame, HUD.
- `arena/lib/` — a cópia do kit usada pela peça + a Ina (ina.js, esqueleto.js, toon.js).
- `render.mjs` (vídeo, `--folha`, `--probe`), `poder.mjs`, `modulos.mjs`, `package.json`.
- `vendor/` (three r160, MIT), `fontes/` (Titan One, OFL).

## Passo a passo (ponta a ponta)
1. **Rodar o demo.** Copie `motores/62/` para a pasta do seu projeto:
   ```bash
   npm install
   npm run demo
   ```
   Sai `saida/demo.mp4`: 3 s do poder de gelo (540×960, mudo).
2. **Ler as regras:** `kit_juice/dynamics.md`. Toda animação nasce como beats em QUADROS a 60 qps e só depois vira código.
3. **Ver os módulos rodando** (um MP4 de 3 s de cada):
   ```bash
   npm run modulos -- hitstop,numeros,barra
   npm run modulos
   ```
4. **Ver um poder isolado inteiro**, ou uma folha de quadros dele:
   ```bash
   npm run poder -- fogo
   node render.mjs --pagina poder/poder.html --query "p=fogo&esc=0.5&ss=1" --folha 1,2.5,3,3.2,4 --saida saida/folha_fogo.jpg
   ```
5. **Escrever a luta em beats.** Na peça (`arena/arena.js`): `WB` (quadros de mundo a 60 qps), `STOPS`/`GOLPES` (hit-stops), `CK` (câmera em órbita: sujeito, azimute, distância, altura, fov), `S`/`KEYS` (poses da Ina) e `GK`/`GKEYS` (Sentinela). Tabela dos 5 golpes no `arena/NOTAS.md`.
6. **Criar um poder novo** em `kit_juice/poderes.js`: uma função `nome(scene)` que devolve `{ cor, atualizar(qf, ctx3), desenhar(ctx2d, qf, ctx3), flash? }`, registrada em `PODERES`. Seguir as 5 fases do PODERES.md. Ver com `poder/poder.html?p=nome`.
7. **Conferir sem olhar tudo:**
   ```bash
   npm run probe
   npm run folha
   ```
   O probe devolve o tempo de cada golpe, a duração do hit-stop e o maior tempo de câmera parada.
8. **Render da peça** (mudo, yuv420p, 30 qps, 1080×1920):
   ```bash
   npm run filme
   ```
9. **Checagem objetiva** com o preset genérico (`estilos/29_checagem_objetiva.md`).
10. **Som:** a peça é muda. Use efeitos reais (sua biblioteca ou um pack CC0), alinhados pelo ataque, 8 dB abaixo da voz (regras em `estilos/27_efeito_golpe.md`). SFX sintetizado por código não funciona aqui.

## Pegadinhas medidas
- **Fundo e tela limpa:** fundo chapado liso vira slide (dê profundidade, luz ou textura); nota de produção nunca vai dentro do quadro (nome de arquivo, versão, crédito de ferramenta); nada de rótulo "imagem gerada" por cima da arte.
- **Anatomia do poder (quadros a 60 qps):** carga 60–150; disparo no 150 (anel de 14 q + flash de 1 q); viagem 150–180; impacto no 180 (hit-stop de 6 q + clarão de 5 q no alvo); resíduo 180–300+.
- **Antecipação:** 8–18 q no sentido contrário antes de toda ação. O soco do Sentinela usa 48 q de subida e desce em 8 q.
- **Golpe rápido, reação lenta:** whip de 2–4 q com smear; reação de 15–40 q.
- **Hit-stop:** 3–6 q no golpe comum, 8 q no crítico (regra do kit). Na peça: 13–14 q nos críticos (cobre o impact frame) e 7 q no soco e no fogo.
- **Clarão:** alvo branco puro por 3–5 q, volta em 2 q, com a forma legível (bloom baixo).
- **Recompensa em camadas:** luz (0 q) → anel (2–6 q) → partículas (4–20 q) → número/HUD (6–30 q).
- **Número de dano:** pop 0 → 1,25 → 1 em 6 q, sobe ~50 px em 40 q, some nos últimos 15 q. Crítico ≥ 2× maior e tremendo.
- **Barra que mente:** o preenchimento cai no contato; um pedaço branco segura 30 q e escoa em 18 q.
- **Câmera:** sempre com destino, atraso de 6–10 q, trauma que decai em ~15 q. Shake direcional (impulso na direção do golpe que volta com mola), não ruído aleatório.
- **Overlap:** braços 3 q depois do corpo, cabeça 5 q; rabo do gorro puxa na carga e chicoteia na soltura.
- **O poder ilumina a cena:** a luz geral cai na carga. No gelo final a cena vai a 12% da luz.
- **Gelo "lavado" (pastel) é o defeito nº 1.** Receita: núcleo azul profundo, só a faceta que pega luz e a borda acendem, contorno azul-marinho.
- **Luz pontual não encosta no rosto:** estoura a pele. A da mão fica em ~0,5.
- **Bloom + flash + luz somados estouram tudo de branco** (aconteceu na 1ª versão).
- **Material custom em InstancedMesh precisa aplicar o `instanceMatrix` no vertex shader.** Sem isso todas as cópias param na origem.
- **`hash(n)` em vez de `Math.random`.** Com aleatório, o quadro muda entre renders.
- **Número e selo na área segura:** a v1 saiu com o "64" cortado na borda. Na v2 as posições são presas a x 260–820 e y 420–1150.
- **Personagem de esferas lisas fica feio.** O que resolveu: forma cinzelada de bloco, rosto desenhado, sombra saturada e cabeça coberta (gorro/capuz; cabelo em código fica ruim). Só engrossar o contorno do modelo velho rendeu +5 pontos em 100.
- **A página tem de ser servida por http** (import map não funciona em `file://`). O `render.mjs` sobe um servidor local sozinho.

## Custo e tempo
- Grátis. Sem voz, sem IA.
- Demo (3 s do gelo, 540×960, CPU): ~25 s.
- Render da peça em CPU (1080×1920): ~0,85 s por quadro; 804 quadros em ~12 min.
- Com GPU, um poder isolado de 8,7 s renderiza em ~20 s.
- Mão de obra medida: gelo do zero ~7 min com o kit pronto; refino ~2 min; 3 poderes novos ~6 min.

## O que funcionou e o que não funcionou
- Funcionou: escrever o golpe em beats de quadros antes do código. Com a tabela na mão, o poder de gelo ficou "interessante" na 1ª rodada.
- Fraquezas da 1ª rodada, corrigidas na peça: pose dura segurando o poder, gelo pastel/lavado, neve discreta.
- Funcionou: juice no golpe (flash, CRÍTICO, tremida) por cima de vídeo já pronto. É barato e muda a leitura do impacto.
- Não funcionou: personagem montado com esferas e cápsulas. Lê como protótipo. A forma precisa de desenho (ver a pegadinha acima).
- Não funcionou: impact frame em estrela pontuda com cunhas radiais. Lê como "explosão de história em quadrinho". Trocado pelo de anime (`estilos/impact_impact_frame.md`).
- Nossa nota: 7 de 10 para "Ina contra a Sentinela". Perde em: Sentinela de blocos chapados ("Minecraft com contorno"), pés da Ina deslizando no empurrão, final calmo demais e falta de som.

## Roteiro de aula
- **Objetivo:** o aluno sai sabendo escrever um golpe em beats de quadros e montar um poder com carga, soltura, impacto e cauda usando os módulos do kit.
- **Demonstração (~20 min, cabe em 2 aulas):**
  1. SEM × COM: o mesmo golpe sem juice e com (método inspirado em contas de game feel) (2 min).
  2. As 12 regras do dynamics.md com a demo de cada módulo (`npm run modulos`) (6 min).
  3. Anatomia de um poder na tabela de quadros; abrir o fogo no código (4 min).
  4. Criar um poder novo copiando o fogo e trocando cor, partícula e resíduo (5 min).
  5. `npm run probe` e folha de quadros antes do render (3 min).
- **Exercício:** criar um 5º poder (ex.: veneno, cor `#b06bff` dos tokens) e acertar um alvo. Deu certo se: o hit-stop tem 3–8 q, o clarão dura ≤ 6 q, o número fica dentro da área segura, a cena escurece na carga e nada usa `Math.random`.
- **Pré-requisitos:** um personagem e um palco three.js (estilos 34 ou 61 do curso); `estilos/29_checagem_objetiva.md`. Depois desta: `estilos/impact_impact_frame.md` e `estilos/27_efeito_golpe.md`.

## Limites conhecidos
- O gelo não está em `poderes.js`: vive na cena `poder/poder.js` (e, na peça, dentro do `arena.js`). Para usar o gelo em outra cena é preciso extrair o shader e a onda de lá.
- A arena só renderiza em 1080×1920 (o HUD 2D é desenhado nessa medida): em CPU o filme leva ~12 min. A cena de poder e as demos aceitam `esc=0.5`.
- `arena/lib/` repete o kit (juice, poderes, tokens): são duas cópias para manter se você mexer nos módulos.
- Tudo é mudo; não existe mix de referência com SFX para este estilo.
- A Ina, o Sentinela e os cenários são nossos: servem de exemplo, mas a peça do aluno pede personagem próprio.
- Fraquezas da peça: Sentinela lê "Minecraft com contorno", pés da Ina deslizam, final calmo.
