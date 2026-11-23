# 28 · Ciclo de conferência ("refaz só o que falhou")

> Vitrine: o ciclo laço + grafo da nossa série (ep6 parte 2 e ep7) · Custo: grátis (o ciclo em si) · Ferramentas: Python, FFmpeg, Claude Code (subagentes revisores, hook), skill `checar-video`

## O que é
Um programa que monta o episódio em segmentos, mede cada plano, devolve só o plano reprovado com a prova escrita, refaz só ele e mede de novo. Você aprova só o TEXTO e o FINAL; no meio ninguém fica olhando quadro. Funciona porque "o modelo achou bom" não conta: só conta medida de programa, e cada plano tem no máximo 3 tentativas antes de virar problema de roteiro.

## Exemplo e arquivos
- Prévia do catálogo: `catalogo/previas/28.jpg` (este estilo é um processo; não tem vídeo de vitrine)
- Motor: `motores/28/` (leia `motores/28/LEIA.md`)
- Projeto de exemplo no contrato do ciclo: `motores/28/exemplo/` (`linha.json` + `montar.py`)
- Demo que prova o laço: `motores/28/DEMO.md`

## Ferramentas e instalação
- Python 3.9+ com `numpy`; FFmpeg no PATH. Grátis.
- Para checar fala × roteiro: `pip install faster-whisper` (modelo small, CPU).
- Para checar texto na faixa da UI e na borda: a skill irmã `checar-video` deste pacote (ver `estilos/29_checagem_objetiva.md`). O ciclo acha sozinho dentro do pacote; fora dele, aponte a variável `CHECAR_VIDEO` para o `checar.py`.
- Para o revisor de quadros: Pillow, e o Claude Code (os revisores são subagentes de contexto zerado).
- A trava de gasto é um hook do Claude Code.
- **Pago fica fora do ciclo:** voz (ElevenLabs, com a sua chave) e qualquer site de geração. O ciclo só confere se o arquivo existe; quem gera é você, sabendo o custo antes.
- GPU: só se a SUA montagem usar. Uma tarefa de GPU por vez.

## Motor
Em `motores/28/`:
- `ciclo.py` — o grafo (pré-requisitos, segmentos em paralelo, concat, mix, checagem) e o laço de devolução.
- `checar_planos.py` — a checagem POR PLANO: fala × roteiro, texto na UI/borda, parado, volume.
- `exemplo/linha.json`, `exemplo/montar.py` — projeto mínimo: 3 planos falsos por código.
- `demo.py` — roda o ciclo no exemplo com 1 defeito injetado.
- `trava_pago.py` + `settings_hook_exemplo.json` — hook que pede o seu clique antes de ação em site pago ou comando de voz/API paga.
- `revisor/REVISOR.md`, `revisor/preparar.py`, `revisor/juntar.py` — revisor de quadros ("quem gera não aprova").

A montagem e o mix de verdade são do SEU projeto. O ciclo espera deles um contrato, descrito no passo 3.

## Passo a passo (ponta a ponta)
1. **Rodar o demo.** Copie `motores/28/` para a pasta do seu projeto e:
   ```bash
   pip install -r requirements.txt
   python demo.py
   ```
   Três planos falsos, o do meio congelado de propósito. Acompanhe o log: só o #1 reprova, só ele re-renderiza, a rodada 2 dá 0. Abra `saida/ciclo/DEVOLUCOES.md`.
2. **Texto aprovado antes.** O ciclo conserta plano, não conserta roteiro. Só comece com o texto fechado.
3. **Deixar a sua peça no contrato do ciclo.** Uma pasta com:
   - `montar.py`, que aceita `LINHA BASE --segs i,j --pasta DIR` e renderiza só esses segmentos (`DIR/seg_000.mp4`...), com o mesmo quadro global, lendo `vivo` e `ui_dy` de cada segmento;
   - `mixar.py` (opcional), que aceita `LINHA BASE`, lê `BASE_mudo.mp4`, grava `BASE.mp4` e lê `abafa_db` e `ganho_db` por segmento;
   - `linha.json` com `segmentos` (cada um com `plano`, `t`, `dur`), `palavras` (pares tempo, palavra, tirados do alinhamento da voz) e `precisa` (arquivos que têm de existir: voz, imagens, clipes).
