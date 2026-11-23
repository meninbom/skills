# 36 · Anime em SVG com gramática "em dois"

> Vitrine: "Fisgada" (30 s, muda) · Custo: grátis · Ferramentas: SVG gerado por JS, GSAP 3.14, Node + puppeteer-core (Chrome do sistema) ou HyperFrames, FFmpeg

## O que é
Um curta de anime desenhado 100% em código: bonecos paramétricos em SVG, animados com GSAP e renderizados quadro a quadro. O que faz parecer anime não é o traço, é o timing: atores trocam de desenho a cada 2 quadros ("em dois"), câmera e efeitos andam em um, existe um único plano caro (sakuga) e os cortes são mergulhos de cor. O espectador vê animação limitada de TV japonesa, com hold, smear e impact frame.

## Exemplo e arquivos
- Prévia do catálogo: `catalogo/previas/36_orig.mp4` (capa em `catalogo/previas/36_orig.jpg`).
- A composição inteira de "Fisgada" (boneco, cenário, 7 planos, linha do tempo): `motores/36/index.html`.
- Notas da peça (história, gramática aplicada, nota contra a referência): `motores/36/NOTAS.md`.
- Motor de origem, a réplica de estudo "Chuva e lâmina" (12 s): `motores/36/chuva_lamina/index.html`, com a ficha em `motores/36/chuva_lamina/SHEET.md`.
- Demo de um comando: `motores/36/DEMO.md`. Origem e licença de cada coisa: `motores/36/FONTES.md`.
- Método do repositório `blixvip/html-anime` (MIT).

## Ferramentas e instalação
Tudo grátis.
- **Node 18+** e `npm install` dentro da pasta do motor (instala só o `puppeteer-core`, que usa o Chrome que você já tem; variável `CHROME_PATH` se ele estiver fora do lugar padrão).
- **GSAP 3.14.2**: não vem no pacote. O `npm install` baixa do npm e copia para `vendor/gsap.min.js` dentro da sua cópia do motor; o render não usa internet. A licença do GSAP é a padrão sem custo (não é MIT); veja `motores/36/FONTES.md`.
- **FFmpeg** no PATH (ou variável `FFMPEG_PATH`).
- **HyperFrames (HeyGen, Apache 2.0), opcional:** a composição segue o contrato dele (`data-composition-id`, `data-start`, `data-duration`, `class="clip"`), então `npx hyperframes render` também funciona na pasta do motor. A peça da vitrine saiu na versão 0.9.55.
- **Pegadinha de custo do HyperFrames:** a ferramenta de mídia dele (`media-use`) procura um arquivo `.env` até 5 pastas acima e chama a ElevenLabs se achar uma chave. Esta peça não usa áudio: não rode essa ferramenta aqui, e trabalhe numa pasta sem `.env` com chave de áudio acima.
- **Placa de vídeo:** não precisa. É SVG; renderiza na CPU.

## Motor
Em `motores/36/` (~1,1 MB, dos quais 0,85 MB é a fonte da réplica):
- `motores/36/index.html`: a peça "Fisgada" completa. Dentro: paleta fechada `C`, esqueleto `rig()` com IK, boneco `actor()`, cenário, 7 planos como clips, agenda de poses "em dois" (`act()`), grão trocando a cada 2 quadros, mergulhos de cor (`#dip`).
- `motores/36/render.mjs`: renderizador. Abre a página no Chrome do sistema, liga e desliga cada clip pelo tempo, posiciona a linha do tempo de `window.__timelines` e manda os quadros para o FFmpeg. Opções: `--pagina`, `--video`, `--quadros` (folha), `--fps`, `--ini`, `--fim`, `--esc` (0.5 = 540×960).
- `motores/36/package.json`: `npm run demo`, `npm run folha`, `npm run filme`, `npm run chuva`.
- `motores/36/chuva_lamina/`: a réplica de 12 s e a ficha no formato do html-anime (runtime, roteiro de cor, orçamento de desenhos, planos). Usa a fonte EB Garamond (OFL), incluída em `chuva_lamina/fonts/`.
- `motores/36/lib/copiar_gsap.mjs` (copia o GSAP no `npm install`), `motores/36/NOTAS.md`, `motores/36/DEMO.md`, `motores/36/FONTES.md`.

