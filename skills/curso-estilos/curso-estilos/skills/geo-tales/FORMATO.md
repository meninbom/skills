# O formato: o que o vídeo é

Exemplos para olhar em `motor/exemplo/`: `antes_depois.jpg` (antes × depois do refino; o 1º quadro é o lugar da sua referência), `v6_b.jpg` (ilustrações na cena), `folha_recorte.jpg` (as 9 ilustrações do piloto).

## 1. Roteiro (a parte menos madura: o roteiro do piloto é o ponto mais fraco da peça)

O que se mediu na referência e se usou no piloto:
- **Um "por quê" só**, com resposta que se VÊ no mapa. Abre já com a afirmação estranha em cima do mapa ("nessa faixinha mora mais da metade do Brasil"), sem introdução.
- **5 a 6 blocos**, cada um com uma causa e uma imagem própria no mapa: risco, parede, rio, produto, cidade. Cada bloco muda de lugar ou de escala, então a câmera sempre tem para onde ir.
- **A tela mostra mais do que a voz diz**: a voz fala "um risco", a tela desenha a linha, pinta os dois lados e escreve o ano.
- **Humor leve**: coisa com carinha (a gota que olha o mar e vai embora), bichinho de chapéu, personagem histórico ranzinza.
- **Fecho em loop**: a última frase emenda na primeira.
- 245 palavras deram 70 s na voz Will (≈ 3,5 palavras/s). Números por extenso no texto do TTS.
- Escrever em narração corrida, no jeito falado de quem assina o canal (parágrafos ligados, não tabela de frases soltas). O arquivo do roteiro tem, para cada parágrafo, a linha **TELA:** dizendo o que o mapa faz. Exemplo de narração: `motor/exemplo/narracao.txt`.

## 2. Mapa e cor

- Base: Blue Marble (oceano azul-marinho profundo, terra viva). De perto: recorte Sentinel-2 com relevo exagerado.
- **Região pintada = cor viva e quase opaca + borda fina clara + sombra de "levantada"**. Verde `#3db51f`, laranja `#f08c12`, amarelo `#f2b01a`, vermelho `#e3262d`, alfa 0,9–0,95; borda de 3,5 px num tom claro da mesma cor. A cor entra por varredura com um fio claro na frente.
- **Tomada inclinada**: a terra ocupa uns 70% do quadro. Mirar a câmera terra adentro, não na linha da costa; com a mira na costa, metade do quadro vira mar liso. Névoa de distância só aparece com a câmera inclinada.
- Nunca fundo chapado nem luz de meio-dia "crua": vinheta, grão leve, névoa.

## 3. Ilustrações (o que mais levantou o nível)

- Tudo que é objeto, bicho, prédio ou pessoa é **ilustração pintada gerada por IA de imagem** (nos nossos testes, Z-Image local), recortada e colada no mapa. Nada desenhado em código, nada de emoji.
- Uma ilustração por ideia do roteiro: o transporte (nau), o produto (cana, ouro), a construção (engenho, Congresso), o personagem com carinha (gota), o bichinho da piada (caranguejo de chapéu), a pessoa histórica em busto (frade).
- Mesmo estilo em todas (o sufixo do prompt é fixo, ver `MOTOR.md` §3), fundo branco puro, objeto único e centrado.
- **Na cena**: sombra suave embaixo, entrada com um quique curto (só objeto quica, texto nunca), vida mínima depois (balanço de 3–6°, sobe-desce de poucos px). Busto de pessoa entra deslizando de lado. Expressão que muda = duas imagens trocadas com fusão (gota curiosa → gota emburrada).
- Tamanho na tela de 1080 px: ícone repetido 110–150 px de altura, personagem 150–280, busto ~340, prédio-herói ~380.

## 4. Texto

- **Limpo**: branco com sombra suave em duas passadas, sem contorno. Montserrat SemiBold para rótulo, ExtraBold só para número/ano grande (≥ 90 px), em amarelo `#ffe14a`.
- Caixa alta com respiro entre letras para nome de região.
- **Legenda**: 1 a 3 palavras, 52 px, a ~70% da altura, branca, sobe de leve ao entrar. Sem destaque colorido de palavra. Número em algarismo.
- Texto entra chegando maior e de baixo e freia (expo.out, ~0,4 s), sem passar do ponto; entra ~0,12 s antes da palavra falada.
- Nada cortado na borda: prender o x do rótulo dentro da tela enquanto a câmera chega.

## 5. Câmera e movimento

- A câmera nunca para: no repouso deriva devagar em linha contínua; entre blocos voa com in-out forte (`mv`) e desfoque de movimento real.
- Cada voo leva para onde a próxima coisa acontece. Um efeito de sopro de ar no pico de cada voo.
- Uma coisa por vez: o que a voz diz agora é o que se mexe.
- Nossa nota: câmera e ritmo são o segundo ponto fraco do piloto (depois do roteiro). Antes de mexer, descubra onde incomoda: assista com alguém e marque os segundos.
