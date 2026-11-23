# Ciclo LAÇO + GRAFO

**Você aprova só o TEXTO e o FINAL.** No meio, o programa monta, checa cada plano e refaz só o plano que falhou. Assim você não precisa revisar quadro a quadro o que uma medida já pega.

## Arquivos (`scripts/`)
- `ciclo.py`: o grafo e o laço.
- `linha_voz.py`: monta a locução (`voz/voz.wav`) e acha o tempo real de cada plano (`linha_voz.json`).
- `montar.py`: o vídeo mudo, plano por plano (clipe do H3 ou placa com empurrão + efeitos e textos).
- `mixar.py`: voz na frente, trilha opcional, SFX por evento, −14 LUFS, versão `_celular`.
- `checar_planos.py`: a checagem por plano, só com medida de programa:
  - fala do plano × roteiro, STT ≥ 95%;
  - texto ou cartão na faixa da UI ou na borda;
  - trecho parado acima de 1,5 s;
  - LUFS do trecho.
- `kitcfg.py`: lê o `kit.config.json` da série.

## Grafo
```
imagens (+ revisão) ──► h3:<plano> (GPU, 1 por vez) ──┐
voz (já gerada, com ok) ──► linha ─────────────────────┴─► seg:<i> (paralelo) ─► concat ─► mix ─► checar por plano
```
- **Em paralelo:** o que não depende de nada (imagens, voz) e o render de cada segmento (`--trabalhos 3`).
- **H3:** um por vez, pela trava `gpu.trava`. `--sem-h3` pula e usa a placa.
- **Voz:** é paga e não roda no ciclo (o gasto fica na `voz-serie`, com orçamento e trava). Sem `voz/voz.wav` e sem `voz/OK_GASTO_VOZ.txt` (o seu ok na voz), ele para.

## Laço (devolve só o plano que falhou)
| Motivo medido | Ajuste no plano | Refaz |
|---|---|---|
| parado > 1,5 s | `vivo += 1` (aproximação lenta) | só o segmento |
| texto na UI ou na borda (só se o texto for do próprio ciclo: cartões, selo, aviso, raio-X) | `ui_dy -= 200` (sobe cartões e painel) | só o segmento |
| fala < 95% | `abafa_db -= 6` (baixa trilha e SFX sob a voz naquele trecho) | o mix |
| volume do trecho fora | `ganho_db ±3` | o mix |

- Cada devolução vai pro `DEVOLUCOES.md` com PLANO / VEREDITO / MOTIVO / PROVA / ESCOPO.
- Máximo de 3 tentativas por plano. Na 4ª falha o plano vira **PROBLEMA NO PLANO/ROTEIRO** e vai pra você: se três ajustes não resolveram, o problema está no plano ou no roteiro, e insistir só gira em falso.

## Uso
```
python ciclo.py --ep ep01 --nome final                       # roda em cima do que existe
python ciclo.py --ep ep01 --nome teste --injetar             # teste: estraga 2 planos de propósito
```
A saída fica em `<serie>/ciclo/<ep>_<nome>/`:
- `linha_ciclo.json`, com os ajustes;
- `segs/`;
- `<nome>.mp4` e `<nome>_celular.mp4`;
- `DEVOLUCOES.md`;
- `estado.json`;
- `checagem_rN/veredito.json`.

Rodar de novo com o mesmo `--nome` continua de onde parou (só renderiza o segmento que falta).
Pra começar do zero, use outro `--nome`.

## Um ep = uma pasta
Se o episódio sair em 2 partes, são 2 pastas (`ep07a`, `ep07b`), cada uma com a sua voz e a sua linha.
