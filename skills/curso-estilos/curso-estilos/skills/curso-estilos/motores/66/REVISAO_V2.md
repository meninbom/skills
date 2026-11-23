# Revisão crítica · EP01 "O Apagão" v2 (49,3 s, 1080×1920, 24 fps, 29 planos)

> Exemplo real de revisão feita por um revisor de contexto zerado (só o vídeo e o roteiro na mão). As folhas e provas citadas
> não vêm no pacote; o documento fica como modelo de como apontar erro com tempo, prova e correção.

Provas (todas tiradas do vídeo final da v2, tempo carimbado no canto):
- `folha_01…10_*.jpg`: o vídeo inteiro, 1 quadro a cada 0,25 s (20 por folha = 5 s).
- `prova_porteiro_senta_levanta.jpg`, `prova_macaneta.jpg`, `prova_fim_congelado.jpg`, `prova_seta.jpg`, `prova_porteiro_M2_zoom.jpg`, `prova_luz_manha.jpg`, `prova_placa_push.jpg`, `prova_abertura_vs_K.jpg`, `prova_legenda_sobre_painel.jpg`, `prova_c1_texto.jpg`, `prova_maos_A2.jpg`, `prova_E1_destaque.jpg`: quadros cheios ou recortes lado a lado, um por defeito.

Método: quadros extraídos com ffmpeg e olhados; movimento medido com o `medir.py` (diferença média entre quadros, 0–255, 270×480) em cada clipe do H3 e em cada plano do final; stems do mix (`final/_voz.wav`, `_sfx.wav`, `_amb.wav`, `_mus.wav`, 44,1 kHz) medidos em RMS por janela; transcrição STT do QA comparada ao roteiro. Nenhum player com som foi aberto. Nada da v2 foi alterado.

---

## 1. Veredito

A v2 resolveu o que fez a v1 parecer bagunçada: o protagonista agora é um só (rosto, moletom roxo, tênis) em 29 planos, a paleta é uma (tijolo, noite azul, janela quente), a HUD virou 4 peças limpas sem brilho, as placas EXIT/OPEN/STOP e a lista de idiomas nascem na imagem, e o ritmo passou de 14 para 29 cortes. O que sobrou de errado é **continuidade de cena dentro da sequência da porta (29–49 s)**, e é bem visível porque é a parte que todo mundo olha: o porteiro **senta e levanta sete vezes** (em pé gritando aos 32 s, sentado dormindo aos 35 s, em pé aos 36 s, sentado aos 38 s, em pé aos 40 s, dormindo aos 43 s e aos 45 s), a **maçaneta que ele arranca aos 35,8 s está de volta na porta aos 38 s e aos 45 s**, a seta que o porteiro "desenha" **já está desenhada no primeiro quadro** (e quem está sentado embaixo dela é outro porteiro, de cabelo escuro), e o plano congelado da votação é o quadro-mestre antigo (homem puxando a maçaneta inteira, porteiro dormindo, cachorro no beco). Fora da porta, o erro grande é a **manhã que vira noite**: 06:08–06:10 é dia cinza, 06:11 é noite azul com celulares acesos. E a HUD conta uma hora que não bate: a abertura (o mesmo puxão da porta) marca 23:52 e a volta à porta marca 23:56–23:58. Nenhum desses erros exige mudar o método; todos vêm de reaproveitar clipe/quadro antigo (E3, I1, N1) ou de gerar L1/M2/F1 sem o quadro certo como referência. São 6 imagens no Flow (0 crédito) e 6–7 clipes no H3 (~20–30 min), mais ajustes de código.

---

## 2. Erros, do mais grave ao menos

Legenda: **[OBJ]** = erro objetivo (continuidade, lógica, texto errado). **[OFÍCIO]** = escolha que enfraquece a peça; discutível, mas eu mudaria.

