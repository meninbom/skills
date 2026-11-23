# 06 · Série isekai em massinha com escolha (LUMEN)

> Vitrine: "O Mundo de LUMEN", 6 episódios no ar, até 16,1 mil pessoas por episódio · Custo: só a voz (~2.000 caracteres de narração e falas por episódio, ou seja, ~2.000 créditos da sua conta ElevenLabs); imagem, animação, efeito e montagem R$ 0 se você já tem um gerador de imagem por assinatura e placa de vídeo · Ferramentas: ChatGPT ou outro gerador de imagem (ficha e quadros), MiniMax H3 no ComfyUI local (animação), RIFE, ElevenLabs, Python + FFmpeg

Todos os caminhos desta receita partem da pasta desta skill (`${CLAUDE_SKILL_DIR}`, a `skills/estilo-06/` do plugin `serie-lumen`).

## O que é
Série vertical de 1–2 min em que um menino (Nico) joga um RPG de imersão. Os bonecos são de massinha 3D (cabeça redonda, membros de cápsula, material fosco) e o mundo é pintado, com luz de cinema. Todo episódio traz um fato real explicado em holograma com número e termina numa escolha "Comenta 1 ou 2": o voto do público decide o episódio seguinte. A imagem e o movimento vêm de IA (quadro parado → H3 anima); o código faz o resto: HUD, selo do voto, cartões, raio-X, glitch, som e a checagem plano a plano.

## Exemplo e arquivos
- Prévia do estilo: `previa/06.mp4` (capa em `previa/06.jpg`).
- Demo que roda sem IA: `motor/DEMO.md` (3 s de montagem com os efeitos em código sobre bonecos-placeholder).
- Material de ensino dentro do motor:
  - `motor/REGRAS_SERIE.md` (as regras da série por área + o registro do que foi tentado e virou regra)
  - `motor/ANALISE_retencao.md` (retenção real dos ep2–5, com o método de medir)
  - `motor/ciclo/LEIA.md` (o ciclo loop + grafo e o desenho da pasta do episódio) e `motor/ciclo/revisor/REVISOR.md`
  - `motor/LINHA.md` (o formato da linha do tempo, campo a campo) e `motor/exemplo_ep6/` (a linha real da parte 2 do ep6, a linha estimada com as âncoras e a narração)
  - `motor/h3/def_clipes.py` (os prompts de animação reais do ep6, com a trava de estilo)
- Não vêm no pacote: as fichas dos personagens, os quadros, os clipes, a voz e a trilha da série. Você cria os seus.

## Ferramentas e instalação
- **Gerador de imagem com edição por referência (ChatGPT, Flow/Nano Banana ou parecido):** é onde nascem a ficha e os quadros. Um gerador só por episódio. Dentro de uma assinatura que você já paga, sai a custo zero por imagem.
- **ComfyUI + MiniMax H3 (local, grátis, pede placa de vídeo):** ~42 GB de pesos, 11,2–11,5 GB de VRAM. Subir com `PYTHONUTF8=1`, `PYTHONIOENCODING=utf-8` e `--disable-pinned-memory` (o `motor/ciclo/h3_um.sh` já faz isso). Você aponta a pasta com `COMFY_DIR`. Licença do H3: confira os termos de uso comercial para o seu país e o seu faturamento antes de monetizar; fora do Brasil a situação é menos clara.
- **RIFE (grátis, MIT):** `rife-ncnn-vulkan` com o modelo rife-v4.6; leva o clipe de 24 para 60 qps. Usa GPU. Você aponta a pasta com `RIFE_DIR`.
- **ElevenLabs (PAGO):** a API, com a sua chave na variável `ELEVENLABS_API_KEY`. O `motor/voz/gerar_voz.py` só gasta com `--confirmo-custo`.
- **Python 3.10+:** `pip install -r motor/requirements.txt` (numpy, Pillow; opencv para capa e rastreio; faster-whisper em CPU int8 para a checagem de fala). FFmpeg no PATH.
- **Skill `checar-video`** (vem no plugin `curso-estilos`, do mesmo pacote; instale os dois): a checagem por plano usa o OCR dela. Aponte `CHECAR_VIDEO_DIR` para a pasta da skill.
- **Efeito de golpe por partículas:** se quiser reforço num impacto, use a skill `fx-golpe` deste plugin.

