"""Folha de bonecos-palito dos NPZ do HY-Motion para escolher a variação: python palitos.py pasta saida.jpg id1 id2 ...
Cada linha = uma variação; 10 quadros ao longo do tempo; vista 3/4 (gira 35 graus)."""
import sys, numpy as np, glob, os
from PIL import Image, ImageDraw
B = [(0,1),(1,4),(4,7),(7,10),(0,2),(2,5),(5,8),(8,11),(0,3),(3,6),(6,9),(9,12),(12,15),(9,13),(13,16),(16,18),(18,20),(9,14),(14,17),(17,19),(19,21)]
pasta, out, ids = sys.argv[1], sys.argv[2], sys.argv[3:]; NQ, CW, CH = 10, 150, 200; lin = []
for i in ids:
    for f in sorted(glob.glob(os.path.join(pasta, i + '_[0-9].npz'))): lin.append((os.path.basename(f)[:-4], np.load(f, allow_pickle=True)))
im = Image.new('RGB', (NQ * CW + 130, CH * len(lin)), 'white'); d = ImageDraw.Draw(im); a = np.radians(35); ca, sa = np.cos(a), np.sin(a)
for r, (nome, z) in enumerate(lin):
    K = z['keypoints3d'][:, :22]; n = len(K); d.text((4, r * CH + 4), nome, fill='black'); y0 = K[..., 1].min()
    for c in range(NQ):
        k = K[int(c * (n - 1) / (NQ - 1))]; x = k[:, 0] * ca + k[:, 2] * sa; y = k[:, 1] - y0; ox, oy = 130 + c * CW + CW / 2, r * CH + CH - 12; s = 100
        for j, (p, q) in enumerate(B): d.line([ox + x[p] * s, oy - y[p] * s, ox + x[q] * s, oy - y[q] * s], fill=(200, 60, 60) if j < 4 or 17 <= j else (60, 60, 200) if j < 8 or 13 <= j < 17 else (40, 40, 40), width=3)
        d.ellipse([ox + x[15] * s - 6, oy - y[15] * s - 12, ox + x[15] * s + 6, oy - y[15] * s], outline='black', width=2)
    T = z['transl']; d.text((4, r * CH + 20), 'anda %.1f m' % np.hypot(T[-1, 0] - T[0, 0], T[-1, 2] - T[0, 2]), fill='gray')
im.save(out, quality=90); print('ok', out)
