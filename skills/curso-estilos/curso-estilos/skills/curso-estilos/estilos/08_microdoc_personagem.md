# 08 · Micro-doc com personagem fixo (série "De onde vem?": Robot, Orange)

> Vitrine: "De onde vem?" Robot (45 s) e Orange (46 s) · Custo: só a voz (ElevenLabs, ~800 caracteres de narração por vídeo ≈ 800 créditos; emendas de frase são poucas dezenas de caracteres); imagem, vídeo e montagem R$ 0 · Ferramentas: Z-Image e H3 no ComfyUI local, Remotion, ElevenLabs, Whisper, FFmpeg

## O que é
Micro-documentário de 45 s sobre a origem de uma palavra, com um personagem fotográfico que abre e fecha o vídeo (o homem pálido do Robot) e documentos reais entrando como objetos na mesma luz. Os quadros são do Z-Image com um bloco de direção de fotografia; os planos vivos são do H3; a tipografia, os documentos, a câmera e o ritmo são código, travados nas palavras da voz. Funciona porque a imagem em si é bonita e o motion só mostra o que a voz explica, na ordem em que ela explica.

## Exemplo e arquivos
- Prévia do estilo: `catalogo/previas/08.mp4` (capa em `catalogo/previas/08.jpg`).
- Demo que roda sozinho: `motores/08/DEMO.md` (3 s com imagens-placeholder).
- Material de ensino, todo dentro do motor:
  - `motores/08/tratamento.json` (3 conceitos julgados, o vencedor e por quê; styleframes, tipografia, som)
  - `motores/08/correcoes_v3.txt` (o que subiu a nota da v2 para a v3, item por item)
  - `motores/08/projeto_robot/plano_movimento.json` (o que é H3, o que é código, e por quê Remotion)
  - `motores/08/projeto_robot/src/data/cenas.json` (o roteiro de montagem real: 23 planos, câmera, textos e papéis com tempo)
  - `motores/08/v4_aprovacao/SPEC_robot.md` (nota do diretor → o que muda, item por item), `motores/08/v4_aprovacao/REGRAS_AGENTE.md` e `motores/08/v4_aprovacao/CRITICO_FABLE.md`

## Ferramentas e instalação
- **Node 18+ e Google Chrome:** bastam para o demo e para a montagem.
- **Remotion 4.0.532:** instalado pelo `npm install` do projeto. **Licença:** grátis para pessoas e empresas pequenas; empresas maiores precisam de licença paga. Confira em remotion.dev/license antes de uso comercial. No Chrome headless com placa de vídeo o renderizador é o ANGLE (já está no `remotion.config.ts`); sem GPU, `DEMO_CPU=1` troca para o renderizador por software.
- **ComfyUI (grátis, local, pede placa de vídeo):** instale o ComfyUI na sua máquina com os modelos Z-Image Turbo e MiniMax H3. Os scripts de API estão em `motores/08/comfy/`: `zimage.py` (~11 s por imagem 1088×1920), `h3.py` (448×768, 124 quadros = 5 s, ~55 s por cena com o LoRA turbo; defina `COMFY_INPUT` com a pasta `input` do seu ComfyUI) e `upscale_clip.sh` (Real-ESRGAN; defina `REALESRGAN_DIR`). No Windows, suba o ComfyUI com `PYTHONUTF8=1` e `PYTHONIOENCODING=utf-8`.

**Neste setup, as aindas (styleframes) saem pela skill `codex-image`** (`../CODEX_IMAGE.md`), sem ComfyUI e sem placa: `python3 ~/.agents/skills/codex-image/scripts/codex_image.py "<brief>" -o assets/nome.png --aspect 9:16 --crop`. Salve em `assets/` da cópia do motor e continue a montagem. O H3 (animação em vídeo) continua opcional, só se o aluno quiser, e aí sim pede ComfyUI e GPU.
- **ElevenLabs (PAGO):** a API ou o site da ElevenLabs, com a sua chave. Este motor não traz script de voz: a voz entra como arquivo pronto (`voz/<nome>.mp3` + tempos por palavra).
- **Whisper local (grátis):** faster-whisper em CPU int8, para os tempos por palavra e para conferir a fala da mix.
- **Python 3.10+** (só para os scripts de preparo em `projeto_robot/tools/`): `pillow`, `numpy`, `opencv-python`, `rembg`, `librosa`; FFmpeg no PATH.
- **Não é HyperFrames:** esta série foi montada em Remotion. A decisão HyperFrames × Remotion é por peça.

