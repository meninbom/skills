# Revisor de quadros (exemplo: LUMEN)

**Regra: quem gera não aprova.** Cada quadro (storyboard, placa do H3, capa) passa por um revisor que começa do zero: um subagente novo, sem a conversa de quem gerou.

Ele olha cada quadro em tamanho cheio, do lado das fichas, e marca APROVADO ou REPROVADO com o erro escrito. Só o que passa vai pra quem dirige a série.

**Por quê:**
- O agente que gerou o storyboard do ep7 disse "conferi cada quadro" olhando a prancha em miniatura.
- A direção achou mais de 10 errados em 41.
- Braço faltando e perna flutuando somem em miniatura.

## Calibração (storyboard v3 do ep7)
- **Revisor:** reprovou 24 de 41.
- **Direção:** marcou só 2, o 10 (flecha invertida) e o 40 (quadro feio, e o Nico sem cachecol). Os dois estavam entre os 24: o revisor **pega o que o olho humano pega**, mas barra demais.
- **A direção vence.** Quadro aprovado por quem dirige não se refaz pelo que o revisor apontou; o apontamento vira aviso pra animação.
- **Pra próxima rodada:** separar o que o público vê no celular em 2 s, que REPROVA, do que é continuidade fina, que vira AVISO e não reprova sozinho.
  - Reprova: membro sumido, flutuando, personagem trocado ou sem o item marcante, objeto invertido, poder que não existe, quadro feio.
  - Aviso: que mão segura o arco, o estado do braço entre quadros, diferença pequena de escala.
- **Uso certo:** o revisor é o filtro ANTES da aprovação humana, pra ninguém perder tempo com o óbvio. Não é juiz depois dela.

## Como rodar
1. `python ciclo/revisor/preparar.py --lista <ESCOLHIDOS.txt> --pasta <ep>/quadros --desc <descricoes.json> --fichas <ficha1.jpg,ficha2.jpg> --saida <ep>/revisao`
   - Gera `entrada.json`, com nº, arquivo, o que o quadro devia mostrar e quem aparece.
   - Gera `zoom/NN_cima.png` e `zoom/NN_baixo.png`, as metades em tamanho cheio.
2. Abrir 2–3 subagentes em paralelo (Agent, general-purpose), cada um com uma fatia dos números.
   - O prompt é o bloco "PROMPT DO REVISOR" abaixo, com a pasta e a fatia preenchidas.
   - O subagente não recebe a opinião de quem gerou.
3. Cada um grava `<saida>/parte_<X>.json`. `python ciclo/revisor/juntar.py <saida>` junta tudo em `veredito.json` e `REVISAO.md`.
4. **Reprovado:** refazer ou editar no gerador de imagem, com o `conserto` do revisor no prompt, e revisar de novo só esse quadro.
   - Máximo de 3 voltas.
   - Na 4ª, vai pra decisão humana como "quadro problema", com as 3 tentativas lado a lado.
5. O `ciclo.py` (nó `imagens`) não deixa plano seguir pro H3 sem APROVADO no `veredito.json` da revisão.

## A lista fixa
Cada item vem de um erro real que passou na série. Erro grave reprova; o resto vira aviso. **Esta é a lista do LUMEN: reescreva os itens 3, 4, 7 e 9 e as fichas com os personagens da SUA série.**

