# DIREÇÃO DE ARTE: Emoji v3, "Agenda de purikura"

_Direção de arte do exemplo "de onde vem o emoji" (56 s). A versão anterior parecia infantil; o pedido desta foi: mais colorida, mais fofa, com refinamento, um pouco mais juvenil (14–16 anos), com cara de colagem MAXI._

## 1. Por que a v2 parecia de 8–12 anos
- Tinha fundo pastel diferente a cada cena.
- Carinhas redondas e multidão de cápsulas eram personagens 2D desenhados em código.
- O "NÃO!" vinha com um X vermelho.
- As legendas eram pílulas com palavra pintada.
- Usava muitos tipos de objeto (celular vetorial, livro, avião de papel, CRT, museu de silhueta).

## 2. As 3 direções pensadas
- **A · Agenda de purikura (colagem maximalista).**
  - É uma página de agenda de adolescente japonesa de 1999.
  - Tudo é adesivo: fotos em retícula e adesivos de pixel 12×12.
  - Uma câmera contínua percorre a página.
  - Refs: e01 Sticker ("fluidez, direciona o olhar"), e02 Colagem (reprovada só pela tremedeira e pelo excesso simultâneo) e as réplicas BlaBlaLab de câmera dolly.
- **B · Mundo 12×12.** Pixel colorido PICO-8 do começo ao fim. Ficou de fora porque o nosso pixel ainda não chega no nível da referência e vira cara de jogo retrô.
- **C · Tela do keitai.** UI Y2K em tela cheia. Ficou de fora porque é fria, repete o celular da v2 e força o MoMA e o "e+moji" para dentro de uma interface.

**Crítico independente:** escolheu a **A, enxugada**: 2 tipos de objeto, um fundo, 5 tokens, uma família e 3 técnicas. Também apontou 3 armadilhas:
1. salada de recortes;
2. página toda viva ao mesmo tempo;
3. repetir a v2 (contador em card, "NÃO!" com X).

## 3. A direção
**A ideia:** a história inteira está colada numa página de agenda quadriculada. A câmera passeia por ela, e cada viagem termina no adesivo que a voz está dizendo. Perto do fim, um único recuo mostra a página cheia, que é o momento MAXI. Depois a câmera volta para o coração do começo, e o vídeo fecha em laço (o último quadro é igual ao primeiro).

### Paleta fixa
| token | hex | papel |
|---|---|---|
| papel | `#FAF8F3` | a página, do primeiro ao último quadro |
| linha | `#DCE2F0` | quadriculado (contínuo em qualquer zoom, grade fractal de 2 camadas) |
| tinta | `#1B1631` | todo texto e os pontos da retícula |
| rosa | `#FF4FA3` | 1999 / Tóquio / celular; o coração; o risco em "emotion"; a mesa fora da página (só no recuo) |
| azul | `#3157FF` | o processo do Kurita (mão, mangá, tempo, placa) |
| lima | `#9ADB2A` | hoje / museu |

Nenhuma palavra fica pintada. A cor está só nos adesivos e no risco físico sobre "emotion".

### 2 tipos de objeto
1. **Foto-adesivo.** Imagem do Z-Image local passada por retícula AM duotone (tinta sobre o token clareado), com borda branca de adesivo recortado e uma sombra só (`img/stickers.py`). São 7: Shibuya à noite, o celular flip (o NEC N501i do i-mode era flip), a mão desenhando em papel quadriculado, mangá, mapa do tempo, placa de pedestre e a parede do museu.
2. **Adesivo de pixel 12×12.** Desenhado por nós, uma cor por ícone, como no set de 1999. Não são os desenhos do Kurita. São SVG nítidos em qualquer zoom, com borda branca do mesmo pixel (`img/pixel.py`). Servem de herói, de folha de 176 e de confete.

O texto do LCD (DepartureMono) é diegético: faz parte do celular, não é uma segunda família.

### Uma família tipográfica: Bricolage Grotesque
- **800** para títulos na página.
- **650** caixa-alta para etiquetas.
- Kanji em Yu Gothic Bold (subconjunto 絵文字).

### Só 3 técnicas de movimento
1. **Travelling da página.**
   - Curva `mover` (.75,0,.35,1). Todo movimento tem destino: o adesivo da vez.
   - Entre viagens há uma deriva lenta, com escala 1,02–1,03.
   - Mergulhos em escala logarítmica: no LCD (3,8×), numa figurinha da folha (17×, ela vira a grade editável) e no coração (9×).
2. **Pouso.** O adesivo cai na página (−40 px, 1,08 → 1, power2.in 0,34 s), sem mola. O "descolar" é o mesmo gesto ao contrário (1,06), no fecho.
3. **Linha subindo por máscara.** expo.out 0,5 s, cerca de 0,1 s antes da palavra.