## Motor
Em `motores/08/` (menos de 1 MB; a mídia do episódio não vem no pacote):
- `motores/08/demo.mjs` + `motores/08/package.json`: o demo de um comando (ver `motores/08/DEMO.md`).
- `motores/08/projeto_robot/`: o projeto Remotion. `src/lib/` (as peças: fonte de imagem, câmera, texto no mundo, papel com sombra dura, grão, vinheta, flash, parallax de foto), `src/Robot.tsx` (o plano e as camadas), `src/Demo.tsx` + `src/data/demo.json` (o demo), `src/data/cenas.json`, `quads.json`, `words.json` (os dados do episódio real), `tools/` (ver `tools/LEIA.md`: o que roda e o que é referência), `plano_movimento.json`, `mix_v4.json`.
- `motores/08/h3/h3_loop.py`: laço do H3 por lista de jobs (gera, amplia para 1120×1920, corta o centro 1080×1920, pula o que existe). `motores/08/h3/h3_check.py`: confere cada clipe. `motores/08/h3/h3_jobs.json`: os 15 jobs reais do Robot (prompt de câmera travada, segundos úteis, seed), com caminhos relativos.
- `motores/08/comfy/`: os scripts de API do ComfyUI (não rodam no demo).
- `motores/08/v4_aprovacao/`: o método da página de aprovação. `pagina.py` (página atual | corrigido | opção, com campo de comentário), `entrega.py`, `folhas.py`, `emendar.py` (emenda frase nova na voz, nas pausas), `SPEC_robot.md`, `itens_robot.json`, `REGRAS_AGENTE.md`, `CRITICO_FABLE.md`.

Fora do pacote: quadros, clipes do H3, LUTs, documentos reais, fontes (a Fixture é comercial), voz e trilha. As composições `Robot` e `Prev30` ficam como exemplo de roteiro de montagem; para renderizá-las você monta a sua pasta `public`.

## Passo a passo (ponta a ponta)
0. **Rode o demo** para ver o motor de pé: copie `motores/08/` para a pasta do seu projeto e, dentro dela:
   ```
   npm run demo
   ```
   Sai `saida/demo.mp4` (3 s, 540×960, mudo). Abra `projeto_robot/src/data/demo.json` e mexa num tempo ou num texto para sentir o formato.
1. **Estudo da palavra** com fontes e roteiro de ~45 s (~800 caracteres). **Portão 1: aprovar o roteiro antes de gastar com voz.** Voz (PAGA) em uma tomada, com tempos por palavra (Whisper).
2. **Três conceitos** por ângulos diferentes; escolher um e registrar o porquê num `tratamento.json` (modelo: `motores/08/tratamento.json`).
3. **Styleframes no Z-Image** com bloco de fotografia (lente, janela sempre do mesmo lado, grão). Com o ComfyUI no ar (uma tarefa de GPU por vez):
   ```
   python comfy/zimage.py --out frames --w 1088 --h 1920 --file prompts.txt
   ```
4. **Prancha + portão 2:** quadros-chave no nível final, numerados, aprovados antes de animar.
5. **H3 nos planos vivos** (um vídeo por vez na GPU; câmera travada no prompt, o movimento de câmera é do código). Monte o seu `h3_jobs.json` no formato do exemplo e rode da raiz da cópia do motor:
   ```
   python -u h3/h3_loop.py h3/h3_jobs.json
   ```
6. **Tratar os clipes:** reconformar de 24 para 30 qps (minterpolate mci) para não tremer; cobrir texto que o H3 redesenha; grão + halation + vinheta para mascarar o gerador (técnica em `projeto_robot/tools/tratar_clipes.py` e `lut.py`).
7. **Montagem no Remotion** com os tempos das palavras: ponha stills em `projeto_robot/public/stills/`, clipes em `public/clips/`, documentos em `public/docs/`, liste os clipes em `src/data/disponiveis.json` e escreva o seu `cenas.json`. Depois:
   ```
   cd projeto_robot
   npm run quadros      # um quadro parado
   npm run previa       # meia resolução, mudo
   ```
