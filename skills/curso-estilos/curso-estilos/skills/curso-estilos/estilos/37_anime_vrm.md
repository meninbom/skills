# 37 · Anime 3D com boneco VRM (isekai do cotidiano)

> Vitrine: "Fui atropelado por um patinete elétrico e renasci como o patinete" (38 s com som; 46,9 s narrado) · Custo: grátis; a narração (opcional) gasta ~520 caracteres na sua conta ElevenLabs · Ferramentas: boneco VRM do VRoid (CC0), three.js r160 + @pixiv/three-vrm 2.1.3, Chrome headless (puppeteer-core), FFmpeg; ElevenLabs só na versão narrada

## O que é
Comédia de anime em 3D: um personagem pronto do VRoid (arquivo VRM, CC0) entra num motor three.js com cel shading, tinta no pós, FX desenhados em atlas e cartelas de light novel. A piada é o isekai ao pé da letra com objeto do dia a dia (o cara renasce como o patinete que o atropelou). Funciona porque o personagem já vem com corpo, rosto e esqueleto de artista; o código só cuida de pose, câmera, FX e ritmo.

## Exemplo e arquivos
- Prévia do catálogo: `catalogo/previas/37.mp4` (capa em `catalogo/previas/37.jpg`).
- Demo do motor: `motores/37/DEMO.md` (um comando, sai `saida/demo.mp4`).
- Bíblia do episódio (piada, regras de arte, paleta, planos, cues): `motores/37/ep01/BIBLIA.md`
- Notas da peça (rodadas de stills, problemas do VRM, nossa nota): `motores/37/ep01/NOTAS.md`
- Narração (texto, voz, janelas): `motores/37/ep01/NARRACAO.md`, `motores/37/ep01/falas.tsv`
- Som (decisões, tempos e níveis medidos): `motores/37/ep01/MIX.md`, `motores/37/ep01/TIMELINE.json`
- Licenças e créditos (fora da tela): `motores/37/FONTES.md`
- Boneco: `motores/37/modelo/HairSample_Male.vrm`

## Ferramentas e instalação
- **Node 18+ e Google Chrome (ou Edge/Chromium) já instalado.** `npm install` na pasta do motor instala só o `puppeteer-core`, que usa o navegador do sistema (não baixa outro). Se ele não achar o Chrome, aponte a variável `CHROME_PATH`.
- **FFmpeg** no PATH. **Python 3** só para a montagem (`montar.py`) e a versão narrada.
- **three.js r160 + @pixiv/three-vrm 2.1.3 (MIT):** já vêm em `motores/37/vendor/`, ligados por import map no `motores/37/ep01/index.html`. Nada de CDN.
- **Boneco VRM (grátis, CC0):** HairSample_Male, amostra oficial do VRoid Studio; a licença está no metadado do próprio arquivo e na página oficial citada em `motores/37/FONTES.md`. A cópia do pacote tem as texturas reduzidas (6,4 MB). Para usar o seu boneco: ponha o `.vrm` em `modelo/` e renderize com `Q="&vrm=../modelo/seu.vrm"` (confira a licença dele antes).
- **O render usa a placa de vídeo** (WebGL no Chrome). Sem placa, `DEMO_CPU=1` renderiza por software, bem mais lento. Uma tarefa de GPU por vez: não rode dois renders juntos.
- **ElevenLabs (PAGO, opcional):** `motores/37/ep01/gerar_vozes.sh` fala com a API da ElevenLabs usando a chave da sua conta (variável `ELEVENLABS_API_KEY`) e só envia texto com `--confirmo-custo`.
- **Trilha e efeitos:** não vêm no pacote. Use a sua biblioteca de efeitos ou um pack CC0. Nada sintetizado.

