# Extras: voz, tempo das palavras e checagem

Nada aqui faz parte do demo. O curta de exemplo sai mudo; a trilha de música e efeitos sai de `python audio/balao_mix.py` (precisa de `numpy` e `scipy`), também sem voz.

Neste estilo **a voz vem primeiro**: cada plano, cada reação e cada efeito sonoro é marcado pelo instante em que uma palavra começa. O caminho é: texto → voz → `words.json` → `story.ts`.

| Arquivo | O que faz | Gasta? |
|---|---|---|
| `tts_onecore.ps1` | Voz de rascunho com a voz de leitura do Windows (só Windows). Serve para **cronometrar**, não para postar: é robótica. | Não |
| `voz_prep.py` | Recebe um WAV de voz (a sua gravação, a de rascunho ou a de um serviço), transcreve no seu PC com o faster-whisper, encurta as pausas longas (teto de 0,22 s) e grava `voice.wav` (48 kHz) e `words.json` (`[{"w","s","e"}]`). | Não |
| `short_qa.py` | Checagem quadro a quadro do vídeo pronto: quadro preto, branco, congelado, salto de imagem, volume. | Não |

## Passo a passo da voz

```bash
# 1. rascunho (Windows). O texto fica em audio/voice/texto.txt, uma frase por linha
powershell -File extras/tts_onecore.ps1 -Texto audio/voice/texto.txt -Saida audio/voice/bruto.wav -Voz Daniel -Rate 1.1

# 2. tempo das palavras (qualquer sistema). Baixa o modelo "small" do whisper na primeira vez (~500 MB)
pip install faster-whisper numpy
python extras/voz_prep.py audio/voice/bruto.wav audio/voice

# 3. trilha com a voz
pip install scipy
python audio/balao_mix.py          # audio/mix.wav, cerca de -14,5 LUFS
```

Sem Windows, grave a sua voz no celular lendo o texto e comece do passo 2.

- O whisper erra a grafia de nomes ("Versalhes" virou "Versales" no `words.json` do exemplo). O tempo está certo, que é o que importa aqui.
- O `voz_prep.py` está com `language="pt"`. Para outro idioma, troque na linha do `transcribe`.
- Trocou a voz, mudou o tempo das palavras: os quadros de `story.ts` precisam ser reescritos a partir do `words.json` novo.

## Voz para postar

A voz de rascunho não serve para publicar. As opções são gravar a sua ou usar um serviço de voz com a **sua** conta. Voz paga só depois de estimar o custo: o texto do exemplo tem 373 caracteres para 27 s; um curta de 60 s fica perto de 850. Confira a tabela atual do serviço e quanto o seu plano ainda cobre antes de gerar, e gere uma vez só. Nunca escreva a chave de API num arquivo do projeto.

## Juntar vídeo e som

```bash
ffmpeg -y -i saida/filme.mp4 -i audio/mix.wav -map 0:v:0 -map 1:a:0 -c:v copy -c:a aac -b:a 192k -ar 48000 -shortest -movflags +faststart NOME_1080.mp4
```