### E1. [OBJ] O porteiro senta e levanta a cada corte (29,5–49,3 s)
Prova: `prova_porteiro_senta_levanta.jpg`, `folha_07…10`.
- 31,0–33,3 s (J2): em pé, palmas no vidro, gritando.
- 34,6–35,8 s (K2 = clipe E3 a partir de 2,0 s): **sentado, dormindo**, na poltrona.
- 35,8–37,5 s (K3): em pé na porta, mãos na cabeça.
- 37,5–38,7 s (L1): **sentado, dormindo**, atrás do cachorro.
- 38,7–41,4 s (M2): sentado no 1º quadro (39,0 s), em pé com a mão levantada a partir de 40,2 s.
- 42,7–44,1 s (N2 = clipe I1 a partir de 2,15 s): **sentado, de olhos fechados**.
- 44,1–46,3 s (N3 = quadro E3 congelado): **sentado, dormindo**.
- Por que quebra: a virada do episódio é "o porteiro acorda e grita". Depois disso ele não pode voltar a dormir; cada corte que mostra ele dormindo desfaz a cena anterior.
- Correção: (a) K2 deixa de usar o E3: vira o clipe **A2** (mãos puxando, PUSH em cima) com `ENTRADA['K2'] = 1.7` (A2 tem 3,04 s; K2 precisa de 1,27 s). É o mesmo plano da abertura voltando no mesmo momento da história, o que funciona como rima. (b) L1: regerar o quadro a partir do **último quadro do K3** (porteiro em pé, porta sem maçaneta) com o cão avançando; ou, barato, cortar a porta fora do enquadramento com push em código: `PUSH['L1'] = (1.5, (0.33, 0.60), (0.50, 0.60))` (o rastreio do olho já é transformado pela matriz). (c) N2 e N3: ver E3 e E4.

### E2. [OBJ] A maçaneta arrancada volta para a porta (38,0 s e 45,0 s)
Prova: `prova_macaneta.jpg`.
- 35,9 s (K3): ele voa com a barra dourada na mão; 36,8 s (K3): a porta está **sem** maçaneta (certo).
- 38,0 s (L1): a porta tem **duas** barras douradas, inteiras.
- 45,0 s (N3): a maçaneta está na porta e ele está puxando ela, enquanto a legenda diz "EMPURRA OU PUXA?" e o cartão ITEM OBTIDO: MAÇANETA passou 8 s antes.
- Correção: L1 e N3 gerados a partir do quadro de K3 (porta sem maçaneta). Para o N3 (o congelado da votação) a imagem certa é **ele de pé, a 1 m da porta, a maçaneta arrancada na mão, o porteiro em pé atrás do vidro ao lado da seta, o cachorro a 2 m na calçada**. Prompt Flow (ref: `quadros/K3.png` + `quadros/J2.png`): "mesmo homem, mesmo moletom roxo, mesma porta de vidro à noite na chuva; ele de pé de frente para a porta segurando a maçaneta de latão quebrada, a porta sem maçaneta, o porteiro de cabelo branco em pé atrás do vidro com a palma no vidro, cachorro preto de olhos vermelhos na calçada atrás dele; sem texto novo". Alternativa de custo zero: congelar o **último quadro do K3** (36,8–37,4 s) no lugar do E3 em `still_e3()` (ele no chão com a maçaneta, porteiro em pé, porta vazia). Perde o cachorro perto, mas não contradiz nada.

