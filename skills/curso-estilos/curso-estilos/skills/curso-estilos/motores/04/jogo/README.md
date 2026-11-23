# O Caseiro: a primeira noite (protótipo jogável)

Jogo de decisão no mundo voxel de "O Caseiro". Você leva o Caio pela noite. A cada momento-chave aparecem 2 cartões, e o que você escolhe e **por onde anda** quebra as regras.

## Como rodar
- **Estado no pacote do curso: código de estudo, não roda de primeira.** O jogo carrega áudio obrigatório que não vem no pacote (sem licença de redistribuição): `audio/gains.json`, `audio/foley/*.mp3` e as falas `voz/<ep>/<id>.mp3` + `voz/<ep>/<id>.words.json`. Com os seus áudios nesses lugares:
  1. na pasta do estilo (a de cima): `npm install` e `npm run assar` (gera `motor/data/`);
  2. aqui: `bash build.sh` (junta a cabeça e o comum do motor com o `game_tail.js` → `game_shots.js`);
  3. na pasta do estilo: `npm run jogo` → http://localhost:4810
- **Controles:**
  - andar: setas/WASD ou arrastar o dedo na tela;
  - escolher: tecla 1 ou 2, ou tocar no cartão;
  - começar / jogar de novo: Enter ou toque.
- **Teste sem a animação do navegador:** `?norocket&manual` e depois `window.step(seg)` no console. `GAME.autoGo = new THREE.Vector3(x, 0, z)` liga o piloto automático.

## A noite (v2, 25/10): 6 decisões no total, 3 ou 4 por partida, 7 finais
1. **Chegada:** sobe a trilha (c01, c02), lê o bilhete (c03) e diz "Quinze mil pra não fazer nada" (c04).
2. **Meia-noite:** três batidas DE DENTRO da cabana vazia.
   - **ABRO A PORTA:** só a lareira acesa e pegadas descalças da porta até o lago. As pegadas ficam a noite toda.
   - **VOU FAZER A RONDA:** as batidas param.
3. **A ronda:** "Caio..." (v01) com congelada + tremor (sem squash: é voz), a luz e o vulto no gelo (v02, c06).
   - **VOU ATÉ O LAGO** ou **SIGO AS REGRAS**.
4. **Lago:**
   - o gelo racha sob o pé (tremor + squash + flash: impacto físico);
   - lanterna dela, rádio do patrão (r01), o gelo cede, a lanterna apaga em silêncio.
   - **RESPONDO O RÁDIO:** final 1 (O OUTRO CASEIRO).
   - **CORRO PRA MARGEM CALADO:** fuga jogável. Na margem o rádio chia sozinho:
     - **DESLIGO:** a lanterna dela acende de novo, com alguém de pé → final 3 (A LUZ VOLTOU);
     - **DEIXO LIGADO:** final 2 (DUAS VOZES).
5. **Regras:** volta pela trilha e a voz dela atrás (v03). No meio da trilha os passos atrás dele param:
   - **OLHO PRA TRÁS:** ele se vira, o vulto está a 3 m, some, e a lanterna dele enfraquece pelo resto da noite;
   - **SIGO SEM OLHAR:** "Não responde..." (b02).
   - Na porta: porta aberta com lareira, 4ª regra no bilhete (b04), "Entra, Caio" (v04).
     - **ENTRO:** final 4 (DUAS CANECAS), ou final 6 (A PORTA FECHOU) se olhou pra trás;
     - **FICO FORA:** final 5 (O PRIMEIRO VIVO), ou final 7 (TRÊS DA MANHÃ) se olhou pra trás.
- As regras quebram pelo lugar onde ele pisa (trilha, lago) e pela escolha (responder o rádio).
- Os eventos novos não têm fala nova: o que ele vê ou ouve aparece escrito, na cor quente dele.

## Som (v2)
- Foley REAL de um pacote royalty-free (nós usamos o Sonniss GDC; confira a licença do seu), recortado em `audio/foley/`:
  - passos na neve (7 tomadas), no gelo (3) e na madeira da varanda (2), nunca o mesmo passo duas vezes seguidas;
  - gelo rachando e rangendo, porta de madeira rangendo, batida na porta, clique e chiado de rádio;
  - lareira (cresce perto da porta aberta);
  - ambiente de floresta de inverno à noite com lobos ao longe, e vento.
- Nada sintetizado; a lanterna dela apaga em silêncio.
- Níveis medidos: voz −20 RMS, passos −35, impactos −27, ambiente −34/−38, tema 3 dB mais baixo que na v1.
- Ambiente e tema abaixam ~6 dB sob cada fala.
- **Testes sempre com `&mute`** (nada toca nas caixas de som): `?norocket&manual&mute`.

## Como é feito
- **Motor:** é o motor da série, sem cópia. `server.mjs` serve `../motor` (mundo, dados assados), o three do `node_modules` da pasta do estilo e as vozes de `../voz`.
  - `game_scene.js` = `scene.js` com resolução interna 720×1280 (≈16 ms por quadro na 4070 Ti) e um loop em tempo real.
  - `game_tail.js` é o jogo (entrada, roteiro, câmera, HUD, som). `build.sh` junta a cabeça e o comum do motor com ele → `game_shots.js`.
- **Som:**
  - `audio/gains.json` guarda o ganho de cada arquivo, medido contra os alvos da mix da série (`{ "caminho/do/arquivo.mp3": ganho }`);
  - SFX ~4 dB mais baixos que na série (≥10 dB abaixo da voz);
  - eco na voz dela, filtro de rádio no dono;
  - nenhum SFX sintetizado e nenhuma fala nova (custo R$ 0).

## Falta / próximos passos
- Jogar no celular: hoje o servidor escuta em localhost. Para o celular, é preciso servir na rede local ou publicar.
- Os finais são cartões de texto (sem fala nova). Gravar 1 fala por final custaria créditos de voz.
- A câmera agora para antes de bater em neve ou parede; no close da margem ela fica mais perto do rosto.
- Jogados inteiros pelo piloto automático (mudo) na v2: os finais 3 e 7, mais a porta aberta com as pegadas e o olhar pra trás. Os finais 2 e 5 foram jogados na v1. Os finais 1, 4 e 6 só foram conferidos no código.
