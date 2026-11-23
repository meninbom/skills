# Como fazer

Episódio novo = uma pasta do seu projeto com a cópia inteira de `motor/` (index.html, render.mjs, legendas.py, voz.py, package.json, vendor/, dados/). Rode o demo primeiro (`npm install`, `npm run demo`; ver `motor/DEMO.md`). A cena do episódio (`cena_<tema>.js`) e o `prepara.py` partem de `exemplo/`: copie os dois para a raiz da pasta do episódio e edite. Tudo é relativo a essa pasta.

Requisitos: Node 18+, Chrome (ou Edge/Chromium; `CHROME_PATH` se não estiver no lugar padrão), ffmpeg no PATH. Para os scripts auxiliares: Python 3.10+ e `pip install -r requirements.txt`.

O que vem pronto em `dados/`: mundo em 2k, América do Sul em baixa e o contorno do Brasil (o que o demo usa). A cena de exemplo (`exemplo/cena_brasil.js`) é material de leitura: para rodá-la é preciso baixar a base cheia, gerar os dados com o `prepara.py`, criar as 9 ilustrações e a voz.

## 1. Dados (`baixar_assets.mjs` e `prepara.py`)

- **Blue Marble**: NASA GIBS WMS (`gibs.earthdata.nasa.gov/wms/epsg4326/best/wms.cgi`, camada `BlueMarble_ShadedRelief_Bathymetry`, qualquer recorte, sem chave, domínio público). `node baixar_assets.mjs` baixa o mundo em 8k, a América do Sul a 80 px por grau e o Natural Earth; `node baixar_assets.mjs recorte europa -16 60 64 18` baixa outro continente. No Windows, se for usar `curl` à mão, ele pode pedir `--ssl-no-revoke`. O servidor antigo `eoimages.gsfc.nasa.gov` costuma não responder: use o GIBS.
- **De perto**: Sentinel-2 cloudless (EOX, CC BY 4.0) + relevo terrarium (AWS). `patch(nome, lon0, lon1, lat0, lat1, ...)` no `prepara.py` gera `dados/gen/<nome>.jpg` + `<nome>_alt.bin`. O `prepara.py` iguala a cor do recorte à do Blue Marble e conta com `dados/am_sul.jpg` a 80 px por grau (renomeie o `am_sul_80.jpg` baixado).
- **Regiões**: Natural Earth (países, rios) e malhas do IBGE, API v3 (estados, regiões metropolitanas; salve como `dados/ibge_<nome>.json`) → `dados/gen/<nome>.json`. Faixa a X km da costa = buffer em projeção local.
- Nunca ponha e-mail ou dado pessoal em URL ou User-Agent das requisições.

## 2. Cena (`cena_<tema>.js`)

`export async function CENA(ctx)` devolve `{ dur, camera, mundo(t), tela(t) }`. A menor cena completa é `demo/cena_demo.js` (50 linhas): leia essa primeiro.
- `camera`: chaves `{t, lon, lat, span, tilt, az, e, arco}`. `span` = altura visível em graus. `e`: `'lin'` no repouso, `'mv'` no voo.
- `mundo(t)`: estado 3D. `new Pais(geojson, {cor, alfa, ordem})` e `.set({corte, fio, alfa, visivel})` (varredura por latitude; `fio` = linha clara na frente). `recorte(...)` com `.exag` (relevo) e `.alfa`. `quatArco` + `.aplica(q)` faz a região voar em "tamanho real" para outro lugar.
- `tela(t)`: camada 2D. `T.texto`, `T.img(im, p, altura, {esc, rot, alfa, espelha, base})`, `T.pino`, `T.traco`/`T.geo` (linha que se desenha, devolve a ponta), `T.ponto`, `T.legenda`. `tela(lon, lat, z)` projeta para pixel. Borda fina de região: função `borda()` do demo e do exemplo.
- Entrada de texto: `...E(t, t0)` do demo. Objeto: `esc: seg(t, a, a + .36, 'back')`.
- Cor de `Pais` já é convertida no motor (sem isso o hex sai escuro).

**Testar sempre em quadro parado**: `node render.mjs --cena cena_<tema> --times 4.4,19.6,27 --tw 540 --out prints/x.jpg` (~10 s). `--mb 30` liga o desfoque no quadro parado. A cena é passada sem o `.js`, relativa à pasta do motor.

