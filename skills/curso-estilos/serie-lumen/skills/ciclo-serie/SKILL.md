---
name: ciclo-serie
description: "Monta o episódio da série pela voz e roda o ciclo \"checa cada plano e refaz só o plano que falhou\" (montar → mixar → checar por plano → ajuste automático, no máximo 3 tentativas). Use quando a voz e os quadros do ep já existem e é hora de montar, ou quando pedirem \"monta o ep\", \"roda o ciclo\", \"refaz só o plano que falhou\", \"testa o ciclo\". NÃO use pra escrever roteiro (sala-roteiro), gerar imagem (ChatGPT), gerar voz (voz-serie, paga) ou gerar vídeo/animação (animar-local), nem pra checar um vídeo avulso (checar-video)."
---

Responda sempre em português do Brasil, em linguagem simples, como para quem está começando.

# ciclo-serie

O aluno aprova só o **TEXTO** e o **FINAL**. No meio, o programa monta, mede cada plano e refaz só o plano que falhou na checagem. Assim ninguém revisa quadro a quadro o que uma medida já pega.
Nada aqui gasta dinheiro. Nada é apagado: versão velha vai pra `_antigo/`.

`<skill>` abaixo = a pasta desta skill (ex.: `${CLAUDE_SKILL_DIR}`).

## O grafo
```
imagens (+ revisão) ──► h3:<plano> (GPU, 1 por vez) ──┐
voz (já gerada, com ok) ──► linha ─────────────────────┴─► seg:<i> (paralelo) ─► concat ─► mix ─► checar por plano
```
- Imagens e voz são conferidas juntas. Cada segmento renderiza em paralelo (`--trabalhos 3`).
- O H3 roda um por vez, pela trava `gpu.trava` do config (chama a skill `animar-local`).
- A voz é paga e **nunca** roda aqui: o gasto fica na `voz-serie`, que tem orçamento e trava. Sem `voz/voz.wav` e sem `voz/OK_GASTO_VOZ.txt` (o ok do aluno na voz), o ciclo para e manda usar a `voz-serie`.
- Sem o `revisao/veredito.json` da `revisor-quadros` com todos os planos `APROVADO`, o ciclo para: animar e montar quadro com defeito só gasta tempo.

## O laço (ajuste automático, só no plano que falhou)
| Medida que falhou | Ajuste no plano | Refaz |
|---|---|---|
| parado > 1,5 s | `vivo += 1` (aproximação lenta) | só o segmento |
| texto na faixa da UI (15% de baixo) ou na borda | `ui_dy -= 200` (sobe cartões e painel) | só o segmento |
| fala < 95% no STT | `abafa_db -= 6` (baixa trilha e SFX sob a voz) | o mix |
| volume do trecho fora | `ganho_db ±3` | o mix |

- Cada devolução vai pro `DEVOLUCOES.md`: PLANO / VEREDITO / MOTIVO / PROVA / ESCOPO. (Ele só nasce se algum plano falhar.)
- **Máximo de 3 tentativas por plano.** Na 4ª falha o plano vira PROBLEMA NO PLANO/ROTEIRO. O ciclo não insiste, porque o ajuste automático já não resolve: leve o caso ao aluno.