## Motor
Em `motores/37/` (7,7 MB, quase tudo é o boneco):
- `motores/37/package.json`, `motores/37/demo.mjs`, `motores/37/chrome.mjs`: demo de um comando e o localizador do Chrome.
- `motores/37/vendor/`: three.js, GLTFLoader, three-vrm (com as licenças). `motores/37/modelo/`: o VRM.
- `motores/37/ep01/engine/src/main.js`, `motores/37/ep01/engine/src/workbench.js`: laço do filme, `FILM.renderFrame(n)`, `FILM.grab()`.
- `motores/37/ep01/engine/src/hero_vrm.js`: carrega o VRM, troca MToon pelo cel do motor, chapa o rosto, posteriza cabelo/roupa em 3 níveis, desliga as malhas de outline, limita o pescoço.
- `motores/37/ep01/engine/src/hero.js`, `motores/37/ep01/engine/src/look.js`: boneco procedural alternativo (não usado no filme), presets de luz e cor.
- `motores/37/ep01/engine/src/scooter.js`: o patinete com display LCD (olhos + bateria em %).
- `motores/37/ep01/engine/src/fxd.js`: FX desenhados em atlas (gota, estrelas, brilhos, notas, poeira).
- `motores/37/ep01/engine/src/slime.js`, `motores/37/ep01/engine/src/city.js`, `motores/37/ep01/engine/src/field.js`, `motores/37/ep01/engine/src/props.js`, `motores/37/ep01/engine/src/heights_lib.js`, `motores/37/ep01/engine/src/vale_lib.js`: Rei Slime e sets (rua, campo).
- `motores/37/ep01/engine/src/shots.js`, `motores/37/ep01/engine/src/direction/main.js`, `motores/37/ep01/engine/src/direction/late.js`: lista de planos, cores do personagem (`CHAR`) e a direção de cada plano.
- `motores/37/ep01/engine/src/anime/post.js` + `motores/37/ep01/engine/src/anime/README.md`: cel, tinta e pós (cadeia do RYUMON, MIT; licença em `motores/37/ep01/engine/LICENSE`).
- `motores/37/ep01/index.html`, `motores/37/ep01/render.mjs`: página e render (still/vídeo; variáveis `S`, `Q`, `T0`/`T1`, `OUT`, `WARP`, `SAIDA`, `PASSO`).
- `motores/37/ep01/cards.mjs`: cartelas de light novel em PNG transparente.
- `motores/37/ep01/sheet.sh`: folha de stills.
- `motores/37/montar.py`: cartelas sobre o render cru → mestre mudo, 1080 e celular.
- `motores/37/ep01/gerar_vozes.sh`, `motores/37/ep01/falas.tsv`: uma fala por arquivo, 1 take, −16 LUFS.
- `motores/37/ep01/narrado/plano.py`, `motores/37/ep01/narrado/montar_narrado.py`, `motores/37/ep01/narrado/warp.json`, `motores/37/ep01/narrado/falas_pos.json`: a voz manda no relógio (warp) e a montagem narrada.

Fora do pacote: trilha, efeitos, vozes e os vídeos finais (não redistribuíveis), e o nosso mixador (dependia de bibliotecas internas; a mixagem é no seu editor, com os números do `MIX.md`).

## Passo a passo (ponta a ponta)
Copie `motores/37/` para a pasta do seu projeto e trabalhe lá. Os comandos usam bash (no Windows, Git Bash).

0. **Demo primeiro** (confirma Node, Chrome e FFmpeg):
   ```bash
   npm install
   npm run demo            # saida/demo.mp4: 3 s, 540×960, mudo. Sem placa de vídeo: DEMO_CPU=1 npm run demo
   ```
1. **Piada em 1 linha + bíblia.** Formato de `ep01/BIBLIA.md`: a piada, regras de arte, paleta, tabela de planos com tempo e CUES. A piada tem que ler sem narração (aqui: display com olhos e bateria).
2. **Copiar o episódio** como base (pasta nova ao lado, ex. `ep02/`, mesma estrutura) e trocar `engine/src/shots.js` (planos, cues, cores do personagem), `engine/src/direction/` e o objeto-herói.
3. **Stills por plano e folha:**
   ```bash
   cd ep01
   S=1 node render.mjs still 1.5,7.6 r1          # qa/r1_<t>.png
   bash sheet.sh r1 qa/x.jpg 8 1.5 7.6
   ```
   Rodadas até a piada ler (o ep01 levou 5).