### E3. [OBJ] "O porteiro desenha uma seta" e a seta já está desenhada; quem está embaixo é outro porteiro (38,7–41,4 s)
Prova: `prova_seta.jpg`, `prova_porteiro_M2_zoom.jpg`.
- 39,0 s (1º quadro do M2): seta enorme já pronta no vidro embaçado; o porteiro está **sentado** numa cadeira, **cabelo escuro com têmporas grisalhas, bigode escuro, terno escuro**. Em I1 (26,5 s) e J1 (30,0 s) ele é de cabelo branco, bigode branco, terno cinza.
- 40,2–41,2 s: ele aparece em pé, pequeno, no fundo, com uma mão levantada ao lado da seta; a placa PUSH ficou na altura do joelho dele (em J2 estava no peito).
- A seta aponta **para cima**. "Pra dentro" não se lê; para quem não sabe inglês (boa parte do público da peça), a pista visual decisiva é esta e ela não entrega "empurre".
- O plano M1 (dedo desenhando no vidro) tem prompt em `prompts/M1.txt` mas não tem quadro nem clipe; a montagem pula direto para M2. A narração diz "desenha" e a imagem nunca desenha.
- Correção (Flow 2 imagens + H3 2 clipes): M1 = close pelo vidro embaçado, o dedo do porteiro (branco de cabelo, terno cinza, referência `quadros/J2.png`) riscando a condensação, a seta pela metade; M2 = seta completa **em perspectiva** (cauda larga perto da câmera, ponta pequena entrando no saguão), a palma do porteiro ao lado, placa PUSH na altura do peito dele. Prompt H3 do M1: "his index finger drags through the condensation drawing the arrow stroke by stroke, the line appears behind the finger". Se o H3 não segurar a seta em perspectiva, desenhar a seta em código sobre o vidro do J2 (como o plano da v1 previa) é mais seguro do que a seta pra cima.

### E4. [OBJ] O final reaproveita clipes que contradizem a cena (42,7–46,3 s)
Prova: `prova_fim_congelado.jpg`.
- N2 (42,65–44,10 s) = clipe I1 (porteiro dormindo, placa PUSH). N3 (44,10–46,34 s) = quadro E3 (homem puxando a maçaneta inteira, porteiro dormindo, cachorro no beco). Depois de M2 (porteiro em pé, seta no vidro, maçaneta arrancada, cachorro na calçada), as duas imagens voltam no tempo.
- Correção: N2 = a segunda metade do novo M2 (seta + PUSH no mesmo quadro, que é exatamente a dúvida "e se push não for puxar?"); N3 = o still novo descrito em E2. N4 (olhos) pode ficar.

### E5. [OBJ] A manhã vira noite entre 06:10 e 06:11 (17,1–21,6 s)
Prova: `prova_luz_manha.jpg`.
- 9,6 s (C1, 06:08): rua cinza de dia. 12,0 s (D1, 06:09) e 16,5 s (E1, 06:10): dia claro, céu branco. 18,0 s (F1, 06:11): **noite azul**, poças escuras, painéis acesos como lanternas. 20,5 s (F2, 06:11): noite com luz quente de janela (parece a porta das 23 h). 22,0 s (G1, 09:14): dia.
- Correção: regerar `quadros/F1.png` e `quadros/F2.png` no Flow com `quadros/D1.png` como referência de luz ("mesma manhã cinza e clara, céu branco, calçada molhada clara, painéis brancos opacos sem brilho") e rodar o H3 de novo (2 clipes). O prompt atual de F1 já é bom; só a luz está errada. Se não houver tempo, F2 (close dele) aceita um grade para o cinza de D1 em código, F1 não.

### E6. [OBJ] A hora da HUD não bate com a história (0–5,6 s vs 23,5–49,3 s)
Prova: `prova_abertura_vs_K.jpg`.
- A abertura mostra ele puxando a maçaneta com o porteiro dormindo e marca **23:52** ("faltam oito minutos"). A mesma ação, de volta na história, marca **23:57** (I2, 27,6 s) e **23:58** (K2, 35,0 s). O espectador que repara no relógio vê a mesma cena em dois horários.
- Correção (só `RELOGIO` no `montar_v2.py`): a abertura é o **primeiro** puxão (I2, porteiro ainda dormindo, o que bate com A1). Então: A1/A2 23:52 (fixo pela fala); H1/I1 **23:51**; I2 **23:52**; J1/J2 23:52; K1–K3 **23:53**; L1 23:54; M 23:55; N 23:56. O "até 00:00" continua apertado e o congelado para em 23:56 com 4 min, que é mais honesto do que 23:59 por 11 s.

