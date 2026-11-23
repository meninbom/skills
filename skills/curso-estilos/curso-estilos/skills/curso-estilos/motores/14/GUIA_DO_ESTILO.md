# Kit de estilo EMOJI ("agenda de purikura")

**O que é:** um Reel vertical narrado (45–60 s) em que **a história inteira está colada numa página única de agenda quadriculada**. Uma câmera que **nunca para** passeia por ela, e cada viagem termina no adesivo da palavra que a voz está dizendo. Perto do fim, **um único recuo** mostra a página inteira (o momento MAXI). Depois a câmera volta ao começo e o vídeo **fecha em laço**: o último quadro é igual ao primeiro.

O exemplo é "de onde vem o emoji" (público de 14–16 anos): a prévia está em `catalogo/previas/14.mp4` do plugin e a composição inteira em `hf/` (renderiza muda com `node render.mjs hf`). **Assista antes de ler o resto.**

O estilo resolve três problemas de uma vez: corte solto, tela parada e salada visual. A regra que resume tudo: continuar sempre se movimentando, sempre dentro do mesmo mundo, com um ponto focal.

---

## Conteúdo desta pasta
| caminho | o que é |
|---|---|
| `GUIA_DO_ESTILO.md` | este guia (DNA, passo a passo, prompts, erros, checklist) |
| `ROTEIRO_TEMPLATE.md` | a estrutura do roteiro, para preencher, com o roteiro do exemplo anotado |
| `PROMPT_CLAUDE_CODE.md` | o prompt para colar no Claude Code e como o motor funciona por dentro |
| `kit_template/` | composição de 12 s que já renderiza (o ponto de partida de um vídeo novo) |
| `kit_branco/` | página mínima e comentada de 4 s, em pé ou deitada (o ponto de partida de um estilo seu; veja `DEMO.md`) |
| `kit_ferramentas/` | 2 ferramentas Python (foto→adesivo em retícula, grade→adesivo de pixel) |
| `hf/`, `hf_src/` | o exemplo completo de 56 s (mudo) |
| `som/` | o script de mixagem do exemplo e os tempos dos SFX (sem áudio: você aponta os seus arquivos) |

---

## 1. DNA

### 1.1 Paleta fixa (6 cores + 2 de apoio, nada além disso)
| token | hex | papel |
|---|---|---|
| papel | `#FAF8F3` | a página, do primeiro ao último quadro |
| linha | `#DCE2F0` | o quadriculado (quadrado de 64 px na escala 1) |
| tinta | `#1B1631` | todo texto e os pontos da retícula |
| rosa | `#FF4FA3` | 1º bloco do assunto (no exemplo: 1999 / Tóquio / celular), o coração do gancho e o risco |
| azul | `#3157FF` | 2º bloco (no exemplo: o processo do criador) |
| lima | `#9ADB2A` | 3º bloco (no exemplo: hoje / museu) |
| apoio | `#6E6A86` | só para etiquetas pequenas em caixa-alta |
| mesa | `#E6E1D6` | o que aparece fora da página, só no recuo |

- **Nenhuma palavra pintada.** A cor mora só nos adesivos. A única exceção é um risco físico rosa sobre uma palavra (o "Só que não").
- Cada cor marca um **bloco** da história, não um enfeite.

### 1.2 Tipografia: uma família só
- **Bricolage Grotesque** (Google Fonts, licença OFL, uso comercial livre). Está em `kit_template/fonts/Bricolage.ttf`.
  - **800** para títulos, com entreletra −4%. Tamanho de 100 a 270 px num quadro de 1080×1920.
  - **650** em caixa-alta, entreletra +7% e cor `apoio`, só para etiquetas ("UM TWEET HOJE", "DESENHO").
- Japonês ou outro alfabeto: **Noto Sans JP Bold** (OFL). O original usou Yu Gothic, que não é redistribuível.
- Texto que faz parte de um objeto (a tela do celular) pode usar uma mono pixelada, como Departure Mono (OFL). Conta como objeto, não como segunda família.
- **Sem legenda.** O texto na tela é só a palavra-âncora da frase: o nome, o número, a data.