Não vem no pacote: os MP4 finais, as folhas de revisão e o repositório do autor do método (só o método foi estudado).

## Passo a passo (ponta a ponta)
1. **Rode o demo.** Copie `motores/36/` para a pasta do seu projeto e, dentro dela:
   ```bash
   npm install
   npm run demo      # saida/demo.mp4: 3 s do plano caro, 540×960, ~1 min
   ```
2. **História em 1 parágrafo** com virada, sem lore (em "Fisgada": os dois pescam um ao outro). Passe por uma lista de clichês antes de produzir (profecia, escolhido, vilão sem motivo) e conte por uma pessoa concreta.
3. **Ficha (SHEET.md)** no formato de `chuva_lamina/SHEET.md`: duração fechada, 24 qps, paleta fechada por papel (ink, água, névoa, sol, accent, pele...), orçamento de desenhos (3 por plano, 8–9 só no plano caro), lista de planos com tempo, câmera e nº de desenhos.
4. **Edite o `index.html`:** troque a paleta `C`, o cenário, as poses e a agenda. Mantenha a raiz com `data-composition-id` e `data-duration`, e cada plano como `class="clip"` com `data-start` e `data-duration`.
5. **Desenhe as poses.** Cada pose é um desenho inteiro do boneco; poses com pano ganham 3 variações (sufixos `_0`..`_2`) trocadas a cada 4 quadros para o hold não congelar.
6. **Agende "em dois":** a troca de pose só acontece em quadro par (`f` de 2 em 2 dentro de `act()`). Câmera, névoa, gotas, voo e anéis ficam em um.
7. **Plano caro:** antecipação 4 q, puxão 2 q, smear 2 q (forma crescente, nunca blur), follow-through, assentar. Impact frame segurado 2+4+3 q, hit-stop de 4 q depois.
8. **Cortes** por mergulho de cor (a cor cobre a tela 1–2 q). Fade final de 8 q para ink.
9. **Stills antes do filme:** confira 1 quadro por plano.
   ```bash
   npm run folha     # saida/folha.jpg com 12 quadros
   node render.mjs --pagina index.html --quadros 2,9,16.1 --out saida/teste.jpg --esc 0.5
   ```
10. **Render e entrega:**
    ```bash
    npm run filme     # saida/fisgada_1080.mp4, 1080×1920, 24 qps, mudo, yuv420p
    ffmpeg -y -i saida/fisgada_1080.mp4 -vf scale=720:-2 -c:v libx264 -profile:v main -level 3.1 -crf 24 -pix_fmt yuv420p -movflags +faststart saida/fisgada_celular.mp4
    ```
11. **Checagem técnica:** `ffprobe saida/fisgada_1080.mp4` (duração, `yuv420p`) e uma passada quadro a quadro procurando flash (mais de 3 trocas claro/escuro por segundo) e trecho idêntico por mais de 4 q fora dos mergulhos.

## Pegadinhas medidas
- **Fundo e tela limpa:** fundo chapado liso vira slide (dê profundidade, luz ou textura); nota de produção nunca vai dentro do quadro (nome de arquivo, versão, crédito de ferramenta); nada de rótulo "imagem gerada" por cima da arte.
- **Flashes:** a primeira versão falhou na checagem com "4 flashes por segundo" no impact frame (claro → tinta → papel → cena). Correção: o 1º desenho do impact virou verde-água escuro em vez de quase branco.
- **Avisos que ficam, de propósito:** quadro vazio/repetido nos picos dos mergulhos de cor (1–2 q) e "sem áudio".
- **Hold ≥ 12 quadros** e nunca parado: pano e respiração trocam a cada 4 q.
- **Smear é forma**, não blur: crescente + silhueta esticada por 2 q.
- **Câmera:** só 100→106% durante hold; nada de câmera passeando sobre desenho parado.
- **Cel:** 1 sombra dura a 20% e contorno de ~6 px (regra da referência).
- **Grão:** turbulência deslocada a cada 2 q (`backgroundPosition` sorteado com semente fixa por quadro par), opacidade 0,13 em overlay.
- **Amostre no meio do quadro:** o `render.mjs` pede o tempo `(i + 0,5) / fps`. Pedir o tempo exato da fronteira faz a troca "em dois" cair um quadro antes ou depois por arredondamento.
- **`window.__timelines`:** o HyperFrames cria esse objeto; fora dele a página precisa de `window.__timelines = window.__timelines || {}` antes de registrar a linha do tempo, senão quebra.
- **Tempo de render:** 30 s a 24 qps levaram ~4 min no HyperFrames; no `render.mjs` conte ~0,8 s por quadro em 540×960 na CPU (3 s = 58 s medidos). A réplica de 12 s levou 23 s no HyperFrames.
- **"Em dois" num filme 3D:** bastaram ~8 linhas numa cópia da cena three.js (`tq = Math.floor(t * 12) / 12` só para os atores; câmera e efeitos seguem em `t`).
- **Onde perde para a referência (~55–60%):** boneco ainda é "palito engordado" (mãos sem dedos, rosto simples); o voo em silhueta é pequeno; o nó dos anzóis só lê no close.

