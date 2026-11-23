# Revisor de quadros

**Regra: quem gera não aprova.** Cada quadro gerado (storyboard, quadro de entrada de vídeo, capa) passa por um revisor que começa do zero: um subagente novo, sem a conversa de quem gerou.

Ele olha cada quadro em tamanho cheio, do lado das fichas dos personagens, e marca APROVADO ou REPROVADO com o erro escrito. Só o que passa segue para você.

**Por quê:**
- Num storyboard de 41 quadros da nossa série, a conversa que gerou disse "conferi cada quadro" olhando a prancha em miniatura. Mais de 10 estavam errados.
- Braço faltando e perna flutuando somem em miniatura.

## Calibração (medida num storyboard de 41 quadros)
- **Revisor:** reprovou 24 de 41.
- **Revisão humana:** marcou só 2 (uma flecha invertida; um personagem sem o item marcante). Os dois estavam entre os 24: o revisor **pega o que o humano pega**, mas barra demais.
- **A pessoa vence.** Quadro que você aprovou não se refaz pelo que o revisor apontou; o apontamento vira aviso para a animação.
- **Separar o que REPROVA do que é AVISO:**
  - Reprova (o que se vê no celular em 2 s): membro sumido, flutuando, personagem trocado ou sem o item marcante, objeto invertido, poder que não existe, quadro feio.
  - Aviso (continuidade fina): que mão segura o objeto, o estado do braço entre quadros, diferença pequena de escala.
- **Uso certo:** o revisor é o filtro ANTES de você, para você não perder tempo com o óbvio. Não é juiz depois.

## Como rodar
1. `python revisor/preparar.py --lista ESCOLHIDOS.txt --pasta <pasta dos quadros> --desc descricoes.json --fichas ficha_a.jpg,ficha_b.jpg --saida <projeto>/revisao`
   - Gera `entrada.json`, com nº, arquivo, o que o quadro devia mostrar e quem aparece.
   - Gera `zoom/NN_cima.png` e `zoom/NN_baixo.png`, as metades em tamanho cheio.
   - Precisa de Pillow (`pip install pillow`).
2. Abrir 2–3 subagentes em paralelo no Claude Code, cada um com uma fatia dos números.
   - O prompt é o bloco "PROMPT DO REVISOR" abaixo, com a pasta e a fatia preenchidas.
   - O subagente não recebe a opinião de quem gerou.
3. Cada um grava `<saida>/parte_<X>.json`. `python revisor/juntar.py <saida>` junta tudo em `veredito.json` e `REVISAO.md`.
4. **Reprovado:** refazer ou editar a imagem com o `conserto` do revisor no prompt, e revisar de novo só esse quadro.
   - Máximo de 3 voltas.
   - Na 4ª, vira "quadro problema": olhe você, com as 3 tentativas lado a lado.
5. `ciclo.py --exige-revisao` não deixa o projeto seguir sem APROVADO no `revisao/veredito.json` para cada plano (o campo `nome` do quadro tem de ser o nome do plano).

## A lista fixa
Monte a SUA lista com os erros que já apareceram no seu projeto. Esta é a da nossa série (série em massinha 3D com três personagens), como modelo: cada item nasceu de um erro real. Erro grave reprova; o resto vira aviso.

