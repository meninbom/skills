# LUMEN: onde o público sai (ep1 a ep5)

Análise dos cinco primeiros episódios, vídeo a vídeo, cruzada com os gráficos de retenção do Instagram (ep2 a ep5; o ep1 não tem métricas). É o modelo de como ler a retenção da sua própria série.

## Episódios analisados
ep1 (127,0 s), ep2 (123,2 s), ep3 (96,1 s), ep4 (138,9 s) e ep5 (105,4 s), nas versões que foram ao ar.

## Como foi medido
- **Folhas:** 1 quadro a cada 2 s. Também há folhas de 1 em 1 s para o começo (0–10 s) e o fim (últimos 15 s). 
- **Transcrição:** faster-whisper medium, na CPU (`epN_stt.json`, com o tempo de cada palavra).
- **Cortes:** detector de cena do ffmpeg (scdet 6). Ele perde algumas fusões, então os números são aproximados.
- **Volume:** ebur128, com o volume medido dentro e fora da fala.

## O que os gráficos mostram (resumo)
- O meio segura muito bem: platô de 60–70%.
- O vídeo perde em dois lugares:
  1. nos primeiros ~8 s, de 25 a 32%;
  2. nos últimos 8–12 s, a parte da escolha.
- O ep4 tem dois degraus no meio: um em 35–40 s e outro em ~1:57.
- O ep2 tem um degrau pequeno em ~45 s.

## Números lado a lado

| | ep1 | ep2 | ep3 | ep4 | ep5 |
|---|---|---|---|---|---|
| duração | 127 s | 123 s | 96 s | 139 s | 105 s |
| planos (aprox.) | 80 | 56 | 40 | 39 | 44 |
| duração média do plano | 1,6 s | 2,2 s | 2,4 s | **3,6 s** | 2,4 s |
| duração do 1º plano | 1,9 s | ~2,5 s | ~3,5 s | **5,5 s** | **5,4 s** |
| 1ª frase | "E se o seu emprego fosse jogar?" | "Vocês votaram 2" | "Vocês votaram 1" | "Vocês votaram 1" | "Vocês votaram 1" |
| 1ª frase com tensão | 0 s | 5,5 s ("Só que no nível 1…") | 3,7 s ("10 erros") | 8,1 s ("terminou pior do que começou") | 3,7 s (fraca); a real vem aos 13 s |
| 1º acontecimento forte na tela | ~56 s (1ª flecha); antes disso, só montagem do mundo | 0 s (Nico fugindo do javali) | 4 s (flecha errando, "ERROU") | 8 s (tronco cheio de flechas, "ERROU") | 14 s (flecha no lobo, "84" / "410") |
| velocidade da fala | 186 palavras/min | 168 | 166 | **155** | 193 |
| começo da escolha até o fim do vídeo | 6,8 s | ~8 s (contando "fez a conta": 18 s) | ~9 s (as opções começam a ser ditas em 82 s: 14 s) | **25 s** ("Opção 1:" em 1:54) | 5,8 s |
| perda nos primeiros 8 s (gráfico) | sem dado | ~30% | ~28% | ~32% | **~25%** (a menor) |

- **Volume:** todos saem a −13,5 LUFS. A voz fica em ~−14 LUFS momentâneo. Sem voz, a música fica em −23 (ep1) e entre −28 e −31 (ep2–ep5). Ou seja, a música fica de 10 a 16 dB abaixo da voz. **O som não explica as quedas.**
- **Planos parados:** não há nenhum trecho de 3 s ou mais sem movimento. A câmera sempre anda.
- **Planos longos (mais de 4 s):**
  - ep4: 16 planos (o maior tem 15,8 s, aos 50 s, na tela do boleto/áudio do Seu Ademir);
  - ep3: 9 planos;
  - ep5: 9 planos;
  - ep2: 6 planos;
  - ep1: 1 plano.

---

## Ep1 "O Arqueiro" (sem métricas; análise só pelo vídeo)
**0–10 s.**
- Fala: "E se o seu emprego fosse jogar? 2047. Quase não tem vaga aqui fora. Então meio mundo trabalha dentro de um jogo, o Lumen…"
- Tela: Nico no quarto com a cápsula → cidade com o outdoor LUMEN → fila na "AGÊNCIA SEM VAGAS" → galpão de cápsulas → título LUMEN.
- Corte a cada ~1,6 s. É o único ep que abre com uma pergunta ao espectador, em vez de "Vocês votaram".

