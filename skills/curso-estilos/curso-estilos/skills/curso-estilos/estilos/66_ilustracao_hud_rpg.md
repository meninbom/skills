# 66 · Ilustração adulta com HUD de RPG ("O Apagão")

> Vitrine: série de ilustração com HUD de RPG, EP01 "O Apagão" (52 s) · Custo: só a voz (PAGA: ~900 caracteres de narração por tomada; conte 2–3 tomadas); imagem, animação e montagem R$ 0 · Ferramentas: Flow (Nano Banana), H3 Flash no ComfyUI local, RIFE, Python + FFmpeg (montagem e HUD), ElevenLabs, Whisper

**Neste setup, as ilustrações paradas saem pela skill `codex-image`** (`../CODEX_IMAGE.md`): `python3 ~/.agents/skills/codex-image/scripts/codex_image.py "<brief>" -o assets/nome.png --aspect 9:16 --crop`. Salve em `assets/` da cópia do motor e continue HUD + montagem. A animação (H3 Flash / ComfyUI) continua opcional e à parte, só se o aluno quiser — pede GPU.

## O que é
História curta para adulto em ilustração vetorial chapada (traço tipo Kurzgesagt, noite azul, janela quente), contada em 2ª pessoa, com uma camada de HUD de RPG por cima: status e relógio nos cantos, um cartão de sistema, um círculo de alvo e legenda de 1–2 palavras. O motor do episódio é um teste de leitura (a palavra em inglês na tela, PUSH lido como "puxe") e o fim é um voto "1 ou 2" nos comentários (formato inspirado em contas de isekai/RPG com voto). As imagens nascem todas de um quadro-mestre aprovado; o H3 Flash anima; o código faz HUD, corte seco e som.

## Exemplo e arquivos
- Prévia do estilo: `catalogo/previas/66.mp4` (e a capa `catalogo/previas/66.jpg`).
- Demo que roda sozinho: `motores/66/demo.py` (ver `motores/66/DEMO.md`).
- Material de ensino, dentro do motor:
  - Roteiro e regras do mundo: `motores/66/ROTEIRO_EP01.md`
  - Revisão crítica real da v2, erro por erro, com correção: `motores/66/REVISAO_V2.md`
  - Prompts de animação por plano (linha do tempo por segundo): `motores/66/v2/prompts/`
  - Texto da narração com as marcações de emoção: `motores/66/voz/narrador.txt` e `motores/66/voz/gancho.txt`
  - Tempos da voz, palavra por palavra: `motores/66/voz/timeline.json`

## Ferramentas e instalação
- **Python 3.10+ e FFmpeg no PATH.** `pip install -r requirements.txt` (numpy, Pillow, opencv-python-headless). É tudo o que o demo, a HUD e a montagem pedem.
- **Google Flow (imagem):** flow.google.com, agente com Nano Banana. Na conta PRO em que medimos, imagem não consumiu crédito; confira no seu plano. Vídeo no Flow é pago e não é usado aqui.
- **H3 Flash no ComfyUI local (grátis, precisa de GPU):** HyperFlow H3 Flash 14B GGUF Q4_K_M, 6 passos. Nós: ComfyUI-GGUF e ComfyUI-HyperFlow-Flash (se você remendar o model_patch do nó, um git pull desfaz). Script de API: `motores/66/h3_flash/flash.py` (variável `COMFY_INPUT` = pasta input/ do seu ComfyUI). Se os pesos ficam em outro disco, use `motores/66/h3_flash/extra_model_paths_flash.yaml` com o seu caminho.
- **RIFE (grátis, GPU):** rife-ncnn-vulkan (github.com/nihui/rife-ncnn-vulkan), modelo rife-v4.6, para câmera lenta 2× no plano do voto. Variável `RIFE_DIR`.
- **ElevenLabs (PAGO):** a API ou o site da ElevenLabs, com a sua chave. Modelo com marcação de emoção entre colchetes. O pacote não gera voz: você gera os takes e o `montar_voz.py` corta e monta.
- **Whisper** (ou o alinhamento com tempos da própria ElevenLabs): para o tempo de cada palavra e para conferir a fala contra o roteiro.
- **Não é HyperFrames:** montagem e HUD são um script Python que desenha por cima dos clipes.
- **Com marca:** esta série é sem marca. Se a peça for de uma marca, a HUD usa só os elementos do kit oficial dela, sem inventar UI.

