# 29 · Checagem objetiva do vídeo

> Vitrine: o QA que roda em toda entrega nossa · Custo: grátis · Ferramentas: Python, FFmpeg, OpenCV, RapidOCR, faster-whisper

## O que é
Um script que mede o vídeo renderizado e devolve passou/falhou, sem nenhum modelo "olhando" quadro a quadro. Pega parado, quadro repetido, flash, texto cortado ou na faixa da UI, formato de pixel, volume, pico, som no celular e fala × roteiro. Funciona porque separa o que é medida (programa) do que é gosto (você).

O motor deste estilo é a skill irmã `checar-video`, que vem no mesmo pacote (pasta `skills/checar-video/`, ao lado de `skills/curso-estilos/`). No Claude Code ela atende por `/checar-video`.

## Exemplo e arquivos
- Prévia do catálogo: `catalogo/previas/29.jpg` (este estilo é uma ferramenta; a "saída" é um relatório, não um vídeo)
- A skill: `../checar-video/SKILL.md`
- Script: `../checar-video/scripts/checar.py`
- Presets: `../checar-video/presets/generico.json` (sem paleta), `../checar-video/presets/com_fotos.json` (peça com foto real) e `../checar-video/presets/identidade_exemplo.json` (exemplo de identidade fechada: branco, tinta, acento, HUD no topo)
- Demo: `../checar-video/DEMO.md`
- Uso dentro de um laço automático: `estilos/28_ciclo_conferencia.md`

## Ferramentas e instalação
Tudo local e grátis:
```bash
pip install -r requirements.txt     # na pasta da skill checar-video: numpy, opencv-python, rapidocr-onnxruntime, faster-whisper
```
FFmpeg e ffprobe no PATH. O faster-whisper baixa o modelo small (~460 MB) na 1ª vez que a fala é checada. Se o pip reclamar de certificado atrás de proxy ou antivírus, instale com `pip install truststore` e `python -m pip --use-feature=truststore install ...`.

## Motor
Não há pasta `motores/29/`: o motor é a própria skill `checar-video` (um script de ~24 KB + 3 presets + `requirements.txt`). Uma cópia aqui criaria duas versões.

## Passo a passo (ponta a ponta)
1. **Rodar o demo** (na pasta `skills/checar-video/`):
   ```bash
   pip install -r requirements.txt
   python scripts/checar.py ../curso-estilos/catalogo/previas/04.mp4 --config presets/generico.json --sem-stt --out saida/04_qa
   ```
   Sai `saida/04_qa/QA.md`. A prévia FALHA em "Celular" (−20,7 LUFS) e leva aviso de formato (480×854): é o esperado, ela é um arquivo de vitrine.
2. **No seu render:**
   ```bash
   python scripts/checar.py VIDEO.mp4 --config presets/generico.json --roteiro ROTEIRO.txt
   ```
   Opções: `--out pasta`, `--fps-amostra 2`, `--sem-ocr`, `--sem-stt`, `--lingua pt`.
3. Ler o QA.md na pasta de saída (nome do vídeo + `_qa`) e olhar só a `suspeitos.png` (até 24 quadros com tempo e motivo). Código de saída 1 = alguma checagem falhou. Aviso não bloqueia.
4. Corrigir o que falhou e rodar de novo.
5. Se o QA acusar `yuvj420p` no formato de pixel:
   ```bash
   ffmpeg -i VIDEO.mp4 -vf "scale=in_range=full:out_range=tv,format=yuv420p" -c:v libx264 -crf 16 -pix_fmt yuv420p -profile:v high -c:a copy VIDEO_ok.mp4
   ```
6. Gerar a versão leve para mandar por mensagem (o script não faz):
   ```bash
   ffmpeg -i VIDEO.mp4 -c:v libx264 -profile:v main -level 3.1 -pix_fmt yuv420p -vf scale=720:-2 -crf 24 -c:a aac -b:a 128k -ar 48000 -ac 2 -movflags +faststart VIDEO_celular.mp4
   ```
7. Som no celular: o script mede o volume da versão simulada (highpass 300 Hz + lowpass 8 kHz, mono). Regra de bolso além disso: o RMS da versão simulada não pode cair mais de ~6 dB contra o original.
8. Mostrar a versão `_celular` para aprovação; o 1080p é a entrega para postar.