8. **Render final** com trava de render (um render pesado por vez na máquina):
   ```
   bash tools/final_v4.sh
   ```
   Sai o mestre 1080×1920 (crf 16, AAC 48 kHz) e o _celular (yuv420p, ≤ 20 MB). Adapte o nome da composição e do arquivo de mix.
9. **Rodada de notas:** quem dirige grava notas com o segundo do vídeo → um SPEC por vídeo com itens numerados → página de aprovação (atual | corrigido | opção):
   ```
   python v4_aprovacao/pagina.py robot
   ```
   Implementar só o que o SPEC pede, o resto idêntico.
10. **Crítico de contexto zerado** por vídeo (pega defeito herdado; prompt em `v4_aprovacao/CRITICO_FABLE.md`) e a skill `checar-video` do pacote antes de entregar.

## Pegadinhas medidas
- **Densidade (vale para todo explicativo):** cerca de 45 substantivos concretos por minuto, e cada um vira um objeto na tela no instante em que a palavra é dita; a tela sabe mais que a voz (nome, data, número); a família visual troca a cada 5 a 8 s; o primeiro evento visual entra até 0,4 s. O porquê de cada número está no `../OFICIO.md`.
- **Fundo e tela limpa:** fundo chapado liso vira slide (dê profundidade, luz ou textura); nota de produção nunca vai dentro do quadro (nome de arquivo, versão, crédito de ferramenta); nada de rótulo "imagem gerada" por cima da arte.
- **Menos cortes:** a v2 do Robot tinha 47 trocas de plano em 45 s; a v3 tem 23 planos, sem punch seco, com push contínuo e planos bonitos respirando 2–4 s. Foi o que subiu a nota.
- **H3 a 24 qps treme** em timeline de 30: reconformar.
- **O H3 redesenha texto** (capa de livro virou letras inventadas, moedas antigas viraram modernas): conferir e cobrir.
- **OffthreadVideo sempre dentro da Sequence da cena, com +3 quadros de folga:** sem isso aparece quadro preto no corte.
- **Placa do H3 em 1120×1920 (7:12 = 448×768):** o H3 não corta nada e a ampliação não achata; o padrão 1080×1920 achata 3,6%.
- **Crítico IA às cegas erra o gosto:** deu 5,5 num vídeo que quem dirige achou dos melhores da série. Mas pegou defeitos herdados que ninguém viu (figura derretendo aos 12–13 s, crédito tapado por um objeto).
- **Mix:** voz −16 LUFS, trilha 10–13 dB abaixo, master ≈ −13,5 LUFS, pico −1,8 dBTP, celular −19,7; fala conferida 95–99%.
- **Emenda de voz:** frase nova entra na pausa entre frases, com tomada escolhida por tom e volume medidos contra o vizinho. As emendas da v4 ficaram a 1,2× para casar; hoje a regra é no máximo 1,1× (voz acelerada soa falsa).
- **Quadros JPEG no Remotion dão yuvj420p** (faixa cheia), que alguns celulares não abrem: renderize com `--image-format=png` (o demo faz) ou converta na versão de celular com `-pix_fmt yuv420p`, e confira com ffprobe antes de mandar.
- **Celular:** grão renovado a cada quadro faz CRF 23 puro dar 54 MB; com teto de taxa de 3,8 Mbps cai para 19 MB sem tirar o grão.
- **Crítica completa custa caro em uso de IA:** 7 vídeos com crítica completa estouraram o limite semanal do plano no meio da produção. Fazer por lotes.
- **Não cortar o último quadro:** sem -shortest no mestre; o último quadro é o quadro 0 do loop.

## Custo e tempo
- **Pago:** só a voz. ~1 crédito por caractere na ElevenLabs: um roteiro de 45 s tem ~800 caracteres; cada emenda de frase, 40–80. Conte os caracteres do seu roteiro antes de gerar.
- **Grátis:** Z-Image, H3, Whisper; Remotion dentro da licença gratuita (remotion.dev/license).
- **Tempo:** Z-Image ~11 s por quadro; H3 turbo ~55 s por cena de 5 s + ~40 s de ampliação; H3 de 20 passos em 768×1344 ~15 min por plano.
- **GPU:** uma tarefa de GPU por vez; quem sobe o ComfyUI desliga no fim. Render do Remotion e ComfyUI não rodam juntos (a trava de render do `final_v4.sh` cuida disso entre renders).