### Mapa de atenção (o alvo de cada palavra)
- "Emoji vem de emotion" → coração + "emoji"; "emotion" sobe; um risco rosa em "Só que não".
- "japonês" → 絵文字.
- "Tóquio, 1999" → foto de Shibuya pousa, + "1999".
- "celular" → o celular pousa; o LCD mostra "conectando" na palavra "internet" e "i-mode" no "i-mode"; "NTT Docomo" ao lado.
- "250 caracteres" → mergulho no LCD: a mensagem é digitada e o contador sobe junto até 250/250 (a tela mostra o número, sem card).
- "Menos que um tweet" → sai pelo mesmo eixo e entra "um tweet hoje · 280" ao lado do celular (a tela sabe mais que a voz).
- "Shigetaka Kurita" → foto da mão desenhando + nome; "ideia" → a câmera aproxima; "sentimento" → um coração de pixel pousa na foto.
- "mangá / previsão do tempo / placa de rua" → 3 fotos pousam, uma por palavra.
- "176 figurinhas" → a folha enche em onda e "176" sobe.
- "12 por 12 pixels" → mergulho numa figurinha, que vira a grade; a régua 1–12 entra em cima no 1º "12" e do lado no 2º.
- "Sol. Nuvem. Coração. Lâmpada. Bomba." → a grade se redesenha a cada palavra (sem carrossel: carrossel = 0 nesta peça).
- "no lugar de uma frase inteira" → a frase "tô com saudade, vem logo pra casa" colapsa dentro do coração.
- "dois pontos, traço, parêntese" → `:` `-` `)` sobem um por palavra; "Rosto" → o grupo gira 90° e vira rosto.
- "E, desenho / moji, letra" → 絵 + 文字 com "e / moji" e "desenho / letra"; "emotion?" → "≠ emotion"; "coincidência" → a câmera chega nele.
- "2016 / MoMA" → a foto do museu pousa, "2016" e "MoMA". A legenda "museu de arte moderna de Nova York" saiu, porque a voz já diz.
- "Ou seja" → recuo único (0,32×: a página cheia, 71% da largura) e volta ao coração; "peça de museu." sobe; tudo sai e sobra o quadro 0.

### Confete
- São adesivos de pixel pequenos (56–104 px), parados, só nas sobras.
- Ficam a ≥120 px de qualquer texto ou objeto.
- Dão a densidade MAXI sem disputar o foco: só o adesivo da vez se mexe.
- Nada treme: 30 fps, sem 12 fps e sem boil.

## 4. Regras conferidas
- **Sem crédito na tela.** As fotos são geradas e a nota fica em `FONTES.md`.
- **Carrossel 0×.**
- **Nenhum destaque colorido de palavra.**
- **Nenhum card repetindo o que a cena mostra.** O 250 está no LCD. O 12×12 é uma régua de contagem, não legenda. O "Nova York" foi cortado.
- **Camadas** (`../sanduiche/_tools/medir_camadas.py hf`):
  - 0 texto × objeto, 0 texto × texto, 0 objeto acima de texto.
  - Os avisos de margem que sobram são confete e adesivos cortados pela borda do quadro, de propósito (a página continua fora da tela), e 1 quadro do recuo.
- **Fala × roteiro:** STT 99%.
- **Rodadas de crítica** ("isso é pra teen de 15 anos, refinado e coerente?"):
  - **r1:** 8 correções. Entre elas: recuo ilegível, página vazia antes do 176, zoom sem o quadriculado, frase pequena, blocos parados e legenda do MoMA repetindo a fala.
  - **r2:** "coerente e refinado para 15 anos", com 4 ajustes: frase maior, laterais do recuo em papel escuro em vez do rosa, deriva no fecho. O 4º item era uma leitura errada da saída do zoom do LCD.
  - **r3:** é o final.

## 5. Roteiro, voz e som
- **Roteiro:** `roteiro/roteiro_fala.txt`, revisado. Tirei "desenhinho" e a idade, que não bate entre as fontes: a AP diz 25 anos, mas a Wikipedia dá nascimento em 1972. Entrou "Menos que um tweet" e o fecho mudou para "é peça de museu". Fatos e fontes em `FONTES.md`.
- **Voz:** ElevenLabs, voz masculina brasileira, modelo v3, acelerada 1,08×. Narração de 1.085 caracteres. **Pontos para conferir de ouvido: "peça" aos 54,6 s** (os medidores ouviram /t/) e "moji" aos 43,5 s.
- **Som** (`som/mix.py`):
  - Trilha: "Chill Japan" (Pixabay), 11,5 dB abaixo da voz, com duck leve na fala.
  - 5 SFX reais da biblioteca, todos com passa-baixa, 13–19 dB abaixo da voz:
    - carta de papel no pouso de Tóquio e do museu;
    - teclas de um flip phone real enquanto o contador sobe;
    - lápis colorido na grade;
    - folha deslizando no recuo.
  - Master −13,5 LUFS.

## 6. /checar-video no final (`render/final_qa/QA.md`)
- **Passou em:**
  - parado: máx. 0,87 s;
  - sem engasgo, sem flash e sem quadro vazio;
  - −13,6 LUFS e −1,4 dBTP;
  - celular −19,7;
  - STT 99%.
- **As "falhas" são falso positivo:**
  - "texto na borda": em todos os casos o quadro está no meio de uma viagem de câmera, com a palavra entrando ou saindo da tela;
  - "palavra quebrada": é o cursor "_" do LCD lido como hífen.
