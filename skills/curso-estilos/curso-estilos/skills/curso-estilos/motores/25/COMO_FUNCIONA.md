# Mapa → cenário de mangá: como funciona

Estilo inspirado na ferramenta Location Scout, que mostrou que um lugar real pode virar cenário de mangá só com geometria e shader, sem IA de imagem. O código dela é fechado; este motor foi escrito do zero com a mesma ideia.

## 1. Dados (`scripts/baixar_dados.py`)

```
python scripts/baixar_dados.py <nome> <lat> <lon> [raio_m]     # -> cena/<nome>.json
```

- Prédios, ruas, áreas verdes, água e árvores vêm do OpenStreetMap, por **uma** consulta à Overpass API (guardada em `cache/<nome>/`).
- Relevo: Terrain Tiles da AWS no formato terrarium, com altura = R·256 + G + B/256 − 32768 (4 tiles no zoom 15 para um raio de 450 m).
- A cena sai em metros locais, com o centro pedido na origem. Altura de prédio vem de `height` ou `building:levels`; sem nenhum dos dois, é estimada por tipo e área.
- Árvores de calçada, carros e postes são estimados ao longo das ruas (o OSM quase nunca tem esses dados).
- User-Agent genérico, sem e-mail.

## 2. Modelo 3D (`render/manga.js`, three.js)

- O contorno de cada prédio é extrudado até a altura. Janelas são desenhadas no shader a partir das coordenadas da parede e somem quando ficam pequenas na tela.
- Ruas viram fitas sobre o relevo, com faixas e travessias.
- Copa de árvore tem um único ID, então não sai linha entre os tufos.
- A "rua principal" (parâmetro `eixo`) define o sistema de coordenadas das câmeras: ao longo, lateral, altura.

## 3. Traço e retícula (o "mangá")

1. **Sombra**: mapa de profundidade a partir do sol (`az`, `el`).
2. **G-buffer** em supersample (`ss`): normal, profundidade, luz, cinza do material, ID do objeto.
3. **Linha**, em três testes:
   - salto de profundidade, pela 2ª derivada de 1/z (assim chão inclinado não vira risco);
   - dobra forte entre normais;
   - troca de ID.
   Só o objeto da frente desenha a linha. O traço afina e clareia com a distância.
4. **Tom**: Lambert em degraus + sombra projetada + cinza do material. A retícula de pontos é feita na tela, girada 45°, e o raio do ponto cresce com a densidade.
5. **Beta** (preto chapado) só aparece onde é escuro **e** está na sombra, ou no vidro. Dentro do preto as linhas ficam brancas (白抜き, "shironuki").
6. **Antisserrilhado**: redução do supersample com média de caixa.

## 4. Render (`scripts/render.mjs`)

- Roda no Chrome do sistema, sem interface. Os arquivos da pasta são servidos por interceptação de requisição e todo o resto é abortado: nada sai para a rede.
- Três modos: `fotos` (câmeras prontas: `overview`, `alto`, `rua`), `voo` (descida de cima até a avenida, 12 desenhos/s) e `specs` (lista de câmeras livres em JSON, usada pela peça).
- Câmera livre: `MANGA.free({f, pos, look, fov, shift, T, zmin, limpa, fa, fb, ground})`. Com `f: "at"` as posições são (ao longo, lateral, altura) em relação ao eixo.

## 5. Parâmetros na URL (o campo "query" dos comandos)

| parâmetro | o que faz | padrão |
|---|---|---|
| `eixo` | nome da rua principal no OSM (`Avenida%20Paulista`) | maior rua de carro perto do centro |
| `ss` | supersample (2 = rascunho, 3 = final) | 2 |
| `lw` | espessura do traço | 1.6 |
| `cell` | passo da retícula em px | 4.2 |
| `out` | escala de traço e retícula (fixe em 1 para quadros de tamanhos diferentes na mesma página) | largura/1080 |
| `az`, `el` | azimute e elevação do sol, em graus | 320, 38 |
| `fa`, `fb` | começo e fim do esmaecimento para o branco, em metros | 320, 620 |
| `ts` | escala do tom (0.72 clareia, mas tira preto das janelas) | 1.0 |
| `zumbi=1` | liga a horda e o museu modelado de `render/zumbi.js` (só faz sentido na cena `paulista`) | desligado |

## 6. A peça de exemplo (`scripts/peca.py`)

- 4 câmeras em splines PCHIP (sem overshoot, não atravessam prédio), renderizadas como camadas.
- A montagem recorta cada camada por um polígono (os quadros da página), desenha as bordas em 4× e reduz, e anima o primeiro quadro fechando e o último abrindo até a tela cheia.
- `scripts/compor.py` cola um personagem desenhado (imagem em P&B sobre fundo branco) no cenário, passando o tom dele pela mesma retícula.

## 7. O que falta em relação a uma ferramenta de produção

Cidade ao longe (a cena acaba no raio pedido e esmaece para o branco), fachada em geometria perto da câmera, árvores com galhos, gente, semáforos, fios, hachura (kakeami) e exportação SVG.
