"""Mede silhueta: conceito x modelo (vista de frente), largura por faixa de altura + sobreposição de contornos.
uso: python medir.py recon/e2_full.jpg recon/e2_sil.jpg"""
import sys, numpy as np
from PIL import Image, ImageFilter
full = Image.open(sys.argv[1]).convert('RGB'); W, H = full.size; ref = full.crop((0, 0, W, H // 2)).resize((1536, 1024)); mine = full.crop((0, H // 2, W, H)).resize((1536, 1024))
def mask(im, panel):
    a = np.asarray(im.crop((panel * 512, 0, panel * 512 + 512, 1024))).astype(int); bg = np.median(np.concatenate([a[:40, :40].reshape(-1, 3), a[:40, -40:].reshape(-1, 3)]), 0)
    m = np.abs(a - bg).sum(2) > 60; m[np.abs(a - bg).sum(2) < 60] = False; return m
out = []
for pnl in (0, 1, 2):
    r, m = mask(ref, pnl), mask(mine, pnl)
    rows = lambda k: np.nonzero(k.any(1))[0]
    out.append((pnl, rows(r)[[0, -1]], rows(m)[[0, -1]]))
    if pnl == 0:
        print('faixa(y)  largura conceito  largura modelo')
        for y in range(80, 1000, 40):
            wr = r[y].sum(); wm = m[y].sum(); print(f'{y:5d} {wr:6d} {wm:6d}')
        e = lambda k: np.asarray(Image.fromarray((k * 255).astype('uint8')).filter(ImageFilter.FIND_EDGES)) > 0
        base = np.asarray(ref.crop((0, 0, 512, 1024))).astype(float) * 0.5 + 127
        base[e(r)] = [255, 0, 0]; base[e(m)] = [0, 90, 255]
        Image.fromarray(base.astype('uint8')).save(sys.argv[2], quality=92)
print('topo/base por vista (conceito, modelo):', [(p, list(a), list(b)) for p, a, b in out])