### E7. [OBJ] Legenda em cima do texto do painel (13,9–15,5 s)
Prova: `prova_legenda_sobre_painel.jpg`.
- 14,5 s e 15,0 s (D2): "O PORTUGUÊS VEIO" e "BLOQUEADO." com tarja escura por cima de "ESPANHOL / MANDARIM" do painel; 15,4 s (E1): "VOCÊ FOI" encosta no painel. Texto sobre texto, no plano cujo ponto é ler o painel.
- Correção barata: a legenda é redundante aqui (o painel já mostra PORTUGUÊS com cadeado); suprimir a legenda em D2 (`if p == 'D2': return` antes de `legenda()` no `hud()`), ou subir a legenda para y≈380 nesses dois planos com um dicionário `LEG_Y = {'D2': 380, 'E1': 380}`.

### E8. [OBJ] A porta ainda muda de geometria entre planos
Prova: `prova_placa_push.jpg`.
- A2 (4,0 s): placa PUSH **em cima da maçaneta**, no mesmo painel. E3/I2 (28,5 s): placa no painel da direita, acima do porteiro; maçaneta no painel da esquerda. J1 (30,0 s): porta de um painel só, placa no centro, sem maçaneta visível. H1 (24,5 s): placa ao lado da cabeça do porteiro dormindo, na mesma profundidade dele (parece colada na parede do balcão, não no vidro). M2 (39,5 s): placa na altura do joelho do porteiro, maçaneta na borda direita.
- É muito melhor que as seis portas da v1, e em corte rápido passa. Fica registrado para a correção de M2 (E3) e de N3 (E2), que são os que vão ser refeitos de qualquer jeito: usar sempre o E3 como referência de **onde** fica placa, maçaneta e porteiro.

### E9. [OFÍCIO] Os clipes continuam quase parados; o push-in em código é quem se mexe
Medido com `medir.py` nos clipes do H3 (meta do plano anterior: descartar < 2,0): A1 0,86 · B1 1,06 · C1 1,07 · C2 0,70 · D1 0,53 (2ª metade 0,14) · E1 0,74 · F1 1,03 · F2 0,96 · G1 0,52 · G2 0,24 · G3 0,39 · H1 1,19 · I1 0,88 · K3 1,18 · L1 0,74 · M2 0,93 · N1 0,71 · E3 1,08. Só J1 (2,22) passa; A2, D2, J2, K1 chegam a 1,9.
- No final, com push-in e cortes, o QA mede "maior parado 0,5 s" e os planos de 0,5–0,7 s (G) mascaram. Mas o **plano de abertura** (A1, 0–3,3 s) é um homem na mesma pose por 3,3 s com zoom: `folha_01`, 0,00–3,00 s, perna levantada idêntica em 13 quadros seguidos. O prompt pedia "yanks again and again, body jerking"; o H3 não entregou. É o plano que decide se o vídeo é visto.
- Correção barata (só `CORTES`): A1 0–1,6 s; A2 1,6–4,3 s (tem 3,04 s de clipe, os puxões visíveis); volta ao A1 em 4,3–5,62 s com `ENTRADA` 2,0. Três cortes nos primeiros 5 s em vez de dois, e o plano parado nunca passa de 1,6 s. Correção boa: regerar A1 no H3 com um prompt de **um** verbo ("one violent pull: the whole body snaps back, foot slips on the wet step") e medir antes de usar; aceitar só ≥ 1,8.

### E10. [OFÍCIO] "Você puxa" (27,6 s) e "você puxa com tudo" (34,6 s) são o mesmo clipe, na mesma pose
Prova: `folha_06` 27,5–29,25 s e `folha_08` 35,0–35,5 s (I2 e K2 = E3_s7.mp4). "Com tudo" pede escalada; a imagem repete o esforço anterior. Resolvido junto com E1(a): K2 vira as mãos do A2.

### E11. [OFÍCIO] Os olhos aparecem duas vezes em 5 s (41,4 s e 46,3 s)
Prova: `prova_fim_congelado.jpg` (N1 e N4 = clipe N1.mp4, mesmo enquadramento). Com N2/N3 refeitos (E4), N4 pode continuar sendo os olhos; o que não pode é N1 e N4 serem o mesmo trecho do mesmo clipe. Usar `ENTRADA['N4'] = 3.0` (o clipe tem 4,46 s e a 2ª metade é o olhar para o outro lado) ou trocar N1 pelo clipe K1 (rosto cerrado) a partir de 1,5 s.