## Motor
Em `motor/` (~600 KB, código, textos e duas fontes livres):
- `motor/demo.py`: o demo (ver Passo 0).
- `motor/montagem/montar.py`: montagem + todos os efeitos em código + cartões de escolha. Sem clipe, usa o quadro parado com empurrão de câmera (dá animatic antes de animar).
- `motor/montagem/linha_voz.py`: a linha do tempo real a partir da voz (cada plano ancorado numa frase).
- `motor/montagem/mixar.py`: o som, pelos eventos da linha (você põe os seus efeitos em `sons/`).
- `motor/montagem/placa.py` (imagem → quadro + placa 768×1344), `motor/montagem/rastro.py` (rastreio de objeto pela cor, para o efeito seguir), `motor/montagem/comum.py` (letreiro dourado, fontes, ataque do som).
- `motor/ciclo/ciclo.py`: o grafo (imagens → animação por plano → segmentos em paralelo → concat → mix → checagem) e o laço que refaz só o plano reprovado.
- `motor/ciclo/checar_planos.py`: checagem por plano só com medida de programa (fala × roteiro por STT ≥ 95%, texto na faixa da UI, parado > 1,5 s, LUFS do trecho).
- `motor/ciclo/h3_um.sh`: animação de um plano, uma tarefa de GPU por vez, desliga o ComfyUI e passa o RIFE 60. `motor/h3/fila.sh`: fila de vários planos. `motor/h3/pausa.py`: segura a fila enquanto um programa da sua lista está aberto.
- `motor/comfy/h3.py`: o grafo do H3 pela API do ComfyUI.
- `motor/h3/def_clipes.py` + `motor/h3/clipes.json`: trava de estilo e ação por plano.
- `motor/ciclo/trava_pago.py` + `motor/ciclo/settings_exemplo.json`: hook do Claude Code que obriga você a clicar antes de qualquer ação em site ou API paga.
- `motor/ciclo/revisor/`: revisão de quadros por subagente de contexto zerado, com a lista fixa de itens.
- `motor/voz/gerar_voz.py` + `motor/voz/falas_exemplo.tsv`: voz com teto de caracteres (PAGO).
- `motor/capa/capa.py`: capa "EP. X" dourada no recorte 3:4.

## Passo a passo (ponta a ponta)
Copie `motor/` para a pasta do seu projeto e rode os comandos de dentro da cópia. `<ep>` é a pasta do seu episódio (o desenho dela está no `ciclo/LEIA.md`).

0. **Demo primeiro** (sem IA, ~1 min):
   ```
   pip install -r requirements.txt
   python demo.py                      # saida/demo.mp4
   ```
1. **Ler antes de escrever:** `REGRAS_SERIE.md`, a bíblia da sua série (mundo, elenco, lore que não muda), o livro-razão (votos, promessas, quem sabe o quê) e o roteiro anterior. Recontar o voto do episódio anterior.
2. **Roteiro (só texto)** em narração corrida, com a frase da voz que cai em cada plano. Abre no perigo, fato real em até 8 s, escolha numa frase de até 6 s. **Portão 1: o texto é aprovado antes de qualquer imagem.** Escreva a `linha_estimada.json` (formato no `LINHA.md`), com a `ancora` de cada plano.
3. **Quadros** no gerador de imagem: chat novo, ficha do personagem como imagem 1, uma imagem por pedido, sempre com as fichas anexadas. Plano aberto primeiro (geografia), close como resposta. Cada imagem baixada vira quadro e placa:
   ```
   python montagem/placa.py <ep> ~/Downloads/cena1.png S01
   python montagem/montar.py <ep>/linha_estimada.json <ep>/animatic      # animatic mudo com os quadros parados
   ```
4. **Revisor + portão 2:** preparar, rodar 2–3 subagentes de contexto zerado com o prompt do `REVISOR.md`, juntar; só o APROVADO vai para a prancha numerada com a fala embaixo. **A prancha é aprovada por uma pessoa antes de qualquer animação.**
   ```
   python ciclo/revisor/preparar.py --lista ESCOLHIDOS.txt --pasta <ep>/quadros --desc descricoes.json --fichas ficha1.jpg,ficha2.jpg --saida <ep>/revisao
   python ciclo/revisor/juntar.py <ep>/revisao
   ```
5. **Animação no H3** (20 passos, sem LoRA, 768×1344), um plano por vez. A fila sobe o ComfyUI, gera, desliga e passa o RIFE:
   ```
   cd <ep>/h3 && python <motor>/h3/def_clipes.py           # grava clipes.json (prompt + nº de quadros por plano); edite antes com os seus planos
   COMFY_DIR=<pasta do ComfyUI> RIFE_DIR=<pasta do RIFE> bash <motor>/h3/fila.sh <ep>/h3 S01 S02 S03    # clips/ (24 qps, COM faixa de áudio: o H3 gera som) e clips60/ (60 qps, sem áudio)
   ```
6. **Voz (PAGA):** rode primeiro sem a confirmação para ver os caracteres; só depois confirme.
   ```
   python voz/gerar_voz.py --texto narracao.txt --voz <voice_id> --saida <ep>/voz/narr                   # só conta
   python voz/gerar_voz.py --texto narracao.txt --voz <voice_id> --saida <ep>/voz/narr --confirmo-custo
   python montagem/linha_voz.py <ep>                                                                     # voz/voz.wav + linha_voz.json
   ```