4. **Cartelas:** `node cards.mjs` (gera os PNG em `ep01/cards/`; a fonte japonesa é a do sistema, troque no CSS se não tiver).
5. **Render mudo:**
   ```bash
   S=2 OUT=raw.mp4 node render.mjs video        # ~6 min para 38 s com placa de vídeo
   ```
6. **Montagem:** `python ../montar.py ep01` → `01_patinete_mudo.mp4` (mestre), `_1080.mp4` e `_celular.mp4` (720×1280, crf 26), todos mudos.
7. **Som:** monte trilha + efeitos no seu editor sobre o mestre mudo, seguindo `TIMELINE.json` (eventos e momentos) e `MIX.md` (pico do efeito no quadro do contato, níveis medidos).
8. **Versão narrada (PAGO, opcional):** escreva `NARRACAO.md` e `falas.tsv` (a voz só diz o que o personagem pensa, nunca descreve a tela nem repete cartela; silêncio no impacto). Aprove o texto antes de gastar, e então:
   ```bash
   bash gerar_vozes.sh                         # só mostra quantos caracteres vai enviar
   ELEVENLABS_API_KEY=... bash gerar_vozes.sh --confirmo-custo   # 13 falas, 1 take cada, 1,0x
   python narrado/plano.py                     # estica os planos onde a fala não cabe -> warp.json, falas_pos.json
   S=2 OUT=raw_narrado.mp4 WARP=narrado/warp.json node render.mjs video
   python narrado/montar_narrado.py            # voz no relógio novo + cartelas -> 01_patinete_narrado_voz.mp4
   ```
   As durações de fala dentro de `narrado/plano.py` foram medidas nos takes da peça: meça os seus e atualize a tabela `FALAS`.
9. **Conferir:** `ffprobe -show_entries stream=pix_fmt` = yuv420p; assista no celular; se tiver a skill `/checar-video`, rode nela.

## Pegadinhas medidas
- **Fundo e tela limpa:** fundo chapado liso vira slide (dê profundidade, luz ou textura); nota de produção nunca vai dentro do quadro (nome de arquivo, versão, crédito de ferramenta); nada de rótulo "imagem gerada" por cima da arte.
- **Bug do atlas de FX:** gota, estrelas e brilhos NUNCA apareciam. O `fxd.js` mandava o índice cru (5) em vez da fração (5/8) e o shader amostrava fora da textura; só o índice 0 funcionava. Uma linha.
- **"Cara de jogo VRoid":** chapar o rosto (degradê da textura achatado no tom de pele), posterizar cabelo e roupa em 3 níveis e desligar as malhas de outline do VRoid (a linha vem do pós). O corpo ainda lê como 3D de perto.
- **Pescoço esticado:** pitch de pescoço+cabeça limitado a −0,42..0,5 rad; o resto vai para a coluna.
- **Perna dura:** joelhos 0,16 rad + contrapposto em toda pose de pé.
- **Gota de suor:** presa à cabeça, puxada 20 cm para a lente, deslocamento limitado ao quadro.
- **Timing de anime no 3D:** personagem em twos, FX em threes, câmera em ones. Impact = 3 quadros invertidos + 3 brancos.
- **Leitura:** teleobjetiva de 15° no rasante; display com tinta preta sem brilho; o número da bateria nunca encosta na borda.
- **Render:** S=2, 38 s ≈ 6 min; narrado 1.407 quadros ≈ 522 s (com placa de vídeo). Saída já em yuv420p (rawvideo → libx264 crf 14). Por software (`DEMO_CPU=1`), S=0,5 leva ~2 s por quadro.
- **Escala S:** em S=0,5 a tinta do contorno quase some; julgue linha só em S=1 ou 2.
- **Warp da voz:** 38 s → 46,9 s. Esticadas de 1,23× a 3×; a voz nunca acelera.
- **Mix narrado:** voz −16, trilhas 10 dB abaixo com duck 4 dB, efeitos ≥ 10 dB abaixo da voz. MP4 −13,7 LUFS, pico −1,6 dBTP, celular −19,3 LUFS. WER 0,118 (quase tudo é número em algarismo).
- **Mix sem voz:** passa-alta de 130 Hz nas trilhas (o celular perdia 7 dB no grave). MP4 −13,6 LUFS, celular −19,8.
- **Verificador automático:** avisos esperados: "quadro vazio" (luz branca do renascimento) e "texto pequeno" (bateria e legenda japonesa vertical).

