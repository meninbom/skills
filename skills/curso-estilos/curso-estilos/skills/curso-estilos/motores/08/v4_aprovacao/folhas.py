"""Folhas de conferência a 2 fps (32 quadros por folha, 8 colunas, 270 px) para o crítico. uso: python folhas.py video.mp4 pasta_saida"""
import subprocess, sys, glob, os
from PIL import Image, ImageDraw, ImageFont
v, out = sys.argv[1], sys.argv[2]
os.makedirs(out + '/q', exist_ok=True)
for f in glob.glob(out + '/q/*.jpg'): os.remove(f)
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', v, '-vf', 'fps=2,scale=270:-1', out + '/q/q%03d.jpg'], check=True)
fs = sorted(glob.glob(out + '/q/q*.jpg')); fo = ImageFont.truetype('arial.ttf', 18)
per, cols = 32, 8
for p in range(0, len(fs), per):
    part = fs[p:p + per]; w, h = 270, 480; rows = (len(part) + cols - 1) // cols
    S = Image.new('RGB', (cols * w, rows * (h + 22)), 'white'); d = ImageDraw.Draw(S)
    for i, q in enumerate(part):
        x = (i % cols) * w; y = (i // cols) * (h + 22); S.paste(Image.open(q).resize((w, h)), (x, y + 22)); d.text((x + 4, y + 2), f'{(p + i) / 2:.1f}s', fill='black', font=fo)
    S.save(f'{out}/folha_{p // per + 1}.jpg', quality=82)
print(len(fs), 'quadros')
