# intro (narr_I) + corpo (narr_A) -> voz/narr_full_-16.wav + voz/narr_full.display.words.json (palavras do corpo deslocadas)
# python ep_bau/junta_voz.py [I]
import json, sys
from pathlib import Path
import numpy as np, soundfile as sf

V = Path(__file__).resolve().parent / "voz"
TK = sys.argv[1] if len(sys.argv) > 1 else "I"
G = 0.8  # silêncio entre a intro e o corpo, em segundos
i, sr = sf.read(V / f"narr_{TK}_-16.wav"); a, sr2 = sf.read(V / "narr_A_-16.wav"); assert sr == sr2
wi = json.load(open(V / f"narr_{TK}.display.words.json", encoding="utf8")); wa = json.load(open(V / "narr_A.display.words.json", encoding="utf8"))
fim_i = wi[-1]["end"] + 0.12
cut = int(fim_i * sr); off = fim_i + G
full = np.concatenate([i[:cut], np.zeros(int(G * sr)), a])
sf.write(V / "narr_full_-16.wav", full, sr)
w = wi + [{**x, "start": round(x["start"] + off, 3), "end": round(x["end"] + off, 3)} for x in wa]
json.dump(w, open(V / "narr_full.display.words.json", "w", encoding="utf8"), ensure_ascii=False, indent=0)
print("intro", round(fim_i, 2), "s; total", round(len(full) / sr, 2), "s; deslocamento", round(off, 2))
print("confira agora que cada T() do ep.mjs cai DEPOIS do início da cena dele (node ep_bau/prints.mjs)")
