# Kit de partida · peça curta com o boneco vetor

Uma cena de 7 s que já renderiza: o boneco entra andando, para, acena e fala uma frase com legenda. É o ponto de partida para uma peça curta de qualquer tema. O episódio de exemplo (a floresta azul) continua intacto; aqui o cenário e as cores ficam num arquivo separado.

## Rodar

Dentro da pasta do motor (a que tem o `package.json`), depois do `npm install`:

```
npm run kit
```

Sai `saida/kit.mp4`: 7 s, 1080×1920, 30 qps, mudo, yuv420p. Para ver só 4 quadros lado a lado, bem mais rápido: `npm run kit:folha` (sai `saida/kit_folha.jpg`).

Para testar outro tema, tamanho ou enquadramento sem editar nada, chame o render direto (funciona igual em qualquer terminal):

```
node render.mjs --pagina kit_template/kit.html --video saida/kit.mp4 --tema interior
node render.mjs --pagina kit_template/kit.html --video saida/kit.mp4 --tema chuva
node render.mjs --pagina kit_template/kit.html --video saida/kit.mp4 --vw 540 --vh 960
node render.mjs --pagina kit_template/kit.html --video saida/kit.mp4 --vw 1920 --vh 1080 --plano aberto
```

`--vw` e `--vh` são a largura e a altura do quadro (padrão 1080×1920). No horizontal nada estica: o cenário se repete para os lados.

## O que trocar e onde

| Quero trocar | Arquivo | Onde |
|---|---|---|
| O tema inteiro (dia claro × sala quente × cidade à noite na chuva) | `cenario.js` | a linha `export const TEMA = 'dia';` (troque por `'interior'` ou `'chuva'`) |
| Uma cor do cenário | `cenario.js` | o bloco `cores` do tema |
| As cores do personagem | `cenario.js` | o bloco `boneco` do tema (pele, roupa, calça, bota, chapéu, acento) |
| O clima de luz em cima do boneco | `cenario.js` | `amb` (tinge as cores) e `luz` (o fio de luz na borda) |
| O desenho de uma camada | `cenario.js` | `fundo`, `meio`, `chao` ou `frente` do tema, na função `desenha` |
| A chuva (mais forte, mais fraca, sem) | `cenario.js` | no tema `chuva`, o bloco `tempo`: `forca: 1` (0 desliga, 0.5 = garoa) |
| Uma luz que brilha (janela, poste, farol) | `cenario.js` | desenhe a mancha com `g.globalCompositeOperation = 'lighter'`; o poste do tema `chuva` é o exemplo |
| Criar um tema novo | `cenario.js` | copie um tema inteiro, dê outro nome e ponha esse nome em `TEMA` |
| O enquadramento | `cena.js` | a linha `const PLANO = ... 'medio'` (`'aberto'`, `'medio'` ou `'close'`) |
| O tamanho do boneco em cada plano | `palco.js` | a tabela `PLANOS` (`altura` = quanto da altura do quadro ele ocupa) |
| As peças do personagem (corpo, touca, mochila...) | `cena.js` | o bloco 2, a ficha passada para `gerar(...)` |
| O que acontece e quando | `cena.js` | o bloco 3, a linha do tempo, e a função `quadro(t)` |
| A fala e a legenda | `cena.js` | `FALA` (texto e tempo) e `LEGENDA` (telas de 2–3 palavras; `*palavra*` fica em amarelo) |

## As camadas, na ordem em que são desenhadas

1. **céu**: degradê que cobre o quadro (`ceu`). Num interior, é a parede.
2. **fundo**: o que está longe. Quase não anda quando a câmera anda.
3. **meio**: o que fica entre o longe e a ação.
4. **chão**: onde o boneco pisa. Anda junto com ele.
5. **ação**: o boneco e os objetos da cena.
6. **frente**: o que passa na frente da câmera, desfocado. No close ela some, para não tapar o rosto.
7. **acabamento, tempo e legenda**: sombra nas bordas (`vinheta`), o que cai por cima do quadro (`tempo`: a chuva do tema `chuva`; é opcional) e, por cima de tudo, a legenda.

Cada camada tem `p` (paralaxe: 0 = parada no fundo, 1 = anda com o boneco, mais que 1 = na frente) e `desfoque`. O chão é `y = 0` e para cima é negativo; um boneco jovem tem ~600 de altura, use isso de régua.

## Os três temas prontos

| Tema | O que é | Bom para |
|---|---|---|
| `dia` | rua de terra, morros, árvores, sol | história leve, de dia |
| `interior` | sala com janela, estante, sofá e abajur | conversa, cena de casa |
| `chuva` | cidade à noite: prédios com janelas acesas, vitrines, postes com brilho, asfalto molhado e chuva | cena de clima, noite, drama |

## A pose do boneco: os campos

