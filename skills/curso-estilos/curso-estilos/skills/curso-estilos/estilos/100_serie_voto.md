# 100 · Série diária com voto nos comentários

> Vitrine: "30 dias pra ficar igual à foto", episódio 1 (72,7 s com voz) em dois estilos · Custo: R$ 0 em tudo menos a narração (~1.170 caracteres da ElevenLabs por gravação; opcional, o exemplo já vem com voz) · Ferramentas: HyperFrames 0.8.162 (pelo `npx`) + GSAP, FFmpeg, Python (numpy) para o som, ElevenLabs só para a voz

## O que é
Série em que um personagem tem um prazo em dias, um placar que sobe pouco por episódio e, no fim de cada vídeo, duas opções: o público comenta uma palavra e a mais votada vira o episódio seguinte. É o formato das contas de série diária em que o público escolhe o próximo passo. Funciona porque quem votou volta no dia seguinte para ver a consequência, e porque o texto é feito de piadas de uma frase com número concreto.

O desenho é vetor em código, com a câmera andando por um cenário cheio. O mesmo episódio sai em dois estilos trocando uma linha:
- **luz**: contorno escuro grosso, luz com direção, cara feia bem marcada;
- **kurz**: sem contorno, limpo, com cara de infográfico (família Kurzgesagt).

## Como o roteiro funciona (medido em 56 episódios)
Estudamos 5 séries públicas desse formato (a original, em inglês, e quatro que vieram depois). Para cada uma, transcrevemos e medimos os 10 primeiros episódios e o último. As regras abaixo saem desse estudo.

**Tamanho:** o episódio 1 tem 80–130 s e 220–290 palavras. Os seguintes ficam com 90–130 s e são narrados a 130–165 palavras por minuto. Perto do fim da série, os episódios encurtam para 50–90 s. O que segura é a densidade de piadas; o comprimento não atrapalha.

**O episódio 1 é um molde.** Três das cinco séries seguem as mesmas 9 batidas, quase fala por fala. A que não seguiu teve o pior episódio 1 medido; no episódio 2, já no molde, rendeu 11 vezes mais.
1. Prazo e motivo nos 5 primeiros segundos ("30 dias. É o tempo que o Régis tem até a Marina descer do avião.").
2. "Olha pra ele" e 2–3 defeitos que se veem.
3. A pessoa do outro lado manda mensagem.
4. "30 dias pra consertar tudo. Por onde a gente começa?"
5. Passeio por 4–5 cenários, uma piada por cenário (espelho, cozinha, rua, loja, um reflexo).
6. Primeiro sinal de humanidade ("se vê numa poça e, pela primeira vez, não desvia o olhar").
7. Resposta patética para a pessoa: digita, apaga, manda "k".
8. "Agora entra você."
9. Duas opções, "uma delas muda a vida dele hoje", "comenta uma palavra, o dia 2 começa com a sua escolha".

**Do episódio 2 em diante:**
1. Abrir com ação ou perigo nos 2 primeiros segundos, já dentro do resultado do voto. O voto de ontem entra só em texto, numa placa por cima da cena ("VOCÊS ESCOLHERAM: BANHO · 81%"), e o primeiro corte vem em até 1,5 s. Medido numa série nossa: abrir com o narrador dizendo "vocês votaram…" sobre o placar parado fez de 25 a 32% do público sair nos primeiros 8 s, porque quem chega pela aba de vídeos nunca viu a série.
2. Falar com quem perdeu ("Quem votou nos dentes? O dia de vocês vai chegar.").
3. Prazo e, se precisar, uma frase de "no último episódio…".
4. Por que o defeito é grave, com número ("o último banho foi na época da Copa").
5. A tarefa em três tentativas: falha, falha, acerta.
6. A revelação: o espelho ou um objeto reage.
7. O placar sobe, dito em voz alta ("Mais 3%").
8. A mensagem da pessoa: digita, apaga, manda; a resposta dela fecha o bloco.
9. Uma ou duas piadas que voltam de episódios anteriores.
10. Uma cena curta à noite.
11. Inventário em três itens do que já foi feito e do que falta.
12. O voto.

