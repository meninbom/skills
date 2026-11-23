---
name: econodescomplicada-videos
description: >-
  Use when creating, revising, or delivering vertical Economics explainer videos
  (with caption) for the @econodescomplicada profile in Kurzgesagt #07
  illustrated style with the Moedinha mascot.
---
# Vídeos do @econodescomplicada (Estilo #07 · Explicativo Ilustrado)

Receita completa para produzir, revisar, legendar e arquivar vídeos verticais curtos (Reels/TikTok/Shorts) de Economia para público leigo no estilo `#07` (Explicativo ilustrado, pegada Kurzgesagt) com a mascote **Moedinha**.

## 0. Setup no Mac (uma vez, já feito pelo Sargento em 20/11/2026)
- Pasta da série: `~/Documents/Cursos/econodescomplicada/` (modelos em `modelos/`, episódios novos em `episodios/`). Não mova.
- Plugin do curso: `curso-estilos@doti-cursos` (pasta `~/Documents/Cursos/curso-estilos`).
- Voz: `~/Documents/Cursos/econodescomplicada/.venv-audio` com `edge-tts`. Checagem: `~/Documents/Cursos/econodescomplicada/.venv-checar` com o `requirements.txt` do `checar-video`.
- Render usa o Google Chrome do Mac (ou `CHROME_PATH`) e `puppeteer-core` via `npm install` na pasta do episódio. FFmpeg em `/usr/local/bin/ffmpeg`.
- Mac Intel sem GPU dedicada: render é por software, use `--workers 2`.
- Placas: Codex CLI (`~/.local/bin/codex`, logado com ChatGPT) via `gerar_placa.sh` (adicionado em 20/11/2026).