## Custo e tempo
- Sem voz: grátis (boneco CC0, bibliotecas MIT; o som é da sua biblioteca).
- Narrado: 13 falas, ~520 caracteres na ElevenLabs (1 take por fala; conte uns 1.500 se for refazer falas).
- Render: ~6–9 min por episódio com placa de vídeo.
- Nossa nota para a peça: 6,5/10 (a piada lê sem narração e o rosto parece anime; perde no patinete pequeno em dois planos e no final, em que o slime tapa o quadro).

## O que funcionou e o que não funcionou
- **Funcionou: boneco VRM pronto + comédia do cotidiano.** O riso veio da piada lida na imagem (display com olhos e bateria), não do texto. Virou a base de uma série.
- **Funcionou: a voz manda no tempo.** Teto de 1,1× na fala e nunca acelerar; quando a fala não cabe, o plano estica (warp). Fala acelerada soa artificial e derruba a peça.
- **Não funciona: sussurro e narração que descreve a tela.** A voz só acrescenta o pensamento do personagem.
- **Não funciona: crédito na tela.** Licença e crédito vão no `FONTES.md`; na tela só a história.
- **Risco: som escolhido por metadado.** A trilha foi escolhida por gênero e curva medida, sem escuta; ouça antes de publicar. Efeito sintetizado soa falso: use gravação real e alinhe o pico no contato.
- **Ordem que evita retrabalho:** roteiro e texto de narração aprovados antes de gerar voz e antes do render final.

## Roteiro de aula
- **Objetivo:** o aluno sai sabendo colocar um personagem VRM CC0 num motor three.js de anime, tirar a "cara de VRoid" e fechar um curta de comédia com cartela, som e (opcional) narração que manda no tempo.
- **Demonstração (~30 min):**
  1. `npm run demo` e o VRM cru × depois do tratamento cel (4 min).
  2. A bíblia: piada, paleta, tabela de planos (4 min).
  3. Um plano do zero: pose, câmera, FX em atlas; still e folha (8 min).
  4. Twos/threes/ones e o impact de 6 quadros (4 min).
  5. Cartelas e `montar.py` (4 min).
  6. Narração: `falas.tsv`, `narrado/plano.py` e o warp esticando o plano (6 min).
- **Exercício:** um gag de 10 s com o HairSample recolorido (tabela `CHAR` no `shots.js`): 3 planos, 1 cartela, 1 impact. Deu certo se a piada for entendida sem som por alguém que não leu a bíblia.
- **Pré-requisitos:** básico de three.js (estilo 34), aula de som/mix; para a parte narrada, a aula de voz (ElevenLabs).

## Limites conhecidos
- Só existe 1 corpo no pacote (HairSample_Male recolorido, texturas reduzidas). Outros bonecos CC0 da VRoid estão na página oficial citada no `FONTES.md`; VRM 1.0 ou boneco de outra ferramenta pode pedir ajuste no mapeamento de materiais do `hero_vrm.js` (ele reconhece os nomes de material do VRoid).
- O filme tem 1080×1920 fixo (`shots.js`); outra proporção pede mexer nas câmeras.
- Não há mixador no pacote: o som é montado no seu editor. Os números do `MIX.md` são da peça original.
- A cartela usa fontes do sistema (Yu Gothic/Meiryo no Windows); em Mac/Linux o japonês cai na fonte padrão.
- O demo foi testado no Windows com Chrome; Mac e Linux usam o mesmo código (procura do Chrome nos caminhos padrão), sem teste nosso.
- De perto o corpo ainda lê como 3D; o tratamento cel convence no rosto e no plano médio.
