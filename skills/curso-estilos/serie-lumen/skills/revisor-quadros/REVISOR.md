# Revisor de quadros

**Regra: quem gera não aprova.** Cada quadro (storyboard, placa do H3, capa) passa por um revisor que começa do zero: um subagente novo, sem a conversa de quem gerou.

Ele olha cada quadro em tamanho cheio, do lado das fichas, e marca APROVADO ou REPROVADO com o erro escrito. Só o que passa vai pro aluno.

**Por que existe:**
- Quem gerou o quadro tende a ver o que quis fazer, e não o que saiu.
- Braço faltando e perna flutuando somem na prancha em miniatura.
- Na série LUMEN, um storyboard dado como conferido em miniatura tinha mais de 10 quadros errados.

## Calibração (dado da série LUMEN)
- Num storyboard de 41 quadros, o revisor barrou 24 e o olhar humano marcou 2, que estavam entre os 24.
- Ou seja: o revisor **pega o que o olho humano pega**, mas barra demais.
- **A palavra final é do aluno.** Quadro que ele aceitou não se refaz pelo que o revisor apontou; o apontamento vira aviso pra animação.
- **Reprova** o que se vê no celular em 2 s: membro sumido, flutuando, personagem trocado ou sem o item marcante, objeto invertido, poder que não existe, quadro feio.
- **Aviso** (não reprova sozinho): que mão segura o objeto, estado de um detalhe entre quadros, diferença pequena de escala.
- O revisor é o filtro ANTES do aluno, pra ele não perder tempo com o óbvio. Não é juiz depois dele.

## A lista fixa
Cada item é um erro que já apareceu de verdade num storyboard. Erro grave reprova; o resto vira aviso.

| # | Item | Reprova quando |
|---|---|---|
| 1 | **Anatomia** | Braço, mão ou perna faltando, fundido, a mais, ou cortado de um jeito que parece amputado. Membro escondido só vale se o motivo for óbvio (atrás do corpo, fora do quadro pela borda). |
| 2 | **Peso e chão** | Pé que não pisa em nada, perna que some na névoa, corpo flutuando sem motivo. |
| 3 | **Escala** | A altura entre os personagens não bate com as fichas (`fichas.json`, campo `escala`). |
| 4 | **Igual à ficha** | Algum dos `pontos` da ficha não bate, ou aparece algo da lista `nunca`. |
| 5 | **Faz o que a cena pede** | Ação, quem está em quadro, direção do olhar ou expressão diferentes da descrição. Mirar sem olhar o alvo, olhar pra câmera, cara neutra quando a cena pede tensão. |
| 6 | **Objetos** | Objeto do tamanho errado, invertido, apontando pro lado errado, na mão errada quando a cena define, ou duplicado. |
| 7 | **Geografia** | Num plano com vários personagens, alguém do lado errado da tela em relação ao plano anterior, sem motivo. Quebrar o eixo sem motivo confunde. |
| 8 | **Ninguém a mais** | Personagem repetido, figurante que não está na descrição, o mesmo personagem duas vezes. |
| 9 | **Lugar** | O lugar diferente do lugar fixo da série (`fichas.json`, campo `_lugares`): móveis, janela, céu, objeto marcante. |
| 10 | **Plano** | Tudo de perto sem motivo: cena de ação que pede plano aberto saindo em close. |
| 11 | **Deriva no clipe (vídeo)** | O personagem muda em relação ao quadro de entrada: rosto de estúdio de animação com olho grande e cílio, traço novo, roupa trocada. Conferir na folha de deriva: entrada, 0,1 s, meio e fim. |
| — | Avisos (não reprovam) | Estilo um pouco diferente, luz, detalhe pequeno de roupa, mão meio mole, fundo genérico, letra na imagem. |

## As fichas da série
Ficam em `<serie>/fichas/`. O `fichas.json` diz o que tem que bater:
```json
{
  "NOME": {"arquivo": "fichas/nome.png",
           "pontos": ["cabelo castanho bagunçado", "cachecol mostarda", "olho de bolinha preta"],
           "nunca": ["olho grande com branco", "versão realista"],
           "escala": "criança; metade da altura da mestra"},
  "_lugares": {"quarto": {"arquivo": "fichas/quarto.png", "pontos": ["cápsula à esquerda", "janela com cortina"]}}
}
```
Exemplo pronto: `<serie>/exemplo_lumen/fichas.json` (Nico, Iara e General, da série LUMEN). Pra testar com ele, copie pra `<serie>/fichas/fichas.json`: os caminhos já apontam pra `exemplo_lumen/fichas/`.

