# Monta o catálogo: vídeo-mosaico numerado (cada efeito em loop, 30 qps) + folha PNG do pico de cada um.
# Precisa de Pillow (pip install pillow) e FFmpeg.
# Uso: python folha.py            → catalogo.mp4/.png/.json (efeitos dos samples)
#      python folha.py extras     → catalogo_extras.mp4/.png/.json (efeitos X_*, numerados a partir de 101)
import os, glob, subprocess, json, sys
from PIL import Image, ImageDraw, ImageFont, ImageStat
AQUI = os.path.dirname(os.path.dirname(os.path.abspath(__file__))); Q = os.path.join(AQUI, 'quadros')   # grava o catálogo na pasta do motor
EXTRAS = len(sys.argv) > 1 and sys.argv[1] == 'extras'
efs = sorted(d for d in os.listdir(Q) if glob.glob(os.path.join(Q, d, 'f*.jpg')) and d.startswith('X_') == EXTRAS)
N0 = 100 if EXTRAS else 0; SUF = '_extras' if EXTRAS else ''
CW, CH, COL = (135, 240, 16) if EXTRAS else (180, 320, 10)
LOOP = 90   # quadros do mosaico (3 s)
def _fonte(tam):
    for nome in ('arialbd.ttf', 'Arial Bold.ttf', 'DejaVuSans-Bold.ttf'):
        try: return ImageFont.truetype(nome, tam)
        except OSError: pass
    return ImageFont.load_default()
fonte = _fonte(22); fonte_p = _fonte(14)
info = []
cache = {}
for i, e in enumerate(efs):
    fs = sorted(glob.glob(os.path.join(Q, e, 'f*.jpg')))
    ims = [Image.open(f).convert('RGB').resize((CW, CH), Image.BILINEAR) for f in fs]
    br = [ImageStat.Stat(im).mean for im in ims]; br = [sum(b) for b in br]
    pico = max(range(len(ims)), key=lambda k: br[k])
    cache[e] = (ims, pico)
    info.append(dict(n=N0 + i + 1, nome=e, quadros=len(fs), seg=round(len(fs) / 30, 1), pico=pico, vazio=max(br) < 3))
rows = (len(efs) + COL - 1) // COL
def placa(k):
    G = Image.new('RGB', (CW * COL, CH * rows), (0, 0, 0)); d = ImageDraw.Draw(G)
    for i, e in enumerate(efs):
        ims, pico = cache[e]; im = ims[pico] if k is None else ims[k % len(ims)]
        x, y = (i % COL) * CW, (i // COL) * CH; G.paste(im, (x, y))
        d.rectangle([x, y, x + CW - 1, y + CH - 1], outline=(40, 40, 40))
        d.text((x + 6, y + 4), str(N0 + i + 1), font=fonte, fill=(255, 220, 60))
        d.text((x + 6, y + CH - 20), e.split('__')[-1][:18], font=fonte_p, fill=(200, 200, 200))
    return G
placa(None).save(os.path.join(AQUI, 'catalogo' + SUF + '.png'))
tmp = os.path.join(AQUI, '_mosaico'); os.makedirs(tmp, exist_ok=True)
for k in range(LOOP): placa(k).save(os.path.join(tmp, f'm{k:04d}.jpg'), quality=88)
subprocess.run(['ffmpeg', '-y', '-v', 'error', '-framerate', '30', '-i', os.path.join(tmp, 'm%04d.jpg'),
                '-vf', 'scale=trunc(iw/2)*2:trunc(ih/2)*2:out_range=tv,format=yuv420p', '-c:v', 'libx264', '-crf', '20', '-pix_fmt', 'yuv420p', os.path.join(AQUI, 'catalogo' + SUF + '.mp4')], check=True)
for f in glob.glob(os.path.join(tmp, '*')): os.remove(f)
os.rmdir(tmp)
json.dump(info, open(os.path.join(AQUI, 'catalogo' + SUF + '.json'), 'w'), indent=1)
print(len(efs), 'efeitos;', 'vazios:', [x['nome'] for x in info if x['vazio']])