## Custo e tempo
- Grátis, CPU, sem GPU e sem IA. Render de minutos.
- Tempo de produção da peça: uma sessão de trabalho (ficha → poses → 7 planos).
- Som fora do escopo (peça muda). Se entrar narração, conte ~15 caracteres por segundo de fala na API ou no site da ElevenLabs, com a sua chave.

## O que funcionou e o que não funcionou
- **Timing antes de traço:** no lado a lado do mesmo plano, contínuo × "em dois", a versão "em dois" foi a escolhida. Aplique a gramática de timing antes de mexer em modelo ou luz: é o ganho mais barato.
- **Impact frame de anime, não de quadrinho:** estrela pontuda com raios radiais lê como explosão de história em quadrinho e fica aguda. Funciona silhueta chapada + pincel seco na direção da força + respingo, em 1 cor.
- **Cabeça coberta:** cabelo desenhado em código fica ruim também em 2D. Chapéu + lenço ou capuz resolvem e dão silhueta.
- **História pequena com virada** segura mais que lore: risco pessoal, humor e um valor que vira.
- **Cinematográfico desde o primeiro quadro:** sol baixo em contraluz, névoa tingida, primeiro plano desfocado, vinheta e grão. Fundo chapado com luz neutra deixa a cena crua.
- **Nossa nota:** a réplica "Chuva e lâmina" vale 45–50% da referência; "Fisgada" vale ~55–60%: ganha em história, luz e impact frame, perde no traço dos bonecos.

## Roteiro de aula
- **Objetivo:** o aluno sai sabendo fazer um plano de anime limitado em SVG: ficha, poses "em dois", 1 plano caro com smear e impact, corte por mergulho de cor.
- **Demonstração (~20 min):**
  1. Lado a lado contínuo × "em dois" no mesmo plano (2 min).
  2. A ficha: paleta fechada e orçamento de desenhos (4 min).
  3. O boneco `actor()` e uma pose nova nascendo (5 min).
  4. O plano caro quadro a quadro: antecipação, puxão, smear, impact, hit-stop (6 min).
  5. `npm run demo`, a folha de quadros e a checagem pegando o flash (3 min).
- **Exercício:** um plano de 4 s com 1 ator, 3 desenhos em dois, 1 hold de 12 q com pano vivo e 1 mergulho de cor na saída. Deu certo se, passando quadro a quadro, o ator só muda em quadro par e nenhum trecho fica idêntico por mais de 4 q.
- **Pré-requisitos:** noção de timeline do GSAP e a aula de impact frame.

## Limites conhecidos
- Não existe gerador de ficha nem de boneco: cada peça edita o `index.html` na mão (67 KB num arquivo só).
- Sem som: não há receita de mix para este estilo.
- Mãos com dedos e dobras de roupa (o maior ganho visual) não estão resolvidas.
- O `render.mjs` cobre o que estas duas composições usam do contrato do HyperFrames (clips por tempo + uma linha do tempo GSAP). Sub-composições, vídeo e áudio embutidos pedem o HyperFrames de verdade.
- O caminho pelo HyperFrames com o GSAP local e o filme inteiro pelo `render.mjs` não foram refeitos depois da vendorização; o demo, a folha e a réplica foram.
- Testado só em Windows; em Mac e Linux o `render.mjs` procura o Chrome nos caminhos padrão.
- O exemplo de "em dois" em filme 3D não vem no pacote; fica só a técnica descrita nas pegadinhas.