**Pontos de queda prováveis:**
- **0–30 s:** é só explicação do mundo (boleto, parcela, cápsula, raio-X do cérebro). Ainda não há personagem fazendo nada, nem perigo. Quem não se pega pela premissa sai aqui.
- **24–28 s e 34–37 s:** hologramas de corpo e ouvido. Isso é aula antes de haver história.
- **~1:28–1:37:** bloco de raio-X do "olho quieto", com 9 s fora da cena.

**Últimos 15 s (1:52–2:07).**
- O chefe aparece (bom gancho).
- 2:02: tela escura com as opções "Arriscar no bullseye / Fugir e vender a pena". Nos primeiros quadros, a tela ainda está quase vazia (só texto pequeno).
- 2:04–2:07: Nico dormindo na cápsula + "Comenta 1 ou 2" + "PARTE 2" grande.
- Quem já viu o chefe tem pouco motivo para ficar nos 5 s de menu.

## Ep2 "A Mestra" (média 1:09 de 2:03)
**0–10 s.**
- 0,0–5,2 s, fala: "Vocês votaram 2, ele correu, pena no bolso, metade do aluguel garantida."
- Tela:
  - 0–2 s: Nico correndo do javali, com o placar de votos ("VOTOS DO EP. 1");
  - 3–5 s: close da pena no bolso;
  - 6–10 s: o vídeo sai da cena e vira um holograma azul do corpo ("NV 1"), com "gente comum corre uns 20 por hora".

**Pontos de queda:**
- **0–5 s (−30%):**
  - a 1ª frase é recapitulação. Para quem não viu o ep1, "votaram 2" não quer dizer nada;
  - a única imagem de perigo some aos 2 s;
  - aos 6 s, o vídeo vira uma aula de anatomia.
- **~40–48 s (degrau pequeno):**
  - O clímax acabou de acontecer: a flecha no olho do javali, em 38–39 s. Logo depois, a história desacelera de propósito: "O Nico viu uma figura lá no alto, uma velhinha, ela demorou uma eternidade pra descer".
  - A tela mostra planos abertos e calmos: a silhueta pequena no morro (40–43 s) e uma piada de relógio acelerado ("0:31:45 → 2:11:45") sobre a paisagem, com a personagem minúscula no quadro (43–45 s).
  - A tensão foi resolvida e nada novo foi prometido. É o ponto natural de sair.
- **1:52–2:03 (cai para ~15%):**
  - 1:44–1:51: o Nico "faz a conta", com uma barra 50/50 explicando o acordo (8 s de explicação);
  - 1:52–1:54: ele sozinho na praia;
  - 1:55: um quadro **cinza claro e chapado**, com o cartão desbotado (a transição para a tela de escolha pisca em cinza);
  - 1:56–1:59: tela escura com dois cartões ("Aprendiz: divide o loot" / "Solo: fica com tudo");
  - 2:00–2:03: volta para o Nico parado, com "Comenta 1 ou 2 / PARTE 3".
  - São quase 20 s de "regra do acordo" + menu depois que a história já parou.

## Ep3 "O Olho que Manda" (média 1:04 de 1:36; só 37% das views vieram da aba Reels)
**0–10 s.**
- Fala: "Vocês votaram 1. Primeira aula. 10 flechas. 10 erros. Todas pra esquerda. E olha que ele mirou com calma, igual no bullseye. Cara, menino…"
- Tela:
  - 0–3 s: Nico de costas, a Mestra pequena, o boneco-alvo e o placar de votos (plano largo, ninguém se mexe muito);
  - 4–5 s: flecha errando, "ERROU";
  - 6–8 s: Nico mirando;
  - 9 s: close da velha.

**Pontos de queda:**
- **0–3 s (−28%):** "Vocês votaram 1" + um plano largo sem ação. O bom gancho ("10 erros, todas pra esquerda") só chega aos 3,7 s.
- **14–34 s:** 20 s seguidos de holograma (cérebro, dedo apontando "testa aí", cabeças "2 em cada 3"), com um plano de 8 s aos 17 s. O platô aguentou, mas é o trecho mais longo fora da história.
- **1:23–1:36 (cai para ~22% a partir de 1:30):**
  - a Iara diz a escolha ("ou fica uma semana aqui comigo, treinando, sem caçar nada", 1:22–1:27);
  - **o narrador repete a mesma escolha** ("Treina a semana com ela e atrasa a cápsula, ou vai no lobo hoje, com uma flecha só?", 1:27–1:32), com os cartõezinhos 1/2 por cima da cena;
  - 1:33–1:36: tela escura com dois cartões e "Comenta 1 ou 2 / Curte pra parte quatro".
  - A queda começa justamente na repetição.

