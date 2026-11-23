---
name: 100-serie-voto
description: "Estilo #100 do curso, Série diária com voto nos comentários - estilo em destaque do curso e o formato que mais engaja hoje: série diária em 2D com um personagem, um prazo e um placar, em que no fim de cada vídeo o público comenta uma palavra e o voto vira o episódio seguinte. Traz o guia de roteiro tirado do estudo de mais de 100 vídeos do formato, o motor em código com dois estilos de traço e a esteira de voz e som. Use quando o aluno pedir \"estilo #100\", \"o 100\", \"série com voto\", \"série diária\", \"30 dias pra conseguir X\", \"o público escolhe\", \"comenta uma palavra\", \"episódio novo da série\", \"dia N da série\". NÃO use para série em voxel (isso é o #04). Série longa de história em massinha é o plugin `serie-lumen`."
---

Responda sempre em português do Brasil, em linguagem simples, como para quem está começando.

# #100 · Série diária com voto nos comentários

Estilo em destaque do curso e o formato que mais engaja hoje: série diária em 2D com um personagem, um prazo e um placar, em que no fim de cada vídeo o público comenta uma palavra e o voto vira o episódio seguinte. Traz o guia de roteiro tirado do estudo de mais de 100 vídeos do formato, o motor em código com dois estilos de traço e a esteira de voz e som.

Marca no catálogo: **v1 (receita completa)**. Custo: grátis + voz.

Esta skill é a porta de entrada do estilo. A receita e o código ficam na skill mestre do plugin, e os caminhos abaixo partem da pasta deste arquivo (`${CLAUDE_SKILL_DIR}`):

- **Receita (leia inteira antes de produzir):** `../curso-estilos/estilos/100_serie_voto.md`
- **Motor (código):** `../curso-estilos/motores/100/`, com o demo em `DEMO.md`
- **Prévia de 15 s:** `../curso-estilos/catalogo/previas/100.mp4`

## Fluxo

1. **Conferir o PC para este estilo.** Só lê, não instala nada:
   ```
   node "${CLAUDE_SKILL_DIR}/../curso-estilos/scripts/checar_pc.mjs"
   node "${CLAUDE_SKILL_DIR}/../curso-estilos/scripts/catalogo.mjs" --estilo 100
   ```
   O segundo comando diz se o estilo roda neste PC e o que falta.
2. **Instalar só o que falta**, um item por vez, dizendo o que é, o tamanho e de onde vem, e só com o ok do aluno.
3. **Demo de poucos segundos.** Copie `../curso-estilos/motores/100/` para uma pasta nova do projeto do aluno (nunca edite dentro da pasta do plugin) e rode o comando do `DEMO.md`. Ele prova que o ambiente está de pé antes de trocar o conteúdo.
4. **Ler o ofício antes do roteiro:** `../curso-estilos/OFICIO.md` (roteiro, câmera, voz, som e entrega, com os números e o porquê de cada um). Leia de novo a seção 4 antes da mixagem.
5. **Pedir o tema do aluno** (assunto, personagem, tom, duração) e **propor 3 ideias bem diferentes** antes de escrever, cada uma em 2 linhas. Passe cada uma pelo teste do genérico: se dá para trocar o assunto e a animação continuar a mesma, a ideia é genérica. O estilo é recriado com o tema dele: a peça de exemplo ensina o ofício, não é para copiar.
6. **Roteiro em texto corrido, aprovado antes de produzir.** Cada fato com 2 fontes anotadas. Pedido ao espectador (seguir, comentar) só com motivo real dentro da história.
7. **Seguir o "Passo a passo" da receita**, na cópia.
8. **Aprovar por quadros antes do render completo:** mostre uma folha de 6 a 9 quadros numerados para o aluno aprovar ou apontar pelo número; depois renderize só o trecho mais difícil (uns 5 s); só então o vídeo inteiro. Corrigir um quadro custa segundos, e corrigir depois do render custa o render.
9. **Nunca grave por cima de uma versão.** Cada versão ganha nome novo (`v2`, `v3`) e a antiga vai para `_antigo/`.
10. **Nada pago sem custo e ok.** Voz ou qualquer serviço pago: diga o custo estimado antes e espere o sim. Sem resposta, entregue mudo.
11. **Conferir com a skill `checar-video`** e entregar o MP4 (1080×1920, `yuv420p`) e a versão leve de celular.

