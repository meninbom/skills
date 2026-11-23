---
name: revisor-quadros
description: "Revisor cego dos quadros da série (storyboard, placas do H3, capa) e dos clipes animados (folha de deriva). Use antes de mostrar qualquer quadro ao aluno ou de mandar quadro pro H3, ou quando ele pedir \"revisa os quadros\", \"confere o storyboard\", \"o clipe derivou?\". Prepara cada quadro em tamanho cheio, abre revisores de contexto zerado com a lista fixa de 11 itens e junta o veredito. NÃO use pra gerar ou editar imagem (isso é no ChatGPT) nem pra checagem técnica do vídeo final (isso é a checar-video)."
---

Responda sempre em português do Brasil, em linguagem simples, como para quem está começando.

# revisor-quadros

**Quem gera não aprova.** O chat que fez os quadros não pode ser o mesmo que diz que estão bons, porque tende a ver o que quis fazer, e não o que saiu. Esta skill abre revisores novos, sem a conversa de quem gerou, e eles olham cada quadro em tamanho cheio, do lado das fichas.

Leia `REVISOR.md` (nesta pasta) antes de rodar: a lista fixa, a calibração e o prompt do revisor estão lá.

## Passo a passo
1. Confira as fichas da série em `<serie>/fichas/` e o `fichas.json` (pontos, nunca, escala, lugares). Sem ficha, o revisor só pega anatomia, chão, objetos e plano. Exemplo pronto: `<serie>/exemplo_lumen/fichas.json`.
2. Em `<ep>/revisao/`, monte o `ESCOLHIDOS.txt` (`nº<TAB>nome`) e o `descricoes.json` (o que cada quadro devia mostrar e `quem` aparece, com os nomes do `fichas.json`). Tire a descrição do roteiro do episódio.
3. Prepare:
   ```bash
   python ${CLAUDE_SKILL_DIR}/scripts/preparar.py --lista <ep>/revisao/ESCOLHIDOS.txt --pasta <ep>/gpt --desc <ep>/revisao/descricoes.json --saida <ep>/revisao
   ```
4. Divida os números em 2 ou 3 fatias e abra um subagente por fatia (ferramenta Agent, em paralelo), com o PROMPT DO REVISOR do `REVISOR.md`. Preencha `<SKILL>` com o caminho desta pasta. Não conte pro revisor o que você acha dos quadros, senão ele herda o mesmo ponto cego.
5. Junte:
   ```bash
   python ${CLAUDE_SKILL_DIR}/scripts/juntar.py <ep>/revisao
   ```
   Sai `veredito.json` (o ciclo lê) e `REVISAO.md` (você lê).
6. Quadro com veredito REPROVADO: refaça no ChatGPT com o `conserto` no pedido e revise de novo só esse quadro. No máximo 3 voltas, porque depois disso insistir raramente melhora. Na 4ª, mostre as 3 tentativas lado a lado ao aluno, pra ele escolher.
7. Só o que passou vai pro aluno, numa prancha numerada. Ele responde "1 - a, 2 - b". Quadro que ele aceitou não se refaz pelo que o revisor apontou, porque o revisor barra mais do que precisa (ver a calibração no `REVISOR.md`): o apontamento vira aviso pra animação.

## Clipes (depois do H3)
```bash
python ${CLAUDE_SKILL_DIR}/scripts/deriva.py <ep>/h3 P01 P02 P03
```
Gera `h3/deriva/Pnn.jpg` (entrada | 0,1 s | meio | fim). Mande pro revisor com o item 11: o personagem mudou de cara em relação à placa? Clipe REPROVADO = refazer (outro seed ou prompt mais simples), no máximo 3 vezes; depois, reserva (placa parada ou trecho limpo).

## Não faça
- Não diga "conferi cada quadro" olhando miniatura: braço faltando e pé flutuando somem no tamanho pequeno. Na série LUMEN, um storyboard dado como conferido em miniatura tinha mais de 10 quadros errados.
- Não deixe o revisor ver a sua opinião nem o histórico de quem gerou.
- Não refaça quadro que o aluno aceitou só porque o revisor apontou: a palavra final é dele.