## 3. Ilustrações (IA de imagem local)

Feito por nós com o Z-Image no ComfyUI local (grátis, ~12 s por imagem numa placa de 12 GB). Qualquer gerador que entregue objeto isolado em fundo branco serve. Uma tarefa de GPU por vez: se você subiu o ComfyUI só para isso, desligue ao terminar (confira a fila vazia antes).

1. Um prompt por linha em `dados/ilus/prompts.txt` (modelo em `exemplo/prompts.txt`). Forma: descrição concreta do objeto + sufixo fixo:
   `Hand-painted digital illustration, detailed gouache storybook style, like an asset from a history strategy game, soft painterly shading, clean silhouette. Single object centered, isolated on a plain pure white background, no text, no border.`
2. Gerar a 1024×1024, ~10 passos, uma semente fixa, no seu fluxo de texto-para-imagem.
3. Recorte: `rembg` (modelo u2net), cortar na caixa do alfa, reduzir para ~560 px, salvar `dados/ilus/<nome>.png`. Montar uma folha sobre fundo colorido e OLHAR antes de usar (modelo: `exemplo/folha_recorte.jpg`).
4. Na cena: `const IL = await img('dados/ilus/<nome>.png')` e `T.img(IL, ...)`. O demo usa um cartão desenhado em canvas no mesmo lugar.

Limites vistos: personagem simples (gota) sai mais "vetor" que pintado; detalhe pedido pode não vir (a tonsura do frade); sobra um véu branco em vãos finos (entre talos, cordas). Sementes diferentes dão quase a mesma imagem: para variar, mude o texto.

## 4. Voz, reancoragem, legenda, som

- **Voz** (ElevenLabs, PAGO, com a sua chave em `ELEVENLABS_API_KEY`): `python voz.py voz/narracao.txt voz/narr_A --voz ID_DA_VOZ --confirmo-custo`. Sem `--confirmo-custo` ele só mostra a estimativa (~1 crédito por caractere; o piloto tem ~1.100 caracteres por tomada). Sai o áudio e o `.words.json` com o tempo de cada palavra. Também dá para gerar no site e exportar os tempos. Voz do piloto: "Will - Dynamic Voiceover", estabilidade 0,35, estilo 0,7, velocidade 1,0. Sem sussurro; nunca acelerar acima de 1,1×.
- **Reancorar**: tabela `ANC = [[tempo da voz, tempo da cena muda], ...]` (uma âncora por palavra-chave, tirada do `.words.json`); `cenaDe(t)` interpola por trechos e os tempos da câmera passam pelo inverso. A voz fica intacta. Ver `exemplo/cena_brasil.js`.
- **Legendas**: `python legendas.py voz/narr_A.words.json voz/caps.json "cento e onze=111" ...`.
- **Som** (`exemplo/mix.py`): voz a −16 LUFS na frente; 5 a 8 efeitos da sua biblioteca (ou de um pack CC0) nos buracos da fala, sopro de ar alinhado pelo pico, pop pelo ataque, picos de −18 a −21 dBFS; master −14 LUFS. Trilha: escolha de ouvido, baixa o bastante para não disputar com a voz. Um agente de IA não ouve: quem aprova o som é uma pessoa.

## 5. Render e entrega

- `node render.mjs --cena cena_<tema> --video saida/video.mp4` (CPU, 30 qps, 1080×1920, desfoque ligado): ~25 min para 72 s. Rode em segundo plano. `--gpu` usa a placa (em Windows, ANGLE/D3D11).
- Consertar um trecho: `--de 24 --ate 31` e emendar com `trim` + `concat` no ffmpeg (grão e desfoque são determinísticos, a emenda não aparece).
- Juntar áudio: `-crf 19 -pix_fmt yuv420p`, AAC 48 kHz. Versão de celular: `scale=720:-2 -crf 22` (~27 MB para 72 s).
- Conferência objetiva: a skill `checar-video` do pacote (`../checar-video/scripts/checar.py VIDEO --config ../checar-video/presets/generico.json --roteiro voz/narracao.txt`); se falhar, olhar o `suspeitos.png`.