## Motor (copiado para a skill)
Em `motores/66/` (~0,4 MB):
- `motores/66/demo.py` + `motores/66/DEMO.md`: o demo (3 s, sem IA).
- `motores/66/hud.py`: as 4 peças fixas, genéricas: status + relógio, cartão no slot fixo y 1040–1220, círculo de alvo fino com rótulo de ameaça, legenda de 1–2 palavras; mais o par de botões do voto. Só numpy + Pillow.
- `motores/66/fontes/`: Barlow Condensed (OFL). Licenças em `motores/66/FONTES.md`.
- `motores/66/v2/montar_v2.py`: o montador real do episódio, como exemplo completo: 29 planos de até 3 s, corte seco, rastreio da placa e dos olhos, push-in em código, `--so` para planos soltos e `--quadros` para tirar um quadro por plano.
- `motores/66/v2/mix.py` + `motores/66/v2/mix_exemplo.json`: mix pela timeline da voz: voz no topo, ambiente dos clipes, camas, efeitos e música, cada stem ≥ 10 dB abaixo da voz; −14 LUFS. Os sons são os seus.
- `motores/66/v2/fila_flash.sh`: fila do H3 Flash (se o ComfyUI já estiver ligado, só enfileira e não desliga; se foi ela que ligou, desliga com a fila vazia).
- `motores/66/v2/finalizar_v2.sh`: vídeo com HUD → mix → MP4 + _celular → checar-video.
- `motores/66/v2/medir.py`: movimento médio de um clipe (descartar abaixo de 2,0). `motores/66/v2/ver_clipe.py`: folha a 8 qps para conferir continuidade.
- `motores/66/v2/prancha_v2.py`: prancha dos quadros-fonte na ordem, com rótulo e fala.
- `motores/66/v2/rife_lento.sh`: câmera lenta 2× de um clipe.
- `motores/66/voz/montar_voz.py`: uma tomada cortada por frase, a 1,08×, com o porteiro abafado pelo vidro; grava a timeline (blocos = planos).

Fica fora do pacote: as ilustrações, os clipes, a voz, a música e os efeitos do episódio. O demo desenha as imagens por código; no seu projeto entram os seus arquivos em `v2/quadros/`, `v2/clipes/`, `voz/` e `v2/sons/`.

## Passo a passo (ponta a ponta)
Copie `motores/66/` para a pasta do seu projeto e trabalhe dentro dela.

0. **Demo primeiro:**
   ```
   pip install -r requirements.txt
   python demo.py                      # saida/demo.mp4, 3 s, as 4 peças da HUD sobre 3 imagens-placeholder
   python v2/montar_v2.py --quadros    # a HUD de cada corte do episódio de exemplo (fundo preto, sem clipes), em v2/final/_quadros/
   ```
   Para ver a HUD sobre as suas ilustrações, ponha `demo_quadros/1.png`, `2.png`, `3.png` e rode o demo de novo.
1. **Escolha do estilo num quadro só:** a mesma cena em 2–3 estilos, com a HUD composta por cima. Escolha pelo olho, antes de gerar mais. O quadro escolhido vira o **quadro-mestre**.
2. **Roteiro** com as regras do mundo e a palavra-teste. A ameaça do clímax (o cachorro) entra já na fala do gancho. **Portão 1: roteiro aprovado antes de qualquer voz ou imagem.**
3. **Mapa da cena** escrito e fixo: onde fica a câmera (sempre na calçada), quem está de que lado de qual porta, de onde vem cada personagem.
4. **Imagens no Flow:** TODA imagem nasce do quadro-mestre como referência, mudando só o enquadramento; o mapa da cena vai no prompt; texto do mundo (placas) nasce dentro da imagem. Uma imagem por pedido. Salve em `v2/quadros/<plano>.png`.
5. **Prancha + portão 2:**
   ```
   cd v2
   python prancha_v2.py                # prancha.jpg
   ```
   Confira consistência (rosto, roupa, porta, luz) antes de animar.
6. **Voz (PAGA):** confira o custo antes (o texto tem ~900 caracteres por tomada). Gere uma tomada inteira da narração, o gancho e o grito do porteiro, com os tempos por palavra; depois
   ```
   cd voz
   python montar_voz.py narr_a gancho_b      # dialogo.wav + timeline.json
   ```
   Os nomes de arquivo esperados estão no cabeçalho do `montar_voz.py`.
7. **Animar no H3 Flash** (768×1344, 6 passos, até 124 quadros). Uma tarefa de GPU por vez:
   ```
   cd v2
   COMFY_DIR=/caminho/do/seu/ComfyUI_portatil SEED=23 bash fila_flash.sh A1 A2 A4 B1
   python medir.py clipes/A1.mp4          # abaixo de 2,0 = parado, refazer
   python ver_clipe.py clipes/A1.mp4      # folha a 8 qps
   ```