### 1.3 Dois tipos de objeto (só dois)
1. **Foto-adesivo:** a foto vira **retícula de pontos duotone** (pontos cor `tinta` sobre a cor do bloco clareada), ganha borda branca de adesivo recortado (cerca de 18 px), cantos levemente arredondados, uma rotação de −2° a +2° e uma sombra só (`0 14px 18px` a 22% de opacidade + `0 2px 3px` a 25%, cor `tinta`).
2. **Adesivo de pixel 12×12:** ícone desenhado numa grade de 12 por 12, **uma cor por ícone** (só os tokens), com borda branca. Ele é herói, figurinha da avalanche e confete. As 10 grades prontas estão em `kit_template/icones.json` (vire PNG com `kit_ferramentas/adesivo_pixel.py`).

Nenhum terceiro tipo: nada de ilustração vetorial, 3D, ícone de app ou emoji colorido brilhante.

### 1.4 Formato
- **1080×1920, 30 fps.**
- Se a referência for horizontal: `node render.mjs kit_template --vw 1920 --vh 1080`. O conteúdo não estica nem corta. Para compor pensando no quadro deitado, troque `BASE` no bloco PALCO do `index.html`.
- Nada treme: nada de 12 fps, de "boil" ou de grão animado.
- Duração de 45 a 60 s (o exemplo tem 56,4 s).

### 1.5 A câmera contínua (o coração do estilo)
A câmera alterna o tempo todo entre dois estados, sem nunca parar:

| estado | duração | curva | o que faz |
|---|---|---|---|
| **VIAGEM** | 0,5–0,6 s | `cubic-bezier(.75,0,.35,1)`, que no After Effects é influência de **saída 75% / entrada 65%** | vai até o próximo alvo e **chega ~0,05 s depois do início da palavra** |
| **DERIVA** | o resto da frase (1–4 s) | sine in-out | aproxima devagar, escala 100% → 102–103%, deslocando 10–25 px |

Regras da câmera:
- O alvo da viagem fica sempre no **mesmo ponto da tela: x 540, y 1000** (um pouco acima do meio). O olho não precisa procurar.
- **Toda viagem tem destino:** o adesivo da palavra da vez. Movimento sem alvo é proibido.
- Os alvos se alternam entre a **coluna esquerda e a direita** da página e vão **descendo**. É o zigue-zague que dá a sensação de percorrer a agenda.
- **Mergulhos** (2 ou 3 por vídeo, no máximo): zoom grande para dentro de um objeto, por exemplo 3,8× na tela do celular ou 17× numa figurinha que vira a grade de pixel. Curva power2/power3 in-out, 0,7–0,9 s. O zoom precisa ser **logarítmico** (ver 3.2): com zoom linear, o fim do mergulho dispara.
- **Um recuo só, perto do fim:** escala 0,32, mostrando a página inteira com tudo o que já apareceu (0,6 s para ir, ~0,4 s de respiro, 0,9 s para voltar ao começo). As bordas fora da página mostram a cor `mesa`.
- **Laço:** o quadro 0 e o último são idênticos (o mesmo enquadramento e o mesmo adesivo a 106%).
- O quadriculado **não pode sumir nem engrossar** no zoom. No código, duas grades se revezam. Em programa de edição, faça o papel em vetor ou em resolução alta.

### 1.6 Como os adesivos entram: o POUSO
- O **contato** acontece no início da palavra.
- O pouso dura **0,34 s** antes do contato e parte de **−40 px** de altura, escala **108% → 100%** e rotação final **+2,5°**.
- A curva é **ease-in (power2.in)**: ele acelera e "bate" no papel. **Sem mola, sem overshoot, sem quique.**
- A opacidade vai de 0 a 100% nos primeiros 2 quadros.
- O **descolar** é o mesmo gesto ao contrário (sobe para 106%) e só aparece no fecho.
- **Avalanche** (a folha de 176): uma grade de figurinhas aparece em **onda a partir do centro** em ~1,3 s. Cada uma faz um mini-pouso (125% → 100% em 0,22 s, ease-in).

### 1.7 Como o texto entra: LINHA POR MÁSCARA
- Cada linha mora numa **máscara do tamanho da linha**. O texto sobe de baixo (a partir de 175% da própria altura) até o lugar.
- A subida usa **expo.out em 0,5 s** e começa **0,06–0,1 s antes** da palavra.
- Duas linhas juntas ("Tóquio," / "1999") entram com 0,07–0,5 s de diferença, cada uma na sua palavra.
- A saída (rara) sobe para fora em 0,2 s, expo.in. Na maioria das vezes o texto **fica na página**: a câmera é que vai embora.
- O texto fica **colado na página** e anda com a câmera. Ele só fica preso à tela dentro de um mergulho forte (no exemplo, a régua 1–12).

