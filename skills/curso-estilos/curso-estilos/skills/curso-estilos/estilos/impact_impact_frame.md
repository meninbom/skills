# impact · Impact frame de anime

> Vitrine: golpe final do curta "Slime Slayer" e críticos de "Ina contra a Sentinela" · Custo: grátis · Ferramentas: three.js, canvas 2D, Node + puppeteer-core (render com o Chrome do sistema), FFmpeg

## O que é
No quadro do golpe a cena some e entram 3–4 DESENHOS segurados por poucos quadros: clarão, preto com silhuetas brancas e pincelada, papel claro com silhuetas pretas, e a volta com zoom. Duas tintas chapadas mais UMA cor de destaque, tudo seguindo a direção da força. Funciona porque o olho lê a silhueta real dos personagens num contraste máximo durante 0,2 s, e em seguida o hit-stop segura o peso.

## Exemplo e arquivos
- Prévia do catálogo: `catalogo/previas/impact.mp4`
- O módulo: `motores/impact/impactFrame2.js` (função `criarImpactFrame`)
- Cena de exemplo, de pé: `motores/impact/cena.js` + `index.html`
- Demo: `motores/impact/DEMO.md`
- Onde mais é usado no pacote: `motores/62/arena/arena.js` (raio dourado e gelo azul; variante com semente por golpe). A mesma gramática redesenhada em SVG está no estilo 36 (`estilos/36_anime_svg.md`).

## Ferramentas e instalação
Tudo grátis. Node 18+, `npm install` na pasta do motor (só o `puppeteer-core`, que usa o Chrome que você já tem), FFmpeg no PATH. O three.js r160 já vem em `vendor/`. O módulo em si não tem dependência além do three que o seu motor já usa: você passa o `THREE` por parâmetro.

## Motor
Em `motores/impact/`:
- `impactFrame2.js` (~13 KB): `criarImpactFrame({ THREE, scene, cam, renderer, gl, out, cor })` devolve `{ mascara, desenhar, prj }`. Traz junto o gerador com semente, a máscara de silhueta, a pincelada seca, o arco, o respingo e o grão. As medidas são de um quadro de 1080×1920 e escalam sozinhas para o seu canvas.
- `cena.js`: demo mínimo. Dois volumes (quem bate, quem apanha), um golpe, hit-stop, tremida, alvo achatado e o impact frame plugado.
- `index.html`, `render.mjs`, `package.json`, `vendor/`.

## Passo a passo (ponta a ponta)
1. **Rodar o demo.** Copie `motores/impact/` para a pasta do seu projeto:
   ```bash
   npm install
   npm run demo
   npm run folha
   ```
   Sai `saida/demo.mp4` (3 s) e `saida/folha.jpg` com os 4 desenhos lado a lado.
2. **No seu motor:** ter a cena do golpe rodando como função pura do tempo, com o WebGL num canvas (`alpha: true`, `preserveDrawingBuffer: true`) e o quadro composto num canvas 2D de saída.
3. **Criar o impact frame uma vez:**
   ```js
   import { criarImpactFrame } from './impactFrame2.js';
   const IF = criarImpactFrame({ THREE, scene, cam, renderer, gl, out, cor: '#ffd04a' });
   ```
4. **No plano do golpe, definir o segundo do impacto e o hit-stop.** No original:
   - impacto em TI; hit-stop de 0,36 s (o mundo congela);
   - k = quadro a 60 qps desde o impacto, de 0 a 11, só nos primeiros 0,20 s;
   - tremida só a partir de TI + 0,2: 0,3 × exp(−3,2 t);
   - alvo achatado em 0,74 enquanto dura o hit-stop.
5. **No draw, depois de compor a cena e antes do HUD:** `IF.mascara([...])` só com quem participa do golpe, projetar o ponto do impacto e um 2º ponto ~2 m adiante (direção da força) com `IF.prj`, e chamar `IF.desenhar(k, x, y, ux, uy)`. Sair sem desenhar HUD nem legenda por cima. As ~10 linhas estão no fim do `quadro()` em `cena.js`.
6. **Trocar a cor de destaque** pela cor do poder. Uma só por golpe (`npm run gelo` mostra em azul).
7. **Conferir os 4 desenhos numa folha** com os tempos do seu golpe:
   ```bash
   node render.mjs --pagina index.html --query "esc=0.5" --folha 1.31,1.36,1.43,1.48 --saida saida/folha.jpg
   ```
8. **Render do filme** e checagem objetiva (`estilos/29_checagem_objetiva.md`). Olhar a linha de flashes.

## Pegadinhas medidas
- **Fundo e tela limpa:** fundo chapado liso vira slide (dê profundidade, luz ou textura); nota de produção nunca vai dentro do quadro (nome de arquivo, versão, crédito de ferramenta); nada de rótulo "imagem gerada" por cima da arte.
- **Tempos reais (60 qps), 12 quadros = 0,20 s:**
  | Quadros | Dura | Desenho |
  |---|---|---|
  | 0–1 | 2 q (33 ms) | clarão: fundo branco, silhuetas em cinza claro |
  | 2–5 | 4 q (67 ms) | preto, silhuetas brancas, 16 pinceladas secas, arco na cor de destaque, respingo |
  | 6–9 | 4 q (67 ms) | invertido: papel claro, silhuetas pretas, 12 pinceladas pretas, arco preto + filete branco |
  | 10–11 | 2 q (33 ms) | volta para a cena: zoom 1,08 → 1,05 e separação de cor |