### E12. [OBJ, pequeno] Texto legível no mundo quando "ninguém lia" (9,6 s)
Prova: `prova_c1_texto.jpg`. A banca ao fundo tem a placa "NEWSTAND" (grafia errada, artefato) e jornais com texto, 1 s antes de C2 mostrar as letras escorrendo. Correção: no Flow, pedir "placa da banca em branco, jornais sem texto" (0 crédito) + H3 1 clipe; ou aceitar, porque dura 1 s e a placa tem ~30 px. Eu aceitaria por ora e trocaria quando o C1 for refeito por outro motivo.

### E13. [OFÍCIO, som] Cauda do trovão embaixo de "Sem" (36,55–36,75 s)
Medido nos stems (44,1 kHz): voz −20,5 dB RMS, sfx (cauda do trovão de 4,5 s) −29,4 dB: **9 dB** abaixo, não 10, exatamente na consoante fraca da palavra que importa. O STT do QA transcreveu "**Tem** maçaneta". Correção no mix: `thunder = corta(..., 2.0)` em vez de 4,5 s, ou um dip de −6 dB no stem sfx entre `INI['K3']+0.6` e `_w('maçaneta','P12')`. O estalo de metal está no corte (onset 35,825 s = `INI['K3']` 35,83 s): certo. A música entra a 30,6 s (2 s antes do grito): certo.

### E14. [OFÍCIO, pequeno] O destaque amarelo do INGLÊS já existe antes da escolha (15,32–15,63 s)
Prova: `prova_E1_destaque.jpg`. Por causa da leitura invertida do clipe, aos 15,35 s a fileira já está amarelo-claro, acende forte aos 15,6 s e volta a apagar aos 17,0 s. Lê como "piscou", não como "escolheu". Barato: deixar o quadro parado (frame k) até "inglês" e só então tocar o clipe de trás pra frente, para o amarelo surgir uma vez e ficar.

---

## 3. O que está bom e não deve ser mexido

- **Personagem**: um homem só em 29 planos (B2 7,75 s, C1 9,6 s, D1 12,0 s, F2 20,5 s, G1 22,0 s, K1 34,0 s, N1 42,0 s). Isso era o defeito nº 1 da v1 e está resolvido.
- **Paleta e traço**: tijolo, noite azul, janela quente, dia cinza (fora F1/F2). Sem neon, sem glow, sem gradiente de banco de imagem.
- **HUD**: status + relógio, um cartão no slot, o círculo de alvo, legenda de 1–2 palavras. Linha fina, sem brilho. "PORTEIRO · INGLÊS LV 7" (29,8 s) e "ITEM OBTIDO: MAÇANETA" (36,2 s) são as duas piadas de interface certas: a tela sabe mais que a voz. "+10" subindo do status nos três G é limpo.
- **Sequência D1→D2→E1** (lista com os nomes escritos, cadeado no PORTUGUÊS, dedo no INGLÊS, status vira "INGLÊS · LV 1" na palavra): exatamente o que o plano pedia.
- **G1/G2/G3** (EXIT/OPEN/STOP escritos na imagem, 0,6 s cada, relógio em passos 09:14 → 15:40 → 21:03): resolvido.
- **C2** (letras escorrendo dos jornais) é a melhor ideia visual nova da v2.
- **J1/J2** (porteiro acorda e esmaga as palmas no vidro): o clipe com mais vida e as palmas no vidro já são o gesto de "empurre" para quem não lê inglês. Manter.
- **K3** (voa com a maçaneta, porteiro em pé com as mãos na cabeça): certo; o estalo de metal cai no corte.
- **Teste PUSH**: a placa é legível e grande em A2 (3,3 s), I1, J1/J2 e E3; quem sabe inglês entende já na abertura e o "PUSH = ???" aos 24 s vira cumplicidade, não mistério. Funciona. Para quem não sabe, as pistas são as palmas do porteiro (boa) e a seta (fraca, ver E3).
- **Mix**: voz no topo, stems ≥ 10 dB abaixo em todas as janelas medidas (exceto E13), −14,2 LUFS, pico −1,3 dBTP, celular OK. Abertura sem música e música entrando 2 s antes do grito está no nosso método de som.
- **Legendas**: 1–2 palavras, amarela na palavra-chave, tarja só onde o fundo é claro. "6:07" e "NÍVEL 1/2" com números: bom.

