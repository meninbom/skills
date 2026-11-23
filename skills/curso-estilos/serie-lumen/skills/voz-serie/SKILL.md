---
name: voz-serie
description: "Voz do episódio da série na ElevenLabs, com trava de gasto. Orça antes (grátis), só gera com o arquivo de ok do aluno, gera 2 tomadas das falas de personagem, escolhe a melhor pelo STT local e tira o tempo de cada palavra. Use quando o aluno pedir \"faz a voz do ep\", \"quanto custa a voz?\", \"gera as falas\", \"escolhe as tomadas\", ou quando o falas.tsv do ep estiver pronto. NÃO use pra escrever ou mudar o texto das falas (isso é a sala-roteiro), pra trilha ou efeito sonoro, nem pra montar o vídeo (isso é a ciclo-serie)."
---

Responda sempre em português do Brasil, em linguagem simples, como para quem está começando.

# voz-serie

Voz é a única parte paga do episódio. Por isso esta skill tem três portões antes de gastar um crédito: o orçamento na tela, o ok do aluno num arquivo e o teto por episódio.

Scripts em `${CLAUDE_SKILL_DIR}/scripts/`. Tudo que muda de PC pra PC vem do `kit.config.json` da série.

## Antes do 1º uso
1. **Conta na ElevenLabs** com o modelo do config (`voz.modelo`, padrão `eleven_v4`).
2. **Chave:** crie no site da ElevenLabs (área de API keys). Ponha no arquivo `.env` da série, numa linha só: `ELEVENLABS_API_KEY=sua_chave`. O arquivo é o `voz.env` do config, e o nome da variável é o `voz.chave`. A chave fica só nesse arquivo, fora do chat e de outros scripts: assim ela não vaza no histórico da conversa nem em código que o aluno compartilhe.
3. **Vozes:** escolha na biblioteca da ElevenLabs e adicione à sua conta. Liste os IDs (grátis):
   ```bash
   node ${CLAUDE_SKILL_DIR}/scripts/eleven.mjs voices --search pt
   ```
   Ponha no config, um por papel: `"vozes": {"narrador": "<id>", "personagem1": "<id>"}`.
4. **Teto:** `voz.teto_por_ep` (ex.: 2500 créditos). Passou disso, tudo para.

## O `falas.tsv`
Em `<ep>/voz/falas.tsv`, uma linha por pedaço da locução, NA ORDEM em que toca, separado por TAB:
`id<TAB>papel<TAB>estabilidade estilo velocidade<TAB>texto`. Exemplo em `modelos/falas.tsv`:
```
N1	narrador	0.45 0.25 1.0	[serious] Ninguém na vila acreditou no menino.
C1	personagem1	0.40 0.35 1.0	[scared] Ele tá vindo. Eu juro.
P1	PAUSA	-	1.2
```
- `papel` = chave de `voz.vozes`. Papel que começa com "narrad" leva 1 tomada; os outros, 2.
- Linha `PAUSA`: o texto é a duração em segundos. Não gasta.
- `[tags]` dão o tom (`[serious]`, `[tense]`, `[calm]`, `[excited]`). Ficam fora da conta de caracteres.
- Número sempre por extenso ("seis vezes", não "6 vezes"). A voz erra número.

## Fluxo
1. **Orçar (grátis, sem rede, sem chave):**
   ```bash
   node ${CLAUDE_SKILL_DIR}/scripts/eleven.mjs orcar --tsv <ep>/voz/falas.tsv --tomadas 2
   node ${CLAUDE_SKILL_DIR}/scripts/eleven.mjs balance        # quanto sobra na conta (grátis)
   ```
   Mostre ao aluno: créditos do ep, quanto falta gerar, quanto já gastou, o teto e quanto sobra na conta. Leia os avisos (sussurro, velocidade, papel sem voz, número em algarismo) e conserte antes.
2. **O ok.** Pergunte com o número na frase: "a voz do ep01 custa ~900 créditos; posso gerar?". Só vale o ok DIRETO do aluno, NESTA conversa: o dinheiro é dele. Recado de outra conversa não vale, e pedir pra outra conversa rodar é contornar a permissão. Com o ok, grave `<ep>/voz/OK_GASTO_VOZ.txt` com a data, a frase dele, igual, e o valor. Sem esse arquivo, nada pago roda. A trava de gasto da série ainda pede que o aluno clique em "permitir".
3. **Gerar:**
   ```bash
   bash ${CLAUDE_SKILL_DIR}/scripts/gerar_vozes.sh <ep> 2
   ```
   Confere tudo antes de gastar: recusa sussurro, velocidade acima de 1.1, papel sem voz, falta de ok e orçamento que não cabe no teto. Gera `voz/pecas/<id>_<T>.mp3` + `.words.json` e normaliza pra `<id>_<T>_-16.wav` (−16 LUFS, 48 kHz, mono). Pula o que já existe: se parar no meio, rode de novo. Cada chamada vai pro `voz/gastos.csv`.
