# ep7 v3: articulações (15/11)

Histórico do motor: o que mudou no boneco entre a v2 e a v4 do episódio. Não mudou: roteiro, tempos (161,97 s, mesmos planos) e estilo.

## O que mudou

### boneco.js
- **Dobra padrão invertida, agora certa.** De perfil (`l`/`q`), o joelho dobra para a frente e o cotovelo para trás. De frente/costas (`f`/`b`), os dois dobram para fora. Antes era joelho para trás e cotovelo para a frente.
- **`e*` deixou de ser cotovelo fixo e virou cotovelo-guia.**
  - O IK resolve o braço e escolhe o lado mais perto da guia.
  - Vale o escorço que a guia pedir: braço até 55%, antebraço até 35%.
  - Esticar não vale. Antes, os braços chegavam a esticar 60% (arqueiros, General).
  - O escorço nunca impede a mão de chegar ao alvo.
- **`checaJuntas()`, a trava.**
  - Acusa:
    - joelho atrás da linha quadril–tornozelo;
    - de perfil, cotovelo à frente com a mão abaixo do ombro;
    - em 3/4, cotovelo à frente só com o braço solto, porque o braço pode abrir para o lado;
    - de frente, membro dobrado para dentro;
    - mão ou pé fora do alcance ou perto demais;
    - braço com tamanho errado.
  - Só roda quando a trava liga.

### Poses (comum.js e atos)
- **Sinais forçados tirados:**
  - `cotF/cotN/joeN/joeF` de nicoMira, nicoPe, nicoChao, generalBase, iaraPresa, iaraPe e iaraMira;
  - os sinais do A1-06, do nicoDeitado, do A2-10, do Nico de costas no A4-01 e do A4-02.
- **Mantido um sinal:** `cotF: -1` no arremesso da pedra (A2-09a), que é intencional: braço erguido.
- **Pés que não alcançavam o chão** (5–10 px, as pernas esticavam e o pé flutuava): nicoMira agacha 8, nicoPe agacha 6 e o fim do levantar no A3-02 agacha 6.
- **Iara erguida (`ar`):** as mãos acompanham o corpo. Antes, as mãos ficavam presas a 96 px abaixo.
- **General:**
  - a guia do cotovelo longe no generalSolto foi para trás;
  - A3-07 (inclinado para trás), A2-09e (braço cruzando), A2-09f (girando: o IK escolhe pela vista) e A3-08 (mão alcançável);
  - o close dos dedos do A2-09g estava com as mãos fora do alcance.
- **Nico deitado (A2-05/A2-06): deixou de ser tábua.** A perna de trás dobra com a canela para cima, a outra levemente, o peito sai um pouco do chão e o braço que alcança o arco ficou dentro do alcance.
- **Iara caída (A3-08, A4-01, A4-04): agora está no chão, não agachada em pé.**
  - Nova pose `iaraSentada` (comum.js): sentada, com uma perna esticada e a outra dobrada, apoiada na mão de trás e com o tronco caído.
  - No A3-08 ela cai solta e senta (0,35 s).
  - A cauda do casaco para no chão (elenco.js).
  - O close do A4-01 foi reenquadrado.

### Texto na borda (a v2 falhou em 4 quadros)
- **A1-10:** as janelas-fantasma "NÃO ENCONTRADO" saíam da tela (x 190 e 900 com 440 px de largura). Foram para dentro (258 e 822).
- **A3-07 (RAIO-X):** o rótulo "FLECHA" nascia cortado na borda esquerda. Agora fica preso a x ≥ 124.

## Verificação
- **Trava:** `python trava.py` passa sem reprovação (1926 quadros, a 12 por segundo, em todos os planos); relatório em `TRAVA.md`. Antes das correções acusava ~100 problemas (`_poses/rascunho/_trava_inicio.md`).
- **Poses em tamanho grande:**
  - `_poses/antes_v2.jpg` × `_poses/v3_final.jpg` (A1-02, A2-05, A2-07, A3-02, A3-08, A4-01);
  - `_poses/general.jpg` (v2 em cima, v3 embaixo; o General ficou igual onde já estava certo);
  - `_poses/v3_todos.jpg` (um quadro por plano).
- **checar-video `--sem-stt`** (`ep7_v3_qa/`): texto na borda 0, contra 4 na v2.
  - Volume -19,1 LUFS e celular -27,7 seguem reprovando, como na v2: o episódio está sem voz e o som não foi mexido.
  - Texto pequeno continua como aviso: é o HUD.

## Ferramentas novas
- `python trava.py [--qps 12]`: sai com código 1 se houver reprovação.
- `python folha_poses.py --out x.jpg [--video arquivo.mp4] PLANO:u,u ...`: ladrilhos grandes por plano/tempo, ao vivo ou tirados de um vídeo.

# ep7 v4: física e rosto (15/11)
Entregue: `ep7_v4_celular.mp4`. Resumo visual em `_poses/v4_resumo.jpg`. Fontes da v3 guardadas em `_versoes_v3/`.
- **Pano × chão** (`noChao`/`chaoCtx` no boneco.js): cada ponto de pano que passaria do chão deita nele e escorrega para fora do corpo.
  - Vale para o casaco e a cauda da Iara, a capa e o saiote do General e a túnica do Nico.
  - O chão é `P.chao` (padrão: `P.y`). Em boneco girado só vale se passar `chao`, e o Nico deitado passa `CH`.
- **fisica.js:**
  - `salta()`: antecipa, impulso, voo e pouso.
  - `pousa()`: achata no contato, o joelho absorve e volta com mola.
  - `equilibrio()`: no agachamento o quadril vai para trás e o tronco para a frente.
  - `mola()`.
- **Boneco novo:**
  - `calcN/calcF`: calcanhar ergue e o pé gira na ponta;
  - `estica`: estica/achata com volume constante;
  - `voo`: o ar levanta ou atrasa o pano.
- **A2-07:** a Iara cai com os pés apontando e o casaco subindo, e pousa com mola.
- **Rosto:**
  - piscar determinístico por personagem (`piscando`);
  - a boca do Nico e da Iara segue a fala: sílabas pelas vogais, fecha nas pausas, forma pela vogal (`bocaDaFala`, ligado no episodio.js).
- **Laboratório:** `lab_fisica.html?q=nico&s=1.9` (ou `q=iara`); `?tira` faz a tira com fantasma.
- **Trava:** agora também reprova se algum ato não carregar. Antes, um erro de sintaxe passava liso.