4. **Revisar os quadros antes** (se houver imagem gerada):
   ```bash
   python revisor/preparar.py --lista ESCOLHIDOS.txt --pasta PASTA_DOS_QUADROS --desc descricoes.json --fichas ficha_a.jpg,ficha_b.jpg --saida MEU_PROJETO/revisao
   python revisor/juntar.py MEU_PROJETO/revisao
   ```
   Entre um e outro, 2–3 subagentes novos revisam com o prompt do `revisor/REVISOR.md`. Com `--exige-revisao`, o ciclo bloqueia sem `veredito.json` com APROVADO.
5. **Provar o laço uma vez na sua peça** (estraga o plano do meio de propósito e vê se acha e refaz só ele):
   ```bash
   python ciclo.py --projeto MEU_PROJETO --nome teste --injetar
   ```
6. **Rodar de verdade:**
   ```bash
   python ciclo.py --projeto MEU_PROJETO --nome final --trabalhos 3
   ```
7. **Ler a saída** em `MEU_PROJETO/_ciclo_final/`: `estado.json` (cada nó e a hora), `DEVOLUCOES.md` (PLANO / VEREDITO / MOTIVO / PROVA / ESCOPO), a pasta `checagem_rN` de cada rodada com `veredito.json`, e o vídeo final.
8. **Plano marcado PROBLEMA NO PLANO/ROTEIRO:** parar e mexer no plano ou no roteiro. Não insistir no ajuste.
9. Conferir `yuv420p` e rodar a checagem objetiva (`estilos/29_checagem_objetiva.md`) no arquivo final.

## Pegadinhas medidas
- **Tabela do laço:**
  | Motivo medido | Ajuste | Refaz |
  |---|---|---|
  | parado > 1,5 s | vivo += 1 (aproximação lenta) | só o segmento |
  | texto na UI ou na borda (só sobreposição nossa) | ui_dy −= 200 px | só o segmento |
  | fala < 95% | abafa_db −= 6 | o mix |
  | volume do trecho fora | ganho_db ±3 | o mix |
- **Parado à prova de grão:** média de 3 quadros a 10 qps em 54×96 px, comparada com 1 s depois. Calibrado num episódio real: plano congelado = 0,42; plano real mais lento = 1,5+. Limiar 1,0. O grão muda a cada quadro e engana a medida comum.
- **Volume por trecho:** com fala, entre −20 e −9 LUFS; sem fala, entre −32 e −9. Trecho menor que 1,2 s não mede.
- **Fala por plano:** STT (faster-whisper small, CPU) com tempo por palavra, folga de 0,4 s nas bordas, palavra "parecida" a partir de 0,75 de semelhança.
- **Texto que é da própria cena vira aviso, não reprova.** Só reprova se o segmento tem cartão, "continua", selo ou monitor nosso (chaves `cartoes`, `continua`, `selo`, `monitor` no segmento).
- **Máximo de 3 tentativas por plano.** Num episódio de 48 segmentos, 4 planos viraram problema, todos por fala em plano curto: "4/5 palavras ouvidas entre 1,00–3,65 s" e "0/2 palavras entre 72,60–74,83 s". Plano de 2 palavras reprova fácil no STT: é sinal de roteiro ou de divisão de planos, não de mix.
- **Passo fixo às vezes não basta na 1ª:** num teste, a 1ª correção de ui_dy (de +330 para +130) não bastou; a 2ª (−70) resolveu. O passo é fixo de 200 px.
- **Nada é apagado:** segmento refeito vai para `segs/_antigo/` com a hora.
- **Revisor barra demais:** num storyboard de 41 quadros reprovou 24; a revisão humana marcou só 2, e os 2 estavam entre os 24. Ele é filtro ANTES de você, não juiz depois. A pessoa vence.
- **Miniatura esconde erro:** quem gerou disse "conferi cada quadro" olhando a prancha pequena; mais de 10 estavam errados. Por isso o revisor recebe as duas metades em tamanho cheio.
- **A trava de gasto só vale em conversa aberta na pasta que tem o hook.** Aberta em outra pasta, não tem trava.
- **O OCR é a parte lenta** (dezenas de segundos). O ciclo só roda quando algum segmento tem sobreposição nossa, ou com `--texto` no `checar_planos.py`.