8. **Montar, mixar e finalizar:**
   ```
   python montar_v2.py --quadros          # um quadro por plano, para conferir a HUD
   cp mix_exemplo.json mix.json           # e troque os arquivos de som pelos seus
   bash finalizar_v2.sh v1                # montar + mix + mp4 + _celular (+ checagem, se CHECAR_VIDEO estiver definida)
   ```
   Para a sua história, o `montar_v2.py` é o molde: troque `CORTES`, `RELOGIO`, `PUSH` e a função `hud()`.
9. **Conferência a 8 qps**, plano por plano, com a pergunta "quem está de que lado de qual porta e de onde veio" (`python ver_clipe.py final/_video.mp4`). Depois um revisor de contexto zerado com folhas a cada 0,25 s (modelo: `REVISAO_V2.md`).
10. **Entrega:** MP4 yuv420p + _celular 720p (crf 20), e a skill `checar-video` do pacote.

## Pegadinhas medidas
- **Fundo e tela limpa:** fundo chapado liso vira slide (dê profundidade, luz ou textura); nota de produção nunca vai dentro do quadro (nome de arquivo, versão, crédito de ferramenta); nada de rótulo "imagem gerada" por cima da arte.
- **Imagem só por texto = elenco trocando.** A v1 teve 6 portas, 2 porteiros, 3 cachorros e rosto mudando. Com o quadro-mestre como referência em todas, a v2 fechou um protagonista só em 29 planos.
- **HUD:** a v1 tinha 9 vocabulários visuais com brilho por cima de imagem quase parada. A v2 tem 4 peças fixas, sem brilho, glitch ou vinheta.
- **Ritmo:** de 14 para 29 cortes; plano de no máximo 3 s; 2 enquadramentos por cena.
- **"Static wide shot" no prompt do H3 congela o plano** (movimento 0,11). Plano aberto precisa de câmera e ação no prompt, ou de push-in em código com destino.
- **Nunca mandar personagem "ir até" porta ou vidro** no prompt: o porteiro atravessou o vidro. Escrever "stays behind the glass".
- **Conferir a 8 qps (394 quadros).** A tira de 1 qps e o revisor deixaram passar erros que apareceram na hora de assistir.
- **Reaproveitar clipe de outro momento quebra a continuidade:** na v2 o porteiro sentou e levantou sete vezes e a maçaneta arrancada voltou para a porta.
- **Personagem novo na fala precisa estar na tela antes, e a ameaça do final precisa estar na FALA do gancho.**
- **H3 Flash:** ~5 min por clipe na nossa máquina; ~3× mais rápido que o H3 de 20 passos; embaralha o fim de frases longas (fala 80–83%), então a voz é sempre do ElevenLabs. O clipe que sai do H3 vem COM faixa de áudio (o modelo gera som); o clipe depois do RIFE sai sem: nunca abra o clipe cru num player com som sem saber disso, e descarte esse áudio na montagem. O H3 muda enquadramento e zoom: HUD presa a objeto pede rastreio.
- **Voto longo:** 8 s de voto com clipe de 3,75 s pede câmera lenta com RIFE 2×, não congelar.
- **Corte de voz no silêncio** pode decepar uma fricativa (o S inicial): conferir cada corte. No episódio, o "Sem maçaneta" virava "Tem maçaneta" no STT; resolveu adiantar o corte 0,13 s e baixar efeitos e música só debaixo dessas duas palavras.
- **Legenda sobre fundo claro** (placa branca, céu de dia) pede tarja escura; decida no 1º quadro do plano para não piscar.
- **Download do Flow sem o editor:** trocar o sufixo de tamanho do link da grade por =s0-l100 dá o JPEG cheio (768×1376).

## Custo e tempo
- **Pago:** só a voz. Narração ~900 caracteres por tomada; o gancho sozinho, 162 caracteres; o grito do porteiro, poucos caracteres. Com 2–3 tomadas, conte ~2.000–2.500 caracteres/créditos na sua conta. Confira o preço do seu plano antes de gerar.
- **Grátis:** Flow (imagem, no plano em que medimos), H3 Flash local, RIFE, montagem e HUD.
- **Tempo:** ~5 min por clipe no Flash (23 clipes ≈ 2 h de GPU). Uma rodada de correção (7 imagens + 6 clipes refeitos) leva ~2 h. O demo roda em 20–60 s, só CPU.
- **GPU:** uma tarefa de GPU por vez. A fila só enfileira se o ComfyUI já estiver no ar; quem liga o ComfyUI desliga no fim. Não rode o RIFE com a fila andando.

