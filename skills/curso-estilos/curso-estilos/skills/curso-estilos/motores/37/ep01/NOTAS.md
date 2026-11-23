# NOTAS ep01: "Fui atropelado por um patinete elétrico e renasci como o patinete" (38 s)

## Como rodar (a partir da pasta do motor, depois de `npm install`)
- Demo: `npm run demo` → `saida/demo.mp4`.
- Stills: `cd ep01 && S=1 node render.mjs still 1.5,7.6 prefixo` → `qa/prefixo_<t>.png`; folha: `bash sheet.sh prefixo qa/x.jpg 8 1.5 7.6`
- Cartelas: `node ep01/cards.mjs` → `ep01/cards/*.png`
- Vídeo: `cd ep01 && S=2 OUT=raw.mp4 node render.mjs video` (~6 min com placa de vídeo)
- Depois do raw: `python montar.py ep01` → `ep01/01_patinete_mudo.mp4`, `_1080.mp4`, `_celular.mp4` (todos mudos; o som é seu, ver `MIX.md`)

## Rodadas (o que cada folha de stills mostrou)
- R1 (23 stills): patinete invisível no rasante (s03), display ilegível no capim (s08), poeira em bolas brancas
  parecendo ovo, s15/s16 com o slime tapando tudo. Display passou a ter tinta preta sem brilho, bateria maior.
- R2/R3: teleobjetiva 15° no rasante; câmera do s08 pela normal da tela + roll −72° (tela de pé);
  sem poeira no campo; s09 virou órbita frente→costas.
- R4/R5 + prévia em vídeo S=1: s16 refeito (câmera atrás do patinete olhando o slime).
- Final S=2 → **achado**: gota de suor, estrelas e brilhos NUNCA apareciam: `fxd.js` mandava o índice
  cru do atlas (5) em vez da fração (5/8) e o shader amostrava fora da textura; só a nota (índice 0) funcionava. Corrigido
  (`fxd.js`, 1 linha) e re-renderizado.
- Depois: re-render de 24,5–31,8 s porque o % da bateria encostava na borda e ficava vermelho; agora centrado e com
  número na tinta preta, só a barra fica vermelha.

## Problemas do VRM atacados
- Gota de suor: além do bug do atlas, ela agora é presa à cabeça, puxada 20 cm para a lente e com deslocamento limitado ao quadro.
- Pescoço esticado: pitch de pescoço+cabeça limitado (−0,42..0,5 rad), o resto vai para a coluna.
- Perna dura: joelhos com 0,16 rad + contrapposto em toda pose de pé (a menos que o plano peça `idle:false`).
- "Cara de jogo VRoid": rosto chapado (degradê da textura achatado no tom da pele), cabelo/roupa posterizados em 3 níveis,
  malhas de outline do VRoid desligadas (a linha é do pós). O rosto agora lê como cel; o corpo ainda tem cara de 3D de perto.

## Som
Duas trilhas: uma leve na rua (corta seco no atropelamento, volta na cartela final) e uma de aventura no outro mundo
(entra no abrir de olhos e MORRE junto com a bateria, 31,4 s). 14 efeitos reais + 3 ambientes; detalhes no `MIX.md`.
A escolha foi feita por metadados e curvas medidas: ouça antes de publicar.

## Conferência técnica
Versão com som e versão muda sem falhas. Avisos esperados de um verificador automático: "quadro vazio" = luz branca do
renascimento (de propósito) e "texto pequeno" = bateria/legenda japonesa vertical.

## Nossa nota: 6,5/10
- Bom: a piada lê sem narração (cartela + display com olhos e bateria em %), o rosto do VRoid agora parece anime, a "morte"
  da música junto com a bateria.
- Fraco: o patinete fica pequeno no rasante (s03) e na corrida (s10); no final (s16) o slime ocupa quase o quadro todo e o
  patinete morto quase some no capim; a cartela final encosta no olho do slime. O Ryo só aparece nos primeiros 11 s.
- Só um corpo (HairSample_Male recolorido). O HairSample_Female também é CC0 (mesma página oficial da VRoid): baixe e
  ponha em `modelo/` se quiser um segundo personagem.

## Versão narrada (46,9 s)
- 13 falas do Ryo (voz jovem casual, 1 take cada, 1,0x, sem acelerar): texto em `NARRACAO.md`, posições em `narrado/falas_pos.json`.
- A imagem seguiu a voz: `narrado/plano.py` gera `narrado/warp.json` (tempo novo -> tempo do filme) e o `render.mjs` aceita `WARP=`
  (sem a variável, renderiza igual a antes). Esticados: olhar antes do impacto 1,5x, fim da cartela 1 (branco parado) 1,43x, grua do
  mundo 1,4x, corrida 1,23x, contagem da bateria 2,05x, slime subindo 1,5x, fuga 2x, patinete tombado 3x, final 1,4x. 38 s -> 46,9 s.
- Silêncio garantido no impacto (8,8), no rugido (34,8) e no apagão (37,9); a cartela 2 (41,9) entra sem fala por cima.
- Render: `S=2 OUT=raw_narrado.mp4 WARP=narrado/warp.json node render.mjs video`, depois
  `python narrado/montar_narrado.py` (voz no relógio novo, cartelas, TIMELINE_narrado.json, MP4 com a voz).
- Mix: voz −16, trilhas 10 dB abaixo com duck 4 dB; efeitos que caem sob fala a ≥ 10 dB da voz. Medido: MP4 −13,7 LUFS, pico −1,6 dBTP,
  celular −19,3 LUFS (queda 5,6). Transcrição automática do mix: WER 0,118; quase todo o "erro" é número escrito em
  algarismo (22, 1, 16). Erros de verdade: "sem chefe" saiu "Em chef" e "não tenho" saiu "não tem".
