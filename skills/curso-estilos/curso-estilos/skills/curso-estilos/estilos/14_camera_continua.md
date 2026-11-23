# 14 · Câmera contínua num mundo só

> Vitrine: "Emoji" ("de onde vem o emoji", 56,4 s) · Custo: só a narração, se for voz paga (~1.100 caracteres); todo o resto grátis · Ferramentas: HTML + GSAP + SVG, Node + Chrome do sistema (puppeteer-core) ou HyperFrames, Python/Pillow para os adesivos, um gerador de imagem para as fotos, FFmpeg

## O que é
A história inteira está colada numa página única (uma agenda quadriculada de 2400×11600 px). Uma câmera que nunca para percorre a página, e cada viagem termina no adesivo da palavra que a voz está dizendo. Não existe corte nem troca de fundo: um mundo, uma paleta, uma fonte. Perto do fim há um único recuo e o último quadro é igual ao primeiro (laço).
Funciona porque resolve de uma vez três problemas comuns de vídeo curto: corte solto, tela parada e salada visual.

## Exemplo e arquivos
- Prévia do catálogo: `catalogo/previas/14.mp4` (capa em `catalogo/previas/14.jpg`).
- Exemplo completo, mudo, renderizável: `motores/14/hf/` (composição pronta) e `motores/14/hf_src/` (fonte + build).
- Ponto de partida de um vídeo novo: `motores/14/kit_template/` (12 s).
- Material de estudo: `motores/14/GUIA_DO_ESTILO.md` (DNA com números, passo a passo com e sem código, prompts, 17 erros comuns, checklist), `motores/14/ROTEIRO_TEMPLATE.md`, `motores/14/PROMPT_CLAUDE_CODE.md`, `motores/14/DIRECAO.md` (a direção de arte do exemplo).
- Demo de 3 s: `motores/14/DEMO.md`. Licenças e fatos do roteiro: `motores/14/FONTES.md`.

## Ferramentas e instalação
- **Node 18+** e `npm install` dentro da cópia do motor (instala só o `puppeteer-core`, que usa o Chrome já instalado). Outro navegador: variável `CHROME_PATH`.
- **Google Chrome**, Edge ou Chromium, e **FFmpeg** no PATH.
- **GSAP 3.12.5** (grátis, licença própria da GSAP): não vem no pacote. O `npm install` baixa do npm e copia para `vendor/gsap.min.js` de cada composição; no render não há CDN.
- **HyperFrames** (grátis, Apache 2.0), opcional: as pastas `kit_template/` e `hf/` também são projetos HyperFrames. `npx --yes hyperframes@0.8.162 render` faz o mesmo render e `preview` mostra ao vivo; ele baixa um Chromium próprio na primeira vez.
- **Python 3.10+** com `pip install -r requirements.txt` (numpy, scipy, pillow para os adesivos; soundfile e pyloudnorm para a mixagem).
- **Fotos**: qualquer gerador de imagem (o exemplo usou Z-Image Turbo local, que pede placa de vídeo; um gerador online serve igual) ou foto de banco com licença comercial.
- **Voz** (opcional, paga): a API ou o site da ElevenLabs com a sua chave, ou a sua própria voz gravada. Confira o preço antes: é cobrado por caractere.
- Pegadinha de instalação: skills de mídia do ecossistema HyperFrames podem procurar um `.env` em pastas acima da sua e gastar créditos de voz sem pedir. Não deixe chave de API em `.env` solto perto do projeto; gere a voz você mesmo, num passo separado.