Em cada quadro você entrega ao boneco um objeto de pose, `B.boneco(g, HEROI, P)`. Tudo é opcional: o que você não escreve fica no padrão (de pé, braços soltos). As medidas são do próprio boneco: `[x, y]` contado a partir do ponto do chão embaixo dele, com frente = x positivo e para cima = y negativo.

| Campo | O que faz |
|---|---|
| `x`, `y` | onde o boneco está no mundo (`y: 0` = no chão) |
| `dir` | `1` olha para a direita, `-1` para a esquerda |
| `vista` | `'l'` de perfil, `'q'` de três quartos, `'f'` de frente, `'b'` de costas |
| `expr` | rosto: `'neutro'`, `'firme'`, `'bravo'`, `'triste'`, `'medo'`, `'susto'`, `'dor'`, `'grita'` |
| `olha` | para onde os olhos vão, `[x, y]` em poucos pixels (ex.: `[5, 0]`) |
| `agacha` | abaixa o quadril (positivo desce; negativo sobe, como sentado num selim alto) |
| `px` | empurra o quadril para a frente ou para trás (sentar, inclinar) |
| `lean` | inclina o tronco (0 = reto, 0.5 = bem debruçado para a frente) |
| `cabT` | gira a cabeça em relação ao tronco (negativo = levanta o queixo) |
| `mN`, `mF` | onde cada mão vai (`N` = a de cá, `F` = a de lá). O braço dobra sozinho para chegar |
| `eN`, `eF` | para onde cada cotovelo aponta (guia; use quando o braço dobrar para o lado errado) |
| `pN`, `pF` | onde cada pé pisa |
| `calcN`, `calcF` | calcanhar erguido (positivo) ou ponta erguida (negativo), só de perfil |
| `abertaN`, `abertaF` | `true` = mão aberta |
| `ar` | altura do pulo (tira o boneco do chão e encolhe a sombra) |
| `gira`, `estica` | gira o corpo inteiro (cambalhota) e estica ou achata (impacto) |
| `s`, `alfa` | tamanho (1 = normal) e transparência (1 = sólido) |
| `sombra` | `false` tira a sombra do chão (boneco em cima de um objeto) |
| `atras(g)`, `frente(g)` | desenham um objeto atrás ou na frente do boneco, nas medidas dele |

Um objeto que anda junto (bicicleta, cadeira, caixa nas mãos) entra por `atras` e `frente`:

```js
const P = { x, y: 0, vista: 'l', dir: 1, sombra: false,
  px: -64, agacha: -80, lean: 0.5,              // sentado e debruçado
  mN: [170, -424], mF: [174, -420],             // as duas mãos no guidão
  pN: [48, -150], pF: [-64, -150],              // os pés nos pedais
  atras: g => desenhaBicicleta(g),              // o que fica atrás do corpo
  frente: g => desenhaPedalDeCa(g) };           // o que passa na frente da perna
B.boneco(g, HEROI, P);
```

Para misturar duas poses sem pulo use `B.mix(poseA, poseB, k)` (k de 0 a 1), como a cena do kit faz na freada.

## A câmera

- `palco.camera('medio', { x, zoom })`: enquadramento pronto (`'aberto'`, `'medio'`, `'close'`), pensado para boneco de pé.
- `palco.cameraEm(x, y, zoom, yTela)`: aponta para um ponto qualquer do mundo. Serve para detalhe de objeto, close de boneco sentado e plano só de cenário. `zoom: 1` = um boneco de pé ocupa a altura inteira do quadro; `yTela` = altura do quadro em que o ponto fica (0.5 = meio). Exemplo, o rosto de alguém sentado: `palco.cameraEm(x + 40, -540, 1.5, 0.4)`.
- `palco.misturaCam(camA, camB, k)`: passa de uma câmera para outra dentro do mesmo plano.

## Arquivos

- `cenario.js`: os temas (cores e desenho das camadas). É o que mais se troca.
- `cena.js`: personagem e linha do tempo.
- `palco.js`: monta o quadro (ordem das camadas, câmera, enquadramento, legenda). Quase nunca precisa mexer.
- `kit.html`: a página que o render abre.

O boneco, o gerador de personagem, a caminhada e a legenda vêm do motor (`../boneco.js`, `../gerador.js`, `../fisica_v5.js`, `../motor.js`). Por isso o kit precisa ficar dentro da pasta do motor.

## Limites

- A legenda é a do motor: telas de 2–3 palavras por vez (não é palavra por palavra).
- No vertical o boneco entra por fora do quadro; no horizontal o quadro é mais largo e ele já começa visível, andando.
- A cena é muda. Voz e som você monta depois, no seu editor.
- Para conferir as articulações da sua cena: `python trava.py --page kit_template/kit.html --qps 30 --out TRAVA_kit.md` (precisa do `pip install -r requirements.txt`; o resultado sai em `TRAVA_kit.md`).