- **Depois vem o hit-stop.** No original: 0,36 s no total (0,20 s de desenhos + 0,16 s de cena parada). Na peça do estilo 62: 13–14 q nos críticos (cobre o impact frame), 7 q no soco e no fogo.
- **A 30 qps cada desenho vira 2 quadros ("em dois") e o clarão vira 1.** É de propósito.
- **Silhueta REAL, não recorte por brilho.** Máscara = cena renderizada com material branco único, cenário escondido, com 1,5 px de desfoque na borda. Os objetos da máscara têm de ser filhos diretos da `scene`.
- **Direção da força manda em tudo:** pinceladas paralelas ao golpe, respingo em leque para a frente (70 gotas brancas até 900 px; 110 pretas até 1100 px; só 26 para trás até 420 px), sombra da silhueta deslocada 46 px contra a força, depois 18 px a favor.
- **Volta para a cena:** contraste 1,35, saturação 1,3, brilho 1,1, cópias a ±22 px com alpha 0,28.
- **Grão de papel** em overlay (alpha 0,22) só nos dois desenhos do meio.
- **Tudo determinístico** (gerador com semente). Nada de `Math.random`, senão o desenho muda entre renders.
- **Flash na checagem objetiva:** claro → preto → papel → cena são 4 trocas fortes. Uma peça falhou com "Flashes 4/s"; a correção foi escurecer o 1º desenho (opção `claro` do módulo: um tom escuro da cor do poder em vez de quase branco). Outra passou com 2/s.
- **Dois efeitos por cima do mesmo quadro brigam:** na peça do 62 o selo de status nasce sobre o "CRÍTICO!" por ~0,3 s.
- Referência de catálogos de game feel (não é a nossa medida): "0,1 s de silhueta branca no preto → inverte → volta; hit-stop 0,12 s; shake 10 px por 0,25 s". O nosso segura o dobro.

## Custo e tempo
Grátis. O demo leva ~15 s em CPU e 6 s com placa de vídeo (medido com RTX 4070 Ti 12 GB). No motor hospedeiro o impact frame não muda o tempo de render (são 12 quadros de canvas 2D). Sem som: o SFX do golpe entra depois, alinhado pelo ataque (ver `estilos/27_efeito_golpe.md`).

## O que funcionou e o que não funcionou
- Não funcionou: a 1ª versão, com estrela pontuda e cunhas radiais. Lê como "explosão de história em quadrinho", toda aguda.
- Funcionou: silhueta chapada, pincel seco, respingo, 1 cor, 3–4 desenhos segurados e, depois, hit-stop. **Sem estrela, sem raios radiais.**
- Funcionou: usar a silhueta real dos personagens. Mancha genérica no lugar do corpo tira a leitura de quem bateu em quem.
- Nossa nota: o módulo está nas peças dos estilos 35, 36 (em SVG) e 62. A cena do demo é propositalmente pobre (dois blocos): serve para ver a mecânica, não como exemplo de acabamento.

## Roteiro de aula
- **Objetivo:** o aluno sai sabendo a diferença entre impacto de quadrinho e impact frame de anime, e sabe plugar o nosso num golpe em código.
- **Demonstração (~12 min):**
  1. Lado a lado: estrela pontuda × os 4 desenhos (2 min).
  2. Passar o golpe quadro a quadro (`npm run demo60`) e nomear cada desenho com a duração (3 min).
  3. Abrir `impactFrame2.js`: a máscara de silhueta e a direção da força (3 min).
  4. Trocar a cor de destaque (`npm run gelo`) e a direção ao vivo; ver numa folha de quadros (2 min).
  5. Rodar a checagem objetiva e ler a linha de flashes (2 min).
- **Exercício:** plugar o impact frame num golpe do aluno com a cor do poder dele. Deu certo se: a folha mostra os 4 desenhos na ordem, as silhuetas são dos personagens (não manchas), as pinceladas apontam na direção do golpe e a checagem não reprova por flash.
- **Pré-requisitos:** um motor three.js + canvas 2D (`estilos/62_poderes_game_feel.md`) e `estilos/29_checagem_objetiva.md`.

## Limites conhecidos
- Pede um motor com o WebGL num canvas separado e um canvas 2D de saída. Se o seu render vai direto para a tela (sem canvas 2D), é preciso criar essa etapa.
- A máscara só enxerga filhos diretos da `scene` e usa `overrideMaterial`: material com deformação no vertex shader (vento, skinning custom) pode sair com silhueta diferente.
- Os números (raios, alcances, quantidade de gotas) foram afinados para um golpe lateral em 9:16. Em 16:9 ou com golpe na direção da câmera, ajuste à mão.
- A versão com semente por golpe e grão pré-feito vive só no `arena.js` do estilo 62; as duas não foram unificadas.
- A cena do demo é simples (dois blocos, sem personagem desenhado).
