---
name: checar-video
description: "Checagem objetiva e grátis de um vídeo renderizado (Reel, aula, motion), sem LLM olhando quadro a quadro. Use em TODO render antes de mostrar a alguém, ou quando o usuário pedir \"checa esse vídeo\", \"QA\", \"tá tudo certo tecnicamente?\". Mede o que dá para medir por código (parado, quadro repetido, flash, texto pequeno/cortado/quebrado, zona da UI, paleta, tamanho do herói, formato de pixel, volume, celular, pico, silêncio, fala × roteiro) e devolve passou/falhou + uma folha só com os quadros suspeitos. Não julga ideia, gosto nem som. Isso é de quem assina a peça."
---

Responda sempre em português do Brasil, em linguagem simples, como para quem está começando.

# checar-video

A ideia: **separar as checagens repetitivas, feitas por código, do trabalho criativo**. O agente não gasta tempo olhando centenas de quadros. Ele roda o script, lê o `QA.md` e olha só a `suspeitos.png`. A pessoa revisa ideia, ritmo e som.

Os caminhos abaixo são relativos à pasta desta skill (onde está este SKILL.md).

## Instalar (uma vez)
```bash
pip install -r requirements.txt
```
Recomendado: instalar num ambiente virtual do Python, para não misturar com as bibliotecas do sistema. Na pasta do projeto: `python -m venv .venv`, ative (`.venv\Scripts\activate` no Windows; `source .venv/bin/activate` no Mac/Linux) e só então rode o `pip install`. Nas próximas vezes, ative o mesmo ambiente antes de checar.

FFmpeg e ffprobe no PATH. O `faster-whisper` baixa o modelo small (~460 MB) na 1ª vez que a fala é checada. Com `--sem-ocr --sem-stt` bastam `numpy` e `opencv-python`.

## Rodar
```bash
python scripts/checar.py VIDEO.mp4 \
  --config presets/generico.json \
  --roteiro ROTEIRO.txt          # texto da locução (opcional; compara com o STT do áudio final)
  [--out pasta] [--fps-amostra 2] [--sem-ocr] [--sem-stt] [--lingua pt] [--mudo]
```
- Saída em `VIDEO_qa/` (ou `--out`): `QA.md` (tabela), `qa.json` (tudo medido) e `suspeitos.png` (até 24 quadros com tempo + motivo).
- Código de saída 1 se alguma checagem **falhou**. Aviso não bloqueia.
- Tempo: ~1 min para um Reel de 25 s com OCR + STT. `--sem-stt` corta ~30 s.
- Tudo local e grátis: ffmpeg, OpenCV, RapidOCR (onnx) e faster-whisper small.
- Teste rápido: `DEMO.md`.

## O que mede
| Checagem | Falha / aviso | Por quê |
|---|---|---|
| Formato de pixel | falha se `yuvj420p`; aviso se outro que não `yuv420p` | `yuvj420p` não abre em alguns celulares |
| Áudio AAC 48 kHz | falha se não for | 96 kHz deixa o app mudo |
| Maior tempo parado | falha > 1,5 s | nada vivo por mais de ~1,5 s perde o espectador. Medido por bloco 16×16, ignorando a faixa do HUD/topo |
| Engasgo (1 quadro repetido no meio de movimento contínuo) | aviso | Typewriter e trocas discretas não contam |
| Quadro vazio, flashes > 3/s | aviso / falha | acessibilidade e corte acidental |
| Texto pequeno (fonte < 52 px num quadro de 1080) | aviso | nada minúsculo para ler em 1 s. HUD decorativo pode ficar |
| Texto na borda (cortado) | falha | detalhe quebrado |
| Texto na zona da UI (15% de baixo no 9:16) | aviso | a UI do Instagram cobre |
| Palavra quebrada com hífen | falha | "CHECA-GEM" |
| Fora da paleta / área do acento | aviso | 1 fundo + 1 tinta + 1 acento; acento de 2–6% |
| Tamanho do herói (heurística) | aviso < 40% da largura | um herói por tela, grande (60–85%) |
| Volume, pico real, celular | falha | −14 ±1 LUFS; ≤ −1 dBTP; celular (300 Hz–8 kHz, mono) ≥ −20 LUFS |
| Silêncio no meio > 0,6 s | aviso | silêncio só de propósito |
| Fala × roteiro (STT local do áudio FINAL) | falha < 90% | música alta come palavra |

## Presets (`presets/`)
- `generico.json`: sem paleta; serve para qualquer vídeo.
- `com_fotos.json`: peça com foto real (pula a paleta; HUD mais alto; texto mínimo de 40 px).
- `identidade_exemplo.json`: exemplo de identidade fechada (branco, tinta #121211, acento #ED3821, HUD no topo).

Crie um preset por identidade sua. Todas as chaves e os padrões estão no topo de `scripts/checar.py` (`PADRAO`).

## Calibração
- Um episódio aprovado de uma série nossa: **PASSOU**, 0 falhas; STT × roteiro em 98%.
- Três animatics que quem assistiu não entendeu: passaram nas falhas, mas acenderam aviso de **herói pequeno** (16%, 34%, 38%) e de acento quase sumido (0,4%).
- **A lição:** o script pega defeito objetivo e alguns sinais de clareza, mas **não** pega "a ideia não se entende". Isso continua sendo o portão humano.

## Limites
- O OCR estima a fonte pela altura da caixa (×0,7). Letra muito estilizada pode escapar.
- "Herói" é o maior objeto cheio que não é fundo. Grupos de objetos pequenos leem como herói pequeno. É aviso, não falha. Em cenário cheio (fundo que não é liso, ou close que vai de um lado ao outro do quadro) não dá para separar o personagem: a linha sai como "não medido: cenário cheio" e o tamanho se confere no olho.
- O "parado" é enganado por grão: grão muda a cada quadro e o plano parece vivo. Para peça com grão, use a medida do ciclo (`curso-estilos`, estilo 28).
- Vídeo mudo: as linhas de volume, pico e celular não aparecem; fica só o aviso "sem faixa de áudio". Se a entrega é muda de propósito, passe `--mudo` e a linha vira ok.
- Não mede motion blur com fantasma, coreografia, gosto nem qualidade de som.
