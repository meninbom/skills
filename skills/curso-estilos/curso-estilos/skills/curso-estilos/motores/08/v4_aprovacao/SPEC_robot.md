# Robot v3 → v4 · SPEC

Leia antes: `_v4/REGRAS_AGENTE.md`. Projeto: `projeto_robot` (Remotion, 24 fps, ver `correcoes_v3.txt` e
`src/data/cenas.json`). Vídeo atual: `assistir/1_robot_v3.mp4` (45,4 s).
Notas do diretor: seção "1_robot_v3" de `notas_audio/TRANSCRICAO.md`. Ele adorou o gancho ("absurdamente boa"), o ateliê,
o decreto (Patent), os servos, a moldura de geada do RAB, a multidão "fabricados em série" e a queda do parafuso.
Mexer só no que está abaixo.

Voz fixa (`voz/robot_tight.mp3`), tempos-chave: Robô 0,07 · 1920 2,41 · Karel 3,94 · inventou 5,17 · termo 5,74 ·
Josef 8,07 · robota 9,38 · trabalho forçado 10,05 · rab 13,88 · escravo 14,45 · parafuso 16,86 · carne 18,99 · fabricados em série
19,49 · confundir com gente 21,12 · estreia 22,10 · 2 de janeiro de 1921 22,90–24,55 · Hradec Králové 25,53 · grupo amador 26,83 ·
Teatro Nacional de Praga 27,81 · 25 de janeiro 29,81–30,61 · engoliu 31,44 · autômato 32,97 · androide 33,70 · lata e engrenagem
35,01 · veio depois 36,70 · Ou seja 37,60 · escravo 39,68 · povo inteiro 40,72 · destruição 42,25 · outro dia 43,93 (fim 44,13).

## Itens

1. **0:05–0:07 · "LABOŘI / 1ª ideia de Karel"** (a voz não fala de "laboři"; ele também disse "poderia ter aparecido já").
   b = sem "LABOŘI" e sem a legenda: o pintor escreve "ROBOT!" direto, começando em 'inventou' (5,17) e completo em 'termo'.
   Stills: a = 7,0 s; b = 7,0 s.
2. **0:11–0:13 · mascarar o gerador de vídeo** ("a qualidade da ferramenta de vídeo não é tão boa, a gente tem que mascarar...
   a moldura com blur e grain ficou muito legal"). Em todo plano H3 (servos 11–13, multidão 19–22, teatro de noite 22–23,
   plano do grupo amador): grão de filme visível (como o da moldura de geada do RAB), leve desfoque/halation e vinheta.
   Moldura de geada só nos exteriores de neve (servos, teatro de noite), para não repetir. Não tocar nos documentos reais.
   Stills: a = 11,5 / 19,5 / 22,5 s; b = os mesmos.
3. **0:14 · "RABOTA / ROBOTA / ROBOT"** ("evolução da palavra... informação jogada"). Sai a pilha. Fica "RAB" e embaixo
   "= escravo" legível (≥ 56 px, sem o "rabъ"). Stills: a = 15,5 s; b = 15,5 s.
4. **0:16–0:18 · o parafuso** ("a mão fechando com o parafuso caindo não fez sentido... mas a forma como caiu ficou bem legal").
   Sai a mão. O parafuso cai na mesa vazia (mesma mesa, mesma perspectiva e a mesma queda que ele elogiou), quica 2 vezes e
   rola até parar; "ZERO parafusos" fica. Para tirar a mão: preencher a mesa (a mesa do robô de lata em 34–36 s pode servir de
   fonte, ou inpaint/clone da madeira). Stills: a = 17,0 e 18,0 s; b = os mesmos.
5. **SFX do parafuso** ("não teve nenhum sound effect... bem baixinho só, dele caindo... faz bastante diferença").
   Um "tlim" metálico pequeno em cada quique na madeira + o rolar curto. Fonte: sua biblioteca de efeitos (ou um pack CC0)
   se houver algo metálico pequeno; senão gere candidatos no Stable Audio 3 local (`comfy/sa3_sfx.py`, grátis;
   subir o ComfyUI com PYTHONUTF8=1) ex. "small metal screw dropping on a wooden table, two tiny
   bounces, close mic, dry". Gere 3 candidatos e ponha os 3 na página (clip b, c, d). Nível: ~14 dB abaixo da voz no curto prazo.
   Clip: `_v4/robot/clips/05_sfx_<x>.mp4`, 15,5–19,5 s, 540 px, com o mix + o SFX.
6. **0:22–0:25 · "2. LEDEN 1921"** ("ficou muito confusa... poderia ter sido um jornal, um calendário... escrita mesmo,
   2 de janeiro de 1921... muitas vão assistir sem som"). Troca por uma folha de calendário de parede (papel, tipografia de
   época) com "2" grande e "janeiro de 1921" embaixo, em português, entrando nas palavras da voz (o "2" em 22,90, "janeiro" em
   23,72, "1921" em 24,55). Pode ficar no mesmo fundo (casaco com neve) ou na parede do teatro. Stills: a = 24,0 s; b = 24,6 s.