## Custo e tempo
- O ciclo é grátis. Tempos medidos por nós (montagem real, 1080×1920):
  - 12 segmentos, com 2 defeitos injetados e 3 rodadas: 14,8 min.
  - Mesmo episódio sem defeito, 1 rodada: 7,7 min.
  - 48 segmentos: 16–17 min.
  - Refazer 1 segmento: 20–70 s. Concat: 1–2 s. Mix: 15–30 s. Checagem por rodada: ~2 min.
- O demo (3 planos de 1,2 s): 20–60 s.
- Voz é paga e fica fora: gere antes, com a sua chave, sabendo o custo (uma narração de 60 s tem ~900 caracteres).

## O que funcionou e o que não funcionou
- Funcionou: devolver só o plano reprovado, com a prova escrita. Refazer 1 segmento leva 20–70 s; refazer o episódio leva 8+ min.
- Funcionou: limite de 3 tentativas. Sem ele, o laço insiste num defeito que é do roteiro.
- Não funcionou: confiar em "conferi cada quadro" de quem gerou, olhando miniatura. Daí nasceu o revisor de contexto zerado.
- Não funcionou: regra escrita de "pergunte antes de gastar" em conversa longa. Uma sessão gastou milhares de créditos com opção grátis na mão. Daí nasceu o hook: ele roda fora da cabeça do modelo.
- Funcionou: avisar quando o ciclo começa e quando trava. Rodar sozinho não é rodar em silêncio.
- Nossa nota: o ciclo pega o que é mensurável (parado, texto na UI, fala, volume). Não pega plano feio, piada sem graça nem ritmo. O final continua sendo seu.

## Roteiro de aula
- **Objetivo:** o aluno sai sabendo montar um laço "mede → devolve só o que falhou → refaz → mede", com limite de tentativas, em cima de qualquer pipeline de vídeo por segmentos.
- **Demonstração (~15 min):**
  1. O desenho do grafo: o que roda junto, o que é serial, o que é pago (2 min).
  2. Rodar `python demo.py` e acompanhar o log: 1 reprovado, só ele re-renderiza (5 min).
  3. Abrir o DEVOLUCOES.md e ler um bloco PLANO / MOTIVO / PROVA / ESCOPO (3 min).
  4. Mostrar o que acontece quando o conserto não resolve: trocar `0.22` por `0.0` no `exemplo/montar.py` e ver o plano virar PROBLEMA NO PLANO/ROTEIRO depois de 3 tentativas (2 min).
  5. O hook de gasto pedindo permissão (3 min).
- **Exercício:** pegar um vídeo seu de 4+ segmentos, plantar 1 defeito (congelar um plano por 3 s ou descer uma legenda para a faixa da UI) e fazer o ciclo achar e corrigir sozinho. Deu certo se: só o segmento defeituoso foi refeito e a rodada seguinte dá 0 reprovados.
- **Pré-requisitos:** `estilos/29_checagem_objetiva.md`. Ter um pipeline que renderiza por segmento (qualquer estilo em código do curso).

## Limites conhecidos
- O ciclo não renderiza nada sozinho: a montagem e o mix são seus, no contrato do passo 3. O exemplo do pacote é de planos falsos; adaptar uma montagem real leva algumas horas.
- Os nós de geração (imagem, vídeo por IA, voz) não fazem parte do motor: nos nossos projetos eles eram amarrados a um episódio. Aqui o ciclo só confere que os arquivos existem (`precisa`).
- O `--injetar` congela o segmento do meio; para "congelar" funcionar, o seu `montar.py` precisa respeitar `fx: ["congela"]`.
- Os ajustes automáticos são 4 (vivo, ui_dy, abafa_db, ganho_db). Defeito fora disso é reprovado, mas não tem conserto automático.
- O demo é mudo: a checagem de fala e de volume não é exercitada nele.
- A prévia do catálogo é só imagem.