## Pegadinhas medidas
- **`yuvj420p` não abre em alguns celulares.** Sai do render JPEG → ffmpeg; `-c:v copy` na mixagem mantém o defeito. Nunca copie direto do mudo do motor sem conferir.
- **1080p de 13–17 MB em H.264 High às vezes não toca dentro de app de mensagem.** A versão `_celular` fica com 3,5–5 MB.
- **Som "sem som" no celular:** trilha sintetizada em 55–110 Hz some no alto-falante. Energia principal entre 200 Hz e 4 kHz.
- **Limites que reprovam:** parado > 1,5 s; flashes > 3/s; texto cortado na borda; palavra quebrada com hífen; `yuvj420p`; áudio fora de AAC 48 kHz (96 kHz deixa o app mudo); volume fora de −14 ±1 LUFS; pico acima de −1 dBTP; celular abaixo de −20 LUFS; fala × roteiro abaixo de 90%.
- **Avisos:** texto < 52 px num quadro de 1080; texto nos 15% de baixo (UI do Instagram); herói < 40% da largura; acento fora de 2–6%; silêncio > 0,6 s; engasgo; resolução fora das padrão.
- **Impact frame estoura o limite de flash:** uma peça com impact frame falhou com "Flashes 4/s" (claro → tinta → papel → cena). Ver `estilos/impact_impact_frame.md`.
- **Vídeo mudo:** as linhas de volume, pico e celular não entram; fica o aviso "sem faixa de áudio". Vídeo com faixa de áudio em silêncio falha nas três: registre nas notas da peça e siga.
- **Grão engana a medida de parado.** O ciclo do estilo 28 usa uma medida própria à prova de grão (ver `estilos/28_ciclo_conferencia.md`).
- Tempo: ~1 min para um Reel de 25 s com OCR + STT; `--sem-stt` corta ~30 s. O OCR é a parte lenta.

## Custo e tempo
Grátis, CPU, ~1 min por Reel. Sem GPU.

## O que funcionou e o que não funcionou
- Funcionou: rodar em TODA entrega. O que é mensurável deixa de depender de alguém lembrar de olhar.
- Calibração: um episódio aprovado passou com 0 falhas e 98% de fala × roteiro. Três animatics que ninguém entendeu passaram nas falhas e só acenderam aviso de herói pequeno (16%, 34%, 38%). **O script não pega "a ideia não se entende": isso é portão humano.**
- Não funcionou: mandar o 1080p pesado por mensagem (não abriu no celular) e entregar `yuvj420p` (idem). Daí os passos 5 e 6.
- Não funcionou: grave sintetizado como trilha. No celular, "tá tudo sem som". Daí a linha "Celular" do QA.
- Ordem que funcionou: corrigir → versão leve para aprovação → ok → só então subir o arquivo final para onde ele vai ficar.
- Nossa nota: é um detector de defeito, não de qualidade. Vídeo ruim passa; vídeo com defeito técnico não.

## Roteiro de aula
- **Objetivo:** o aluno sai sabendo passar qualquer vídeo por uma checagem objetiva antes de mostrar a alguém, e sabe o que ela não julga.
- **Demonstração (~10 min):**
  1. Rodar o demo na prévia 04 e abrir o QA.md: ler a falha de "Celular" (2 min).
  2. Rodar num vídeo com defeito plantado (legenda na faixa da UI, 2 s parado) e abrir a suspeitos.png (3 min).
  3. A linha "Formato de pixel" e a conversão de `yuvj420p` (2 min).
  4. Gerar o `_celular` e comparar tamanho (1 min).
  5. Mostrar a calibração: animatic ruim que "passou" (2 min).
- **Exercício:** rodar no último vídeo do aluno, corrigir 1 falha e rodar de novo. Deu certo se: código de saída 0, formato de pixel `yuv420p` e `_celular` abaixo de 10 MB.
- **Pré-requisitos:** nenhum. É a 1ª aula de ferramentas.

## Limites conhecidos
- A versão `_celular` e a comparação de RMS da simulação de alto-falante não estão dentro do script; são passos manuais.
- O OCR estima a fonte pela altura da caixa; letra muito estilizada escapa.
- "Herói" é heurística (maior objeto cheio que não é fundo): em cena cheia a medida não vale e a linha sai como "não medido: cenário cheio" (confira no olho); grupo de objetos pequenos lê como herói pequeno.
- Os alvos de formato são de Reel/vídeo padrão (1080×1920, 1920×1080, 1080×1350, 1080×1080); outra resolução só leva aviso.
- O STT é o faster-whisper small em CPU: nome próprio e palavra inventada derrubam a porcentagem sem ser defeito de mix.
- A prévia do catálogo é só imagem.