### 1.8 Confete (a densidade MAXI)
- São adesivos de pixel pequenos (56–104 px), com rotação de −12° a +12°, espalhados nas sobras da página.
- Ficam **parados** e a **≥120 px** de qualquer texto ou objeto. São cerca de 110 numa página de 2400×11600.
- Dão a sensação de página cheia sem disputar o foco: **só o adesivo da vez se mexe.**

### 1.9 Som
O áudio do exemplo não vem no pacote. Use `som/cues.json` como régua: lista cada SFX com o segundo em que entra e quantos dB fica abaixo da voz; `som/mix.py` é a mixagem inteira.
- **Voz** normalizada em **−16 LUFS**. Voz corrida, sem teatro, com velocidade **máxima de 1,1×**.
- **Trilha** calma, nostálgica, com cara de lo-fi japonês (no exemplo, "Chill Japan" da Pixabay). Fica **11,5 dB abaixo da voz**, com duck de −2,5 dB durante a fala, e some em 0,6 s no fim.
- **SFX:** só **4–5 momentos**, todos de **foley real**. Nada sintetizado, nada de "pirilim":
  - papel ou carta de baralho nos pousos grandes;
  - teclas reais de celular flip enquanto o contador sobe;
  - lápis de cor na grade;
  - folha deslizando no recuo.
- Todo SFX passa por **passa-baixa de 4,5 a 6 kHz** e fica **13 a 19 dB abaixo da voz**. SFX alto é o erro mais comum.
- **Master −13,5 LUFS**, pico real ≤ −1,5 dBTP. Teste no alto-falante do celular.

---

## 2. Estrutura do roteiro (detalhes em `ROTEIRO_TEMPLATE.md`)
1. **Gancho com crença errada (0–4 s):** "X vem de Y, né? Faz sentido. Só que não." O adesivo-herói e a palavra-título já estão na tela no quadro 0.
2. **Origem concreta (4–12 s):** lugar + data + objeto ("Tóquio, 1999. O celular...").
3. **O problema em número (12–17 s):** um número que a tela mostra melhor que a voz (o contador 250/250 no LCD), mais uma comparação com hoje que **só a tela diz** ("um tweet hoje · 280").
4. **A pessoa e a ideia (17–22 s):** nome + o gesto ("desenhar o sentimento").
5. **Avalanche (22–34 s):** a voz lista substantivos, um por batida ("mangá, previsão do tempo, placa de rua"; "Sol. Nuvem. Coração. Lâmpada. Bomba."). Cada um vira um adesivo. É aqui que entra o número grande (176) e um mergulho.
6. **A virada / confusão desfeita (35–47 s):** a coisa parecida que não é ("emoticon: dois pontos, traço, parêntese") e a etimologia real.
7. **Fecho que abre e volta ao começo (47–56 s):** um fato final surpreendente → recuo MAXI → "Ou seja: aquele X que você ... hoje é ..." sobre o coração do começo → laço.

Números do exemplo: 142 palavras em 55,6 s (~155 palavras/min), **1 ou 2 substantivos concretos por frase**, nenhuma pausa longa e de 2 a 3 piadas dentro do dado ("Só que não", "Pura coincidência", "é peça de museu").

---

## 3. Passo a passo

### Etapa 0: material (vale para os dois caminhos)
1. **Roteiro.** Use o prompt da seção 4.1 e depois leia em voz alta. Corte tudo o que você não diria.
2. **Mapa de atenção.** Para cada frase, escreva **a palavra-alvo** e **o que pousa nela** (adesivo de foto, adesivo de pixel ou linha de texto). No máximo **um alvo novo a cada 1–2 s**, sem nada parado por mais de ~1,5 s. Modelo em `ROTEIRO_TEMPLATE.md`.
3. **Voz.**
   - **ElevenLabs:** voz de locução jovem e rápida (no exemplo, "Gabriel Dantas" da Voice Library, modelo eleven_v4, estabilidade 0,35, estilo 0,7). Escreva números por extenso e nomes estrangeiros como se lê ("ai-moude", "ene tê tê Docomo", "môdji"). Teste antes as palavras difíceis numa frase curta e **gere a narração em 1 take**. Acelere no máximo 1,1×.
   - **Voz própria:** grave em 1 take corrido e corte só os respiros longos.
