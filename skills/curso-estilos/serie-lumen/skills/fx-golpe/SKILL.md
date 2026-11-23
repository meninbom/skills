---
name: fx-golpe
description: "Aplica efeito visual de golpe, impacto, magia ou explosão (partículas Effekseer, CC-0/MIT) num vídeo pronto, com o estouro cravado no ataque do som. Use quando pedirem \"põe um efeito\", \"efeito no golpe\", \"pluga o ToonHit\", \"explosão aqui\", ou quando um plano de impacto (hit, crítico, flecha, espada, raio, BUM) pedir reforço visual. Tem o catálogo numerado (nº 1–98 e 101–345), o motor aplicar_fx.py (estouro no som, carga, flash, cauda curta, rastreio da tremida, máscara, SFX) e as regras de timing que funcionaram na série LUMEN. NÃO use para criar efeito do zero em código, para impact frame desenhado nem para trilha ou mix de som."
---

Responda sempre em português do Brasil, em linguagem simples, como para quem está começando.

# fx-golpe

Põe um efeito de partícula renderizado (fundo preto, composto em `screen`) em cima de um vídeo pronto.
O motor acha o ataque do som do golpe e faz o **estouro** do efeito cair nele.

## O que tem aqui
- `scripts/aplicar_fx.py`: o motor.
- `scripts/mascara_cor.py`: máscara por cor (o efeito passa atrás do número de dano ou da legenda).
- `scripts/empacotar_efeitos.py`: gera o zip do pacote de efeitos (uso do professor; o aluno não precisa).
- `CATALOGO.md` + `catalogo.png` (nº 1–98) + `catalogo_extras.png` (nº 101–345) + os `.json` (número → pasta).
- `amostra/quadros/`: 3 efeitos pra começar (nº 96 ToonHit, 45 hit_eff, 234 Blow1).
- `LICENCAS.md` + `licencas/`: CC-0 e MIT.
- `BAIXAR_EFEITOS.md`: como pegar os 343 efeitos (~1,4 GB) e ligar no config.
- `GAME_FEEL.md`: **a régua do golpe** medida na série LUMEN (hit-stop, flash, zoom, tremida, impact frame de anime, som). Leia antes de montar um golpe. Pra mais efeitos com número, o site grátis game-feel-prompts.pages.dev (os prompts curtos dele são liberados pra usar nos projetos do aluno; não vêm no plugin).

## Instalar (uma vez)
```bash
pip install -r ${CLAUDE_SKILL_DIR}/requirements.txt
```
- Precisa do `ffmpeg` e do `ffprobe` no PATH.
- A pasta dos efeitos vem de `fx.quadros` no `kit.config.json` da série.
  Vazio = usa a amostra (3 efeitos). Pra ter os 343, siga o `BAIXAR_EFEITOS.md`.
- Roda na CPU. Não precisa de placa de vídeo.

## Fluxo

### 1. Achar o momento
- Veja o plano a 8 qps numa tira e localize o golpe:
  ```bash
  ffmpeg -ss 13.5 -t 2.5 -i EP.mp4 -vf "fps=8,scale=216:-2,tile=10x2" -frames:v 1 tira.png
  ```
- Ache o ATAQUE do som do golpe. O motor faz isso sozinho com `"t": "auto"` + `"janela": [a, b]`, uma janela de ~0,8 s em volta do golpe.
- Evite o BUM em cima de palavra falada: ele cobre a fala. Ponha logo depois da palavra.

### 2. Escolher o efeito pelo número
- Abra o `catalogo.png` / `catalogo_extras.png` e ache o número.
- No `catalogo.json` / `catalogo_extras.json`, o número dá o nome da pasta. Ponha o nome inteiro em `fx` (ex.: `X_tktk01__Blow3`).
  - Um pedaço do nome também serve, se só um efeito tiver aquele pedaço (`ToonHit` cai no nº 96).
