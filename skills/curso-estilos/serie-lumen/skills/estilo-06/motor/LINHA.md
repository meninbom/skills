# A linha do tempo (`linha.json`)

É o arquivo que a montagem, o mix e o ciclo leem. Um exemplo real está em `exemplo_ep6/linha_p2_voz.json` (parte 2 do ep6 do LUMEN, 43,4 s, 12 segmentos); a versão escrita antes da voz está em `exemplo_ep6/linha_p2_estimada.json`.

## Campos gerais
| Campo | O que é |
|---|---|
| `total` | duração do vídeo em segundos |
| `segmentos` | a lista de planos, na ordem |
| `selo_txt` | texto do selo do voto (ex.: `"EP. 6 · PARTE 2"`) |
| `escolha` | `[["1 · ATIRA", "e vira ALVO do General"], ["2 · FICA PARADO", "e a Iara é levada"]]`: os dois botões do fim |
| `chamada` | texto debaixo dos botões (padrão `COMENTA 1 OU 2`) |
| `continua_txt`, `monitor_txt` | textos do "continua" e do título do monitor |
| `voz` | caminho da voz já no tempo do vídeo, relativo à pasta do episódio (`voz/voz.wav`) |
| `palavras` | `[[segundo, "palavra"], ...]`: gravado pelo `linha_voz.py`; a checagem de fala usa |
| `arquivos` | `{"PLANO": "caminho/do/clipe.mp4"}`: clipe fora do lugar padrão |
| `trilha`, `trilha_ini` | `true` liga a trilha (`sons/trilha`); `trilha_ini` = segundo da música em que ela entra |

## Campos de cada segmento
Tempos em segundos **dentro do segmento**; posições em pixels do quadro 1080×1920.

| Campo | Efeito |
|---|---|
| `plano` | nome do plano: usa `h3/clips60/<plano>.mp4`; sem clipe, `quadros/<plano>.png` com empurrão lento |
| `t`, `dur` | começo e duração no vídeo |
| `ini`, `vel` | segundo do clipe em que o plano começa e velocidade (0,25 a 1) |
| `fx` | lista: `pula` (8 qps, anda aos trancos), `ao_contrario` (rebobina), `congela`, `sepia` (lembrança), `frio` (esfria a cor), `visao` (só o que mexe tem cor), `glitch`, `glitch_fim` |
| `selo` | `[entra, sai]` do selo do voto |
| `monitor` | `[entra, sai, bpm inicial, bpm final]`: painel de sinais vitais com ECG |
| `raiox` | `[entra, sai, x, y, bpm inicial, bpm final]`: raio-X com o coração aceso em (x, y) |
| `sonar` | lista de anéis `[t, x, y, velocidade, raio máx., força, (true = revela tudo)]`: o mundo fica escuro e cada som desenha o que encosta |
| `esconde` | `[x0, y0, x1, y1]`: área que o sonar não revela |
| `soco` | segundo do golpe: zoom de impacto + flash |
| `flash_entrada` | `true`: clarão nos 2 primeiros quadros (troca de forma) |
| `fantasma` | `[t, "PLANO", opacidade]`: 0,1 s de outro quadro por cima |
| `passos` | `[x, y]` normalizados: anéis dourados no chão a cada passo (segue `h3/rastro_<plano>.json` se existir) |
| `some` | `[x, y]` normalizados: escurece aquele ponto em 1,4 s |
| `holo`, `bicho` | `[entra, sai]`: hologramas em traço fino desenhados por código (exemplos; troque o desenho) |
| `cartoes` | segundo em que os dois botões da escolha entram |
| `continua` | segundo em que entra o "continua" |
| `loop` | segundos finais que fundem no 1º quadro do vídeo |
| `vivo`, `ui_dy` | ajustes do ciclo: aproximação lenta extra; deslocamento vertical dos cartões |
| `abafa_db`, `ganho_db` | ajustes do ciclo no mix |
| `parado_ok` | `true`: o plano é parado de propósito; a checagem não reprova |
| `ancora`, `ancoras` | só na linha estimada: frase da narração em que o plano começa (ver `montagem/linha_voz.py`) |