## Motor
Em `motores/14/` (~6 MB; a maior parte são os adesivos do exemplo e as fontes):
- `motores/14/render.mjs`: render quadro a quadro de qualquer pasta com `index.html` + timeline GSAP pausada (o mesmo contrato do HyperFrames). Opções `--de`, `--dur`, `--fps`, `--largura`, `--saida`, `--quadros`.
- `motores/14/kit_template/index.html`: o template enxuto de 12 s. Motor completo (página, adesivos, pouso, linha por máscara, grade dupla do quadriculado, câmera com objeto `cam` e lista `K`). Para um vídeo novo só mudam o bloco "ROTEIRO NA PÁGINA" e a lista `K`.
- `motores/14/hf_src/src.html`: a composição inteira do exemplo de 56 s (celular com tela viva, figurinha que vira grade, frase que colapsa). `motores/14/hf_src/build.py` injeta `motores/14/img/px/icones.json` e grava `motores/14/hf/index.html`.
- `motores/14/hf/words.json`: tempos por palavra da narração do exemplo (o formato que a câmera segue).
- `motores/14/kit_ferramentas/adesivo_foto.py`: foto → adesivo em retícula duotone com borda branca. `motores/14/kit_ferramentas/adesivo_pixel.py` e `motores/14/img/pixel.py`: grade 12×12 → adesivo de pixel. `motores/14/img/prompts.txt`: os 7 prompts das fotos do exemplo.
- `motores/14/som/mix.py` e `motores/14/som/cues.json`: a mixagem do exemplo (voz −16 LUFS, trilha ~11 dB abaixo, SFX reais) e os tempos dos SFX. Não traz áudio: você aponta os seus arquivos em `som/arquivos.json` (modelo em `som/arquivos.exemplo.json`).
- `motores/14/roteiro/`, `motores/14/DIRECAO.md`, `motores/14/FONTES.md`: o roteiro, a direção e as fontes do exemplo.

## Passo a passo (ponta a ponta)
Copie `motores/14/` para a pasta do seu projeto e trabalhe na cópia.

1. **Demo primeiro**:
   ```
   npm install
   npm run demo            # saida/demo.mp4, 3 s, 540x960, mudo
   ```
2. **Direção**: escreva 3 direções, escolha uma e enxugue para 2 tipos de objeto, 1 fundo, 5–6 cores, 1 família de fonte e 3 técnicas de movimento. Modelo: `DIRECAO.md`.
3. **Roteiro** de 45–60 s pelo `ROTEIRO_TEMPLATE.md`. Feche o texto antes de qualquer voz. Confira os fatos e anote as fontes.
4. **Mapa de atenção**: para cada palavra-chave, qual adesivo ou texto é o alvo. Posicione os alvos em zigue-zague (coluna esquerda x 600, direita x 1800), descendo a página.
5. **Voz** (custo por caractere, se for paga): teste curto de pronúncia, depois um take único. Meça os tempos por palavra (faster-whisper com `word_timestamps`, ou as legendas automáticas do seu editor) e salve no formato do `hf/words.json`. Acelere no máximo 1,1× (o exemplo usou 1,08×).
6. **Imagens**: gere as fotos (prompts no estilo de `img/prompts.txt`) e transforme cada uma em adesivo:
   ```
   pip install -r requirements.txt
   python kit_ferramentas/adesivo_foto.py foto.jpg kit_template/img/foto1.png --cor rosa --largura 1100
   ```
7. **Composição**: edite `kit_template/index.html`. Os tempos de tudo vêm das palavras medidas; a câmera é a lista `K` (`[t, x, y, escala, curva]`): VIAGEM de 0,5–0,6 s com a curva `mover` até o alvo, depois DERIVA em sine.inOut até a próxima palavra. `PROMPT_CLAUDE_CODE.md` tem o prompt pronto para o Claude fazer esse passo.
8. **Quadros soltos e render mudo**:
   ```
   node render.mjs kit_template --quadros 1.0,4.3,9.0        # confere a composição em saida/quadros/
   node render.mjs kit_template --saida saida/r1_mudo.mp4
   ```
   Monte uma folha de contato antes do render completo. Máximo de 3 rodadas de correção.