- Na dúvida entre 2 ou 3, **pergunte ao aluno mandando os números do catálogo**. Escolher junto e ir testando funciona melhor.
- O `CATALOGO.md` tem o que serviu pra golpe, corte e magia na série LUMEN.

### 3. Escrever o `golpes.json`
Uma lista, um objeto por golpe. Exemplo (a receita padrão, com estouro no som):
```json
[{"fx": "ToonHit", "t": "auto", "janela": [14.6, 15.4], "x": 540, "y": 860,
  "escala": 0.75, "forca": 0.55, "cor": "gelo", "modo": "screen",
  "antes": 5, "dur": 0.4, "fade": 0.18}]
```
Rodar só a cena:
```bash
python ${CLAUDE_SKILL_DIR}/scripts/aplicar_fx.py EP.mp4 CENA.mp4 --linha golpes.json --corte 13.9 17.9
```
- `--corte INI FIM` gera só aquele trecho (vídeo + áudio). Leva uns segundos por cena de 4 s.
- Sem `--corte`, gera o vídeo inteiro com todos os golpes da lista.
- Um golpe só, sem JSON: `--fx ToonHit --t auto --janela 14.6 15.4 --x 540 --y 860 --dur 0.4`.
- O motor imprime onde achou o impacto (`impacto achado no som em 14.912s`). Confira se faz sentido.
- **Sem som de golpe no mix, o `t: auto` erra:** ele acha o maior salto de som da janela, que pode ser uma sílaba da voz. Nesse caso, use o tempo do golpe da linha do ciclo: `t` do plano + `soco` (no `linha_ciclo.json`). E confira que o BUM não cai em cima de palavra.

### 4. Conferir antes de mandar
- Tira de 8 qps da cena: o mesmo comando do passo 1, no `CENA.mp4`, mas com `-ss 0` (a cena cortada começa no zero; com o `-ss` do ep inteiro o ffmpeg não grava nada e nem dá erro).
- O estouro bate no ataque do som?
- A cauda acabou antes do corte do plano?
- O efeito não cobre o número de dano nem a legenda? Se cobre, use máscara (abaixo).
- Depois, `/curso-estilos:checar-video` no arquivo final.

### 5. Mandar só a cena
Mostre ao aluno só a cena (`--corte`): sai em segundos e ele julga o golpe sem esperar o ep inteiro. O vídeo inteiro só depois do ok dele.

## Campos do golpe (padrão entre parênteses)
| Campo | O que faz |
|---|---|
| `fx` | nome da pasta do efeito (ou um pedaço único) |
| `t` | segundo do impacto, ou `"auto"` + `janela` [a, b] |
| `x`, `y` | ponto do impacto em px do vídeo (centro da tela) |
| `escala` | tamanho em relação à largura do vídeo (0.75) |
| `forca` | intensidade 0–1 (0.55) |
| `cor` | `gelo`, `ouro`, `original` ou `"H,S"` (gelo) |
| `modo` | `screen` ou `add` (screen). `add` estoura mais; só em fundo escuro |
| `antes` | quadros de preparação do efeito antes do estouro (5) |
| `dur` | segundos depois do estouro até começar a sumir (efeito inteiro) |
| `fade` | segundos do sumiço (0.15) |
| `carga`, `carga_forca`, `carga_raio` | brilho crescendo no ponto antes do impacto (0 · 0.5 · 220 px) |
| `flash`, `flash_forca` | quadros de tela branca no impacto (0 · 0.5) |
| `seguir` | `true` = o efeito acompanha a tremida da câmera (não) |
| `matte` | `{"dir": pasta, "ini": segundo}`: máscara, branco = fica na frente |
| `sfx`, `sfx_db` | arquivo de som do golpe e ganho em dB (−8) |

O estouro do efeito = 1º quadro com ≥ 30% do brilho máximo. É ele que cai em `t`.

