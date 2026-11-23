# 25 · Mapa que vira mangá

> Vitrine: "O Vão" (31,1 s, muda) · Custo: R$ 0 (100% código e dados abertos) · Ferramentas: OpenStreetMap (Overpass), relevo Terrain Tiles/terrarium, three.js, Node + Chrome do sistema (puppeteer-core), Python, FFmpeg

## O que é
Uma coordenada real vira cenário de mangá: prédios e ruas do OpenStreetMap extrudados sobre o relevo, renderizados em three.js com traço de nanquim, retícula de pontos a 45°, preto chapado (beta) e linhas brancas dentro do preto (shironuki). Na peça, a câmera sai da vista de mapa da Avenida Paulista, desce até a horda no vão do museu, a cena vira uma página de mangá com 4 quadros vivos e volta ao mapa em laço.
Funciona porque o espectador reconhece o lugar ("minha cidade em mangá") e o estilo é forte e coeso sem nenhuma IA. Estilo inspirado na ferramenta Location Scout.

## Exemplo e arquivos
- Prévia do catálogo: `catalogo/previas/25_orig.mp4` (capa em `catalogo/previas/25_orig.jpg`).
- Motor completo: `motores/25/`; a peça inteira é `motores/25/scripts/peca.py`.
- Como funciona por dentro (dados, traço, retícula, parâmetros): `motores/25/COMO_FUNCIONA.md`.
- Demo de 3 s: `motores/25/DEMO.md`. Licenças e crédito obrigatório: `motores/25/FONTES.md`.

## Ferramentas e instalação
Tudo grátis.
- **Node 18+** e `npm install` dentro da cópia do motor (instala só o `puppeteer-core`, que usa o Chrome já instalado; não baixa navegador). Outro navegador: variável `CHROME_PATH`.
- **Google Chrome**, Edge ou Chromium, e **FFmpeg** no PATH.
- **Python 3.10+** com `pip install -r requirements.txt` (numpy, scipy, pillow, shapely): para baixar um lugar novo e para montar a peça. O demo, os stills e o voo simples não precisam de Python.
- **three.js** (MIT): vai local em `motores/25/vendor/`. O render não acessa a rede: os arquivos são servidos por interceptação e todo o resto é abortado.
- **Dados**: 1 consulta ao Overpass por lugar (fica em `cache/`) + 4 tiles de relevo. User-Agent genérico, sem e-mail. A cena da Paulista já vem em `motores/25/cena/paulista.json`.
- Relevo: **Terrain Tiles da AWS (formato terrarium)**, altura = R·256 + G + B/256 − 32768. O mosaico inclui SRTM, mas o que se baixa é o tile terrarium.
- **Crédito obrigatório** em toda peça publicada: "© OpenStreetMap contributors · relevo: Terrain Tiles (AWS Open Data)". Pode ir na legenda do post em vez de na tela.
- A ferramenta que inspirou o estilo é "All rights reserved": este motor foi escrito do zero, só com a técnica.

## Motor
Em `motores/25/` (~3 MB):
- `motores/25/render/manga.js`: o motor. Sombra → G-buffer → linha pela 2ª derivada de 1/z + troca de ID + dobra de normal → retícula, beta, shironuki → antisserrilhado por supersample. Câmeras prontas (`overview`, `alto`, `rua`), voo (`MANGA.shot('voo', t)`) e câmera livre `MANGA.free({f, pos, look, fov, shift, T, zmin, limpa, fa, fb, ground})`. Parâmetros por querystring (cena, eixo, ss, az, el, lw, cell, fa, fb, zumbi…).
- `motores/25/render/zumbi.js`: o museu (pórticos, volume suspenso, escada de corda) e a horda de figuras 3D da peça. `motores/25/render/personagem.js`: um personagem 3D em código (fica como contraexemplo: de perto não convence). `motores/25/render/index.html`: a página que carrega tudo.
- `motores/25/scripts/render.mjs`: o render. Modos `fotos` (stills), `voo` (MP4 de um voo de cima até a rua) e `specs` (lista de câmeras livres em JSON → um PNG por câmera).
- `motores/25/scripts/baixar_dados.py`: coordenada → `cena/<nome>.json` (Overpass + terrarium).
- `motores/25/scripts/peca.py`: a peça. Splines PCHIP das 4 câmeras, layout dos 4 quadros, máscaras, bordas e encode (`prancha`, `render`, `montar`).
- `motores/25/scripts/compor.py`: cola um personagem desenhado (imagem P&B em fundo branco) sobre o cenário, com a mesma retícula.
- `motores/25/cena/paulista.json` (dados OSM + relevo, ODbL), `motores/25/vendor/` (three.js), `motores/25/lib/chrome.mjs`.

