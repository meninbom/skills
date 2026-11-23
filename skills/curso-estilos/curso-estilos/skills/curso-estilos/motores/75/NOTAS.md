# 75 · Notas da peça: "Os primeiros passageiros"

## A peça
Vertical 1080×1920, 30 qps, 27,5 s (825 quadros). No pacote sai muda. O fato: em 19/09/1783, em Versalhes, o balão de ar quente dos irmãos Montgolfier levou uma ovelha, um pato e um galo, e os três pousaram vivos. Causa e efeito visível: fogo → ar quente → balão sobe.

O texto (em `audio/voice/texto.txt`):

> Os primeiros passageiros de um balão foram uma ovelha, um pato e um galo.
> É 1783, em Versalhes, e o rei quer saber se dá pra respirar lá em cima.
> Os irmãos acendem palha embaixo do pano, o ar quente enche o balão, e os três sobem na frente da corte inteira.
> Oito minutos depois, pousam num bosque. Vivos.
> O único ferido foi o galo.
> Pelo visto, a ovelha pisou nele.

Os 6 planos (quadros em `SHOTS`, no `story.ts`):

1. **0–147 · Gancho no ar:** o balão já voando, os três no cesto, a cidade lá embaixo. Termina num clarão branco de 4 quadros.
2. **147–343 · O jardim:** a corte, os irmãos e o rei, que fecha a cara em "lá em cima".
3. **343–475 · O fogo:** os irmãos acendem a palha; a fumaça sobe e o balão enche.
4. **475–561 · A subida:** o balão sai do chão, a corte e o rei olham para cima.
5. **561–666 · O bosque:** entra em fusão de 8 quadros; o cesto desce na clareira e toca o chão em "pousam".
6. **666–825 · O galo:** o galo de costas no chão com estrelinhas, a ovelha em cima dele, o pato indiferente. O pisão cai na palavra "pisou".

## O que é do curso e o que veio do motor aberto
- **Feito para o curso:**
  - o roteiro, a linha do tempo e a câmera de cada plano (`story.ts`);
  - o balão com textura pintada, cesto de vime, cordas e mastro, o fogo e a fumaça (`balloon.ts`);
  - os três bichos desenhados com a caneta do motor, a coroa do rei e as perucas dos irmãos (`toon.ts`);
  - quem está em cena em cada plano (`stage()` e as funções `court`, `brothers`, `king`, `passengers` em `cast.ts`);
  - a clareira do bosque (ajustes em `world.ts` e `build.ts`);
  - a trilha (`audio/balao_mix.py`): minueto em ré (cravo, pad e pífano), rufar e tímpano no fogo, metais na subida, fogo, vento, multidão, pássaros, o baque do pouso e o pisão.
- **Do motor `mromidev/claude-animated-shorts` (MIT), sem mexer:** o mundo e as texturas pintadas, o traço de tinta nas arestas, o desfoque de lente, a grade de cor, a luz relativa à câmera, o sombreamento dos cartões, a multidão e a gramática de câmera.
- **Ajuste de cor feito depois:** a saturação do mundo no preset `day` desceu de 1,08 para 0,82 (`lights.ts`) e a da grade de `[1.0, 1.05, 1.0]` para `[0.95, 0.9, 0.85]` (`grade.ts`). O croma (C* no percentil 90) caiu de ~73 para ~47 na média dos seis quadros-chave; a referência do gênero fica perto de 48.

## Como a cena é montada (para quem vai mexer)
- Um mundo three.js único; a cada quadro, `story.ts` diz qual plano está valendo, onde está a câmera e o estado do balão.
- Os personagens são cartões (planos com textura de Canvas 2D) que encaram a câmera. A luz da cena tinge o cartão e ele ganha uma sombra de contato no chão.
- Cadeia de pós, na ordem: traço de tinta → desfoque de lente → brilho só no que emite luz → tone mapping → grade de cor. Todos os tamanhos em pixel estão escritos para 1080×1920 e acompanham a escala do render.
- O sol é relativo à câmera e fica congelado por plano (não muda no meio do plano).
- Casas que tapariam a câmera somem sozinhas.

## Notas
- Personagens ~80% da referência; mundo e luz ~50%; câmera, ritmo e efeitos ~70%. Geral: 60–65%.
- Checagem quadro a quadro do motor de origem na primeira versão: nenhum quadro preto, branco ou congelado, 0% de quadros parados.
- O que quebra: o galo deitado lê como mancha vermelha; bichos só de perfil; plano 2 quase parado por 3,5 s; fumaça grande ao fundo; a ponte da história de origem aparece lá embaixo no plano 1.
- Teste com a luz `golden` nos planos 5 e 6: reprovado (a cena caiu em sombra azul). Ficou `day`.
