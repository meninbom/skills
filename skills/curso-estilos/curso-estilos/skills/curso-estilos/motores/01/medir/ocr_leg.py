# Lê os tempos da legenda de uma referência por OCR. Antes, extraia 4 quadros por segundo da faixa da legenda para ref/leg/:
#   ffmpeg -i REFERENCIA.mp4 -vf "fps=4,crop=iw:ih*0.2:0:ih*0.55" ref/leg/%04d.png
# uso: python ocr_leg.py   (pip install rapidocr-onnxruntime) -> ref/legendas_ocr.json
import os, json, sys
from rapidocr_onnxruntime import RapidOCR
o = RapidOCR(); d = 'ref/leg'; res = []
for i, f in enumerate(sorted(os.listdir(d))):
    r, _ = o(os.path.join(d, f)); t = ' '.join(x[1] for x in (r or []) if x[2] > 0.6)
    res.append([round(i / 4, 2), t])
segs = []
for t, s in res:
    if segs and segs[-1][2] == s: segs[-1][1] = t + 0.25
    else: segs.append([t, t + 0.25, s])
segs = [x for x in segs if x[2].strip()]
json.dump(segs, open('ref/legendas_ocr.json', 'w', encoding='utf8'), ensure_ascii=False, indent=0)
for a, b, s in segs: print(f'{a:6.2f} {b:6.2f} {s}')
