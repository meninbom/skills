"""Voz LOCAL e grátis no lugar da chamada paga do voice.py: kokoro-onnx fala o roteiro e o faster-whisper tira o tempo
de cada palavra. Grava os mesmos arquivos de cache que o voice.py espera (voice_raw.mp3, words_raw.json e
voice_meta.json com a mesma assinatura); rodar o voice.py depois só aperta as pausas, sem chamar a API.

Rode de dentro da pasta do motor (a que tem package.json e src/episodes):
    python extras/narrado/voz_kokoro.py <slug> [voz]

Precisa de: pip install kokoro-onnx faster-whisper soundfile numpy, ffmpeg no PATH, e os dois arquivos do modelo
kokoro (kokoro-v1.0.onnx e voices-v1.0.bin, na página de releases do projeto kokoro-onnx). Diga onde eles estão
com as variáveis KOKORO_MODEL e KOKORO_VOICES, ou deixe os dois em ./modelos/. Não faz parte do demo.
"""
import hashlib, json, os, pathlib, re, subprocess, sys

import soundfile as sf

if len(sys.argv) < 2:
    raise SystemExit(__doc__)
slug = sys.argv[1]
voice = sys.argv[2] if len(sys.argv) > 2 else "am_michael"
studio = pathlib.Path.cwd()
if not (studio / "src" / "episodes").exists():
    raise SystemExit("Rode de dentro da pasta do motor (a que tem src/episodes e package.json).")
modelo = pathlib.Path(os.environ.get("KOKORO_MODEL", studio / "modelos" / "kokoro-v1.0.onnx"))
vozes = pathlib.Path(os.environ.get("KOKORO_VOICES", studio / "modelos" / "voices-v1.0.bin"))
for p in (modelo, vozes):
    if not p.exists():
        raise SystemExit(f"Não achei {p}. Baixe o modelo do kokoro-onnx e aponte KOKORO_MODEL / KOKORO_VOICES.")

from kokoro_onnx import Kokoro

ep = json.loads((studio / "src" / "episodes" / slug / "episode.json").read_text(encoding="utf-8"))
text = " ".join(b["text"].strip() for b in ep["script"])
k = Kokoro(str(modelo), str(vozes))
a, sr = k.create(text, voice=voice, speed=1.05, lang="en-us")
pub = studio / "public" / slug
pub.mkdir(parents=True, exist_ok=True)
out = studio / "out" / slug
out.mkdir(parents=True, exist_ok=True)
sf.write(out / "voice_kokoro.wav", a, sr)
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(out / "voice_kokoro.wav"), "-b:a", "192k", str(pub / "voice_raw.mp3")], check=True)
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(out / "voice_kokoro.wav"), "-ar", "16000", "-ac", "1", str(out / "v16.wav")], check=True)

from faster_whisper import WhisperModel

m = WhisperModel("small.en", device="cpu", compute_type="int8")
segs, _ = m.transcribe(sf.read(str(out / "v16.wav"), dtype="float32")[0], word_timestamps=True, language="en")
ww = [w for s in segs for w in s.words]
# a pontuação vem do roteiro (a do whisper pode diferir): alinha pela ordem das palavras
toks = re.findall(r"[\w'’]+[^\w\s'’]*", text)
words = []
for i, w in enumerate(ww):
    p = ""
    if i < len(toks):
        p = re.match(r"([\w'’]+)(.*)", toks[i]).group(2)
    words.append({"w": re.sub(r"[^\w'’]", "", w.word), "s": round(w.start, 3), "e": round(w.end, 3), "p": p})
print(len(toks), "palavras no roteiro,", len(ww), "palavras ouvidas")
(out / "words_raw.json").write_text(json.dumps(words, indent=1), encoding="utf-8")
V = {'id': 'TX3LPaxmHKxFdv7VOQHJ', 'model': 'eleven_multilingual_v2', 'settings': {'stability': 0.4, 'similarity_boost': 0.8, 'style': 0.35, 'use_speaker_boost': True}}
V.update(ep.get('voice', {}))
sig = hashlib.sha1(json.dumps([text, V], sort_keys=True).encode()).hexdigest()[:12]
(out / "voice_meta.json").write_text(json.dumps({"sig": sig, "chars": len(text), "engine": "kokoro-onnx " + voice}), encoding="utf-8")
print("caracteres", len(text), "duração", round(len(a) / sr, 2))
print(" ".join(f"{w['w']}{w['p']}@{w['s']}" for w in words))