4. **Tempos das palavras.** Você precisa do segundo exato em que cada palavra-alvo começa.
   - No CapCut, gere "legendas automáticas" só para ler os tempos e depois apague.
   - No código, use transcrição com tempos por palavra (whisper / faster-whisper com `word_timestamps`).
5. **Imagens (foto-adesivos).** Use 5 a 8 no vídeo inteiro.
   - Gere num gerador de imagem (prompts na seção 4.2) **ou** use foto sua ou de banco com licença comercial (Unsplash, Pexels, Pixabay).
   - **Não use foto de pessoa real identificável como se fosse registro.** No exemplo, o criador aparece só como "uma mão desenhando".
6. **Adesivos de pixel.** Use as 10 grades de `kit_template/icones.json` ou desenhe novas (ver 3.3).

### Caminho A: sem código (After Effects, Alight Motion ou CapCut)

**A.1 Monte a página (Figma, Canva ou Photoshop)**
1. Crie uma prancheta **2400 px de largura × (≈200 px por segundo de vídeo) de altura**. O exemplo usa 2400×11600 para 56 s.
   - Fundo `#FAF8F3` com cantos de 28 px.
   - Quadriculado de linhas `#DCE2F0` de 2 px a cada 64 px.
2. Posicione os alvos em **zigue-zague**: alvo 1 na esquerda em cima (x≈600), alvo 2 na direita (x≈1800) um pouco abaixo, alvo 3 na esquerda mais abaixo, e assim por diante. Os blocos ficam a ~1300–1900 px um do outro na vertical.
3. Ao lado de cada foto-adesivo vai a palavra-âncora em Bricolage 800. Ela fica **embaixo ou ao lado da foto, nunca por cima**.
4. Espalhe ~2 confetes por 1000 px² de sobra, sempre longe do texto.
5. **Exporte cada adesivo e cada linha de texto como camada separada** (PNG em 2× ou SVG) e exporte também o papel com o quadriculado e o confete como uma camada só. Anote as coordenadas (x, y) do **centro de cada alvo** na página.

