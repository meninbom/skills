# 62 · "Ina contra a Sentinela" (a peça de vitrine)

## O que é
Embate curto, mudo e vertical, com 26,8 s (30 qps): **Ina × Sentinela da ruína**, numa arena de lajes em ruínas ao entardecer.
Mostra 4 poderes da biblioteca, cada um com a própria anatomia (carga → soltura → impacto → cauda curta), e o juice do kit.

| Poder | Carga | Soltura | Impacto | Cauda |
|---|---|---|---|---|
| **Raio** | Puxa a mão para baixo e depois a ergue para o céu; o céu escurece | Aponta para o Sentinela (whip de 5 q com rastro) e a câmera chicoteia para o plano aberto | Impact frame de anime, dourado; crítico 124; barra que mente | Selo ATORDOADA; arcos elétricos |
| **Soco do Sentinela** (ele revida) | Braço sobe por cima da cabeça, com antecipação de 48 q | Desce em 8 q com rastro | Onda de pontas de pedra até a Ina; ela voa para trás e pisca branco; −64 em vermelho; a barra dela mente | Pó e entulho |
| **Cura** | Ajoelhada, mãos no peito | Abre os braços; coluna verde | +58; a barra sobe com o pedaço verde na frente | Brilhos lentos |
| **Fogo** | Bola cresce na mão, de lado | Arremesso com torção do tronco e follow-through que cruza o corpo | Explosão; 98; Sentinela chamuscado | Selo QUEIMANDO; fumaça e brasas |
| **Gelo** (golpe final) | É a carga mais longa: mãos juntas, olhos fechados, espiral nas duas mãos. É também a cena mais escura, porque o gelo vira a fonte de luz | Empurrão com as duas mãos e onda de cristais no chão | Coroa de cristais congela o Sentinela de braços erguidos; impact frame azul; crítico 178 deixa a barra em 0 | Ele estilhaça em pedaços que caem e quicam; neve; Ina ofegante; câmera sobe |

## O que mudou contra a prova do kit (`../poder/poder.js`)
- **Pose dura:**
  - Todo golpe tem antecipação no sentido contrário e passa do ponto (keys com `outBack`/`out5`).
  - Braços chegam 3 q atrasados ao corpo e a cabeça 5 q.
  - A respiração fica mais forte depois do soco e no fim; o corpo treme segurando a carga.
  - O rabo do gorro puxa na carga e chicoteia na soltura. No soco ela desliza 0,5 m para trás.
- **Gelo lavado:**
  - Shader novo: faceta em azul fundo → azul saturado, núcleo claro visto por dentro, borda saturada acesa e contorno azul-marinho.
  - A cena cai para 12% da luz na carga.
- **Impact frame:** estilo anime (ver `motores/impact/`). Silhueta real dos personagens, 4 desenhos (clarão / preto com pincel + arco na cor do poder / papel invertido / volta com zoom) e uma cor só por poder. Sem estrela pontuda.
- **Hit-stop:** 13–14 q nos críticos (cobre o impact frame), 7 q no soco e no fogo.
- **Shake direcional:** impulso na direção do golpe que volta com mola, em vez de ruído aleatório.
- **Cena viva:** câmera sempre em órbita com destino, poeira dourada no ar, estandarte rasgado tremulando, capim com vento e o Sentinela respirando.
- **Luz:** cinematográfica. Sol baixo atrás do Sentinela, céu em domo que gira com a câmera, névoa vinho, gradação petróleo/laranja, vinheta, grão e primeiro plano desfocado.
- **Personagem e cenário:** o adversário (golem de pedra cinzelada com olho em fenda magenta e runas) e a arena foram feitos para esta peça. A Ina é personagem nossa e está de gorro.

## Como roda (a partir da pasta do motor, `motores/62/`)
- `arena/arena.html` + `arena/arena.js`. A pasta `arena/lib/` é a cópia do kit que a peça usa (juice, poderes, tokens) + a Ina (ina.js, esqueleto.js, toon.js).
- `npm run filme`: 1080×1920, 30 qps, 804 quadros. Em CPU (`DEMO_CPU=1`), cerca de 0,85 s por quadro (~12 min).
- `npm run folha`: folha de quadros.
- `npm run probe`: tempos dos golpes e câmera parada.
- Beats ficam em `WB` (quadros de mundo a 60 qps), câmera em `CK` (órbita: sujeito, azimute, distância, altura, fov) e poses em `S` / `KEYS` (Ina) e `GK` / `GKEYS` (Sentinela).
- A arena só renderiza em 1080×1920 (o HUD 2D é desenhado nessa medida); a cena de poder isolado e as demos do kit aceitam `esc=0.5`.

## Nossa nota contra a referência
A referência é a prova do kit (8,7 s por poder). Nota para esta peça: **7/10**.
- **Melhor que a prova:** é um embate com começo e fim, os 4 poderes estão no mesmo filme, o gelo tem contraste de verdade, o impact frame é de anime, a luz é de entardecer e a câmera não para.
- **Ainda abaixo de um profissional de game feel (ou de um jogo de verdade):**
  - O Sentinela é de blocos chapados e lê como "Minecraft com contorno"; falta silhueta mais rica (rachaduras, lascas, cristais nas costas).
  - A Ina não tem passo real (os pés deslizam no empurrão).
  - A explosão de fogo ainda estoura um pouco perto da câmera.
  - O final (≈5 s) é calmo demais para quem quer retenção.
  - Sem SFX, por ser mudo: o juice perde metade do impacto.

## Problemas conhecidos
- Checagem objetiva (preset genérico): passou em parado (0,0 s), engasgo, flashes (2/s), texto cortado e zona da UI. Deu aviso de texto pequeno no HUD.
- O selo CONGELADA nasce por cima do rótulo "CRÍTICO!" do número 178 por ~0,3 s.
- Render a 30 qps: os desenhos do impact frame ficam "em dois" (2 quadros cada), o que é de propósito.
- O HUD tem fonte < 52 px (nomes da barra) e é decorativo.
- A v1 saiu com o "64" cortado na borda e o fogo estourado: por isso número e selo são presos à área segura.