| # | Item | Reprova quando |
|---|---|---|
| 1 | **Anatomia** | Personagem com braço, mão ou perna faltando, fundido, a mais ou cortado de um jeito que parece amputado. Membro escondido só vale se o motivo for óbvio (atrás do corpo, fora do quadro pela borda). |
| 2 | **Peso e chão** | Pé que não pisa em nada, perna "fantasma" que some na névoa, corpo flutuando sem motivo. |
| 3 | **Escala** | Proporção entre os personagens diferente da ficha (o grande deixa de ser ~2× o pequeno; a criança fica do tamanho do adulto). |
| 4 | **Igual à ficha** | Roupa, cabelo, rosto ou item marcante diferentes da ficha. Ver "Fichas". |
| 5 | **Faz o que a cena pede** | Ação, quem está em quadro, direção do olhar ou expressão diferentes da descrição. Mirar sem olhar para o alvo, olhar para a câmera, cara neutra quando a cena pede tensão. |
| 6 | **Objetos** | Objeto com tamanho errado, apontando para o outro lado, ao contrário ou na mão errada quando a cena define. |
| 7 | **Geografia** | Personagens trocando de lado entre planos da mesma cena sem motivo (quebra de eixo). |
| 8 | **Ninguém a mais** | Personagem repetido, figurante que não existe, duplicata. |
| 9 | **Lugar** | Cenário diferente do já mostrado (móveis, janela, horário do dia). |
| 10 | **Plano** | Tudo de perto sem motivo: cena de ação que pede plano aberto saindo em close. |
| 11 | **Deriva no clipe (vale para vídeo)** | O personagem muda em relação ao quadro de entrada: o estilo escorrega para "animação de estúdio" (olho grande com cílio, nariz desenhado), detalhe marcante some. Conferir lado a lado o quadro de entrada e os quadros do clipe em 0,1 s, no meio e no fim. |
| — | Avisos (não reprovam) | Estilo um pouco diferente, luz, detalhe de roupa pequeno, mão meio mole, fundo genérico, texto ou letra na imagem. |

### Fichas (o que tem que bater)
Escreva 3–6 linhas por personagem: o que SEMPRE tem e o que NUNCA pode. Exemplo da nossa série:
- **NICO:** menino pequeno, cabelo castanho-escuro bagunçado, cachecol amarelo-mostarda, túnica verde de manga curta, arquinho de madeira pequeno, aljava. Olho da ficha: bolinha preta. Olho grande com branco aparecendo reprova; o mesmo personagem trocando de olho entre quadros também.
- **IARA:** mulher alta, casaco verde-escuro com capuz, trança branca longa, íris âmbar acesas. NUNCA idosa. NUNCA criança.
- **GENERAL:** capacete-concha oco SEM rosto, com anéis azuis acesos dentro; armadura cinza angulosa, capa rasgada. NUNCA cavaleiro medieval com viseira. NUNCA com rosto.

## PROMPT DO REVISOR (copiar, preencher <PASTA>, <NUMEROS> e <LETRA>)
```
Você é o revisor de quadros deste projeto. Você NÃO gerou estes quadros e não tem que defendê-los.
Seu trabalho: achar o erro antes de quem aprova achar. Na dúvida, REPROVA: refazer uma imagem custa pouco;
deixar passar custa a confiança de quem assiste.

1. Leia revisor/REVISOR.md (a lista fixa e as fichas).
2. Leia <PASTA>/entrada.json. Abra as fichas listadas em "fichas" (Read em cada imagem) e guarde como cada um é.
3. Para cada quadro dos números <NUMEROS>:
   - abra o quadro inteiro (campo "arquivo");
   - abra as duas metades em tamanho cheio ("zoom_cima", "zoom_baixo");
   - conte, por personagem, braços, mãos, pernas e pés, e diga onde está cada um;
   - compare com a ficha e com a "descricao" (o que a cena devia mostrar);
   - passe a lista fixa item por item.
4. Grave <PASTA>/parte_<LETRA>.json, uma lista com um objeto por quadro:
   {"n": 5, "nome": "...", "arquivo": "...", "veredito": "APROVADO" | "REPROVADO",
    "contagem": "A: 2 braços (esq. no pulso dele, dir. esticado), 2 pernas; B: só o braço entra pela direita",
    "erros": [{"item": 1, "o_que": "a mão direita some dentro da manga, parece cotoco", "onde": "meio do quadro, à esquerda"}],
    "avisos": ["..."],
    "conserto": "frase curta para colar no pedido de edição da imagem (só se REPROVADO)"}
   Copie "nome" da entrada. Seja específico em "o_que" e "onde". "Proporção estranha" sozinho não serve; diga quem, quanto e onde.
5. Responda no fim só: quantos aprovados, quantos reprovados e os números reprovados com 1 linha de motivo cada.
```