## O que funcionou e o que não funcionou
- **Funcionou:** um personagem reconhecível que abre e fecha o vídeo (o último quadro é o primeiro: loop); a imagem bonita por si (luz de janela dura, sempre do mesmo lado); o documento entrando como objeto na mesma luz, não como cartão sobre fundo cinza; a abertura com a palavra atrás da cabeça do personagem.
- **Funcionou:** menos planos, cada um respirando. Cortar pela metade o número de trocas foi a mudança que mais subiu a nota.
- **Não funcionou:** repetir em toda cena um recurso que foi elogiado numa (a moldura de geada virou enfeite sem sentido). O elogiado fica só onde nasceu.
- **Não funcionou:** câmera que sobe e desce sem destino; lupas, carimbos e calendário decorativos que a voz não pede; letra gigante sem ligação com a fala; grito gerado por IA (soa errado). Todo movimento leva o olho aonde a próxima coisa vai acontecer.
- **Não funcionou:** três dos sete temas da série não fecharam mesmo com a receita inteira (gancho fraco, conceito sem imagem). A receita não salva conceito ruim: vale desistir cedo.
- **Regras que ficaram:** mostrar só o que a voz explica, na ordem da fala (informação "jogada" se resolve ligando o dado à palavra, não tirando); uma coisa nova por vez; nenhum crédito ou selo na tela além de 1 linha discreta em documento real; SFX pequeno, literal e real, ~20 dB abaixo da voz; música sempre abaixo da voz; datas por extenso para quem assiste sem som; século em algarismo arábico ("séc. 16"); nas correções, mudança mínima: mexer só no detalhe apontado.
- **Nossa nota:** Robot e Orange são os melhores da série (a abertura do Robot é o ponto alto); o método é caro em tempo por vídeo e não garante o tema.

## Roteiro de aula
- **Objetivo:** o aluno sai sabendo montar um micro-doc em que um personagem gerado segura o vídeo, o documento entra como objeto na mesma luz e cada elemento da tela obedece a uma palavra da voz.
- **Demonstração (~30 min):** (1) rodar o demo e abrir o `demo.json`, 4 min; (2) Robot v2 × v3: 47 cortes contra 23 planos (`correcoes_v3.txt`), 4 min; (3) o tratamento com 3 conceitos e a escolha, 4 min; (4) styleframe no Z-Image com bloco de fotografia, 5 min; (5) um job do H3 com câmera travada e o tratamento do clipe (30 qps, grão, cobrir texto), 5 min; (6) no Remotion, um texto amarrado à palavra, 4 min; (7) a página de aprovação e um item do SPEC, 4 min.
- **Exercício:** um micro-doc de 20 s sobre a origem de uma palavra, com 1 personagem que abre e fecha e 1 documento. Deu certo se: o personagem é reconhecível nos dois planos, todo texto da tela foi dito pela voz, não há mais de 10 planos e a data aparece por extenso.
- **Pré-requisitos:** aula de ComfyUI local; aula de voz e tempos por palavra; básico de Remotion (ou de HyperFrames, adaptando a montagem).

## Limites conhecidos
- O demo cobre só a montagem em código, com imagens-placeholder. A geração (Z-Image, H3) fica documentada e depende de ComfyUI com placa de vídeo; não foi testada no pacote.
- As composições do episódio real (`Robot`, `Prev30`) não renderizam sem a mídia original, que não vem no pacote. Os scripts de `projeto_robot/tools/` marcados como referência precisam de adaptação de caminhos.
- A montagem é em Remotion, não em HyperFrames; não existe versão HyperFrames desta série.
- O personagem fixo é mantido por prompt e seed no Z-Image (sem referência de imagem); em cenas muito diferentes o rosto varia. Para personagem fixo de verdade, a rota com ficha (o estilo 06, que fica no plugin `serie-lumen` deste pacote) é mais segura.
- A receita não garante o conceito: três de sete temas não fecharam.
- Fontes e trilha da peça original são comerciais: use as suas.
- Licenças: Remotion é pago para empresas maiores (remotion.dev/license); confira também os termos do modelo de vídeo que você usar antes de trabalho comercial.