## Como rodar
1. Na pasta `<ep>/revisao/`, crie:
   - `ESCOLHIDOS.txt`: `nº<TAB>nome` por linha (nome do arquivo do quadro, sem extensão);
   - `descricoes.json`: `{"nº": {"descricao": "o que a cena devia mostrar", "quem": "nico iara"}}`. Os nomes do `quem` são os mesmos do `fichas.json` (maiúscula ou minúscula tanto faz).
2. `python <skill>/scripts/preparar.py --lista <ep>/revisao/ESCOLHIDOS.txt --pasta <ep>/gpt --desc <ep>/revisao/descricoes.json --saida <ep>/revisao`
   - Gera `entrada.json` (nº, arquivo, descrição, quem, fichas) e `zoom/NN_cima.png` + `zoom/NN_baixo.png`.
   - As fichas vêm de `<serie>/fichas/fichas.json`. Dá pra forçar com `--fichas a.png,b.png`.
3. Abra 2–3 subagentes em paralelo (ferramenta Agent), cada um com uma fatia dos números.
   - O prompt é o bloco "PROMPT DO REVISOR" abaixo, com a pasta e a fatia preenchidas.
   - O subagente NÃO recebe a opinião de quem gerou.
4. Cada um grava `<saida>/parte_<LETRA>.json`. Depois: `python <skill>/scripts/juntar.py <saida>` → `veredito.json` + `REVISAO.md`.
5. **Veredito REPROVADO:** refazer no ChatGPT com o `conserto` do revisor no pedido, e revisar de novo só esse quadro.
   - Máximo de 3 voltas, porque depois disso insistir raramente melhora. Na 4ª, vai pro aluno como "quadro problema", com as 3 tentativas lado a lado.
6. Clipes do H3: `python <skill>/scripts/deriva.py <ep>/h3 P01 P02 …` gera `h3/deriva/Pnn.jpg` (entrada | 0,1 s | meio | fim). O revisor usa o item 11.
7. O `ciclo.py` (skill `ciclo-serie`) não deixa plano seguir pro H3 sem APROVADO no `<ep>/revisao/veredito.json`.

## PROMPT DO REVISOR (copiar, preencher <PASTA>, <NUMEROS>, <LETRA> e <SKILL>)
```
Você é o revisor de quadros de uma série em vídeo. Você NÃO gerou estes quadros e não tem que defendê-los.
Seu trabalho: achar o erro antes que ele chegue a quem aprova a série. Na dúvida, REPROVA: refazer o quadro custa 1,5 min;
deixar passar custa a confiança de quem aprova.

1. Leia <SKILL>/REVISOR.md (a lista fixa).
2. Leia <PASTA>/entrada.json. Leia os "pontos", "nunca" e "escala" de cada personagem em "fichas_texto".
3. Pra cada quadro dos números <NUMEROS>:
   - abra as fichas de quem está no quadro ("fichas_quadro"; se vier vazio, use todas as de "fichas");
   - abra o quadro inteiro (campo "arquivo");
   - abra as duas metades em tamanho cheio ("zoom_cima", "zoom_baixo");
   - conte, por personagem, braços, mãos, pernas e pés, e diga onde está cada um;
   - compare com a ficha e com a "descricao" (o que a cena devia mostrar);
   - passe a lista fixa item por item (1 a 10; o 11 só vale pra folha de deriva).
4. Grave <PASTA>/parte_<LETRA>.json, uma lista com um objeto por quadro:
   {"n": 5, "nome": "...", "arquivo": "...", "veredito": "APROVADO" | "REPROVADO",
    "contagem": "Fulana: 2 braços (esq. no pulso dele, dir. esticado), 2 pernas; Fulano: só o braço entra pela direita",
    "erros": [{"item": 1, "o_que": "a mão direita some dentro da manga, parece cotoco", "onde": "meio do quadro, à esquerda"}],
    "avisos": ["..."],
    "conserto": "frase curta em português pra colar no pedido de edição (só se REPROVADO)"}
   Seja específico em "o_que" e "onde". "Proporção estranha" sozinho não serve: diga quem, quanto e onde.
5. Responda no fim só: quantos aprovados, quantos reprovados e os números reprovados com 1 linha de motivo cada.
```