7. **Montagem e mix** (o visual segue a voz, nunca o contrário). Ponha os seus efeitos em `<ep>/sons/` com os nomes listados na cabeça do `mixar.py`:
   ```
   python montagem/montar.py <ep>/linha_voz.json <ep>/ep_v1
   python montagem/mixar.py  <ep>/linha_voz.json <ep>/ep_v1
   ```
8. **Ciclo** (monta, checa por plano, refaz só o reprovado, no máximo 3 tentativas):
   ```
   python ciclo/ciclo.py --ep <ep> --nome final
   ```
   Sai o MP4, a versão `_celular`, `DEVOLUCOES.md` e o veredito por plano. Sem GPU: `--sem-animacao`.
9. **Golpe ou magia que pede reforço:** partículas por cima do clipe, com o estouro cravado no som, logo depois do hit-stop (skill `fx-golpe`).
10. **Entrega:** yuv420p, AAC 48 kHz, −14 ±1 LUFS, pico ≤ −1 dBTP; `_celular` com menos de 30 MB para prévia; versão de postar em crf 18. Capa: `python capa/capa.py <ep> 6`. Fechar com a skill `checar-video` do plugin `curso-estilos`.
11. **Depois de postar:** registrar o voto no livro-razão e cada aprovação ou reprovação como linha nova no Registro do `REGRAS_SERIE.md`.

## Pegadinhas medidas
- **Retenção real (ep2–5):** 25–32% saem nos primeiros 8 s quando o episódio abre com "Vocês votaram…"; o meio segura 60–70%; o menu escuro de escolha no fim derruba de novo. O ep4 (16,1 mil pessoas, 455 seguidores) venceu pelo assunto, não pela montagem.
- **H3:** grade de quadros 17k+5 (56 = 2,3 s, 73 = 3 s, 97 = 4 s, 121 = 5 s). 5 s ≈ 15 min a 20 passos; 10 s = 47–51 min (numa placa de 285 W com 12 GB). VRAM 11,2–11,5 GB. O ComfyUI chega a 27 GB de RAM com memória fixa e 16–17 GB sem.
- **Só o H3 segurou o desenho.** Os modelos rápidos e os outros geradores de vídeo testados redesenharam os personagens no primeiro meio segundo (viram "animação de estúdio"). Modelo novo só entra depois do teste de deriva (quadro de entrada ao lado dos quadros em 0,1 s / meio / fim).
- **Luta que o H3 anima:** uma ação clara por plano, plano aberto, resultado visível no mesmo plano. Troca rápida de golpes sai ruim.
- **Gerador de imagem em conversa viciada:** pedir "refaz no estilo da ficha" numa conversa longa sai realista. Chat novo + "gere EDITANDO a imagem 1". Só texto, sem referência, o design varia.
- **Miniatura esconde erro:** o revisor barrou 24 de 41 quadros e a direção marcou 2 (os dois estavam entre os 24). O revisor é filtro antes da aprovação humana, não juiz depois.
- **"Parado" debaixo de grão:** detector comum de quadro parado não vê, porque o grão muda a cada quadro; a medida própria do ciclo (média de 3 quadros × 1 s depois, numa imagem de 54×96) dá 0,42 no congelado e 1,5+ no plano mais lento.
- **Bug real:** reaproveitar a variável `dy` num laço interno desceu o cartão 2 em 52 px, para dentro da faixa da UI.
- **Fato conferido na fonte:** medo freia o coração em poucos batimentos (84 → 81 → 79), nunca 90 → 58.
- **SFX alinhado pelo ataque**, não pelo pico (`comum.ataque_audio`): alinhado pelo pico, o golpe soa atrasado.
- **Responder comentários:** 5 a 10 pessoas, textos variados, uma por vez. Em lote o Instagram perde o vínculo da resposta com o comentário.

## Custo e tempo
- **Pago:** só a voz. Um episódio em duas partes ≈ 2.000 caracteres (a parte 2 do ep6 tem 678). Rode sempre a contagem antes e gaste só com `--confirmo-custo`.
- **Grátis:** imagens (dentro da assinatura que você já tem), H3 local, RIFE, montagem.
- **Tempo:** ~20 planos × ~15 min de H3 = uma noite de GPU. Um plano curto de 2,3 s (56 quadros, 768×1344, 20 passos): ~5 min de H3 (284 s) e ~6 min no total do `h3_um.sh` (346 s: subir o ComfyUI, gerar, desligar e RIFE), medido com RTX 4070 Ti 12 GB. Uma rodada do ciclo com 2 planos refeitos = 14,8 min. O demo: ~1 min.
- **GPU:** uma tarefa de GPU por vez (o `h3_um.sh` cria uma pasta-trava e só solta no fim). Quem sobe o ComfyUI desliga. Programa da sua lista aberto (um jogo, um editor) = fila em pausa.