9. **Som**: copie `som/arquivos.exemplo.json` para `som/arquivos.json`, aponte para a sua voz, trilha e efeitos, ajuste os tempos dentro do `som/mix.py` e rode `python som/mix.py` (gera `som/mix.wav`). Escolha a trilha de ouvido antes; confira no alto-falante do celular sem deixar nada tocando sozinho.
10. **Entrega**:
    ```
    ffmpeg -i saida/r1_mudo.mp4 -i som/mix.wav -c:v libx264 -crf 20 -pix_fmt yuv420p -profile:v high -c:a aac -b:a 192k -ar 48000 -movflags +faststart saida/final_1080.mp4
    ffmpeg -i saida/final_1080.mp4 -c:v libx264 -profile:v main -level 3.1 -pix_fmt yuv420p -vf scale=720:-2 -crf 24 -c:a aac -b:a 128k -ar 48000 -ac 2 -movflags +faststart saida/final_celular.mp4
    ```
11. `/checar-video` no 1080 com `--roteiro`. Confira o `pix_fmt` com ffprobe antes de publicar.

## Pegadinhas medidas
- **Densidade (vale para todo explicativo):** cerca de 45 substantivos concretos por minuto, e cada um vira um objeto na tela no instante em que a palavra é dita; a tela sabe mais que a voz (nome, data, número); a família visual troca a cada 5 a 8 s; o primeiro evento visual entra até 0,4 s. O porquê de cada número está no `../OFICIO.md`.
- **Fundo e tela limpa:** fundo chapado liso vira slide (dê profundidade, luz ou textura); nota de produção nunca vai dentro do quadro (nome de arquivo, versão, crédito de ferramenta); nada de rótulo "imagem gerada" por cima da arte.
- Alvo sempre no mesmo ponto da tela: x 540, y 1000. O olho não procura.
- A viagem chega ~0,05 s depois do início da palavra. Curva `mover` = cubic-bezier(.75, 0, .35, 1).
- Zoom dos mergulhos em escala log (o motor anima o log da escala). Com zoom linear o fim do mergulho dispara. Mergulhos do exemplo: 3,8× no LCD, 17× na figurinha, 9× no coração; power2/power3 inOut, 0,7–0,9 s. No máximo 2 ou 3 por vídeo.
- Quadriculado some ou engrossa no zoom se for uma grade só: o motor reveza duas (64/2^n e a metade), com a fina entrando aos poucos.
- Deriva entre viagens: escala 1 → 1,02–1,03 e 10–25 px. Câmera lenta demais (1 → 1,05 em 6 s) lê como congelado.
- Pouso do adesivo: 0,34 s, de −40 px, 108% → 100%, power2.in, sem mola nem quique (mola dá cara de vídeo para criança de 8–12 anos).
- Texto: sobe por máscara, expo.out 0,5 s, 0,06–0,1 s antes da palavra.
- Confete parado, a ≥120 px de qualquer texto. Só o adesivo da vez se mexe.
- 30 fps limpos. Nada de 12 fps, boil ou grão animado neste estilo.
- Render do exemplo: 5 min 51 s para 56,4 s (1.692 quadros) com placa de vídeo. O demo (90 quadros de 540×960) sai em 10 s com placa de vídeo (medido com RTX 4070 Ti 12 GB) e em ~49 s por software.
- Render determinístico: timeline `paused` registrada em `window.__timelines`; nada de `setTimeout`, `Math.random` sem semente ou animação CSS.
- QA do exemplo: maior parado 0,87 s; −13,6 LUFS; no filtro de celular −19,7; fala × roteiro 99%. As 2 "falhas" do checador são falso positivo: texto saindo do quadro no meio de uma viagem e o cursor do LCD lido como hífen.
- SFX: só foley real, passa-baixa 4,5–6 kHz, 13–19 dB abaixo da voz, 4–5 momentos. Trilha ≥11 dB abaixo da voz.
- Frase de uma palavra só no TTS vira pausa: emende.
- Texto em japonês (ou outro alfabeto): o exemplo usa a fonte do sistema; para o resultado ser igual em qualquer máquina, ponha Noto Sans JP (OFL) em `fonts/`.

