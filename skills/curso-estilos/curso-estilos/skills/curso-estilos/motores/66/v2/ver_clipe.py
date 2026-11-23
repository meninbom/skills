"""Folha de um clipe a 8 qps: ver o movimento DENTRO do plano e conferir continuidade (1 qps deixa erro passar).
uso: python ver_clipe.py clipes/J1.mp4 [mais...]  ->  _tiras/clipe_J1.jpg     (serve também para o vídeo final inteiro)"""
import sys, subprocess, numpy as np, os
from PIL import Image, ImageDraw, ImageFont
AQUI = os.path.dirname(os.path.abspath(__file__))
FPS = 8; W, H = 160, 280; COLS = 10
f = ImageFont.truetype(os.path.join(AQUI, '..', 'fontes', 'BarlowCondensed-Bold.ttf'), 18)
os.makedirs('_tiras', exist_ok=True)
for src in sys.argv[1:]:
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', src, '-vf', f'fps={FPS},scale={W}:{H}', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'], capture_output=True).stdout
    fr = np.frombuffer(raw, np.uint8).reshape(-1, H, W, 3)
    rows = (len(fr) + COLS - 1) // COLS
    sh = Image.new('RGB', (COLS * W, rows * H)); d = ImageDraw.Draw(sh)
    for i, x in enumerate(fr):
        sh.paste(Image.fromarray(x), ((i % COLS) * W, (i // COLS) * H))
        d.text(((i % COLS) * W + 3, (i // COLS) * H + H - 22), f'{i / FPS:.2f}', fill=(255, 255, 0), font=f)
    out = os.path.join('_tiras', 'clipe_' + os.path.splitext(os.path.basename(src))[0] + '.jpg')
    sh.save(out, quality=85); print(out, len(fr))