**O voto:**
- Sempre 2 opções quando o voto é fechado. "O comentário mais curtido decide" só depois que o público já conhece a série. Tenha pronta a desculpa para quando pedirem várias coisas: "ele só consegue uma por dia".
- Cada opção vem com motivo, custo ou piada ("ajudante na padaria, das 4 às 10, R$ 80 por dia").
- As opções aparecem antes, no meio do episódio. Uma placa na rua com "Guarda essa." vira opção no dia seguinte.
- A opção que perdeu volta no voto seguinte, com a contagem de derrotas ("Três dias de derrota. Vocês não desistiram. Respeito."). Assim o lado que perdeu continua votando.
- Votar entre duas pessoas deu o recorde de comentários de uma das séries: 4 vezes a média.

**Para a série durar:**
- **Elenco que volta:** um figurante que aparece em todo episódio num ofício diferente, um rival, alguém que sempre ganha do personagem e um objeto vivo. O público passa a comentar sobre eles.
- **Um mistério longo**, com uma pista por episódio. Plante a resposta antes da virada: a revelação só funciona se der para voltar e achar as pistas. O voto sozinho cansa por volta do episódio 10. Não entregue no final só a teoria que os comentários já adivinharam: uma das séries fez isso e os comentários do final foram "esperei 1 mês pra nada".
- **Do episódio 8–10 em diante, abra no meio do desastre** e volte ("Três segundos antes do desastre. Vamos voltar."). O assunto passa do corpo para a relação.
- **Além do voto, um gancho no fim** que não depende dele ("em cima da mesa tinha um exame que o pai ainda não viu").

**Na tela:**
- Um placar fixo para a série (dias que faltam, %) e um medidor só do episódio que ande bastante em 90 s (barras seguidas 0 → 5, nota 3/10 → 4/10). O prazo pode mostrar o evento mais próximo e contar em horas quando chega perto.
- Nos 2 primeiros segundos, o voto de ontem aparece como placa por cima da ação ("BANHO · 81%"), sem parar o vídeo numa tela de resultado. No fecho, os cartões das duas opções entram por cima do último plano, sem escurecer a tela, e a pergunta cabe em 6 s.
- Escolha boa não é óbvia, nem "tanto faz", nem no escuro. A lista "Essa escolha é boa?" está no `FORMATO.md` da skill `100-serie-voto`.
- Abra quase todo episódio no mesmo enquadramento. Como o cenário não muda, o olho vai para o que mudou no personagem. O que o público escolheu continua nele nos episódios seguintes.
- Tela do voto: o personagem aparece duas vezes, uma em cada opção, já fazendo a coisa. Embaixo de cada palavra vai uma linha de motivo ou custo ("custa 1 dia · R$ 3"). O último quadro do vídeo é o voto, não um anúncio.
- Quando uma coisa antiga volta, o objeto diz de que dia ela é ("queimou no dia 3").

## Exemplo e arquivos
- Prévia do catálogo: `catalogo/previas/100.mp4` (metade em cada estilo; capa em `catalogo/previas/100.jpg`)
- O episódio de exemplo inteiro em código: `motores/100/lines.js` (a narração), `motores/100/ep.js` (as 13 cenas), `motores/100/mundo.js` e `motores/100/quartoA.js` (os 4 cenários), `motores/100/regis.js` (o personagem)
- A voz e os efeitos do exemplo: `motores/100/audio/A.mp3`, `motores/100/audio/sfx`
- Como rodar: `motores/100/DEMO.md`; origem e licença: `motores/100/FONTES.md`

## Ferramentas e instalação
- **Node 22 ou mais novo** (grátis). O render usa `npx -y hyperframes@0.8.162`, que se instala sozinho na primeira vez (baixa também um navegador próprio; alguns minutos e algumas centenas de MB).
- **FFmpeg** no PATH (grátis).
- **Python com numpy** (grátis): só para a mixagem de som (`motores/100/audio/mix.py`). `pip install numpy`.
- **bash**: o `motores/100/audio/versao.sh` é um script de bash. No Windows, rode pelo Git Bash.
- **ElevenLabs** (PAGO, opcional): `motores/100/audio/gravar.mjs` usa a sua chave na variável `ELEVENLABS_API_KEY`. Sem `--confirmo-custo` ele só mostra quantos caracteres vai gastar e para.
- Não precisa de placa de vídeo.