## Custo e tempo
- Voz: o roteiro do exemplo tem 1.085 caracteres; em serviço pago, calcule ~1 crédito por caractere, mais os testes de pronúncia. Com a sua voz gravada, zero.
- Fotos: grátis com gerador local ou com as cotas gratuitas dos geradores online. Trilha de banco gratuito (Pixabay) e a sua biblioteca de efeitos, ou um pack CC0.
- Render ~6 min por rodada em 1080 com placa de vídeo; mais lento por software. Se o gerador de imagem local e o render usarem a placa, uma tarefa de GPU por vez.
- A peça inteira saiu numa noite (direção → 3 rodadas → entrega).

## O que funcionou e o que não funcionou
- **Câmera que nunca para, dentro de um mundo só, com ponto focal.** Foi o que mais surpreendeu quem assistiu e virou o nosso padrão: resolve corte solto, tela parada e salada visual ao mesmo tempo.
- **O motor repete.** Uma segunda peça (sobre a gíria "farmar aura") saiu no mesmo motor, só com outro roteiro. Lição dela: com meme ou pessoa real, use foto limpa ou clipe real; retícula pesada esconde o assunto.
- **Câmera passeando por telas soltas não faz sentido.** Cada trecho precisa de um elo: um elemento vira ou leva ao próximo. Sem isso a viagem é só deslocamento.
- **Recuo final que mostra tudo junto é "mostrar o esqueleto".** O mosaico da página inteira tira a mágica. Nossa nota: o exemplo deste pacote ainda tem esses dois defeitos (recuo que mostra a página toda, trechos sem elo); use o motor, não copie o final.
- **Um movimento longo vale mais que vários empurrões com corte.**
- **O visual segue a voz.** Locução em 1 take, visual retemporizado pelas palavras; nunca espremer a voz para caber. Acima de 1,1× a voz soa acelerada.
- **Também valem**: nenhuma palavra pintada de cor, nenhum crédito na tela, roteiro fechado antes da voz.

## Roteiro de aula
- **Objetivo**: o aluno sai sabendo montar um mundo único em HTML e dirigir uma câmera por chaves presas às palavras da narração, com viagem + deriva, mergulho em log e laço.
- **Demonstração** (~25 min):
  1. Assistir ao exemplo e apontar: alvo fixo na tela, viagem, deriva, mergulho, recuo, laço (4 min).
  2. Abrir o template de 12 s, mostrar o objeto `cam`, a função `aplica` e a lista `K`; renderizar ao vivo (6 min).
  3. Trocar 3 chaves da `K` e 1 adesivo, renderizar de novo (5 min).
  4. Mostrar o `words.json` e como cada chave nasce de uma palavra (4 min).
  5. Mostrar os dois erros clássicos: zoom linear e câmera sem destino; depois a correção (elo entre trechos, sem mosaico final) (6 min).
- **Exercício**: vídeo de 15–20 s sobre a origem de uma palavra, em cima do template, com 5 alvos, 1 mergulho e laço. Deu certo se: nada fica parado mais de 1,5 s no `/checar-video`, o alvo de cada palavra chega em até 0,1 s da fala, o quadro 0 é igual ao último e cada viagem tem um elo com a anterior.
- **Pré-requisitos**: noção de timeline do GSAP. Ajuda ter feito a aula 29 (checagem objetiva).

## Limites conhecidos
- Áudio não vem no pacote: o exemplo renderiza mudo. A voz, a trilha e os efeitos são seus; o `som/mix.py` tem os tempos do exemplo escritos dentro do código e precisa ser editado para outra peça.
- Não há script de voz nem de tempos por palavra: gere a voz no serviço que preferir e meça as palavras com faster-whisper ou equivalente.
- O exemplo ainda tem os defeitos apontados acima (recuo que mostra a página toda, trechos sem elo). Falta uma peça de vitrine já corrigida por essa regra.
- A fonte japonesa do exemplo original é comercial e não vem: o texto em japonês usa a fonte do sistema e pode mudar de desenho entre máquinas.
- As 7 fotos originais (antes da retícula) não vêm; só os adesivos prontos. Para refazer, use os prompts de `img/prompts.txt`.
- O render por `render.mjs` tira um screenshot por quadro: o demo mediu ~0,5 s por quadro em 540×960 por software; em 1080×1920 é mais lento.