## Passo a passo (ponta a ponta)
Copie `motores/25/` para a pasta do seu projeto e trabalhe na cópia.

1. **Demo primeiro**:
   ```
   npm install
   npm run demo            # saida/demo.mp4, 3 s, 540x960, mudo
   ```
2. **Baixar o seu lugar** (1 consulta, fica em cache):
   ```
   pip install -r requirements.txt
   python scripts/baixar_dados.py minha_rua -23.5614 -46.6560 450     # nome lat lon raio_m -> cena/minha_rua.json
   ```
3. **Stills de reconhecimento** e um voo de teste (o último argumento é a "query" do motor; `eixo` é o nome da rua principal no OSM):
   ```
   node scripts/render.mjs fotos minha_rua 2400x1920 overview,alto "eixo=Avenida%20Paulista"
   node scripts/render.mjs voo minha_rua 1080x1920 7 "eixo=Avenida%20Paulista&ss=3"
   ```
4. **Planejar a peça**: em `scripts/peca.py`, troque `CENA` e `EIXO`, escreva as chaves de câmera `(t, pos, look, fov, shift)` e o layout dos quadros (polígonos PA–PD). Para um lugar que não é a Paulista, tire `zumbi=1` da query e use câmeras com `"f": "at"` (posição ao longo, lateral, altura em relação ao eixo).
5. **Prancha barata** (supersample 2) para fechar o enquadramento antes do render:
   ```
   python scripts/peca.py prancha
   ```
6. **Render das camadas** (s1, s3, b, d):
   ```
   python scripts/peca.py render            # ou: python scripts/peca.py render s1
   ```
7. **Montagem** (página, máscaras, bordas a 4×, MP4 1080 yuv420p + celular por redução de área, em `saida/`):
   ```
   python scripts/peca.py montar
   ```
8. **Com voz** (opcional): feche o roteiro antes; voz em 1 take; prenda cada quadro da página a uma palavra. Voz paga usa a sua chave e é cobrada por caractere.
9. `/checar-video` no 1080. Confira o `pix_fmt` e publique com o crédito do OSM na legenda.

## Pegadinhas medidas
- **Fundo e tela limpa:** fundo chapado liso vira slide (dê profundidade, luz ou textura); nota de produção nunca vai dentro do quadro (nome de arquivo, versão, crédito de ferramenta); nada de rótulo "imagem gerada" por cima da arte.
- Linha por salto de profundidade usa a 2ª derivada de 1/z: assim chão inclinado não vira risco.
- Supersample 3× com média de caixa 3×3. Com 2× e bilinear, traço e ponto serrilham no 1080.
- Traço e retícula do mesmo tamanho em quadros de tamanhos diferentes: fixar `out=1`, `lw=1.6`, `cell=4.2`.
- Sol baixo lateral (az 250°, el 14°) com Lambert quase binário: parede no sol fica branca, sombra longa vira retícula. Sol alto = retícula em tudo = cinza.
- Esmaecimento acompanha a altura da câmera: `fa = max(320, 1,5·altura)`, `fb = max(620, 3,2·altura)`. Sem isso a vista de mapa a 430 m some no branco.
- Splines PCHIP na câmera (não cúbica comum): sem overshoot, não atravessa prédio.
- 12 desenhos por segundo, entregue a 24 fps.
- Horda some a menos de `zmin` metros da câmera (de perto vira manequim): 22 no voo, 14 no teto, 11 na escada.
- Render por software: ~9,5 s por quadro 1080×1920 com supersample 3 (211 quadros em 2.013 s numa camada); ~45 min com 3 camadas em paralelo. Em 540×960, ~3,6 s por quadro. Com placa de vídeo, o voo simples de 7 s sai em ~22 s.
- Celular: redução com `flags=area`, senão a retícula faz moiré. A peça saiu com 45 MB; se o envio tiver teto de 30 MB, suba o crf para 27.
- QA: o OCR do checador lê janela de prédio como "888" (avisos de texto pequeno, falso positivo).
- Na versão com voz: `sidechaincompress` acaba junto com a voz e corta o fim (use `apad`); 10 processos em paralelo estouraram a RAM (5 passou); alinhe o pico do SFX ao quadro do evento, não o início do arquivo.
- Rente ao chão aparecem costuras do relevo no asfalto (a malha do terreno atravessa a fita da rua). Evite câmera rasante ou use polygonOffset no terreno.
- Defeito conhecido da cena de exemplo: um risco em zigue-zague numa faixa de pedestre (via de travessia com curva fechada no OSM).

