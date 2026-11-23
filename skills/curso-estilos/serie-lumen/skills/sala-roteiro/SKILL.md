---
name: sala-roteiro
description: "Liga o modo \"sala de roteiro\" da série, uma conversa SÓ DE TEXTO que escreve a bíblia, o roteiro de cada episódio (narração corrida + falas), a escolha \"1 ou 2\" e mantém o livro-razão. Use quando o aluno disser \"/serie-lumen:sala-roteiro\", \"vamos escrever o ep\", \"roteiro do episódio\", \"a escolha do fim\", \"atualiza o livro-razão\", ou quando a BIBLIA.md da série ainda estiver vazia. NÃO gera imagem, voz, clipe nem vídeo, e não abre site pago (isso é da conversa de produção)."
---

Responda sempre em português do Brasil, em linguagem simples, como para quem está começando.

# sala-roteiro

Um chat que faz tudo (texto, imagem e animação) cresce rápido. Quando a conversa fica muito comprida, o Claude passa a resumir o começo dela, e regras e detalhes da história se perdem nesses resumos. Uma conversa que também gera imagem e animação ainda corre o risco de gastar crédito sem perceber. Por isso a divisão: **a sala só escreve.** A produção é outra conversa, uma por episódio. Assim cada conversa fica curta e lê as regras inteiras.

## Regras do modo
- Só texto. Nada de gerar imagem, voz ou vídeo, nem abrir site pago. Se o aluno pedir, diga que é na conversa de produção do episódio. Texto puro mantém a sala leve e sem gasto.
- Antes de escrever, leia: `BIBLIA.md` (a lore que o voto não muda), `LIVRO_RAZAO.md` (votos, promessas, quem sabe o quê), `REGRAS.md` §1 e §2 + o Registro, e `ESCRITA.md`.
- Escreva do jeito que o aluno conta, em parágrafos ligados. Tabela de frases soltas soa travada na voz, porque cada frase recomeça do zero.
- Roteiro novo vai pro aluno aprovar ANTES de voz e render, porque mudar o texto depois da voz paga custa a voz de novo. O ok dele (a frase e a data) vai no topo do `ROTEIRO.md`.
- Toda nota do aluno (aceita ou recusada) vira uma linha no Registro do `REGRAS.md`, no formato ACEITO/REPROVADO → REGRA DERIVADA → ONDE ENTRA. Assim o gosto dele fica escrito, e a próxima conversa não repete o erro.

## Se a série é nova: a bíblia primeiro
Faça 3 perguntas, uma por vez:
1. Quem é o herói e o que ele quer AGORA, em algo concreto (pagar o aluguel, salvar a irmã)?
2. Qual é o contraste que só essa série tem? (LUMEN: épico lá dentro, boleto aqui fora.)
3. Qual é o segredo grande que o público vai descobrir aos poucos?
Depois preencha a `BIBLIA.md` com ele, em 1 página. A seção "LORE CANÔNICA" é o que o voto nunca muda; é ela que dá rumo à série.

## O episódio (mirar 95–110 s, no máximo ~2 min; `REGRAS.md` §1.7)
1. **Antes:** preencha no topo do `epNN/ROTEIRO.md` o desejo concreto, o valor que vira (de → para), o fato real com número (conferido na fonte) e o voto do ep anterior. Consulte o livro-razão: o que lembrar, o que pagar, qual voto antigo cobrar.
2. **Espinha por segundos** (ESCRITA §3):
   - 0–3 s: gancho no meio do perigo. Evite "Vocês votaram" na 1ª frase: na série LUMEN, episódios que abriam assim perdiam 25–32% do público nos primeiros 8 s.
   - 3–15 s: o que o herói quer agora. Premissa clara pra quem nunca viu a série.
   - 15–80 s: obstáculo que escala 2 ou 3 vezes; cada tentativa custa.
   - 80–100 s: virada.
   - últimos ~10 s: a escolha, numa frase de até 6 s, por cima da cena viva.
3. **Narração corrida.** O narrador não conta o que a tela mostra: fica com o que a imagem não diz. Skill e buff viram aviso na tela, sem explicação na voz. No desespero, a fala do personagem é emoção, não dica técnica.
4. **O fato com número** entra dentro da ação (o RAIO-X congela a cena e mostra a conta), não numa aula parada: quando a história para, o público sai.
5. **A escolha "1 ou 2"** (ESCRITA §6): nasce do que está na tela no fim; as duas opções custam algo da mesma pessoa; cada opção cabe em 3 palavras. Confira o custo no "Quem sabe o quê" do livro-razão.
6. **Depois de escrever:** rode a lista de clichê (ESCRITA §2; 2 ou mais marcados = reescrever) e o checklist da escolha (ESCRITA §6; mais de 2 "não" = reescrever).
7. **Mande pro aluno** o texto inteiro, limpo, sem a tabela de planos, pra ele ler a história como o público vai ouvir. Espere o ok.
8. **Depois do ok:**
   - a tabela de planos NÃO é da sala: quem divide os planos é a conversa de produção do ep (fim do `ROTEIRO.md`);
   - escreva o `epNN/voz/falas.tsv` na ordem em que a locução toca (`id<TAB>papel<TAB>estabilidade estilo velocidade<TAB>texto`; velocidade no máximo 1.1, porque acima disso a voz soa acelerada; sem tag de sussurro, que soa artificial; `PAUSA` com os segundos pra silêncio de propósito);
   - atualize o `LIVRO_RAZAO.md` (promessas novas, variáveis, quem sabe o quê).

## Depois que o episódio sai
- Recontar o voto e anotar no livro-razão (Ep, escolha, quem venceu, placar, leitura).
- Ler a retenção do Instagram: onde o público sai? Cada lição vira linha no Registro do `REGRAS.md`.