Não abra nem toque mídia com som no PC do aluno sem ele pedir. As regras gerais do curso estão na skill mestre `curso-estilos`.

## Destaque do curso: o que esta skill traz a mais

Este é o estilo em destaque. Além da receita, a pasta desta skill tem o que aprendemos estudando mais de 100 vídeos do formato:

- **`FORMATO.md` — leia antes de escrever qualquer roteiro.** A premissa em 7 peças, o molde de 9 batidas do episódio 1, o esqueleto de 12 passos dos episódios seguintes, as regras do voto, as regras de frase, o que vai na tela, o som, os riscos do formato e uma conferência do roteiro. Cada regra vem com o porquê.
- **`MOTOR.md` — leia antes de mexer no código.** Como o roteiro vira `lines.js`, como as cenas são presas às falas no `ep.js`, personagem e cenário novos, como olhar antes de renderizar, voz, som, render dos dois estilos e como fazer o episódio seguinte.
- **`exemplos/`**: as folhas de quadros do episódio 1 nos dois estilos.

### Os dois estilos de traço

| | `luz` | `kurz` |
|---|---|---|
| Traço | contorno escuro grosso | sem contorno |
| Leitura | cartum, a cara feia bem marcada | limpo, de infográfico |
| Onde troca | `estilo.js`: `window.ESTILO = 'luz'` | `window.ESTILO = 'kurz'` |

O `kurz` é uma pele aplicada por cima do `luz`: roteiro, tempos, câmera e animação são os mesmos. **Desenhe sempre no `luz`; o `kurz` sai de graça.** Sem contorno o boneco fica mais bonitinho e perde parte da feiura: se o episódio depende dela, use o `luz`.

### Ordem de produção de uma série

1. **Premissa da série** (só na primeira vez): personagem, prazo, placar, alvo e o fio por baixo (`FORMATO.md`, seção 1). Mostre ao aluno e espere o ok.
2. **O voto de ontem** (série já no ar): peça ao aluno a contagem dos comentários do episódio anterior. O episódio abre com ação nos 2 primeiros segundos, e o resultado do voto entra só em placa por cima da cena, com o número (abrir com "vocês votaram" sobre o placar parado faz o público sair: `FORMATO.md`, 2.2). Depois ele fala com quem perdeu, e a opção que perdeu pode voltar no voto de hoje. Anote também os comentários sobre o elenco e as teorias: viram material.
3. **Roteiro em narração corrida**, aprovado pelo aluno **antes de qualquer voz ou render**. Episódio 1 pelo molde de 9 batidas; do 2 em diante, pelo esqueleto de 12 passos. Passe a conferência do fim do `FORMATO.md`.
4. **Prova de uma cena de 5 a 8 s** quando houver cenário ou personagem novo, e ok do aluno. Fazer o episódio inteiro antes de aprovar o desenho é o erro mais caro deste estilo.
5. **Episódio mudo** com tempos estimados, folha de quadros, correções.
6. **Voz:** custo e ok antes. Uma gravação por voz, sem acelerar.
7. **Ajuste pelo tempo real da voz, som e render dos dois estilos** (um comando; `MOTOR.md`, seção 5).
8. **Conferir** a folha do vídeo final e a skill `checar-video`.

### O que não fazer

- **Mirar no visual das séries que já existem.** O que se copia é a mecânica (prazo, placar, voto). O desenho e a premissa são seus.
- **Fundo liso com etiqueta colorida em tudo.** Vira slide. A informação mora dentro do cenário: papel na parede, rótulo de frasco, tela do celular.
- **Boneco genérico e fofo.** A graça é a feiura específica, e é ela que o voto conserta.
- **Julgar por quadro parado.** Olhe também uma folha de 5 quadros por segundo: há defeito que só aparece em movimento.
- **Copiar o tema "ficar bonito em 30 dias" sem premissa própria.** Está saturando.

Para uma série de história longa em outro traço, com fichas de personagem e ciclo de episódios, existe o plugin opcional `serie-lumen` do mesmo pacote.