## Regras de timing (as que funcionaram na série LUMEN)
- **Receita padrão:** na série LUMEN, a receita que funcionou foi `escala 0.75, forca 0.55, cor gelo, modo screen`, com o ToonHit (nº 96). É o padrão do motor.
- **Estouro depois do hit-stop.** No episódio publicado, o estouro caía logo depois do congelamento de 8 quadros (~0,13 s), não no quadro do impacto. Assim o congelamento fica visível antes do brilho.
  Num golpe com hit-stop, use `t = impacto + hit-stop`.
- **Cauda curta.** Explosão e impacto duram 0,22–0,4 s de estouro: `dur 0.3–0.5` + `fade 0.15–0.2`.
  - Efeito inteiro só se o plano for longo e o efeito for o assunto.
  - Evite jogar o efeito inteiro, fora do som: o tempo e a animação do efeito brigam com o golpe e a aplicação parece solta.
- **Carga antes do impacto** (`carga 0.3–0.5`): brilho crescendo no ponto. Bom quando o golpe é anunciado (flecha de luz, magia carregando).
- **Flash de 2 quadros** (`flash 2`, `flash_forca 0.3–0.5`): só se a montagem do episódio já não tiver flash no impacto. Dois flashes juntos escondem o congelamento e somam clarão demais.
- **Cor = paleta do episódio.** `gelo` num episódio de neve e lobo branco; `ouro` em luz dourada ou outono. Nada saturado que brigue com o número de dano.
- **Força conforme o clarão que a cena já tem.** Cena clara pede `forca` ~0.55. Cena escura aguenta 0.8.
- **Tremida:** se a cena treme no impacto, use `"seguir": true`. O motor rastreia o ponto (fluxo óptico) e o efeito acompanha. Sem isso, o efeito "descola" do objeto.

## Efeito atrás de objetos (máscara), opcional
- `matte: {"dir": pasta, "ini": segundo do 1º quadro}`. Um PNG por quadro do vídeo, branco = fica na frente.
- **Texto** (número de dano, legenda, HUD): máscara por cor.
  ```bash
  python ${CLAUDE_SKILL_DIR}/scripts/mascara_cor.py EP.mp4 mascara_e04 --ini 13.9 --fim 17.9 --branco --faixa-y 1250 1920
  ```
  Use o mesmo `--ini` no `matte`. `--cor R,G,B --tol 50` pega uma cor (ex.: a palavra amarela da legenda).
- **Objeto ou personagem que se mexe:** precisa de recorte por IA (ex.: SAM 2). Pede placa de vídeo e fica **fora do plugin**.
  Se o aluno tiver um recorte assim, salve as máscaras como PNG por quadro e aponte no `matte`.

## Som
- `sfx` = caminho de um arquivo de som **do aluno**. Ex.: o mesmo que está em `sfx.mapa.golpe` no `kit.config.json` da série.
  Leia o config e copie o caminho pro `golpes.json`.
- `sfx_db` (padrão −8 dB). O motor alinha o ATAQUE do arquivo no impacto.
- Se o episódio já tem o BUM mixado, não ponha outro: dois sons de golpe juntos soam duplicados.
- A voz fica na frente: o golpe uns 8 dB abaixo dela, pra fala continuar clara.
- Nenhum som vem no plugin: as bibliotecas não permitem redistribuir. Bibliotecas grátis pra baixar: **SJC SFX Pack** e **Sound Effect Lab** (leia a licença de cada uma).

## Limites
- Composição `screen` sobre fundo preto: só vale pra luz. Fumaça escura e poeira ficam fracas.
- Luz do golpe pintando o ambiente numa cena escura, bloom e vários passes: o motor não faz.
  Pra isso, um compositor (ex.: Natron, grátis) por fora.
- Os efeitos vêm prontos (renderizados). Gerar efeito novo pede o editor do Effekseer e fica fora do plugin.

Licença: só packs CC-0 ou MIT (ver `LICENCAS.md`). Nada de crédito obrigatório na tela.
