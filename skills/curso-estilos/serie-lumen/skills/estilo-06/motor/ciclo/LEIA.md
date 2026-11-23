# Ciclo LOOP + GRAFO

**Quem dirige aprova só o TEXTO e o FINAL.** No meio, o programa monta, checa cada plano e refaz só o plano reprovado.

## A pasta do episódio
Tudo é relativo a uma pasta sua (aqui chamada `<ep>`), fora do motor:
```
<ep>/
  linha_estimada.json      a linha do tempo escrita antes da voz (formato: ../LINHA.md)
  linha_voz.json           a linha real, gravada pelo montagem/linha_voz.py
  quadros/<PLANO>.png      a imagem de cada plano (gerada à mão, com a ficha anexada)
  h3/placas/<PLANO>.png    a mesma imagem em 768×1344 (montagem/placa.py grava as duas)
  h3/clipes.json           prompt e nº de quadros por plano (h3/def_clipes.py)
  h3/clips/ e h3/clips60/  clipes animados a 24 e a 60 qps
  voz/                     narr.wav, narr.words.json, falas/, voz.wav
  sons/                    seus efeitos e trilha (nomes na cabeça do montagem/mixar.py)
  revisao/veredito.json    o resultado do revisor de quadros
  ciclo_<nome>/            a saída de cada rodada do ciclo
```

## Arquivos
- `ciclo.py`: o grafo e o laço.
- `checar_planos.py`: a checagem por plano, só com medida de programa:
  - fala do plano × roteiro, STT ≥ 95% (pede `faster-whisper`);
  - texto ou cartão na faixa da UI ou na borda (pede a skill `checar-video` do pacote: aponte `CHECAR_VIDEO_DIR` para a pasta dela);
  - trecho parado acima de 1,5 s;
  - LUFS do trecho.
- `h3_um.sh`: a animação de um plano, com "uma tarefa de GPU por vez" e RIFE 60.
- `../REGRAS_SERIE.md`: as regras da série. Ler antes de escrever ou dividir planos.

## Grafo
```
imagens (manual, revisadas) ──► h3:<plano> (GPU, 1 por vez) ──┐
voz (PAGA: o ciclo só usa a que existe) ──► linha ────────────┴─► seg:<i> (paralelo) ─► concat ─► mix ─► checar por plano
```
- **Em paralelo:** o que não depende de nada (imagens, voz) e o render de cada segmento (`--trabalhos 3`).
- **Animação:** serial. O `h3_um.sh` cria uma pasta-trava (`<ep>/h3/.gpu_em_uso`) com `mkdir` e só apaga no fim; outra tarefa espera.
- **Voz:** o ciclo nunca gera voz. Se a linha pede `voz` e o arquivo não existe, ele para e avisa. Quem gasta é você, com `voz/gerar_voz.py --confirmo-custo`.

## Laço (devolve só o plano reprovado)
| Motivo medido | Ajuste no plano | Refaz |
|---|---|---|
| parado > 1,5 s | `vivo += 1` (aproximação lenta) | só o segmento |
| texto na UI ou na borda (só se a sobreposição for nossa) | `ui_dy -= 200` (sobe cartões e continua) | só o segmento |
| fala < 95% | `abafa_db -= 6` (baixa trilha e SFX sob a voz naquele trecho) | o mix |
| volume do trecho fora | `ganho_db ±3` | o mix |

- Cada devolução vai pro `DEVOLUCOES.md` com PLANO / VEREDITO / MOTIVO / PROVA / ESCOPO.
- Máximo de 3 tentativas por plano. Na 4ª reprovação o plano vira **PROBLEMA NO PLANO/ROTEIRO**, vai pra decisão humana e o ciclo não entra em loop.

## Uso
```
python ciclo.py --ep <ep> --nome final                           # roda em cima do que existe
python ciclo.py --ep <ep> --nome teste --injetar                 # teste: estraga 2 planos de propósito
python ciclo.py --ep <ep> --nome animatic --sem-animacao --sem-revisao --linha linha_estimada.json   # sem GPU e sem voz
```
A saída fica em `<ep>/ciclo_<nome>/`:
- `linha_ciclo.json`, com os ajustes;
- `segs/`;
- `<nome>.mp4` e `_celular`;
- `DEVOLUCOES.md`;
- `estado.json`;
- `checagem_rN/veredito.json`.

Medido na série: uma rodada com 2 planos refeitos levou 14,8 min num episódio de 43 s (12 segmentos).

## Revisor de quadros e trava de gasto
**Revisor (`revisor/`):** quem gera não aprova.
- `preparar.py` monta a entrada: cada quadro + duas metades em tamanho cheio + o que a cena devia mostrar.
- Subagentes de contexto zerado revisam com a lista fixa do `REVISOR.md`.
- `juntar.py` grava `veredito.json` e `REVISAO.md`.
- O nó `imagens` do ciclo bloqueia se faltar `<ep>/revisao/veredito.json` ou se algum plano não tiver APROVADO. `--sem-revisao` pula (teste e animatic).

**Trava de gasto (`trava_pago.py` + `settings_exemplo.json`):** hook do Claude Code. Copie a pasta `ciclo/` para o seu projeto e o conteúdo do `settings_exemplo.json` para `.claude/settings.json` dele.
- **No navegador:** antes de clique, digitação, JS, upload ou formulário numa aba de site que gasta crédito (a lista `PAGOS` do script), você tem que clicar em permitir.
  - Depois do 1º ok, o site fica liberado por 1 h naquela conversa.
  - Ler, tirar print e navegar não perguntam.
  - Gerador que você usa sem crédito por imagem fica de fora da lista.
- **Nos comandos:** voz (`gerar_voz`, `--confirmo-custo`) e API paga perguntam TODA vez.
- **Estado:** as abas e as liberações ficam em `ciclo/.trava_pago_estado.json`.
- **Limite:** conversa aberta em outra pasta, sem esse `settings.json`, não tem a trava.

## Efeitos por segmento que o ciclo usa
- **Montagem:** `montar.py` aceita `--segs i,j --pasta dir` (render só desses segmentos, com o mesmo quadro global), `vivo` e `ui_dy` por segmento.
- **Mix:** `mixar.py` aceita `abafa_db` e `ganho_db` por segmento.
- **Linha:** o `linha_voz.py` grava `palavras` (o tempo de cada palavra no vídeo final), que é o que a checagem de fala por plano usa.