## 1. Identidade fixa da série
- **Formato:** vertical `1080×1920` (9:16), 30 fps, H.264 High, `yuv420p`, `+faststart`, ~32–45 s + versão leve `720×1280` para celular.
- **Público e linguagem:** 100% público leigo, cotidiano brasileiro, tom direto e visual. **Proibido** jargão de aula ou gráfico acadêmico (nada de *ceteris paribus*, `P*`/`Q*`, curvas D/O' de livro, M1/M2, IPCA técnico, COPOM técnico, exógeno).
- **Mascote fixa (Moedinha):** reaproveitar os sprites já limpos (0 pixels de franja magenta) em `~/Documents/Cursos/econodescomplicada/modelos/economia-leigo-07/arte/sprites/`:
  - `moeda_acena.png` (abertura/explicação)
  - `moeda_aponta.png` (destaque/crescimento/CTA)
  - `moeda_feliz.png` (alívio/equilíbrio/fecho calmo)
  - `moeda_assustada.png` (traz guarda-chuva azul — usar **somente** quando houver chuva literal ou metafórica, como chuva de água ou de notas)
- **Expressões e quadros extras** (mesmo personagem, fundo transparente, recortados rente) em `~/Documents/Cursos/econodescomplicada/modelos/economia-leigo-07/arte/sprites/novos/`; copie para `arte/sprites/` do episódio e registre no `iniciar()` com a chave sem `moeda_`:
  - `moeda_alerta.png` (aviso sério: juros, golpe, dívida) · `moeda_chocada.png` (susto com número, sem guarda-chuva) · `moeda_confusa.png` (dúvida, pegadinha) · `moeda_pensativa.png` (pergunta do gancho, comparação)
  - `moeda_preocupada.png` (aperto, fim do mês) · `moeda_rindo.png` (gancho de humor) · `moeda_nota.png` (dinheiro, salário, desconto) · `moeda_joinha.png` (dica certa, resumo)
  - Quadros de animação: `moeda_anda_a.png` + `moeda_anda_b.png` (ciclo de andar) e `moeda_pulo_agacha.png` + `moeda_pulo_ar.png` (pulo). Prévia em `novos/previa_animacoes.mp4`.
  - Escolha a expressão pela emoção da fala de cada trecho, não por sorteio; não repita a mesma pose numa cena inteira quando a fala muda de emoção.
  - Pose nova que não exista: gere com a skill `codex-image` (`--transparent --aspect 1:1 --ref moeda_acena.png --ref moeda_aponta.png`, briefs em `novos/briefs/`), confira o canal alfa sobre fundo roxo e recorte rente antes de usar.
- **Paleta de overlays da marca:**
  - Cartões/selos principais: violeta-índigo profundo (`#3B207A` / `#2A155E`)
  - Destaques e etiqueta inicial: amarelo ouro (`#FFD93D`)
  - Alerta de alta e botão CTA: coral vibrante (`#FF4F5E`)
  - Equilíbrio / cédulas / check: verde esmeralda (`#27C26C`)
- **Base de referência (somente leitura):**
  - Motor `#07` do plugin (NUNCA editar lá): `~/Documents/Cursos/curso-estilos/curso-estilos/skills/curso-estilos/motores/07/`
  - Receita e regras do estilo: `~/Documents/Cursos/curso-estilos/curso-estilos/skills/curso-estilos/estilos/07_explicativo_ilustrado.md` e `OFICIO.md`
  - Projetos-modelo validados: `~/Documents/Cursos/econodescomplicada/modelos/economia-leigo-07/` (ep. 01) e `~/Documents/Cursos/econodescomplicada/modelos/economia-inflacao-07/` (ep. 02)

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
- **Moedinha já com expressão no 1º quadro**, ligada à emoção do gancho. **Nunca acenando** em 0 s, porque o aceno é o "oi gente" visual. Use a expressão da lista da seção 1 que bate com o gancho: `aponta`/`alerta` (alerta, número), `pensativa`/`confusa` (pergunta, pegadinha), `chocada` (susto), `rindo`/`feliz` (humor), `preocupada` (aperto); `assustada` só com chuva.
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

### Passo 1 — Criar pasta isolada do episódio
- Crie `~/Documents/Cursos/econodescomplicada/episodios/economia-<slug>-07/` copiando `motores/07/` (nunca altere a pasta do plugin nem episódios anteriores).
- Reaproveite `render_paralelo.mjs`, `snap.mjs` e os sprites limpos de `~/Documents/Cursos/econodescomplicada/modelos/economia-leigo-07/arte/sprites/`.
- Garanta `puppeteer-core` disponível (`node_modules` ou symlink do episódio anterior).

### Passo 2 — Narração primeiro (`edge-tts` grátis)
- Use o venv `~/Documents/Cursos/econodescomplicada/.venv-audio` com `edge-tts` em **uma única tomada contínua** (sem emendas):
  - Voz padrão da série: `pt-BR-ThalitaMultilingualNeural`, rate `+10%`.
- Extraia timestamps exatos por palavra (`WordBoundary`) em `voz/words.json`.
- Normalize para `voz/narracao_norm.wav` (−16 LUFS) e gere a faixa final `saida/voz_final.wav` em **−14,0 LUFS estéreo, True Peak ≤ −1,5 dBTP**, 48 kHz.
  - Sempre **estéreo** (mono duplicado nos dois canais) para não perder 6 dB no teste de celular do `checar-video`.
- Defina a duração total (`window.END`) com **0,8 s de respiro visual após a última palavra** (a última palavra do CTA) para nunca cortar áudio.

### Passo 3 — 5 placas de cenário 9:16 (Codex, `gerar_placa.sh`)
- As placas saem do gerador de imagem do Codex CLI do Mac (logado com ChatGPT, recurso `image_generation`) pelo script `~/Documents/Cursos/econodescomplicada/gerar_placa.sh`. **Uma placa por chamada** (lote baixa a qualidade):
  ```
  ~/Documents/Cursos/econodescomplicada/gerar_placa.sh "<cena em inglês, concreta, sem personagem-mascote>" <pasta-do-episodio>/arte/placas/c1_<nome>.png [refs.png ...]
  ```
  - Sem refs, ele anexa `c2_padaria.png` e `c1_mercado.png` do ep. 02 como referência de estilo (violeta-índigo, luz âmbar). Para manter a cara de um episódio específico, passe as placas dele como refs.
  - O script já embute as regras: terço superior limpo, espaço no canto inferior direito para a Moedinha, **sem texto, números, letras, etiquetas, logos, marca d'água nem mascote**.
  - Saída: bruto original em `arte/placas/bruto/<nome>_bruto.png` e a placa final recortada no centro em 9:16 (sem esticar) e ampliada para `1350×2400` (Lanczos, FFmpeg).
  - Cada placa leva ~1–2 min e gasta da cota do ChatGPT do Kauã. Rode uma por vez.
- Escreva a cena em inglês, descrevendo lugar, objetos e luz (ex.: "a Brazilian street market at sunset, stalls with fruit crates"). Figurantes são ok; a Moedinha nunca vai na placa (entra como sprite).
- **Inspecione todas as 5 placas abrindo cada imagem** antes de animar. Rejeite e regenere qualquer placa com texto borrado de IA, cor fora da paleta (céu ciano/pastel), vazamento de cenário de outro episódio ou composição pobre; mova as rejeitadas para `arte/bruto/`.

### Passo 4 — Animação em Canvas (`filme/cenas.js` e `filme/filme.html`)
Toda cena é animada no motor `#07` (Canvas, `window.seek(t)`), nunca uma placa parada com zoom lento montada no FFmpeg: o vídeo passa na checagem técnica mas fica sem nada que prenda a atenção.
- Copie `motor/`, `render.mjs`, `render_paralelo.mjs`, `snap.mjs`, `package.json` e `filme/filme.html` do `economia-inflacao-07` e faça symlink do `node_modules` dele; reaproveite os ajudantes do `cenas.js` modelo (texto `T`, painel `PN`, `card`, `grupo`, `moeda`, `burst`, `brilhos`, `empurra`, `cursorMao`, `gente`, `cedula`, `check`, `xis`, `setaSolida`) e escreva só as funções `cena1…cena5`, `cta` e `window.render`.
- Se a narração foi gravada em trechos, some a duração de cada trecho e a pausa entre eles para converter os tempos de palavra em tempo absoluto do vídeo.
- Moedinha andando: alterne `anda_a`/`anda_b` a cada ~0,2 s enquanto o `x` muda (entrada ou travessia, com quique de ~12 px no quadro B). Pulo grande: `pulo_agacha` ~0,25 s, `pulo_ar` enquanto sobe e desce, `pulo_agacha` ~0,15 s no pouso, depois volta à pose da fala. Na função `moeda`, passe `pose(t)` devolvendo o quadro certo pelo tempo.
- Em cada cena: câmera andando pela placa (`plate` com `kf`), Moedinha pulando nas palavras-chave (`beats`), cartões e ícones entrando na palavra exata, pelo menos uma mudança visível a cada ~1,5 s (contador subindo, item marcado, figura saindo, barra caindo, seta girando).
- Antes do render completo, tire quadros de teste com `node snap.mjs snaps <t1> <t2> ...` (2 por cena), monte uma grade com `hstack` e abra a imagem; corrija sobreposições de cartões e rótulos (posições fixas, texto em 2 linhas) e repita.

Siga este checklist rígido:
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
- Todo encode a partir de JPG/PNG sai em `yuvj420p` (que alguns celulares não abrem): force `scale=...:in_range=pc:out_range=tv,format=yuv420p`, `-profile:v high` e `-color_range tv` em qualquer encode ou recodificação fora do `render_paralelo.mjs`.
- Junte a voz ao vídeo mudo com `loudnorm=I=-14:TP=-1.5`, estéreo, AAC 48 kHz.
- Valide duração, codecs, tamanho, LUFS e True Peak via `ffprobe` + `ebur128`.

## 4. Portão de QA obrigatório (os 3 passos antes de entregar)
1. **Checagem técnica (`checar-video` #29):**
   `~/Documents/Cursos/econodescomplicada/.venv-checar/bin/python ~/Documents/Cursos/curso-estilos/curso-estilos/skills/checar-video/scripts/checar.py <mp4_1080p> --sem-ocr --sem-stt`
   - Exigir **PASSOU (0 falhas)** (0 engasgos, 0 flashes/s, 0 quadros vazios, 0 s parado, áudio −14 LUFS e celular ok; o aviso de largura do herói em cenário cheio é esperado).
2. **Inspeção de quadros :**
   - Extrair grade + quadros soltos direto do `1080p.mp4` (`0,15 s`, cena 1, salto da cena 2, transições, cena 3, cena 4, saída dos cartões, auge do botão `SEGUIR` e último frame) e conferir visualmente abrindo a imagem.
3. **Revisão de vídeo:**
   - Assistir o `720p.mp4` (o Kauã abre no QuickTime) ou pedir revisão a um modelo de vídeo disponível, validando narração completa sem corte, sincronia, transições sem glitch, acentos, ausência de texto fantasma e recorte da Moedinha sem franja magenta.
   - Se a revisão apontar algum problema, confira primeiro o quadro exato no `1080p.mp4` abrindo a imagem; sendo defeito real, arquive a versão anterior em `_antigo/`, corrija na raiz, re-renderize e passe nos 3 passos de novo.

## 5. Entrega e arquivamento no Drive (SEMPRE com legenda)
- **Na conversa:** informe o caminho do `1080p.mp4` e mostre o resumo curto (duração/QA) **+ a legenda pronta para copiar e colar** (nunca envie um vídeo sem a legenda, e nunca afirme ter assistido ao vídeo).
- **No Google Drive pessoal (se houver conector do Drive; senão, deixe os 4 arquivos na pasta `saida/` e avise):** salve sempre na pasta do projeto do Drive pessoal do dono (confirmando o e-mail pessoal antes de criar/enviar, nunca em conta acadêmica/secundária) em uma subpasta numerada `NN — <Tema>` contendo **4 arquivos obrigatórios**:
  1. `<slug>_leigo_1080p.mp4`
  2. `<slug>_leigo_720p.mp4`
  3. `roteiro.md`
  4. `legenda.txt`
- Liste os arquivos da subpasta ao vivo depois do upload para confirmar tamanhos e links.
