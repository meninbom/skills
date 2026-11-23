# Roteiro: template do estilo EMOJI

Preencha as duas partes:
1. **o texto falado**: 140–160 palavras, ≈55 s;
2. **o mapa de atenção**: para cada frase, a palavra-alvo, o que pousa nela e para onde a câmera vai.

O mapa vale mais que o texto: é ele que vira a animação.

---

## Parte 1: texto falado (preencha os colchetes)

```
[1 · GANCHO, 0–5 s]
[X] vem de [Y], né? Faz sentido. Só que não. [Virada curta: "É japonês."] E nasceu de [um problema / um acidente / uma briga].

[2 · ORIGEM CONCRETA, 5–12 s]
[LUGAR], [ANO]. [OBJETO] [verbo concreto]: [nome técnico], da [empresa/pessoa].

[3 · O PROBLEMA EM NÚMERO, 12–17 s]
Mas [o limite / a regra] era só [NÚMERO] [unidade]. [Comparação com hoje em 3–4 palavras: "Menos que um tweet."]

[4 · A PESSOA E A IDEIA, 17–22 s]
Aí [quem], [NOME COMPLETO], tem uma ideia: [gesto concreto, 2–3 palavras].

[5 · AVALANCHE, 22–35 s]
Ele mistura [substantivo], [substantivo], [substantivo]... e em [tempo] [faz] [NÚMERO GRANDE] [coisas]. Cada uma [detalhe técnico com número].
[Item.] [Item.] [Item.] [Item pra algo.] [Item.]
[Frase que diz o que a avalanche significa: "Um desenho no lugar de uma frase inteira."]

[6 · A CONFUSÃO DESFEITA, 35–47 s]
E [a coisa parecida]? Outra coisa: [as partes dela, uma por batida]. [Definição em 4 palavras.]
[X] é [parte 1], [significado], mais [parte 2], [significado].
A cara de [Y]? Pura coincidência.

[7 · FECHO QUE VOLTA AO COMEÇO, 47–56 s]
Em [ANO], [fato final surpreendente: o objeto foi parar em lugar improvável].
Ou seja: aquele [X] que você [verbo do dia a dia] hoje... é [imagem forte].
```

**Regras do texto:**
- Use **1–2 substantivos concretos por frase**. Cada um vira um adesivo, então "ideia", "conceito" e "processo" não servem como alvo.
- Faça frases **emendadas**: no TTS, frase de uma palavra solta vira pausa. Nas listas de avalanche a pausa é intencional e curta.
- Coloque **2–3 piadas dentro do dado** ("Só que não", "Pura coincidência", "é peça de museu").
- A **tela sabe mais que a voz**: guarde um fato que só aparece escrito (no exemplo, "um tweet hoje · 280").
- **Proibido:** "você sabia", "imagine", "neste vídeo", "e aí, o que achou?", e fim que resume.
- Cada fato precisa de fonte, num arquivo à parte. Fato em que as fontes discordam é cortado. No exemplo saiu a idade do criador, porque a AP e a Wikipedia não batem.
- **Para o TTS:** escreva números por extenso ("mil novecentos e noventa e nove") e nomes estrangeiros do jeito que se lê ("ai-moude", "môdji"). Na tela, eles aparecem na grafia certa.

---

## Parte 2: mapa de atenção

Uma linha por palavra-alvo. **O tempo vem da narração gravada** (início da palavra, em segundos).

Para cada linha, escolha o **tipo**:
- **FOTO** = foto-adesivo que pousa;
- **PX** = adesivo de pixel que pousa;
- **TX** = linha de texto que sobe;
- **MERG** = mergulho da câmera;
- **REC** = o recuo MAXI.

E o **lado da página**: E (x≈600) ou D (x≈1800). Os alvos se alternam entre E e D e vão descendo.

| t (s) | palavra-alvo | tipo | o que aparece | cor | lado |
|---|---|---|---|---|---|
| 0,00 |  | PX + TX | herói + palavra-título (já na tela no quadro 0) | rosa | E |
|  |  |  |  |  |  |

Ordem de cada batida: a câmera **viaja** (0,5–0,6 s) → **chega** ~0,05 s depois da palavra → o objeto **pousa** na palavra (ou o texto sobe ~0,1 s antes) → a câmera **deriva** até a próxima viagem.

---

## Exemplo preenchido: "de onde vem o emoji" (tempos reais da narração)