## Ep4 "Dormir é Treino" (melhor da série: 24,8 mil views, 455 seguidores, 82 envios, 154 salvos; média 1:06 de 2:18)
**0–10 s.**
- Fala: "Vocês votaram 1, uma semana com a Iara. Primeiro dia, 300 flechas. Tudo naquela folha ali. E ele terminou o dia pior do que começou."
- Tela:
  - 0–5,5 s: **um plano só**: Iara de braços cruzados e Nico de pé, parados na clareira, com o placar "VOTOS DO EP. 3 · TREINA 76 / LOBO 48" e "DIA 1/7";
  - 6–7 s: Iara apontando a folha;
  - 8–9 s: tronco cheio de flechas, "ERROU".

**Pontos de queda:**
- **0–8 s (−32%, a pior abertura):**
  - o 1º plano dura 5,5 s, com dois personagens em pé e uma tabela de votos;
  - a frase de tensão ("terminou pior do que começou") só chega aos 8 s.
- **35–40 s (degrau de 62% para 53%, o maior do meio em toda a série):**
  - Desde os 25,5 s, a história parou: "Em 2002, em Harvard, botaram um pessoal pra decorar uma sequência no teclado. Quem ficou acordado? Quase nada. Quem dormiu uma noite voltou uns 20% mais rápido…" (25,5–36,8 s).
  - Na tela, são 18 s de holograma azul: mão no teclado → corpo → pessoa deitada → cérebro.
  - Em 36,8 s entra um plano de 6,3 s do cérebro brilhando, com "Sabe aquilo que você travou de noite e de manhã saiu? É isso."
  - Quem veio pela história sai aqui. Esse mesmo bloco é provavelmente o que gerou os envios e salvos: é uma dica útil fora da ficção.
- **1:54–1:57 (degrau em ~1:57):**
  - A Iara fecha a cena com a melhor fala do ep ("esse aqui foi o último treino que você fez comigo", 1:51–1:54).
  - Logo depois, o narrador vira cardápio: **"Opção 1:"** (1:54), sobre uma tela dividida Iara | Duda.
  - Depois vem a explicação inteira: "Vai sozinho no lobo. Se acertar, paga a cápsula e continua aprendiz da Iara. Se sobreviver." Na tela, uma placa "1 · SOZINHO NO LOBO" sobre o lobo.
  - Depois, **"Opção 2:"** (2:02), com placa "2 · RAID DA DUDA" e mais 9 s de regras.
  - Depois, a pergunta de novo (2:12) e a tela de dois cartões (2:14–2:18).
  - **São 25 s de escolha lida em voz alta**, contra 6–9 s nos outros eps. Quem já entendeu na fala da Iara não espera o menu.
- **2:12–2:18 (fim, ~15%):** tela escura de cartões, "Comenta 1 ou 2 / Curte pra parte cinco".

## Ep5 "A Caçada" (média 1:09 de 1:45; com 1 dia)
**0–10 s.**
- Fala: "Vocês votaram 1, então o Nico foi sozinho no lobo. Só que ele não foi no desespero não. Ele fez exatamente o que a Iara passou a semana inteira ensinando. Dormiu antes, fechou o olho certo…"
- Tela: o lobo de neblina vindo para cima e o Nico de arco armado. É a imagem de abertura mais forte da série, mesmo com o placar de votos (252×6) e "LV 7 vs LV 8".
- O 1º plano dura 5,4 s, e o seguinte também é longo.

**Pontos de queda:**
- **0–8 s (−25%, a melhor abertura):** a imagem já é perigo, então ela segura mesmo com a fala sendo recapitulação.
- **Ainda assim:** o combate que o público votou para ver é **contado em 18 s de narração** ("a primeira flecha pegou no ombro, e a segunda entrou bem no olho… e o lobo caiu"). O 1º impacto só aparece aos 14 s.
- **56–64 s:** holograma do raio e do trovão ("3 s ≈ 1 km"), com um plano de 8,6 s. Não houve degrau no gráfico, porque o fato está ligado a uma cena que acabou de acontecer.
- **1:38–1:45 (cai para ~30%):**
  - o gancho é bom: a mensagem da Duda, "quer saber o que ela fez com o último aluno? Me chama" (1:36–1:39);
  - assim que ele chega, entra "E agora? Ele pergunta direto pra Iara ou responde a Duda?" e a tela escura com dois cartões (1:40–1:45);
  - o final depois da pergunta é curto (5,8 s). Foi o ep que menos perdeu no fim.

---