---

## 4. Plano de correção, em ordem

| # | O quê | Erro | Custo |
|---|---|---|---|
| 1 | `RELOGIO`: A 23:52 · H1/I1 23:51 · I2–J 23:52 · K 23:53 · L 23:54 · M 23:55 · N 23:56 | E6 | código |
| 2 | `CLIPE['K2'] = CLIPE['A2']`, `ENTRADA['K2'] = 1.7` (porteiro não volta a dormir; "com tudo" escala) | E1a, E10 | código |
| 3 | `CORTES` da abertura: A1 0–1,6 · A2 1,6–4,3 · A1' 4,3–5,62 (`ENTRADA` 2,0) | E9 | código |
| 4 | Legenda fora de D2 (ou `LEG_Y`) | E7 | código |
| 5 | `thunder = corta(..., 2.0)` ou dip −6 dB sob "Sem" | E13 | código |
| 6 | `ENTRADA['N4'] = 3.0` | E11 | código |
| 7 | L1: `PUSH['L1'] = (1.5, (0.33, 0.60), (0.50, 0.60))` (tira a porta do quadro) **ou** regerar | E1b, E2 | código (ou Flow 1 + H3 1) |
| 8 | **N3 novo**: still "ele de pé com a maçaneta na mão, porta sem maçaneta, porteiro em pé, cachorro perto" (ref K3 + J2) e usar esse quadro no congelado | E2, E4 | Flow 1 (0 crédito), H3 0 |
| 9 | **M1 + M2 novos**: dedo desenhando; seta em perspectiva + PUSH no peito do porteiro de cabelo branco (ref J2) | E3 | Flow 2, H3 2 (~6–8 min) |
| 10 | **N2** = 2ª metade do M2 novo (`CLIPE['N2'] = CLIPE['M2']`, `ENTRADA` 1,6) | E4 | código (depende do 9) |
| 11 | **F1 + F2 de dia** (ref D1 para a luz) | E5 | Flow 2, H3 2 (~6–8 min) |
| 12 | A1 regerado com um verbo físico, aceitar só movimento ≥ 1,8 | E9 | H3 1–2 (~4 min) |
| 13 | C1 sem "NEWSTAND" (quando for refeito por outro motivo) | E12 | Flow 1, H3 1 |

Passos 1–7 são só código e resolvem, sozinhos, o relógio, o porteiro dormindo no K2, a abertura parada, a legenda sobre o painel e o trovão: dá para rodar `finalizar_v2.sh v3` em minutos. Passos 8–11 são 5 imagens no Flow (0 crédito) e 4 clipes no H3 (~15–20 min local) e fecham a continuidade da porta e a manhã. Portão antes do H3: prancha com os 5 quadros novos ao lado de K3/J2/D1 para bater o olho na continuidade (porteiro, maçaneta, luz), como a regra 1 da revisão anterior.

### Conferência do plano da v1 (o que foi e o que não foi resolvido)
Resolvidos: 1 (roupa/rosto), 4 (cachorro), 5 (paleta), 6 (glow), 7 (vocabulários), 8 (lista), 9 (P8 cortado), 10 (placas escritas, relógio em passos), 11 (fontes), 12 (slot do cartão), 14 (ritmo: 29 planos), 15 (glitch/vinheta), 16 (D1→D2), 18 (relógio no céu), 19 (contador).
Parciais: 2 (porta: de seis para três geometrias, ver E8), 3 (porteiro: um só, exceto M2, ver E3).
Não resolvidos: 13 (movimento dos clipes, ver E9), 17 (seta pra dentro, ver E3). E apareceram os novos: E1, E2, E4, E5, E6, E7.
