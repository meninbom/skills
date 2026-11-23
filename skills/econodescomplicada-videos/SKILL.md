---
name: econodescomplicada-videos
description: >-
  Produza e revise vídeos curtos ilustrados de Economia para o perfil
  @econodescomplicada, com mascote Moedinha, gancho, narração, render,
  legenda e QA. Fluxo portátil; verifique configuração e dependências locais.
---

# Vídeos do @econodescomplicada (Estilo #07 · Explicativo ilustrado)

Pipeline portátil para vídeos verticais de Economia para leigos. **A identidade editorial é fixa, os caminhos e ferramentas não.**

A skill contém instruções e diagnóstico, **não** os assets da série, o motor externo #07, credenciais, acesso ao Google Drive ou renderizador completo. Não afirme que um ambiente está pronto sem testar os recursos reais.

## 0. Descoberta e configuração

1. Leia o README desta skill e config.example.json; copie para config.local.json, mantido fora do Git. Configure paths.workspace, paths.engine e paths.sprites com recursos **existentes**. paths.episode_template é opcional quando o motor já possui renderizador suficiente; paths.style_reference, paths.checker_script e paths.browser são declarados conforme a etapa. Não invente paths nem IDs.
2. Os caminhos relativos são resolvidos em relação ao arquivo de configuração, nunca ao diretório atual do terminal. Valem macOS (Intel/Apple Silicon), Linux, Windows e WSL. Não fixe /workspace, ~/Documents, Homebrew, venv, Chrome ou ffmpeg em um endereço universal.
3. Antes do roteiro, execute scripts/preflight.py --config config.local.json --stage plan. Antes de produzir mídia, use --stage render. Antes da publicação, --stage publish. Com --json, obtenha o diagnóstico estruturado. `READY` significa apenas pré-requisitos estáticos encontrados; `NEEDS_VERIFICATION` significa que um provedor externo ou o acesso ao Drive ainda exige comprovação manual; `NOT_READY` indica dependência faltante. Não trate `NEEDS_VERIFICATION` como sucesso automático: valide o recurso, registre a evidência no projeto e só então prossiga. Ausência de ferramenta bloqueia a etapa correspondente, não a escrita de um rascunho.
4. Use image_backend codex-image se a skill e o Codex estiverem disponíveis e autenticados; senão, use um gerador externo **configurado e verificado**. Para áudio, prefira edge-tts; outro fornecedor só se houver voz equivalente e timestamps reais por palavra. Não presume ferramentas chamadas GenerateImage, Read ou videoReview.
5. Para incertezas do tema, público e CTA, faça só as perguntas que afetam a entrega. Reutilize decisões anteriores. Não crie um interrogatório obrigatório.
6. Caminhos pessoais, tokens e IDs de pasta ficam em configuração local e variáveis de ambiente, não no repositório público.

## 1. Identidade visual e técnica preservada

- **Vídeo final:** 1080×1920 (9:16), 30 fps, H.264 High, yuv420p, +faststart, AAC estéreo 48 kHz, aproximadamente 32–45 s. Faça também versão de 720×1280 para visualização.
- **Público:** brasileiros leigos, cotidiano concreto, sem jargão acadêmico de Economia; explicar o mecanismo por imagens acessíveis, sem gráficos de apostila.
- **Mascote Moedinha:** usar sprites reais do diretório paths.sprites, sem franja magenta: moeda_acena.png (explicação, nunca na primeira imagem), moeda_aponta.png (destaque), moeda_feliz.png (alívio), moeda_assustada.png (guarda-chuva azul, **somente com chuva** literal ou metafórica).
- **Expressões opcionais do PR #6:** moeda_alerta, moeda_chocada, moeda_confusa, moeda_pensativa, moeda_preocupada, moeda_rindo, moeda_nota, moeda_joinha; caminhada anda_a/b e pulo pulo_agacha/ar. Essas variações não estão incluídas na skill; use só se os arquivos existirem, sem substituir silenciosamente sprites reais por nomes inventados.
- **Paleta:** violeta/índigo #3B207A e #2A155E; amarelo #FFD93D; coral #FF4F5E; verde #27C26C.
- **Motor #07:** recurso externo em paths.engine (origem somente leitura); projeto-modelo, se houver, em paths.episode_template. Não editar a fonte do motor e não assumir que o agente dispõe de um plugin antigo.

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

## 3. Fluxo de produção independente de máquina

### Passo 0 — Conferir temas e numbering

- Antes de numerar ou publicar, consulte a fonte atualizada dos episódios anteriores: Drive conectado, índice oficial local ou fonte explicitamente confirmada. Compare conceitos, não somente títulos.
- Se duplicado, informe o episódio existente e ofereça outro ângulo. Para tema novo, o número será o maior número existente mais um, **somente** depois de verificar a lista.
- Quando o Drive estiver desconectado e nenhuma fonte confiável existir, pode escrever um **rascunho sem número**. Não declare que verificou duplicação nem publique número presumido. O ID da pasta do Drive deve estar somente em configuração local ou variável de ambiente.

### Passo 1 — Preparar ambiente e projeto

- Execute o preflight no estágio render. Se motor, sprites, Chrome, FFmpeg, Node ou TTS faltarem, reporte o pré-requisito específico. Um template separado só é necessário quando o motor não fornece o renderizador exigido. Se um backend externo estiver pendente de verificação, confirme de verdade sua operação antes de gerar mídia; não invente uma instalação nem gere um vídeo fictício.
- Crie uma pasta isolada em paths.workspace/episodios/<slug>. Copie os arquivos do motor e template **apenas quando existirem**, preservando a origem. Não reutilize symlink para node_modules de outros episódios; instale dependências declaradas no package.json da cópia.
- Render workers vêm da configuração (auto conservador por CPU, ou valor explícito). Não imponha 2 workers em todo computador.

