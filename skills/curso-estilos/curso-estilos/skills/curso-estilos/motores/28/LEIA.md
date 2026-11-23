# Ciclo de conferência (laço + grafo)

**Você aprova só o TEXTO e o FINAL.** No meio, o programa monta, checa cada plano e refaz só o plano reprovado.

## Arquivos
- `ciclo.py` — o grafo e o laço. O contrato do projeto está no topo do arquivo.
- `checar_planos.py` — a checagem por plano, só com medida de programa:
  - fala do plano × roteiro, STT ≥ 95% (precisa de áudio, de `palavras` na linha e de `faster-whisper`);
  - texto ou cartão na faixa da UI ou na borda (usa a skill irmã `checar-video`);
  - trecho parado acima de 1,5 s;
  - LUFS do trecho.
- `exemplo/` — um projeto mínimo no contrato: `linha.json` (3 planos) e `montar.py` (planos falsos por código).
- `demo.py` — roda o ciclo no exemplo com 1 defeito injetado.
- `revisor/` — revisor de quadros gerados ("quem gera não aprova").
- `trava_pago.py` + `settings_hook_exemplo.json` — hook do Claude Code que pede o seu clique antes de gasto.

## Grafo
```
pré-requisitos (imagens, voz, clipes: têm de existir) ─► seg:<i> (paralelo) ─► concat ─► mix ─► checar por plano
```
- **Em paralelo:** o render de cada segmento (`--trabalhos 3`).
- **GPU:** se a sua montagem usa GPU, rode com `--trabalhos 1` (uma tarefa de GPU por vez).
- **Pago (voz, geração):** fica FORA do ciclo. Liste o arquivo em `"precisa"` na linha; o ciclo bloqueia se faltar e nunca gera sozinho.

## Laço (devolve só o plano reprovado)
| Motivo medido | Ajuste no plano | Refaz |
|---|---|---|
| parado > 1,5 s | `vivo += 1` (aproximação lenta) | só o segmento |
| texto na UI ou na borda (só se a sobreposição for nossa) | `ui_dy -= 200` (sobe cartões e legenda) | só o segmento |
| fala < 95% | `abafa_db -= 6` (baixa trilha e SFX sob a voz naquele trecho) | o mix |
| volume do trecho fora | `ganho_db ±3` | o mix |

- Cada devolução vai para o `DEVOLUCOES.md` com PLANO / VEREDITO / MOTIVO / PROVA / ESCOPO.
- Máximo de 3 tentativas por plano. Na reprovação seguinte o plano vira **PROBLEMA NO PLANO/ROTEIRO** e o ciclo para de insistir nele.

## Uso
```
python demo.py                                              # o exemplo, com 1 defeito injetado
python ciclo.py --projeto MEU_PROJETO --nome final          # roda em cima do seu projeto
python ciclo.py --projeto MEU_PROJETO --nome teste --injetar  # teste: estraga o plano do meio de propósito
```
A saída fica em `MEU_PROJETO/_ciclo_<nome>/`:
- `linha_ciclo.json`, com os ajustes;
- `segs/` (os refeitos antigos vão para `segs/_antigo/`);
- `<nome>.mp4`;
- `DEVOLUCOES.md`;
- `estado.json`;
- `checagem_rN/veredito.json`.

## Pôr o seu projeto no contrato
- **Montagem (`montar.py`):** aceita `LINHA BASE --segs i,j --pasta DIR`, renderiza só esses segmentos com o mesmo quadro global, e lê `vivo` e `ui_dy` de cada segmento. `exemplo/montar.py` é o modelo.
- **Mix (`mixar.py`, opcional):** aceita `LINHA BASE`, lê `BASE_mudo.mp4`, grava `BASE.mp4` e respeita `abafa_db` e `ganho_db` por segmento.
- **Linha (`linha.json`):** `segmentos` (cada um com `plano`, `t`, `dur`) e, se tem voz, `palavras` (pares tempo, palavra tirados do alinhamento da voz). É o que a checagem de fala por plano usa.
- **Limites da checagem:** em `"checagem"` na linha. O exemplo usa janela curta (0,4 s) porque os planos têm 1,2 s; num vídeo real use o padrão (janela 1 s, parado máx. 1,5 s).

## Trava de gasto
Hook do Claude Code. Copie o bloco de `settings_hook_exemplo.json` para `.claude/settings.json` do seu projeto, trocando o caminho do `trava_pago.py`.
- **No navegador:** antes de clique, digitação, JS, upload ou formulário numa aba de site que gasta crédito (a lista `PAGOS`), você tem que clicar em permitir. Depois do 1º ok, o site fica liberado por 1 h naquela conversa. Ler, tirar print e navegar não perguntam.
- **Nos comandos:** comando de voz ou API paga pergunta TODA vez.
- **Estado:** as abas e as liberações ficam em `.trava_pago_estado.json` ao lado do script (ou no caminho da variável `TRAVA_ESTADO`).
- **Limite:** só vale em conversa aberta na pasta que tem o `.claude/settings.json` com o hook.
- **Páginas sem custo:** variável `TRAVA_GRATIS` com pedaços de URL (ex.: `unlimited`) que não devem perguntar.