## Motor (dentro do plugin)
Em `motores/100/` (~2 MB com a voz e os efeitos do exemplo):
- `motores/100/lines.js`: a narração, uma fala por linha, com a cena de cada uma. É o que mais muda de um episódio para o outro.
- `motores/100/ep.js`: a linha do tempo. Cada cena é presa ao tempo das falas (`T(i)`, `E(i)`, `P(i, .5)`), nunca a segundos fixos; por isso o vídeo se reajusta sozinho quando a voz chega.
- `motores/100/mundo.js` e `motores/100/quartoA.js`: quarto, parede do espelho, banheiro e corredor, cada um em camadas com paralaxe.
- `motores/100/regis.js`: o personagem, com variantes (com ou sem celular, com jaqueta, cinco bocas, com ou sem fedor). `motores/100/personagem.js`: a foto antiga e a mãe.
- `motores/100/estilo.js`: uma linha, `window.ESTILO = 'luz'` ou `'kurz'`. `motores/100/pele_kurz.js`: a pele sem contorno, aplicada por cima do estilo luz.
- `motores/100/gerar_cues.mjs`: calcula o tempo de cada fala, estimado pelo número de palavras ou medido na voz.
- `motores/100/audio/voz.mjs`, `motores/100/audio/mix.py`, `motores/100/audio/eventos.json`, `motores/100/audio/versao.sh`, `motores/100/audio/gravar.mjs`: voz, efeitos e o comando que faz tudo.

## Passo a passo (ponta a ponta)
1. **Premissa da série** (uma vez). Cinco peças: uma pessoa concreta com um defeito visível; um prazo em dias com motivo que não é dela; um placar com número; um alvo visível que explica o placar; um fio por baixo que não depende do voto. No exemplo: Régis, 29; a Marina chega em 30 dias; "igual à foto: 4%"; a foto de 2019; a mentira "tô igualzinho".
2. **Roteiro em narração corrida**, 220–320 palavras, e mostrar para aprovação antes de produzir. O dia 1 segue o molde de 9 batidas, e os dias seguintes o esqueleto de 12 passos (veja "Como o roteiro funciona"). Antes de aprovar, confira: a tarefa em três tentativas, a mensagem da pessoa, uma piada que volta, o inventário, opções com motivo ou custo que já apareceram no episódio, e um gancho além do voto. Em série no ar, leia os comentários do episódio anterior: o voto vencedor, a porcentagem, o que pediram do elenco e as teorias.
3. **Copiar `motores/100/` para a pasta do projeto** e rodar o demo (`DEMO.md`).
4. **Trocar a narração** no `lines.js`. Cada fala tem `sc` (cena), `t` (legenda, com algarismo), `h` e `c` (palavra colorida e cor) e, quando a voz lê diferente, `f` (número por extenso).
5. **Trocar as cenas** no `ep.js`. Comece reaproveitando os cenários do exemplo e mudando só o que entra em cada fala.
6. **Ver mudo:**
   ```
   node gerar_cues.mjs
   npx -y hyperframes@0.8.162 lint
   npx -y hyperframes@0.8.162 snapshot --at 3,12,30
   npx -y hyperframes@0.8.162 render -q draft -o renders/mudo.mp4
   ```
7. **Voz** (opcional, paga): `node audio/gravar.mjs A <id_da_voz>` mostra o custo; com `--confirmo-custo` grava `audio/A.mp3` e `audio/A.words.json`. Uma gravação só, sem acelerar. Qualquer outra voz serve, desde que você tenha o MP3 e um JSON com início e fim de cada palavra.
8. **Tudo de uma vez** (tempos da voz → render → som → versão de celular), nos dois estilos:
   ```
   bash audio/versao.sh A luz
   bash audio/versao.sh A kurz
   ```