## Passo a passo
**0. Teste do ciclo (uma vez, sem placa de vídeo e sem gasto):**
```bash
python <skill>/exemplo/fazer_ep_teste.py <pasta_da_serie> --ep teste01
python <skill>/scripts/linha_voz.py teste01
python <skill>/scripts/ciclo.py --ep teste01 --nome teste --sem-h3 --sem-stt             # tem que sair PRONTO
python <skill>/scripts/ciclo.py --ep teste01 --nome injetado --sem-h3 --sem-stt --injetar # estraga 2 planos e refaz só eles
```
**1.** No ep: `linha_estimada.json` (planos com `ancora` + efeitos), `gpt/<PLANO>.png` revisados, clipes do H3 se tiver.
**2.** Voz gerada na `voz-serie` e ouvida pelo aluno (`voz/OK_GASTO_VOZ.txt`).
**3.** `python <skill>/scripts/linha_voz.py ep01`. Confira a tabela: plano longo demais = risco de parado.
**4.** `python <skill>/scripts/ciclo.py --ep ep01 --nome v1`
- `--sem-h3`: não chama o H3; plano sem clipe vai de placa com empurrão lento.
- `--sem-stt`: pula a checagem de fala (mais rápido).
- `--sem-revisao`: não exige o revisor (só pra teste).
- `--injetar`: TESTE. Congela um plano do meio e joga os cartões na faixa da UI.

**5.** Saída em `<serie>/ciclo/<ep>_<nome>/`: `<nome>.mp4` (postar), `<nome>_celular.mp4` (prévia), `DEVOLUCOES.md` (só se algo falhou), `estado.json`, `checagem_rN/`.
Depois do PRONTO, rode a `/curso-estilos:checar-video` no final com o preset `com_fotos`: ela mede o celular e o vídeo inteiro, que a checagem por plano não mede.
Se o ep tiver `scripts/montar*.py` ou `mixar*.py` próprios, o ciclo usa os dele (mesmo CLI).

## Campos da linha (por plano; tempos em segundos dentro do plano)
- `ancora`: as 1ªs palavras ditas quando o plano entra (`"#P1"` = começo da PAUSA P1). `desloca: -0.1` adianta o corte.
- `ini`, `vel`: de onde o clipe começa e a velocidade (o `linha_voz` calcula a `vel`).
- `fx`: `congela`, `glitch`, `sepia`, `frio`, `flash_entrada`.
- `soco: 1.2` (ou a palavra): zoom-soco + flash de 2 quadros + SFX `golpe` pelo ataque.
- `raiox: {t0, t1, titulo, linhas, cx, cy}`: a cena vira raio-X em câmera lenta; números em dourado. Na série LUMEN, todo ep tem um.
- `aviso: {t, dur, texto}`: selo de buff com cara de impresso ("◆ OLHO DO FALCÃO · ATIVO"). Skill e buff vão aqui, não na voz.
- `selo: {t0, t1, texto}`: o voto do ep anterior, no topo.
- `cartoes: {t, op1: [titulo, consequência], op2: [...], chamada}`: a escolha, nos últimos 2–3 s, por cima da cena.
- `loop: 0.5`: funde no 1º quadro. `sfx: [{nome, t, db, alinha, corte}]`: som extra (nome = chave de `sfx.mapa`).

## Config que esta skill lê (`kit.config.json`)
`ferramentas.ffmpeg`, `ferramentas.ffprobe`, `ferramentas.fonte` (sem ela, fonte padrão do PIL, mais feia), `gpu.trava`,
`sfx.mapa.<nome>` (golpe, subida, troca…; vazio = pula), `trilha.arquivo` + `trilha.db` (opcional), `checar_video.script` (vazio = a `checar-video` ao lado).
Opcional: `ferramentas.bash` (caminho do Git Bash, se o `bash` do PATH for o do WSL).

## Regras que o código já cumpre
Texto fora dos 15% de baixo (a interface do Instagram cobre essa faixa) e da borda · SFX alinhado pelo ataque, golpe com cauda de 1,0 s · voz na frente, só a trilha abaixa sob a voz ·
−14 LUFS, pico ≤ −1 dBTP · yuv420p, AAC 48 kHz · `_celular` 720×1280 · nada parado mais de 1,5 s.

**Por que o master não tem compressor:** num episódio de teste, compressor 4:1 + EQ + loudnorm na mix inteira achatou todo golpe no nível da fala (LRA 3,8 LU) e tirou o grave do estrondo; aqui os SFX vão num barramento sem compressor e o nível sai de um ganho fixo medido + limitador só de pico.
