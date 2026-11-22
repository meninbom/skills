---
name: econodescomplicada-videos
description: >-
  Use when creating, revising, or delivering vertical Economics explainer videos
  (with caption) for the @econodescomplicada profile in Kurzgesagt #07
  illustrated style with the Moedinha mascot.
---
# Vídeos do @econodescomplicada (Estilo #07 · Explicativo Ilustrado)

Receita completa para produzir, revisar, legendar e arquivar vídeos verticais curtos (Reels/TikTok/Shorts) de Economia para público leigo no estilo `#07` (Explicativo ilustrado, pegada Kurzgesagt) com a mascote **Moedinha**.

## 1. Identidade fixa da série
- **Formato:** vertical `1080×1920` (9:16), 30 fps, H.264 High, `yuv420p`, `+faststart`, ~32–45 s + versão leve `720×1280` para celular.
- **Público e linguagem:** 100% público leigo, cotidiano brasileiro, tom direto e visual. **Proibido** jargão de aula ou gráfico acadêmico (nada de *ceteris paribus*, `P*`/`Q*`, curvas D/O' de livro, M1/M2, IPCA técnico, COPOM técnico, exógeno).
- **Mascote fixa (Moedinha):** reaproveitar os sprites já limpos (0 pixels de franja magenta) em `/workspace/fabrica-videos-claude/economia-leigo-07/arte/sprites/`:
  - `moeda_acena.png` (explicação; nunca no 1º quadro, ver 2.1)
  - `moeda_aponta.png` (destaque/crescimento/CTA)
  - `moeda_feliz.png` (alívio/equilíbrio/fecho calmo)
  - `moeda_assustada.png` (traz guarda-chuva azul — usar **somente** quando houver chuva literal ou metafórica, como chuva de água ou de notas)
- **Paleta de overlays da marca:**
  - Cartões/selos principais: violeta-índigo profundo (`#3B207A` / `#2A155E`)
  - Destaques e etiqueta inicial: amarelo ouro (`#FFD93D`)
  - Alerta de alta e botão CTA: coral vibrante (`#FF4F5E`)
  - Equilíbrio / cédulas / check: verde esmeralda (`#27C26C`)
- **Base de referência (somente leitura):**
  - Motor `#07` do plugin (NUNCA editar lá): `/workspace/fabrica-videos-claude/extracted/curso-estilos/skills/curso-estilos/motores/07/`
  - Receita e regras do estilo: `/workspace/fabrica-videos-claude/extracted/curso-estilos/skills/curso-estilos/estilos/07_explicativo_ilustrado.md` e `OFICIO.md`
  - Projetos-modelo validados: `/workspace/fabrica-videos-claude/economia-leigo-07/` (ep. 01) e `/workspace/fabrica-videos-claude/economia-inflacao-07/` (ep. 02)

## 2. Estrutura de roteiro (5 cenas + CTA) e legenda obrigatória
Salve sempre `roteiro.md` e **`legenda.txt`** na pasta do episódio:
1. **Cena 1 — Gancho (0–3 s) + ponte (3–6 s):** segue as regras de **Gancho da Cena 1** (2.1–2.7) logo abaixo. A ponte dá o nome simples do conceito sem fechar a lacuna aberta pelo gancho.
2. **Cena 2 — Mecanismo principal visual (6–13 s):** demonstração concreta com efeito/salto de preço visível **ainda dentro da Cena 2** (ex.: etiqueta antiga riscada em vermelho → etiqueta nova coral com seta opaca subindo, visível por pelo menos 1 s antes da transição).
3. **Cena 3 — Segundo fator ou reação (13–20 s):** desdobramento prático com badges/indicadores sequenciais animados acompanhando a fala.
4. **Cena 4 — Efeito real ou equilíbrio (20–27 s):** representação visual tangível (balança nivelando, sacolas encolhendo, pilhas/barras comparativas) traduzindo o impacto na vida real.
5. **Cena 5 — Resumo prático + CTA da série (final ~9–10 s):**
   - Dois cartões curtos resumindo a lição principal.
   - Saída limpa dos dois cartões como bloco único.
   - Selo roxo **`ECONOMIA SEM COMPLICAÇÃO`** com grifo coral, seguido do CTA escolhido (ver abaixo).

### Gancho da Cena 1 (regras 2.1–2.7, obrigatórias)
O gancho decide se a pessoa fica. Escrever o gancho **depois** de saber o "pagamento" do vídeo (o número, a virada ou a resposta das cenas 3–5), porque o gancho é a promessa desse pagamento.

#### 2.1 Regra dos 3 primeiros segundos (obrigatória)
- **A fala começa em ≤ 0,3 s** (sem respiro, sem silêncio, sem "oi"). Conferir em `words.json`: a 1ª palavra precisa ter `start ≤ 0,30`.
- **A 1ª frase tem até ~8 palavras** e precisa caber até ~2,5 s de narração.
- **Conflito ou tensão antes do nome do conceito.** O termo (PIB, Selic, CDI…) só aparece **depois** da dor ou da surpresa, nunca como 1ª palavra. Se aparecer na 1ª frase, que seja como alvo do conflito ("O PIB cresceu e teu bolso nem sentiu?"), não como tema de aula.
- **Texto de gancho grande na tela já no 1º quadro (t = 0):** 2 linhas, no máximo ~7 palavras, peso bold, dentro da zona segura (y ≈ 160–900). É a versão curta da fala, não um rótulo de tema. Proibido abrir com o selo **DO DIA A DIA** ou com o título do tema. Se o selo for usado, entra depois de 1,5 s e pequeno.
- **Moedinha já com expressão no 1º quadro**, ligada à emoção do gancho. **Nunca acenando** em 0 s, porque o aceno é o "oi gente" visual. Com os sprites atuais: `moeda_aponta.png` (alerta, curiosidade, número) ou `moeda_feliz.png` (humor, alívio); `moeda_assustada.png` só com chuva, pela regra da seção 1. Se o gancho pedir outra expressão (confusa, rindo, chocada), gere um sprite novo no mesmo estilo e limpe até 0 px de franja magenta antes de usar.
- **Movimento imediato:** algo já se mexendo em t = 0 (etiqueta caindo, número estourando, objeto quebrando, câmera em push-in ≤ 1,20×). Nada de fade do preto nem placa parada.
- **Funciona sem som:** só com o 1º quadro, dá pra entender qual é o problema.

#### 2.2 Cardápio de ganchos (variar entre episódios, nunca repetir o mesmo tipo 2× seguidas)
| Tipo | Quando usar | Exemplo PT-BR (economia de leigo) |
|---|---|---|
| **Humor / autoironia** | dor comum e leve, que dá pra rir dela | "Meu salário cai dia cinco. Acaba dia sete." |
| **Seriedade / alerta** | risco real (dívida, golpe, juros) | "Esse parcelado vai te custar uma TV a mais." |
| **Curiosidade** | mecanismo escondido do dia a dia | "Tem um imposto escondido no teu pãozinho." |
| **Contraintuitivo** | quando o senso comum está errado | "Guardar dinheiro na poupança pode te deixar mais pobre." |
| **Número / conta** | quando o episódio tem conta própria e verificável | "Mil reais. Um ano. Trinta reais de diferença." |
| **Erro comum** | hábito que quase todo mundo tem | "Pagar o mínimo do cartão é o erro mais caro." |
| **POV** | cena vivida, em 1ª pessoa | "POV: a geladeira morreu no dia vinte e oito." |
| **Pergunta direta (com aposta)** | pergunta que a pessoa não sabe responder na hora | "Por que o guarda-chuva triplica quando chove?" |

Pergunta só vale se for **específica e sem resposta óbvia**. Proibido "Já viu/já sentiu/já ouviu…?", porque gera "já, e daí?".

#### 2.3 Rapport
- Falar **"você/teu"** já na 1ª ou 2ª frase. Tom de amigo que explica no bar, não de professor.
- **Dor concreta do brasileiro comum:** salário que acaba antes do mês, parcela, Pix, mercado, conta de luz, cartão, aluguel, 13º, desemprego, "dia vinte e oito". Valores redondos e reais (R$ 100, R$ 2.000).
- **Sem sermão e sem culpa** ("você está fazendo tudo errado" é proibido). A Moedinha está do lado do espectador ("a gente já caiu nessa").
- Humor só se não diminuir a dor de quem passa aperto. Nada de rir de quem é pobre ou está endividado.

#### 2.4 Loop aberto
- O gancho abre **uma** lacuna específica (um número, um "por quê", um "onde") que **só fecha na cena 4 ou 5**. A ponte (3–6 s) **promete** o fechamento sem entregar ("…e a resposta tá numa pizza").
- Dar o nome do conceito na ponte não fecha o loop: o nome é o caminho, a resposta da lacuna vem depois.
- Registrar no `roteiro.md`: `Loop: <lacuna> → fecha em <cena/tempo>`.

#### 2.5 Proibições
- Abrir com "Você sabe o que é X?", "Mas o que é X?" ou com definição de dicionário.
- "Neste vídeo…", "Hoje vou explicar…", "Oi gente", logo, vinheta, selo de série ou título do tema como 1º texto.
- Clickbait que o vídeo não paga (prometer número, segredo ou valor que não aparece). Gancho = promessa, e o vídeo precisa entregar.
- Susto falso ("O Brasil vai quebrar!") e alarmismo sem base.
- Estatística inventada ou sem fonte. Número no gancho só se vier da conta do próprio episódio ou de fonte com link registrado no `roteiro.md`.
- Repetir o tipo de gancho do episódio anterior.

#### 2.6 Processo de escrita (obrigatório, registrar no `roteiro.md`)
1. Escrever o pagamento do vídeo em 1 linha.
2. Escrever **3 ganchos de tipos diferentes** do cardápio.
3. Pontuar cada um de 0 a 2 nos 6 critérios abaixo (máx. 12):
   - **Curto:** ≤ 8 palavras e ≤ 2,5 s falado.
   - **Tensão antes do termo:** dor, surpresa ou riso antes do nome do conceito.
   - **"Isso é comigo":** tem "você/teu" e uma dor concreta.
   - **Lacuna aberta:** dá vontade de saber o fim, e o fim fica para a cena 4/5.
   - **Mudo funciona:** o texto e o quadro de t = 0 se entendem sem som.
   - **Honesto:** o vídeo paga a promessa e não há número sem fonte.
4. Escolher o de maior nota. Desempate: o que mais dá vontade de **mandar pra alguém** (envios contam para alcançar quem não segue).
5. No `roteiro.md`, seção `## Gancho`: os 3 candidatos com tipo e nota, o escolhido, o texto de tela de t = 0, a expressão da Moedinha e a linha `Loop:`.

#### 2.7 Alinhamento fala × tela × legenda
- **Fala, texto de tela (t = 0) e 1ª linha da `legenda.txt` dizem a mesma ideia**, com a mesma palavra-chave. A tela é a versão curta, e a legenda pode ter 1 emoji no fim.
- A 1ª linha da legenda é o gancho escrito, visível antes do "… mais". Nunca abre com o nome do conceito nem com "Neste vídeo".
- No Canvas, zero emoji (como já é a regra). O texto de gancho usa o estilo de título da série, dentro da zona segura.
- QA: no quadro de 0,15 s extraído do 1080p, conferir texto de gancho legível, Moedinha com expressão (não aceno) e algo em movimento. Em `words.json`, conferir 1ª palavra ≤ 0,30 s e nome do conceito depois da 1ª frase.

**CTA: duas opções, padrão = SEGUIR O PERFIL.** Se o dono não disser qual quer, use sempre a opção A. Use a B só quando ele pedir "link na bio" (ex.: há oferta, material ou página no link). Registre a opção usada no `roteiro.md`.
- **A — Seguir o perfil (PADRÃO):** botão coral pulsante **`SEGUIR`** com ícone vetorial de pessoa com "+" desenhado em Canvas 2D, mostrando `@econodescomplicada` logo abaixo, e cursor clicando no botão.
  - Narração: *"Quer entender economia sem complicação? Segue o perfil."*
  - Legenda: *"Quer entender economia sem complicação? Segue o @econodescomplicada. 👇"*
- **B — Link na bio (opcional):** botão coral pulsante **`LINK NA BIO`** com ícone vetorial de elo desenhado em Canvas 2D e cursor clicando na borda inferior.
  - Narração: *"Quer entender economia sem complicação? Clica no link da bio."*
  - Legenda: *"Quer entender economia sem complicação? Clica no link da bio. 👇"*
- Personalizável se houver oferta específica, mantendo o mesmo formato.

**Regra de escrita:** no texto da narração, escreva números por extenso (`cem reais`, `vinte e cinco`), mantendo dígitos curtos e grandes (`R$ 100`, `R$ 25`) na tela.

**Legenda pronta (`legenda.txt` — obrigatória em todo vídeo):**
- Primeira linha = o gancho escrito, mesma ideia e palavra-chave da fala e do texto de tela de t = 0 (ver 2.7), visível antes do "... mais".
- 1–2 parágrafos curtos explicando o mecanismo com os números/exemplos exatos do vídeo, sem clichê nem jargão.
- Uma pergunta rápida de engajamento para comentários.
- CTA igual ao do vídeo: padrão *"Quer entender economia sem complicação? Segue o @econodescomplicada. 👇"*; se o vídeo usou link na bio, *"Quer entender economia sem complicação? Clica no link da bio. 👇"*.
- Linha final com 5–6 hashtags limpas e relevantes (incluindo `#economia`, `#educacaofinanceira`, `#economiasemcomplicacao`).

## 3. Fluxo de produção (zero API paga)

### Passo 0 — Validação de tema no Drive (OBRIGATÓRIO antes de qualquer criação)
Antes de roteirizar ou produzir qualquer coisa:
1. Liste **ao vivo** as subpastas da pasta do projeto no Drive pessoal (`user-Google-drive--personal`, pasta "Economia Sem Complicação — Vídeos", id `1iREg0PXN6AGqVpmtl-hrnq21DawowxJp`). Os nomes seguem o padrão `NN — <Tema>`.
2. Monte a lista de episódios já feitos (número + tema). Em caso de dúvida sobre o que um episódio cobriu, abra o `roteiro.md` ou o `legenda.txt` daquela subpasta.
3. Compare o tema pedido com essa lista. Considere repetido o mesmo conceito, mesmo com outro nome ou ângulo muito parecido (ex.: "Selic" e "taxa básica de juros"; "inflação" e "por que os preços sobem").
4. **Se o tema já foi abordado:** não produza. Avise o dono dizendo qual episódio já cobre aquilo e sugira 2–3 temas novos (ou um ângulo claramente diferente). Só siga com o OK dele.
5. **Se o tema é novo:** o número do episódio é o maior `NN` existente + 1. Use esse número na subpasta do Drive e no `roteiro.md`.
6. Nunca confie só na memória ou em listas antigas: a fonte da verdade é o Drive no momento da criação. Se o Drive não responder, pare e avise em vez de chutar.


### Passo 1 — Criar pasta isolada do episódio
- Crie `/workspace/fabrica-videos-claude/economia-<slug>-07/` copiando `motores/07/` (nunca altere a pasta do plugin nem episódios anteriores).
- Reaproveite `render_paralelo.mjs`, `snap.mjs` e os sprites limpos de `/workspace/fabrica-videos-claude/economia-leigo-07/arte/sprites/`.
- Garanta `puppeteer-core` disponível (`node_modules` ou symlink do episódio anterior).

### Passo 2 — Narração primeiro (`edge-tts` grátis)
- Use o venv `/workspace/fabrica-videos-claude/economia-oferta-demanda/.venv-audio` com `edge-tts` em **uma única tomada contínua** (sem emendas):
  - Voz padrão da série: `pt-BR-ThalitaMultilingualNeural`, rate `+10%`.
- Extraia timestamps exatos por palavra (`WordBoundary`) em `voz/words.json`.
- Normalize para `voz/narracao_norm.wav` (−16 LUFS) e gere a faixa final `saida/voz_final.wav` em **−14,0 LUFS estéreo, True Peak ≤ −1,5 dBTP**, 48 kHz.
  - Sempre **estéreo** (mono duplicado nos dois canais) para não perder 6 dB no teste de celular do `checar-video`.
- Defina a duração total (`window.END`) com **0,8 s de respiro visual após a última palavra** do CTA ("perfil" ou "bio") para nunca cortar áudio.

### Passo 3 — 5 placas de cenário 9:16 (`GenerateImage`)
- Gere 5 ilustrações `aspect_ratio: "9:16"` no estilo flat vetorial Kurzgesagt passando uma placa da série (`/workspace/fabrica-videos-claude/economia-leigo-07/arte/placas/c1_sol.png` ou `catalogo/previas/07.jpg`) em `reference_image_paths` para manter paleta, luz e sombras violeta-índigo consistentes.
- Regras obrigatórias nos prompts:
  - Espaço limpo no terço superior para cartões e CTA.
  - **`ABSOLUTELY NO text, NO numbers, NO letters, NO price tags, NO signs with words, NO watermarks, NO mascot.`**
- **Inspecione todas as 5 placas com `Read`** antes de animar. Rejeite e regenere qualquer placa com texto borrado de IA, vazamento de cenário de outro episódio ou composição pobre (guarde rejeitadas em `arte/bruto/`).
- Amplie as aprovadas para `1350×2400` (Lanczos) para permitir pan/zoom suaves sem perder nitidez.

### Passo 4 — Animação em Canvas (`filme/cenas.js` e `filme/filme.html`)
Baseie-se na estrutura validada de `economia-inflacao-07/filme/cenas.js` e siga este checklist rígido:
- **Sincronia:** derive as entradas das âncoras reais de `voz/words.json`; primeiro evento visual em ≤ 0,4 s; nada congelado por > 1,5 s; estenda câmera da Cena 5 até além de `window.END`.
- **Transições limpas:** **nunca use `whip`** (gera cópias fantasma). Use `empurra` (deslizamento único com filete de sombra) ou zoom suave ≤ 1,2×.
- **Zero texto fantasma:** desenhe cada cartão, selo e botão como bloco composto único (offscreen/layer) antes de aplicar transparência.
- **Legibilidade total:**
  - Fontes sem-serifa bold ≥ 44 px, acentuação PT-BR conferida (`Ç`, `Ã`, `Ó`, `É`, `Í`, `Ê`).
  - **Zero anéis, brilhos ou partículas sobre letras/números**; setas de alerta devem ser opacas com contorno.
  - **Zero emoji de texto** em Canvas (desenhe ícones vetoriais limpos em Canvas 2D: elo de link, cursor, sacolas, setas, cédulas).
  - Respeite a zona segura: overlays no terço superior/médio (`y≈160–900`), nada nos 15% inferiores (UI de Reels/TikTok) e nada cobrindo a Moedinha (`y≈1100–1600`).

### Passo 5 — Render paralelo 1080p + 720p
- Rode `render_paralelo.mjs` (use `--workers 2` quando a memória disponível estiver apertada, um episódio por vez para não disputar RAM do Chromium) gerando:
  - `saida/<slug>_leigo_1080p.mp4` (`1080×1920`, 30 fps, H.264 High, `yuv420p`, `+faststart`, AAC 48 kHz estéreo ~192k)
  - `saida/<slug>_leigo_720p.mp4` (`720×1280`, 30 fps, H.264 High, `yuv420p`, `+faststart`, AAC 48 kHz estéreo ~128k)
- Valide duração, codecs, tamanho, LUFS e True Peak via `ffprobe` + `ebur128`.

## 4. Portão de QA obrigatório (os 3 passos antes de entregar)
1. **Checagem técnica (`checar-video` #29):**
   `/workspace/fabrica-videos-claude/demo-14/.venv-checar/bin/python /workspace/fabrica-videos-claude/extracted/curso-estilos/skills/checar-video/scripts/checar.py <mp4_1080p> --sem-ocr --sem-stt`
   - Exigir **PASSOU (0 falhas)** (0 engasgos, 0 flashes/s, 0 quadros vazios, 0 s parado, áudio −14 LUFS e celular ok; o aviso de largura do herói em cenário cheio é esperado).
2. **Inspeção de quadros (`Read`):**
   - Extrair grade + quadros soltos direto do `1080p.mp4` (`0,15 s`, cena 1, salto da cena 2, transições, cena 3, cena 4, saída dos cartões, auge do botão de CTA (`SEGUIR` ou `LINK NA BIO`) e último frame) e conferir visualmente com `Read`.
   - **Checagem do gancho (2.7):** no quadro de 0,15 s, texto de gancho legível, Moedinha com expressão (não aceno) e algo em movimento; em `words.json`, 1ª palavra com `start ≤ 0,30` e nome do conceito só depois da 1ª frase. Falhou = corrigir antes de entregar.
3. **Revisão de vídeo (`videoReview`):**
   - Enviar o `720p.mp4` ao subagente `videoReview` validando narração completa sem corte, sincronia, transições sem glitch, acentos, ausência de texto fantasma e recorte da Moedinha sem franja magenta.
   - Se `videoReview` apontar algum problema, confira primeiro o quadro exato no `1080p.mp4` com `Read`; sendo defeito real, arquive a versão anterior em `_antigo/`, corrija na raiz, re-renderize e passe nos 3 passos de novo.

## 5. Entrega e arquivamento no Drive (SEMPRE com legenda)
- **No chat:** envie o `1080p.mp4` primeiro como anexo (`type: "attachment"`), seguido imediatamente da mensagem com resumo curto (duração/QA) **+ a legenda pronta para copiar e colar** (nunca envie um vídeo sem a legenda, e nunca afirme ter assistido ao vídeo).
- **No Google Drive pessoal:** salve sempre na pasta do projeto do Drive pessoal do dono (confirmando o e-mail pessoal antes de criar/enviar, nunca em conta acadêmica/secundária) em uma subpasta numerada `NN — <Tema>` contendo **4 arquivos obrigatórios**:
  1. `<slug>_leigo_1080p.mp4`
  2. `<slug>_leigo_720p.mp4`
  3. `roteiro.md`
  4. `legenda.txt`
- Liste os arquivos da subpasta ao vivo depois do upload para confirmar tamanhos e links.