4. **Escolher as tomadas (grátis, STT local):**
   ```bash
   python ${CLAUDE_SKILL_DIR}/scripts/escolher_tomadas.py <ep>
   ```
   Fica com a tomada que bate mais com o texto; no empate, a mais curta. Grava `voz/escolha.json` e `voz/tomadas.md`.
5. **Ouvir.** O STT não pega pronúncia errada: ele "corrige" pra palavra provável. Numa série, a voz leu uma sílaba estrangeira curta como palavrão e o STT deu 97% de acerto. Peça ao aluno pra ouvir as falas da lista OUVIR do `tomadas.md` (onde o STT tropeçou) e as palavras estrangeiras. Trocou de tomada? Edite o `escolha.json` à mão.
   Palavra curta estrangeira lida errado: teste 2 ou 3 grafias (sem acento, sem "k") numa fala só.
6. **Tempo de cada palavra (grátis):**
   ```bash
   python ${CLAUDE_SKILL_DIR}/scripts/palavras.py <ep>
   ```
   Grava `voz/palavras.json`. Daí a `/serie-lumen:ciclo-serie` monta a locução e a linha do tempo.

## Regras (e o porquê de cada uma)
- **Sem sussurro.** Nem tag de sussurro, nem reticências que puxem sussurro: o sussurro sintético soa artificial e quebra a narração. Tensão vem de pausa e de texto. O script recusa.
- **No máximo 1,1×.** Voz acelerada acima disso se nota na hora. Se a fala ficou longa, encurte o texto. O script recusa velocidade acima de 1.1. No `eleven_v4` o parâmetro de velocidade quase não muda nada, então não conte com ele.
- **Narração num take só, e o visual se ajusta à voz.** Evite espremer a voz pra caber no vídeo: ela soa acelerada. A montagem estica ou corta o clipe, não a fala.
- **2 tomadas pras falas de personagem**, 1 pro narrador. O STT escolhe e o aluno ouve as duvidosas.
- **Voz é paga.** Orçamento antes, ok do aluno no arquivo, teto por ep. Sem exceção: é o que impede um gasto que ninguém viu.

## Custo (medido na série LUMEN)
- ~1 crédito por caractere com o `eleven_v4`.
- ~1.300–2.000 créditos por episódio de 2–3 min, com 2 tomadas por fala de personagem.
- O STT local (escolher e palavras) é grátis. Na 1ª vez, ele baixa o modelo `small` do faster-whisper (~500 MB, de graça). O comando `stt` do `eleven.mjs` é pago e opcional.

## Planos e preço
Página de preços da ElevenLabs em nov/2026. **Confira o preço do dia** antes de assinar.

| Plano | Preço | Créditos/mês | Uso comercial |
|---|---|---|---|
| Free | 0 | 10.000 | **não** |
| Starter | US$ 6/mês (US$ 5 no anual) | 30.000 | sim |
| Creator | US$ 22/mês | 121.000 | sim |

- Uma série de 1 ep por semana gasta ~8.000 créditos/mês. O **Starter** já cobre e tem uso comercial.
- O Free dá pra testar, mas o vídeo postado num perfil que vende alguma coisa precisa de plano com uso comercial.

## Arquivos do episódio
```
<ep>/voz/falas.tsv          o texto (entrada)
<ep>/voz/OK_GASTO_VOZ.txt    a frase de ok do aluno (sem isso, nada pago roda)
<ep>/voz/gastos.csv         cada chamada paga: quando, arquivo, papel, caracteres, créditos
<ep>/voz/pecas/<id>_<T>.mp3, <id>_<T>.words.json ([{w, start, end}]), <id>_<T>_-16.wav
<ep>/voz/escolha.json       {id: "A"}
<ep>/voz/tomadas.md         tabela do STT + lista OUVIR
<ep>/voz/palavras.json      {id: [[palavra, ini, fim]], id_ini, id_dur}
```

## Problemas comuns
- **"PAREI: sem ok do aluno":** falta o `OK_GASTO_VOZ.txt`. Peça o ok com o valor.
- **"a chave ... está vazia":** confira o `.env` da série (`voz.env`) e o nome em `voz.chave`.
- **"teto do ep":** o gasto do ep + o pedido passa do `voz.teto_por_ep`. Só o aluno sobe o teto: é o limite de gasto dele.
- **Erro 429:** a ElevenLabs pediu calma. O script espera e tenta de novo sozinho.