### Passo 2 — Narração e timecodes reais

- Padrão da série: edge-tts com pt-BR-ThalitaMultilingualNeural, rate +10%, em uma tomada contínua. Outro backend precisa oferecer narração equivalente e os timestamps necessários.
- Crie voz/words.json com os limites reais de cada palavra; não invente WordBoundary. Primeira palavra ≤ 0,30 s.
- Normalize áudio a −16 LUFS e produza saida/voz_final.wav em −14 LUFS, true peak ≤ −1,5 dBTP, 48 kHz estéreo. Verifique por medição, usando ffmpeg/ffprobe do PATH.
- Duração final window.END = última palavra do CTA + 0,8 s, com respiro visual para nunca cortar a voz.

### Passo 3 — Cinco placas verticais 9:16

- Gere uma placa por cena a partir da direção visual, assets e paths.style_reference existentes. Prefira codex-image se disponível, com referências reais e verificadas. Não presuma um script gerar_placa.sh do Mac nem geração de imagem sem login.
- Brief em inglês: lugar e objetos concretos, luz, índigo/violeta, espaço superior limpo e espaço para a Moedinha. Regras: NO text, numbers, letters, signs, price labels, logos, watermark or mascot. A Moedinha entra depois como sprite.
- Confira proporção final e corte; eventuais conversões com FFmpeg/Pillow não recuperam detalhes ausentes. Revise as 5 placas visualmente. Guarde rejeitadas em arte/bruto e aprovadas em arte/placas.

### Passo 4 — Animação Canvas no motor real

- Inspecione o template real para confirmar filme/cenas.js, filme/filme.html, window.seek/window.render e funções disponíveis. Não invente APIs nem copie plugins inexistentes.
- Faça o timing pelos marcadores de voz/words.json: primeiro movimento ≤ 0,4 s e nenhuma cena visualmente imóvel por mais de 1,5 s. Extraia pelo menos 2 quadros por cena antes do render final.
- Regras úteis dos episódios anteriores: evitar whip com fantasma; usar transições limpas, zoom até 1,2×; compor cada bloco de texto como uma única camada; animar passos/pulos se os sprites necessários existirem.
- Fontes bold ≥ 44 px, acentuação correta, nada de emoji textual no Canvas, nenhuma partícula sobre números, evitar 15% inferiores ocupados pela UI das plataformas e não cobrir a Moedinha.

### Passo 5 — Renderização e prova técnica

- Execute o render_paralelo.mjs **apenas se encontrado** no motor ou template configurado. Gere saida/<slug>_leigo_1080p.mp4 e saida/<slug>_leigo_720p.mp4.
- Exija 30 fps, H.264 High, yuv420p, +faststart, áudio AAC 48 kHz estéreo. Prefira color_range tv quando apropriado; não exporte yuvj420p incompatível com alguns players.
- Confirme dimensões, FPS, codecs, duração, LUFS e true peak com ffprobe/ffmpeg. Não declare valores sem medir.

## 4. Portão de QA obrigatório

1. **Técnico:** use paths.checker_script (checar-video ou outro checker realmente disponível). Se não houver verificador equivalente, execute os testes parciais com ffprobe e registre **QA pendente**, sem escrever PASSOU fictício.
2. **Inspeção de quadros:** abra imagens reais do 1080p (0,15 s, Cena 2, transições, Cenas 3/4, CTA e último quadro). Confira gancho legível, Moedinha expressiva e movimento inicial, além de primeira palavra ≤ 0,30 s.
3. **Revisão audiovisual:** assista ao 720p ou use ferramenta de vídeo disponível para conferir cortes de narração, sincronia, ruído visual, transições, acentuação e transparência da Moedinha. Um print isolado não comprova isso.

Falhou? Salve a versão antiga em _antigo, corrija e repita verificações. Anote resultados e pendências junto do episódio.

## 5. Entrega e arquivamento

- Sempre entregar quatro arquivos: MP4 1080p, MP4 720p, roteiro.md e legenda.txt; informar localização real e status do QA.
- archive.mode=local: manter tudo no workspace e fornecer caminhos, sem afirmar upload.
- archive.mode=google-drive: só usar o Drive quando conector, conta e pasta corretos tiverem sido confirmados em tempo real. Arquivar em NN — Tema depois de verificar o índice; conferir arquivos no destino e não divulgar IDs privados.
- No chat, entregar legenda pronta e resumo de duração, QA e pendências. Nunca afirmar que assistiu ao vídeo, executou um modelo ou fez upload sem confirmação.

## 6. Arquivos incluídos

- README.md: migração do Mac e configuração por sistema.
- config.example.json: diretórios e provedores configuráveis, sem dados pessoais.
- scripts/preflight.py: diagnóstico read-only por estágio, sem gerar conteúdo e sem instalar dependências.
- tests/test_preflight.py: testes offline dos caminhos, requisitos e variáveis de ambiente.
- pesquisa-ganchos.md: referências editoriais.

**Limite da portabilidade:** configuração e lógica podem rodar em outros sistemas, mas render real continua exigindo o motor #07, sprites, modelos e ferramentas externas compatíveis e autorizados.