## O que o ep4 tem de diferente do ep3 e do ep5
1. **Um fato real útil fora da ficção.** "Dormir te deixa ~20% melhor" está no título, na legenda e no meio do vídeo. É coisa que a pessoa manda para alguém, e isso explica os 82 envios e 154 salvos. Esse empurrão levou 73% das views para a aba Reels (no ep3, foram só 37%). O ep3 também tinha um fato ("olho que manda"), mas ele é menos útil no dia a dia.
2. **Problema da vida real no meio da fantasia.** O boleto da cápsula atrasado e o áudio do Seu Ademir ("senão tuas coisas vão pra calçada"), em 50–66 s.
3. **Personagem nova que divide opinião.** A Duda é influencer, com 2 milhões de seguidores e a raid ao vivo. Ela cria lado: Iara × Duda. Comentar vira "torcer", e isso dá a taxa de comentário de 2,6%.
4. **A escolha tem um custo emocional dito por um personagem.** "Esse foi o último treino que você fez comigo." No ep3, a escolha era só logística (treinar × caçar).
5. **Capa nova.** O estilo RPG (título dourado, 1 personagem) entrou no ep4.
6. **O que o ep4 faz PIOR:**
   - a abertura mais lenta (1º plano de 5,5 s, tensão aos 8 s);
   - o plano médio mais longo (3,6 s);
   - a fala mais lenta (155 palavras/min);
   - o vídeo mais longo;
   - o menu de escolha mais longo (25 s).
   - Por isso ele tem a menor fração assistida (~48%). O ep4 venceu pelo **assunto** e pelos **personagens**, não pela montagem.

## Padrões que valem para todos
- **Do ep2 ao ep5, todo episódio começa com "Vocês votaram X"**, sobre um placar de votos. Para quem chega pela aba Reels (a maioria, e quem nunca viu a série), isso é uma frase sem sentido no momento em que ele decide se fica. A perda de 25–32% nos primeiros 8 s acompanha isso. A menor perda foi no ep5, que tinha a imagem mais tensa por baixo da mesma frase.
- **O fim sempre muda de "cena" para "menu":** tela escura, dois cartões pequenos e "Comenta 1 ou 2 / Curte pra parte N". O público lê isso como "acabou" e passa para o próximo. Quanto mais longo o menu, maior a perda: ep4 (25 s) > ep2 e ep3 (~14–18 s com a explicação) > ep5 (6 s).
- **Os hologramas de explicação** só derrubam quando são longos e soltos da cena:
  - ep4, 18 s → degrau;
  - ep5, 8 s ligados à cena → sem degrau.
- **O som está certo em todos.** Voz na frente, música 10–16 dB abaixo.

---

## O que mudar no próximo ep (em ordem de prioridade)
1. **Tirar "Vocês votaram" da 1ª frase.**
   - Abrir no momento mais tenso do ep, com uma frase de perigo no 1º segundo (ex.: "O Nico tinha uma flecha e o lobo já estava correndo").
   - O resultado do voto vai em texto pequeno no placar, ou numa frase de no máximo 2 s **depois** do gancho.
2. **O 1º quadro já é ação, e o 1º corte vem até ~1,5 s.**
   - Nada de dois personagens em pé + tabela de votos (ep4: 5,5 s; ep5: 5,4 s no 1º plano).
   - O 1º impacto visual (flecha, golpe, susto) aparece até 3 s.
3. **A escolha cabe em 1 frase de até 6 s, dita por cima da cena viva.**
   - Nada de "Opção 1: … Opção 2: …" com as regras (ep4: 25 s). Nada de repetir a escolha que um personagem acabou de dizer (ep3, 1:27).
   - As regras de cada opção vão na legenda do post, não na narração.
4. **Acabar no gancho, sem tela de menu.**
   - Os cartões 1/2 entram por cima do último plano, com o personagem ainda reagindo, nos últimos 2–3 s.
   - Cortar a tela escura chapada e o quadro cinza (ep2, 1:55).
   - "Curte pra parte N" só em texto, sem fala.
   - Fazer o último quadro casar com o primeiro (loop), para o replay contar.
5. **Fato real: manter, mas em até 8 s e em cima da cena da história** (ex.: raio-X por cima do próprio Nico, como no ep5 e na referência de game feel). Nunca 18 s de holograma separado (ep4, 25–43 s). O fato é o que traz envios e salvos, então não pode sumir.
6. **O que o público votou para ver tem que ser mostrado, não resumido.**
   - O combate do ep5 foi contado em 18 s de narração. Mostrar em planos curtos.
   - Depois de cada clímax, o próximo problema entra em até 3 s (ep2: a "velhinha que demorou uma eternidade pra descer", 40–45 s).
7. **Mirar 95–110 s e manter o ritmo do ep2/ep5** (plano médio de 2–2,5 s). Usar a fórmula de conteúdo do ep4:
   - fato útil no título;
   - problema da vida real (boleto);
   - dois personagens disputando o Nico;
   - escolha com custo emocional.