9. **Conferir** com a skill `checar-video` e olhar uma folha de quadros do vídeo final antes de postar.

## Pegadinhas medidas
- **Fazer o episódio inteiro antes de provar uma cena dá retrabalho.** A primeira versão do exemplo (13 cenas) foi jogada fora de uma vez. Com cenário ou personagem novo, prove 5–8 s primeiro.
- **Fundo liso com etiqueta colorida em tudo vira slide.** Escreva a informação em objeto do cenário: papel na parede, rótulo de frasco, tela do celular.
- **Boneco genérico não tem graça.** A graça é o defeito específico, desenhado um por um, e cada defeito é algo que o voto vai consertar.
- **Texto solto dentro da camada da câmera estoura no zoom.** Texto solto vai na camada fixa (`#OV` no `ep.js`).
- **Quadro parado esconde defeito de movimento.** Tire uma folha de 5 quadros por segundo nos trechos de câmera: `ffmpeg -ss 1 -t 2.4 -i renders/x.mp4 -vf "fps=5,scale=270:-1,tile=6x2" -frames:v 1 folha.jpg`.
- **Contador e texto digitado não podem usar função chamada a cada quadro** (o render quadro a quadro não garante a ordem). Use elementos que acendem e largura em `steps()`, como no exemplo.
- **A pele kurz tira o contorno, mas não redesenha o boneco:** ele fica mais bonitinho e perde parte da feiura. Se o episódio depender dela, fique no luz.
- **Transcritor pequeno erra.** Para conferir o que a voz disse, use um modelo de transcrição médio ou maior.

## Custo e tempo
- Render de 100 s em 1080×1920, qualidade final: cerca de 2 min e meio num PC comum com placa integrada ou dedicada; rascunho em menos de 1 min.
- Voz: ~1.170 caracteres por gravação no exemplo. Efeitos: os 9 que vêm na pasta servem para qualquer episódio de quarto, banheiro e celular.
- Episódio seguinte com o mesmo personagem e cenários: roteiro, cenas que mudaram e voz.

## O que funcionou e o que não
- Funcionou: câmera mergulhando em detalhe desenhado pequeno (o prato embaixo da cama, o rótulo do detergente); informação escrita no cenário; o mesmo cenário voltando em cenas diferentes; o segundo estilo saindo de uma pele, sem redesenhar nada.
- Não funcionou: testar "estilos novos" trocando só o acabamento do mesmo boneco na mesma pose. Estilo diferente é outro jeito de contar.

## Roteiro de aula
- **Objetivo:** sair com o episódio 1 de uma série de voto sua, mudo, nos dois estilos.
- **Demonstração:** o que entra na tela a cada 2 s numa conta de referência; o molde do dia 1 de três séries lado a lado, batida por batida; as cinco peças da premissa; o demo de 8 s; trocar três falas e uma cena; trocar `luz` por `kurz`; a primeira versão descartada ao lado da final.
- **Exercício:** escrever a premissa e o roteiro do dia 1 no molde de 9 batidas (três piadas de número concreto, duas opções de uma palavra com motivo), trocar o `lines.js`, reaproveitar os cenários do exemplo e entregar mudo. Extra: escrever o dia 2 imaginando que a opção que você menos queria ganhou, falando com quem perdeu e trazendo a perdedora de volta no voto.

## Limites conhecidos
- Personagem e cenário novos são desenho em SVG escrito à mão (com o Claude); o motor não gera personagem por ficha.
- Vem um personagem principal e uma coadjuvante.
- Sem música.
- O formato está saturando e depende de publicar todo dia. Nas 5 séries estudadas, o episódio 1 foi sempre o mais visto, e o 2 caiu de 3% a 82%; depois disso, só sobem os episódios com promessa visual forte. O exemplo do curso ainda não tem número de público para mostrar.
- O exemplo (72,7 s) está curto para um dia 1 no molde e não tem o passeio de cenários com uma piada em cada um. Use o exemplo para aprender o motor e o molde para escrever o roteiro.
- O exemplo é para estudo: faça a sua premissa e o seu personagem.