| # | Item | Reprova quando | De onde veio |
|---|---|---|---|
| 1 | **Anatomia** | Personagem com braço, mão ou perna faltando, fundido, a mais ou cortado de um jeito que parece amputado. Membro escondido só vale se o motivo for óbvio (atrás do corpo, fora do quadro pela borda). | "Iara sem braço/perna" (5, 15, 16), "Nico bugado" (14) |
| 2 | **Peso e chão** | Pé que não pisa em nada, perna "fantasma" que some na névoa, corpo flutuando sem motivo. A Iara pendurada na mão do General é de propósito. | "ele tá flutuando" (22) |
| 3 | **Escala** | General sem ter quase 2× a altura do Nico; Iara sem ser adulta e bem mais alta que o Nico; Nico grande demais. | "proporção errada" (11), "proporção zoada" |
| 4 | **Igual à ficha** | Ver os pontos de cada personagem abaixo. | "General virou cavaleiro" e "Iara virou a velhinha" (15), "rosto do General diferente do ep6", "Nico errado" (38), "3 tá diferente" |
| 5 | **Faz o que a cena pede** | Ação, quem está em quadro, direção do olhar ou expressão diferentes da descrição. Mirar sem olhar pro alvo, olhar pra câmera, cara neutra quando a cena pede tensão. | "Nico com cara de paisagem" (8); ep6 S15: "Nico me olhando pra tela, não mirando no General" |
| 6 | **Objetos** | Flecha maior que o arco ou grossa; flecha apontando pra outro lado; arco ao contrário ou na mão errada quando a cena define. | "flecha gigante", "arco ao contrário" (A1-01) |
| 7 | **Geografia** | Em plano com os três: Nico fora da ESQUERDA, General fora da DIREITA, Iara fora da mão dele. Vale quando a descrição pede; quebrar o eixo sem motivo confunde. | "história sem pé nem cabeça" (v3) |
| 8 | **Ninguém a mais** | Personagem repetido, figurante, 2 Generais, Nico duplicado. | quadro 40 antigo |
| 9 | **Lugar** | Quarto diferente do quarto da série (cápsula, janela, móveis); floresta virando outro lugar; lua aparecendo. | "o quarto mudou", "sem lua" |
| 11 | **Deriva no clipe (vale pra vídeo)** | O personagem muda em relação ao quadro de entrada e vira "Pixar": rosto de animação de estúdio com olho grande e cílio, nariz desenhado, íris acesa apagada, concha do General virando elmo ou robô. Conferir lado a lado o quadro de entrada e os quadros do clipe em 0,1 s, no meio e no fim. | teste com outros modelos de vídeo: redesenharam os personagens no 1º meio segundo |
| 10 | **Plano** | Tudo de perto sem motivo: cena de ação que pede plano aberto saindo em close. | "tudo de perto, sem perspectiva" (v3) |
| — | Avisos (não reprovam) | Estilo um pouco diferente, luz, detalhe de roupa pequeno, mão meio mole, fundo genérico, texto ou letra na imagem. Só a íris dos personagens brilha (exceção: os anéis do General). | |

### Fichas (o que tem que bater)
- **NICO:** menino pequeno, cabelo castanho-escuro bagunçado, rosto redondo moreno, cachecol amarelo-mostarda, túnica verde de manga curta, alça de couro no peito, calça e botas marrons, arquinho de madeira pequeno, aljava.
  - No mundo real (quarto, cápsula): pijama claro, mesmo rosto.
  - **Olho:** o da FICHA, **bolinha preta**. Olho grande com branco aparecendo reprova. Também reprova o mesmo personagem trocando de olho entre quadros (aconteceu: no storyboard o olho mudava de quadro pra quadro).
- **IARA:** SÓ a mulher alta do MEIO da ficha.
  - Casaco verde-escuro com capuz, ombreiras de folhas de cobre, trança branca longa, pele morena, íris âmbar acesas.
  - NUNCA a velhinha. NUNCA criança.
- **GENERAL:** capacete-concha oco SEM rosto, com anéis azuis acesos dentro.
  - Armadura cinza-escura angulosa, membros longos e finos, capa cinza rasgada, cubinhos de pixel cinza saindo do corpo.
  - NUNCA cavaleiro medieval com viseira. NUNCA com rosto.

## PROMPT DO REVISOR (copiar, preencher <CAMINHO>, <PASTA> e <NUMEROS>)
```
Você é o revisor de quadros do LUMEN (série em massinha 3D). Você NÃO gerou estes quadros e não tem que defendê-los.
Seu trabalho: achar o erro antes de quem dirige a série achar. Na dúvida, REPROVA: refazer o quadro custa 1,5 min;
deixar passar custa a confiança de quem aprova.

1. Leia <CAMINHO>/ciclo/revisor/REVISOR.md (a lista fixa e as fichas).
2. Leia <PASTA>/entrada.json. Abra as fichas listadas em "fichas" (Read em cada imagem) e guarde como cada um é.
3. Pra cada quadro dos números <NUMEROS>:
   - abra o quadro inteiro (campo "arquivo");
   - abra as duas metades em tamanho cheio ("zoom_cima", "zoom_baixo");
   - conte, por personagem, braços, mãos, pernas e pés, e diga onde está cada um;
   - compare com a ficha e com a "descricao" (o que a cena devia mostrar);
   - passe a lista fixa item por item (1 a 10).
4. Grave <PASTA>/parte_<LETRA>.json, uma lista com um objeto por quadro:
   {"n": 5, "arquivo": "...", "veredito": "APROVADO" | "REPROVADO",
    "contagem": "Iara: 2 braços (esq. no pulso dele, dir. esticado), 2 pernas penduradas; General: só o braço entra pela direita",
    "erros": [{"item": 1, "o_que": "a mão direita da Iara some dentro da manga, parece cotoco", "onde": "meio do quadro, à esquerda"}],
    "avisos": ["..."],
    "conserto": "frase curta em português pra colar no pedido de edição da imagem (só se REPROVADO)"}
   Seja específico em "o_que" e "onde". "Proporção estranha" sozinho não serve; diga quem, quanto e onde.
5. Responda no fim só: quantos aprovados, quantos reprovados e os números reprovados com 1 linha de motivo cada.
```
