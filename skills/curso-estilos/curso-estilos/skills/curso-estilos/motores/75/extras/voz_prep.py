"""Prepara a voz para o pipeline cartoon-3d-short: transcreve (faster-whisper local, palavras), encurta pausas longas
(teto GAP s, a referência quase não tem pausas), reamostra para 48 kHz estéreo e grava voice.wav + words.json no formato
do timeline.py deles ([{"w","s","e"}]).  uso: python voz_prep.py raw.wav pasta_saida [gap_max]"""
import sys, os, json, subprocess
import numpy as np
from faster_whisper import WhisperModel

raw, out = sys.argv[1], sys.argv[2]
GAP = float(sys.argv[3]) if len(sys.argv) > 3 else 0.22
SR = 48000
x = np.frombuffer(subprocess.run(["ffmpeg", "-v", "error", "-i", raw, "-ac", "1", "-ar", str(SR), "-f", "f32le", "-"], capture_output=True).stdout, np.float32)

def words_of(path):
    m = WhisperModel("small", device="cpu", compute_type="int8")
    a16 = np.frombuffer(subprocess.run(["ffmpeg", "-v", "error", "-i", path, "-ac", "1", "-ar", "16000", "-f", "f32le", "-"], capture_output=True).stdout, np.float32)
    segs, _ = m.transcribe(a16, language="pt", word_timestamps=True, vad_filter=False)
    return [{"w": w.word.strip(), "s": float(w.start), "e": float(w.end)} for s in segs for w in s.words]

W = words_of(raw)
# cortes: em cada vão entre palavras maior que GAP, deixa só GAP (meio antes, meio depois)
keep, t0, shift, out_words = [], 0.0, 0.0, []
lead = max(0.0, W[0]["s"] - 0.08)
cur = lead
for i, w in enumerate(W):
    if i > 0:
        gap = w["s"] - W[i - 1]["e"]
        if gap > GAP:
            a = W[i - 1]["e"] + GAP / 2; b = w["s"] - GAP / 2
            keep.append((cur, a)); shift += b - a; cur = b
    out_words.append({"w": w["w"], "s": round(w["s"] - lead - shift, 3), "e": round(w["e"] - lead - shift, 3)})
end = min(len(x) / SR, W[-1]["e"] + 0.25)
keep.append((cur, end))
y = np.concatenate([x[int(a * SR):int(b * SR)] for a, b in keep])
# micro-fades nas emendas já ficam em silêncio; normaliza pico a -3 dBFS
y = y / (np.abs(y).max() + 1e-9) * 10 ** (-3 / 20)
os.makedirs(out, exist_ok=True)
st = np.stack([y, y], 1)
import wave
with wave.open(os.path.join(out, "voice.wav"), "wb") as f:
    f.setnchannels(2); f.setsampwidth(2); f.setframerate(SR)
    f.writeframes((np.clip(st, -1, 1) * 32767).astype("<i2").tobytes())
json.dump(out_words, open(os.path.join(out, "words.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=0)
print(f"bruto {len(x)/SR:.2f}s -> {len(y)/SR:.2f}s, {len(out_words)} palavras")
for w in out_words: print(f'{w["s"]:6.2f} {w["e"]:6.2f} {w["w"]}')