7. **0:26–0:28 · "grupo amador" + homem de touca** ("não tem muito a ver com o roteiro"). Sai o padeiro e sai
   "ochotníci = amadores". Entra uma imagem que se lê como trupe de teatro amador dos anos 1920 (atores de roupa comum, roteiro
   na mão, palco pequeno). Prioridade: foto real de domínio público (Wikimedia Commons, ex. categorias de teatro amador tcheco /
   "ochotnický spolek", crédito em 1 linha; NUNCA pôr e-mail em User-Agent ou URL). Se não houver, Z-Image local (só se a GPU
   tiver VRAM livre) com o tratamento do item 2, sem crédito. Texto: "grupo amador" (português).
   Stills: a = 26,5 s; b = 27,0 s.
8. **0:29–0:31 · "25. LEDEN +23 dias"** ("não faz sentido... com esse mais de 3 dias"). O mesmo calendário do item 6 vira a
   folha até "25" (folhas passando rápido), "25 de janeiro", e embaixo "Teatro Nacional, Praga". Sai o "+23 dias".
   Stills: a = 30,0 s; b = 30,6 s.
9. **0:31–0:33 · palavras que somem rápido** ("fez aparecer um monte de palavras e desapareceu, super rápido... podia ter sido
   mais devagar, mais suave, deixado aparecer na tela"). "autômato" entra em 'autômato' (32,97), "androide" em 'androide'
   (33,70), uma por vez, legíveis, cada uma ≥ 1 s na tela, e só então são "engolidas" (a palavra ROBOT da capa cresce por cima
   delas, suave). Stills: a = 31,0 e 32,0 s; b = 33,3, 34,0 e o instante do "engolir".
10. **0:33 · "séc. XVIII"** → "século 18" no crédito do Jaquet-Droz. Stills: a = 33,5 s; b = 33,5 s (ou onde ele aparecer).
11. **0:36 · "1928" gigante** (a voz diz "veio depois", não diz 1928): sai o número grande; fica o crédito
    "Televox, Westinghouse · 1928" em 1 linha. Stills: a = 36,5 s; b = 36,5 s.
12. **0:38–0:40 · elenco "sluha = criado"** ("informação legal, mas não teve conexão nem no roteiro nem na forma").
    Troca por um retorno ao que a voz já explicou: o herói (robô de carne) com "ROBÔ" e, em 'escravo' (39,68), embaixo,
    "rab = escravo" (o mesmo desenho do item 3). Stills: a = 39,5 s; b = 40,0 s.
13. **0:40–0:45 · fecho** ("já volta para o robô... é uma assinatura do pessoal do BlaBlaLab... achar uma outra frase").
    Faça as duas opções VISUAIS, sem trocar a voz:
    - b = sem volta ao robô: o fim fica no quadro do Briullov (o "povo que virou sinônimo de destruição"), câmera empurrando
      para dentro da pintura até o fim, e o loop é um corte no movimento para o quadro 0 (nada de cartão "ROBÔ" de novo).
    - c = maquete do fecho com FRASE NOVA (a voz nova só será gerada se ele escolher c): "Ou seja, o robô já nasceu com cara
      de escravo... e o nome da fábrica da peça, Rossum, também esconde uma palavra tcheca, mas essa fica pra outro dia."
      Visual: a capa real de R.U.R. (já existe no projeto), câmera vai até "ROSSUM'S" e o nome fica em foco com um "?" discreto.
      Fato: Rossum alude ao tcheco "rozum" (razão) — en.wikipedia.org/wiki/R.U.R. Só a maquete em still; nada de áudio.
    Stills: a = 42,5 e 44,5 s; b = 42,5 e 44,5 s; c = 2 stills da maquete.
14. **Photo parallax sutil** (o diretor amou o estilo; "só cuidar pra não ficar exagerado demais"). Nas fotos/documentos reais
    que ficam ≥ 1,5 s na tela: Josef Čapek 1937, o Escritor de Jaquet-Droz, Televox 1928 e a pintura do Briullov.
    2–3 camadas (sujeito recortado + fundo preenchido onde abre), deslocamento relativo pequeno (≤ 2% da largura no plano
    inteiro), camadas defasadas por poucos quadros, borda "de foto impressa" (alpha 1,4–1,6 px). Receita e código:
    as nossas notas de photo parallax (estilo inspirado em contas de photo parallax).
    Clip: `_v4/robot/clips/14_parallax.mp4` com 2 trechos (Josef e Briullov), 540 px, sem som.

## Não mexer
Gancho do herói (0–2 s), capa 1920 com a máquina de escrever, ateliê (fora o item 1), Patent, servos (fora o tratamento),
moldura de geada do RAB, multidão, Hradec Králové, Praga/Národní, plateia com a vela, robô de lata, música e mix
(exceto somar o SFX do item 5 num `mix_v4.wav` separado, sem alterar o mix original).