## O que funcionou e o que não funcionou
- **Escolher o estilo num quadro só, com a HUD por cima, funcionou.** Entre realista, "jogo de escolhas" e ilustração + RPG, a ilustração venceu no primeiro quadro; um teste de 5 s animado confirmou antes de escrever o roteiro.
- **Misturar motion gráfico com brilho por cima de imagem inconsistente não funcionou (v1).** O defeito não era a HUD nem a imagem sozinhas: era a soma de elenco trocando com interface chamativa.
- **Reaproveitar clipes para fechar buraco não funcionou (v2 e v3).** O espectador vê na hora o porteiro voltar a dormir e o cachorro "vir do nada". Continuidade se resolve gerando o quadro certo, não na montagem.
- **Plantar a ameaça no gancho funcionou (v5).** Na v4 o cachorro chegava sem aviso e a cena final parecia de outro vídeo; regravar só a fala de abertura para citar o cachorro resolveu.
- **Defeito no plano mais longo não é ressalva, é refazer.** Num teste do estilo "jogo de escolhas", um erro no plano de maior duração derrubou a peça inteira.
- **PS1 não saiu:** em código ficou estranho e por IA não parecia PS1. Por isso a série ficou na ilustração.
- **Regras que valeram:** gerar um quadro antes de gerar muitos; aprovar por prancha numerada antes de animar; roteiro aprovado antes da voz; nada parado na tela; voz no máximo a 1,1×; com marca, só elementos do kit oficial; conferir o custo antes de qualquer geração paga.
- **Nossa nota:** a v5 fechou bem em ritmo, HUD e leitura. O ponto fraco é o movimento dentro do plano: na medição da v2, só 1 clipe passou de 2,0 (quem se mexe é o push-in em código), e a porta ainda mudava de geometria entre planos. Parte disso foi refeito depois, mas não foi medido de novo.

## Roteiro de aula
- **Objetivo:** o aluno sai sabendo manter um mundo ilustrado consistente a partir de um quadro-mestre, animar com IA sem quebrar a continuidade e pôr uma HUD limpa que conta a história.
- **Demonstração (~30 min):** (1) v1 × v5 lado a lado: contar portas, porteiros e cachorros na v1, 5 min; (2) o quadro-mestre e uma imagem nova nascendo dele no Flow, com o mapa da cena no prompt, 6 min; (3) um prompt do H3 com linha do tempo por segundo e a frase que prende o personagem no lugar, 5 min; (4) medir o movimento e a folha a 8 qps de um clipe, 4 min; (5) as 4 peças da HUD no `hud.py`, o demo e um quadro por plano, 6 min; (6) o gancho regravado para apresentar a ameaça, 4 min.
- **Exercício:** uma cena de 12 s com 4 planos do mesmo lugar e uma palavra-teste na tela, terminando em voto. Deu certo se: o personagem e a porta são os mesmos nos 4 planos, a HUD usa no máximo 4 peças sem brilho, nenhum plano passa de 3 s e a folha a 8 qps não mostra ninguém atravessando objeto. Quem não tem GPU faz o exercício com imagens paradas + push-in em código, a partir do `demo.py`.
- **Pré-requisitos:** aula do Flow (referência por imagem, download cheio); aula de ComfyUI local (H3 Flash, uma tarefa de GPU por vez, desligar no fim); aula de voz e orçamento.

## Limites conhecidos
- **Beta:** o demo cobre só HUD + montagem em código sobre imagens-placeholder. A ilustração (Flow) e a animação (ComfyUI com GPU) não rodam sozinhas no pacote; estão documentadas e com script, mas dependem das suas contas e da sua máquina.
- Só existe o EP01; não há segundo episódio para comparar.
- A etapa do Flow é manual no navegador.
- `motores/66/v2/montar_v2.py` é deste episódio (ordem dos planos, textos da HUD e tempos no código). O genérico é o `hud.py` + `demo.py`; o molde de episódio você adapta à mão.
- Não há script de geração de voz: você gera os takes na ElevenLabs e o pacote só corta e monta.
- `fila_flash.sh` foi escrito para Windows + Git Bash com o ComfyUI portátil; em Mac/Linux, use o `flash.py` direto com o ComfyUI já ligado.
- O `mix.py` é uma versão enxuta do mix do episódio (sem a entrada invertida da música nem a cauda de reverb); foi testado com sons sintéticos, não com a biblioteca original.
- Não é HyperFrames; quem quiser HUD em HTML precisa portar.