**A.2 Foto → foto-adesivo, sem código ([Photopea](https://www.photopea.com), grátis no navegador, ou Photoshop)**
1. Recorte a foto (quadrada ou 4:5) e redimensione para ~1,5× o tamanho que ela vai ter na tela.
2. Imagem → Ajustes → Preto e branco. Depois Filtro → Pixelizar → **Meio-tom em cores** com raio máximo de 8–12 px e os 4 canais no mesmo ângulo (15°). Isso gera pontos pretos.
3. **Mapa de gradiente**: preto → `#1B1631`, branco → a cor do bloco clareada. Rosa clareado fica `#FFC5E0`; azul clareado, `#AEBCFF`; lima clareado, `#D3EEA4`.
4. Estilo de camada:
   - **Traçado** 18 px, por fora, branco;
   - **Sombra projetada** cor `#1B1631`, 22%, distância 14 px, tamanho 18 px.
5. Gire de −2° a +2°.

Se você tiver Python, `kit_ferramentas/adesivo_foto.py` faz tudo isso num comando só.

**A.3 Animação no After Effects (o melhor caminho sem código)**
1. Crie a composição: **1080×1920, 30 fps**, com a duração da voz.
2. Importe a página como camadas, todas em escala 100% e nas coordenadas da página.
3. **Crie um Null "CAMERA"** e parenteie todas as camadas da página a ele.
   - Posição do Null = **(540, 1000)**, fixa.
   - Anime o **Anchor Point** do Null, que é o ponto da página que fica no centro do olhar, e a **Escala**.
4. **Zoom em log.** Adicione no Null um Slider "zoom_log" e use na Escala a expressão:
   `s = Math.exp(effect("zoom_log")("Slider")) * 100; [s, s]`
   Keyframes do slider: escala 1 = 0; 1,03 = 0,03; 0,32 = −1,14; 3,8 = 1,34; 9 = 2,2; 17 = 2,83.
5. **Curvas:**
   - keyframes de **viagem**: Velocidade do keyframe, influência de **saída 75%** no keyframe de partida e de **entrada 65%** no de chegada;
   - keyframes de **deriva**: Easy Ease (F9).
6. **Pouso**, em cada adesivo:
   - Posição Y −40 → 0 e Escala 108 → 100 em **10 quadros** (0,34 s), terminando no quadro da palavra;
   - Rotação +2,5° → final;
   - Opacidade 0 → 100 em 2 quadros;
   - influência de **entrada 0%** e de **saída 85%**, para ele acelerar e bater.
7. **Linha por máscara:**
   - pré-componha cada linha de texto numa composição do tamanho exato da linha com ~30% de folga;
   - dentro dela, anime a posição Y de +175% da altura da fonte → 0 em **15 quadros**, com influência de saída ~5% e de entrada ~90% (curva de "expo out");
   - a pré-composição corta o que sobra, e isso já é a máscara;
   - comece 2–3 quadros antes da palavra.
8. **Laço:** copie os valores do keyframe 0 no último quadro.
9. Exporte em H.264 1080×1920, 30 fps. O áudio pode ser mixado aqui ou no CapCut.

**A.4 No celular: Alight Motion**
É a mesma lógica do AE. Agrupe todas as camadas da página num **Grupo "CAMERA"** e anime posição e escala do grupo. Use as curvas personalizadas do keyframe com a mesma forma (saída lenta, chegada lenta e forte). Os mergulhos acima de 4× ficam ruins sem zoom em log: divida em 2–3 keyframes intermediários (1 → 2 → 4 → 8).

**A.5 Só com CapCut (versão simplificada)**
O CapCut não tem "Null", então a página inteira precisa ser **uma imagem grande**.
1. Exporte do Figma **uma imagem da página por estado**: o estado 0 sem nada pousado, o estado 1 com o 1º adesivo, e assim por diante. São todos do mesmo tamanho.
2. Coloque o estado 0 na timeline e anime a câmera com **keyframes de posição e escala** (curva: "personalizada", com saída e chegada lentas).
3. Divida o clipe nos tempos de cada pouso e **substitua** cada pedaço pelo estado seguinte. Confirme que a animação de keyframe continua igual depois de substituir.
4. O pouso vira "aparece no corte". Você perde o gesto de cair, mas mantém a câmera contínua.
5. Os textos podem entrar com a animação de entrada "Subir" do CapCut por cima, mas só nos mergulhos, onde o texto fica preso à tela.

Esta via **não foi testada por nós**. A câmera contínua é o que importa; se o CapCut brigar, use o AE ou o Alight Motion.

**A.6 Mix (qualquer editor)**
1. Voz normalizada em −16 LUFS (CapCut: "Normalizar volume").
2. Trilha ~11–12 dB abaixo da voz (no CapCut, cerca de 25–30% de volume, conferindo de ouvido no celular).
3. 4–5 SFX de foley com passa-baixa, 13 a 19 dB abaixo da voz.
4. Exporte e **assista no celular, no alto-falante**.

### Caminho B: com Claude Code
Veja `PROMPT_CLAUDE_CODE.md`. Em resumo: copie a pasta `kit_template/`, cole o prompt com o seu roteiro e a sua narração, e o Claude preenche o bloco "ROTEIRO NA PÁGINA" e a lista `K` da câmera e renderiza com `node render.mjs kit_template` (Node 18+ e Chrome instalado) ou com o HyperFrames (`npx hyperframes render`). O template já renderiza sozinho: são 12 s.

### 3.3 Emojis e ícones: o que pode usar
**Prefira adesivos próprios.** O estilo depende de pixel 12×12 de **uma cor só**: emoji colorido de fabricante quebra a paleta.
- **Desenhar o seu:** use o [Piskel](https://www.piskelapp.com) (grátis, no navegador) ou o Aseprite. Tela de 12×12, uma cor de token, exportado em 40× (480 px). Depois aplique a borda branca (Traçado 22 px no Photopea) ou rode `kit_ferramentas/adesivo_pixel.py`.
- **Usar um set aberto como base** (redesenhe na grade e na cor do token; não cole o colorido):

| set | licença | pode? |
|---|---|---|
| **Noto Emoji** (Google) | imagens Apache 2.0; fonte OFL 1.1 | sim, uso comercial sem crédito na tela; guarde a licença no seu FONTES |
| **Fluent Emoji** (Microsoft) | MIT | sim, mesma coisa |
| **Twemoji** (gráficos) | CC BY 4.0 | sim, **com crédito** (na legenda do post, não na tela) |
| **OpenMoji** | CC BY-SA 4.0 | com cuidado: exige crédito **e** "compartilha igual" na obra derivada; evite em peça comercial |
| Apple, Samsung, WhatsApp, Facebook/Meta, imagens do Emojipedia | proprietárias | **não** |

As 10 grades de `kit_template/icones.json` foram desenhadas para o curso e podem ser usadas à vontade.

---

## 4. Prompts

### 4.1 Prompt de roteiro (cole em qualquer LLM)
```
Escreva um roteiro de Reel narrado, 140–160 palavras (≈55 s), em português do Brasil falado,
para [PÚBLICO, ex.: adolescentes de 14–16 anos], sobre [TEMA: a origem de ___].

Estrutura obrigatória:
1. Gancho com crença errada: "[X] vem de [Y], né? Faz sentido. Só que não." + 1 frase de virada.
2. Origem concreta: LUGAR + ANO + OBJETO, frases curtas.
3. O problema em um NÚMERO + uma comparação com hoje em 3–4 palavras.
4. A pessoa (nome) e a ideia dela num gesto concreto ("desenhar o sentimento").
5. Avalanche: duas listas de substantivos concretos, um por batida ("Sol. Nuvem. Coração.").
6. A confusão desfeita: a coisa parecida que não é, + a etimologia/explicação real.
7. Fecho que volta ao começo: um fato final surpreendente e
   "Ou seja: aquele [X] que você [verbo] hoje... é [imagem forte]."

Regras: 1–2 substantivos concretos por frase (coisas que viram imagem); frases emendadas, sem pausas
dramáticas; 2–3 piadas DENTRO do dado; nada de "imagine", "você sabia", "neste vídeo";
nada de resumo no final; cada fato precisa de fonte (liste as fontes separadas, fora do roteiro).
Entregue também uma tabela: frase | palavra-alvo | o que aparece na tela (foto, ícone de pixel ou texto).
```

### 4.2 Prompts de imagem (a foto vai virar retícula, então a composição pesa mais que o detalhe)
Use fundo simples, um objeto ou uma cena clara, **sem texto**, com contraste forte. Exemplos usados:
```
Candid film photograph of a crowded street crossing in Shibuya Tokyo at night in 1999, teenagers in late 90s fashion walking, blurred neon lights and shop signs, Fujifilm color film, grain, documentary street photography, no readable text
Studio product photograph of a silver Japanese flip phone from 1999, opened, small plain light grey screen with nothing on it, rounded keypad, stubby antenna, centered on a plain pure white background, soft shadow, sharp focus, vertical
Top-down photograph of a hand holding a pencil filling small squares on graph paper to draw a pixel art heart, 1990s office desk, warm light, film photo, no text
Photograph of a white modern art museum gallery wall showing a large grid of many small framed pixel art icons, two teenagers seen from behind looking at the wall, soft gallery lighting, minimal, documentary photo
```
Padrão: `[tipo de foto] of [objeto/cena do ano X], [época], [luz], [fundo simples], no text`. Objeto que vai ser recortado pede "on a plain pure white background".

### 4.3 Retícula: parâmetros que funcionaram (`adesivo_foto.py`)
| foto | cor | célula | gama | clareia |
|---|---|---|---|---|
| rua à noite (escura) | rosa | 12 | 0,62 | 0,38 |
| mão sobre papel | azul | 12 | 0,55 | 0,5 |
| mangá P&B | azul | 9 | 1,2 | 0,55 |
| mapa / gráfico chapado | azul | 9 | 1,4 | 0,5 |
| placa contra o céu | azul | 9 | 0,7 | 0,5 |
| museu (claro) | lima | 12 | 0,7 | 0,3 |

---

## 5. Erros comuns (todos cometidos por nós em versões anteriores)
1. **Fundo diferente a cada cena.** Mata o estilo: é UMA página do começo ao fim.
2. **Câmera parada ou corte seco.** Entre viagens, a câmera continua em deriva. Nada fica parado por mais de ~1,5 s e não existe corte.
3. **Câmera que anda sem destino.** Toda viagem termina num adesivo que a voz está dizendo.
4. **Salada de recortes.** Três ou mais tipos de objeto (vetor, 3D, foto colorida, emoji de fabricante). São dois tipos, uma família de fonte, três técnicas de movimento.
5. **Página toda viva ao mesmo tempo.** O confete treme, pisca, gira. Só o adesivo da vez se mexe.
6. **Mola, quique, overshoot no pouso.** Deixa infantil (cara de 8–12 anos). O pouso é ease-in seco.
7. **Palavra pintada de cor, pílula atrás da legenda, X vermelho no "não".** Use risco físico e nada mais.
8. **Card que repete a voz.** Se a voz diz "museu de arte moderna de Nova York", a tela não escreve isso. A tela mostra o que a voz **não** diz (um tweet hoje · 280).
9. **Carrossel** (itens passando um atrás do outro no mesmo lugar). Nesta peça foram zero: a grade se redesenha no lugar.
10. **Crédito, tag "imagem gerada" ou fonte na tela.** Nada disso vai na tela. Fontes e licenças ficam num arquivo à parte, e o aviso de IA vai uma vez na legenda do post.
11. **Texto encostando em objeto ou texto em cima de foto.** Mantenha ≥120 px de folga entre confete e texto e zero sobreposição texto × objeto.
12. **Zoom linear nos mergulhos.** O fim do mergulho dispara. Use escala em log (expressão do AE ou o template).
13. **Quadriculado que some ou vira borrão no zoom.** Papel em vetor ou em alta resolução (no template, a grade dupla resolve).
14. **SFX alto ou sintetizado.** Use foley real, passa-baixa, 13–19 dB abaixo da voz, e só nos 4–5 momentos físicos.
15. **Música brigando com a voz.** Trilha ≥11 dB abaixo, e confira no alto-falante do celular.
16. **Voz acelerada demais ou com pausas dramáticas.** O teto é 1,1×. Frases de uma palavra só no TTS viram pausa: emende.
17. **Fim que resume.** Termine com "ou seja: aquele X... é Y" e volte ao quadro 0.

---

## 6. Checklist antes de publicar
**Roteiro**
- [ ] 140–160 palavras, 45–60 s, gancho com crença errada nos primeiros 3 s
- [ ] 1–2 substantivos concretos por frase; 2 avalanches; 2–3 piadas dentro do dado
- [ ] Fecho volta ao começo ("Ou seja...") e não resume
- [ ] Fatos com fonte num arquivo à parte (fato duvidoso = corta)

**Visual**
- [ ] Uma página só, papel `#FAF8F3` com quadriculado, do quadro 0 ao último
- [ ] Só as cores da paleta (1.1) e só Bricolage Grotesque (800 título / 650 etiqueta)
- [ ] Só 2 tipos de objeto: foto em retícula duotone com borda branca + pixel 12×12 de uma cor
- [ ] Nenhuma palavra pintada; nenhum card repetindo a voz; nenhum crédito na tela

**Movimento**
- [ ] A câmera nunca para: viagem (0,5–0,6 s, curva .75/0/.35/1) → deriva (+2–3%) → viagem
- [ ] Cada viagem chega ~0,05 s depois da palavra-alvo, com o alvo em (540, 1000)
- [ ] Pouso: −40 px, 108% → 100%, 0,34 s, ease-in, sem mola, contato na palavra
- [ ] Texto: sobe por máscara, expo.out 0,5 s, ~0,1 s antes da palavra
- [ ] 2–3 mergulhos (zoom em log) + 1 recuo MAXI (0,32×) perto do fim
- [ ] Último quadro = primeiro quadro (laço)
- [ ] Confete parado, longe do texto; 30 fps; nada treme

**Som**
- [ ] Voz −16 LUFS, ≤1,1×; trilha ~11,5 dB abaixo, com duck leve
- [ ] 4–5 SFX de foley real, passa-baixa, 13–19 dB abaixo da voz
- [ ] Master −13,5 LUFS / pico ≤ −1,5 dBTP; ouvido no alto-falante do celular

**Entrega**
- [ ] 1080×1920, H.264, 30 fps, AAC 48 kHz; cópia 720p para mandar no celular
- [ ] Legenda do post com o aviso "imagens geradas por IA" (se houver) e créditos de licença CC BY (se houver)

> **Sem motor local de imagem:** as fotos também podem sair de um gerador online (fizemos uma segunda peça neste motor, sobre a gíria "farmar aura", com imagens do Flow/Nano Banana). Com meme ou pessoa real, use foto limpa ou clipe real: retícula pesada esconde o assunto.

> **Revisão posterior:** o recuo que mostra a página inteira é o ponto mais fraco do exemplo (lê como "mostrar o esqueleto"), e alguns trechos não têm elo entre si. Em peça nova, cada viagem precisa de um elo (um elemento vira ou leva ao próximo) e o fim não deve ser um mosaico de tudo. Detalhes na receita do estilo.