## Custo e tempo
- R$ 0. Nenhuma IA, nenhum crédito.
- Baixar um lugar: segundos (1 Overpass + 4 tiles). Render da peça: ~45 min por software. Montagem: poucos minutos.
- Roda sem placa de vídeo (`DEMO_CPU=1` força o render por software). Com placa é muito mais rápido (o demo sai em 10 s, medido com RTX 4070 Ti 12 GB); uma tarefa de GPU por vez.
- Com voz: um episódio de ~40 s com narração e efeitos gerados ficou na casa de 3.000 caracteres/créditos num serviço pago.

## O que funcionou e o que não funcionou
- **O cenário é o herói.** Lugar reconhecível + traço de mangá segura o vídeo sozinho.
- **Personagem 3D em código não funcionou.** De perto fica feio (manequim). O que serviu: personagem desenhado fora (imagem P&B) e colado sobre o cenário com a mesma retícula (`scripts/compor.py`), ou figuras só de longe, como a horda.
- **Historinha didática não segurou.** A primeira história (o caminho de uma gota de chuva) saiu morna; o que funcionou foi dar um conflito ao lugar (apocalipse zumbi no meio da avenida).
- **Curto demais frustra.** Um animatic de 8 s foi bem recebido e a reação foi "muito curto": o estilo aguenta 30 s ou mais se a câmera tiver para onde ir.
- **Detalhes que pesaram na versão com voz**: corda tem que parecer corda; card de escolha só se a voz fizer a pergunta; dado solto na tela só se a narração ligar a ele.
- **Câmera contínua com elo entre trechos, sempre em movimento, nenhum crédito na tela** (o crédito do OSM vai na legenda).
- Nossa nota para a peça de vitrine: 7 de 10. Perde por não ter personagem de perto e pela cidade que acaba em ~450 m.

## Roteiro de aula
- **Objetivo**: o aluno sai sabendo transformar qualquer coordenada num cenário de mangá animado e entende as 3 passadas que fazem o "mangá" (linha, tom, preto).
- **Demonstração** (~30 min):
  1. Mostrar a peça e o demo rodando (4 min).
  2. Rodar `scripts/baixar_dados.py` num lugar novo e abrir o JSON da cena (5 min).
  3. Stills com 2 câmeras; mudar traço, retícula e sol pela query (`lw`, `cell`, `az`, `el`) (8 min).
  4. Abrir `scripts/peca.py`: uma spline de câmera, a prancha, o render de uma camada curta (8 min).
  5. A página de mangá: máscara por polígono, quadro que cresce até a tela cheia (5 min).
- **Exercício**: a rua do aluno. Baixar a coordenada, entregar 3 stills e um voo de 7 s do alto até a rua. Deu certo se: o lugar é reconhecível, parede no sol está branca (não cinza), não há serrilhado no traço a 1080 e o crédito do OSM está na legenda.
- **Pré-requisitos**: aula 14 (câmera contínua). Ajuda: noção de three.js e de shader.

## Limites conhecidos
- A peça (`scripts/peca.py`) e `render/zumbi.js` são específicos da Paulista e do museu. Lugar novo funciona direto nos modos `fotos` e `voo`; para uma peça completa é preciso reescrever as chaves de câmera e o que acontece na cena.
- Não há personagem bom dentro do motor: de perto a horda é manequim. O caminho que serviu (arte desenhada fora + `scripts/compor.py`) depende de você ter a arte.
- A cena acaba no raio baixado (some em ~450 m, esmaecendo para o branco); copa de árvore em bolha; sem poste detalhado, placa ou fio; costura do relevo rente ao chão.
- A peça de vitrine é muda: não há script de voz, legenda ou card de escolha neste motor.
- Lugares com poucos dados no OSM (sem altura de prédio, sem nome de rua) saem pobres: confira o mapa em openstreetmap.org antes de escolher.
- O `scripts/baixar_dados.py` depende de serviços públicos (Overpass e AWS Open Data): se um estiver fora do ar, tente mais tarde; não faça consultas em laço.