**Texto (142 palavras, 55,6 s):**
> Emoji vem de emotion, né? Faz sentido. Só que não. É japonês. E nasceu de um problema. Tóquio, 1999. O celular ganha internet: o i-mode, da NTT Docomo. Mas cada mensagem tinha só 250 caracteres. Menos que um tweet. Aí um cara da equipe, Shigetaka Kurita, tem uma ideia: desenhar o sentimento. Ele mistura mangá, previsão do tempo, placa de rua... e em um mês desenha 176 figurinhas. Cada uma numa grade de 12 por 12 pixels. Sol. Nuvem. Coração. Lâmpada pra ideia. Bomba. Um desenho no lugar de uma frase inteira. E emoticon? Outra coisa: dois pontos, traço, parêntese. Rosto feito de letra. Emoji é E, desenho, mais moji, letra. A cara de emotion? Pura coincidência. Em 2016, os originais foram parar no MoMA, o museu de arte moderna de Nova York. Ou seja: aquele emoji que você mandou hoje... é peça de museu.

**Mapa:**

| t (s) | palavra-alvo | tipo | o que aparece | cor | lado | câmera |
|---|---|---|---|---|---|---|
| 0,00 | Emoji | PX + TX | coração 12×12 grande + "emoji" (já na tela) | rosa | E | quadro 0 = último |
| 0,81 | emotion | TX | "emotion" sobe embaixo | – | E | deriva |
| 3,44 | não | risco | risco rosa físico sobre "emotion" | rosa | E | deriva |
| 4,00 | japonês | TX | 絵文字 (250 px) | – | D | viagem 3,50→4,05 |
| 6,37 | Tóquio | FOTO + TX | foto Shibuya 1999 pousa; "Tóquio," / "1999" | rosa | D | viagem →6,40 |
| 8,67 | celular | FOTO | celular flip pousa | rosa | E | viagem →8,75 |
| 9,67 / 10,44 | internet / i-mode | objeto | tela do celular: "conectando" → "i-mode" | – | E | deriva |
| 11,44 | NTT | TX | "NTT" / "Docomo" ao lado | – | E | deriva |
| 13,33–15,04 | mensagem…caracteres | MERG | mergulho 3,8× no LCD; a mensagem é digitada e o contador sobe até 250/250 | – | E | mergulho |
| 16,04 | Menos que um tweet | TX | sai pelo mesmo eixo; "UM TWEET HOJE · 280" (só a tela diz) | – | E | 16,00 |
| 17,10 | (Aí um cara) | FOTO | mão desenhando coração no quadriculado | azul | D | viagem →17,30 |
| 18,11 | Shigetaka Kurita | TX | "Shigetaka" / "Kurita" | – | D | deriva |
| 19,52 | ideia | – | câmera aproxima 1,08× | – | D | aproximação |
| 20,74 | sentimento | PX | coração de pixel pousa na foto | rosa | D | deriva |
| 22,04 / 22,59 / 23,59 | mangá / tempo / placa | FOTO ×3 | 3 fotos pousam, uma por palavra | azul | E | viagem →22,05 |
| 24,50–25,80 | desenha 176 | PX (onda) | folha de 176 figurinhas enche do centro para fora | todas | D | viagem →24,60 |
| 25,78 | 176 | TX | "176" (250 px) | – | D | deriva |
| 28,74 / 29,22 | 12 por 12 | MERG | mergulho 17× numa figurinha, que vira a grade; régua 1–12 em cima e depois do lado | – | D | mergulho →28,45 |
| 30,37–33,26 | Sol. Nuvem. Coração. Lâmpada. Bomba. | PX | a grade se redesenha no lugar, a cada palavra (sem carrossel) | cada um | D | deriva |
| 33,93–35,44 | frase inteira | TX | "tô com saudade, vem logo pra casa" colapsa dentro do coração | – | D | recua para 9× |
| 36,07 | emoticon | TX | "emoticon" | – | E | viagem →36,40 |
| 37,85 / 38,56 / 39,11 | pontos / traço / parêntese | TX | `:` `-` `)` sobem um por palavra | – | E | deriva |
| 39,78 | Rosto | TX | o grupo gira 90° e vira rosto | – | E | deriva |
| 41,44–44,07 | E, desenho / moji, letra | TX | 絵 + 文字, "e / moji", "DESENHO / LETRA" | – | D | viagem →41,55 |
| 45,30 / 46,52 | emotion / coincidência | TX | "≠ emotion"; a câmera chega nele | – | D | aproximação 1,06× |
| 47,44 | 2016 | FOTO + TX | foto do museu pousa + "2016" | lima | centro | viagem →47,45 |
| 49,56 | MoMA | TX | "MoMA" (o "museu de arte moderna de Nova York" **não** vai escrito) | – | centro | aproximação |
| 52,15 | Ou seja | REC | recuo 0,32×: a página inteira | – | – | 51,55→52,15 |
| 53,04 | emoji | – | volta ao coração do começo; coração descola | rosa | E | 52,55→53,50 |
| 54,59 | peça de museu | TX | "peça de museu." sobe | – | E | deriva |
| 55,90–56,40 | (fim) | – | textos extras somem; coração a 106% = quadro 0 | – | E | laço |

**Densidade do exemplo:** 30+ eventos em 56 s, ou seja, um evento novo a cada ~1,8 s. O maior tempo de tela parada foi 0,87 s.
