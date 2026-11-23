# Demo · checar-video

**Precisa de:** Python 3.9+, FFmpeg/ffprobe no PATH. Só CPU.

Na pasta desta skill (com a skill `curso-estilos` ao lado, como vem no pacote):

```
pip install -r requirements.txt
python scripts/checar.py ../curso-estilos/catalogo/previas/04.mp4 --config presets/generico.json --sem-stt --out saida/04_qa
```

**O que sai** (aqui a saída é um relatório, não um vídeo): `saida/04_qa/QA.md` (a tabela passou/aviso/falhou) e `saida/04_qa/qa.json` (tudo medido). Quando há quadro suspeito, sai também `suspeitos.png`; nesta prévia não há.

**Resultado esperado para essa prévia:** FALHOU com 1 falha e 1 aviso, e o script sai com código 1. É o comportamento certo: a prévia do catálogo é um arquivo pequeno de vitrine, não uma entrega.
- Falha: "Celular (300 Hz–8 kHz)" mede −20,7 LUFS (o alvo é ≥ −20): a trilha tem grave demais para alto-falante de celular.
- Aviso: "Formato" 480×854 (o alvo de Reel é 1080×1920).
- O resto passa: parado 1,3 s, 0 flashes, 0 texto cortado, volume −13,4 LUFS, pico −2,0 dBTP.

**Tempo:** 1–2 min (o OCR é a parte lenta; `--sem-ocr` pula essa parte).

**Com fala × roteiro:** tire o `--sem-stt` e passe `--roteiro ROTEIRO.txt`. Na 1ª vez o faster-whisper baixa o modelo small (~460 MB).

**Sem instalar OCR nem STT:** `--sem-ocr --sem-stt` roda só com `numpy` e `opencv-python`.