## O que funcionou e o que não funcionou
- **Funcionou:** o ciclo loop + grafo na parte 2 do ep6 (o humano aprova só o texto e o final). O texto em narração corrida. O vilão que caça pelo som, desenhado como concha sem rosto.
- **Funcionou:** a estética das fichas em massinha com luz de cinema; ficha nova sempre editando a figura da ficha antiga, nunca do zero.
- **Não funcionou:** mandar 47 imagens direto para o render, sem o portão da prancha. Saiu personagem sem perna e sem braço, história sem geografia, tudo de perto. "Fazer tudo de uma vez" vale depois do portão de prints, não no lugar dele.
- **Não funcionou:** trocar o H3 por modelos mais rápidos. O desenho deriva; o ganho de tempo não paga.
- **Não funcionou:** título do episódio na capa. Fica só "EP. X"; capa e legenda sem spoiler.
- **Não funcionou:** gastar crédito pago tendo o caminho grátis. Daí a trava em código.
- **Regras de gosto que valem aqui:** sem sussurro na voz; voz no máximo 1,1×; roteiro em narração corrida, sem clichê de "escolhido"; sempre em movimento (nada parado mais de 1,5 s); entrega em yuv420p.
- **Nota do estúdio:** o episódio de luta (ep7) ficou em 7 de 10 para a produção e foi reprovado na direção: imagem forte, animação fraca, com o clímax mexendo nos números do HUD em vez dos corpos.

## Roteiro de aula
- **Objetivo:** o aluno sai sabendo montar uma série com personagem fixo em que a IA faz imagem e movimento e o código faz HUD, escolha, som e checagem, e sabendo ler a retenção para corrigir o roteiro.
- **Demonstração (~35 min):** (1) assistir a prévia e apontar o que é IA e o que é código, 4 min; (2) a ficha e o truque do chat novo "editando a imagem 1", 6 min; (3) do quadro à placa e ao prompt do H3 com a trava de estilo (`motor/h3/def_clipes.py`), 6 min, mostrando um clipe já pronto em vez de gerar; (4) rodar o `demo.py`, abrir a linha do tempo e trocar um efeito, depois a linha que nasce da voz, 8 min; (5) o ciclo devolvendo um plano reprovado (`--injetar` e o `DEVOLUCOES.md`), 6 min; (6) o gráfico de retenção e as regras que saíram dele, 5 min.
- **Exercício:** criar 1 personagem em massinha com ficha, gerar 3 quadros de uma cena com ele, montar o animatic com o `montar.py` e animar 1 no H3 (ou em outro gerador que o aluno tenha). Deu certo se: o rosto e a roupa são os mesmos nos 3 quadros ao lado da ficha, o clipe não muda o desenho entre o 1º e o último quadro, e a cena termina numa escolha "1 ou 2" dita em até 6 s.
- **Pré-requisitos:** aula de ComfyUI local (subir, uma tarefa por vez, desligar); aula de voz e orçamento (ElevenLabs); a skill `checar-video` do plugin `curso-estilos`. Ajuda ter visto o estilo 66 (HUD de RPG) do `curso-estilos`, que usa a mesma lógica com outro traço.

## Limites conhecidos
- O demo cobre só a montagem em código. A geração de imagem é manual no navegador e a animação pede ComfyUI + GPU: nenhuma das duas roda no demo. O `h3_um.sh` (com `comfy/h3.py`) foi testado em 17/11/2026 com a v0.2.x, numa pasta limpa, em um plano: subiu o ComfyUI, gerou, desligou, passou o RIFE e soltou a trava. O `fila.sh` (vários planos) não foi executado nesse teste.
- `gerar_voz.py` foi testado só na contagem (sem gasto). `linha_voz.py` e o ciclo foram testados com voz sintética e quadros parados; `mixar.py`, sem os sons (ele pula o que falta).
- Os efeitos do `montar.py` nasceram no ep6: os desenhos dos hologramas e o texto do monitor são exemplos. Para outra série, troque os desenhos e escreva a sua linha; não há um molde genérico de episódio.
- O ciclo com revisor ainda não entregou um episódio aprovado de ponta a ponta na série: o ep6 parte 2 passou pelo ciclo sem o revisor, e o ep7 (com revisor) foi reprovado por roteiro e animação.
- Os nomes dos arquivos de peso em `comfy/h3.py` são os da nossa instalação; confira com os da sua. O ComfyUI muda rápido: teste o grafo do H3 na sua versão antes de montar a fila.
- A licença de uso comercial do H3 varia por país e faturamento; confira antes de monetizar.
