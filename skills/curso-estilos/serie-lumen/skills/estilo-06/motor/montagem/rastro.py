"""Rastreia um objeto pequeno pela COR num clipe animado, pra o efeito em código seguir o objeto.
Exemplo da série: o rato marrom-alaranjado na faixa do chão -> h3/rastro_<PLANO>.json com (x_pé, y_pé) por quadro a 30 qps, nas coordenadas
do quadro 1080x1920. O passos() do montar.py usa isso pra cada anel nascer no pé do rato. Para outro objeto, troque a regra de cor (linha do
"m = ...") e a faixa de altura (y0, y1).
uso: python rastro.py <pasta do episódio> <PLANO>"""
import os, sys, json, subprocess
import numpy as np, cv2
if len(sys.argv) < 3: raise SystemExit(__doc__)
EP = os.path.abspath(sys.argv[1]); W, H, FPS = 1080, 1920, 30
S = sys.argv[2]
arq = os.path.join(EP, 'h3', 'clips60', f'{S}.mp4')
p = subprocess.Popen(['ffmpeg', '-v', 'error', '-i', arq, '-vf', f'fps={FPS},scale={W}:{H}', '-f', 'rawvideo', '-pix_fmt', 'bgr24', '-'], stdout=subprocess.PIPE)
pts, prev = [], None
while True:
    b = p.stdout.read(W * H * 3)
    if len(b) < W * H * 3: break
    im = np.frombuffer(b, np.uint8).reshape(H, W, 3)
    y0, y1 = int(0.68 * H), int(0.88 * H)
    reg = im[y0:y1].astype(np.int16); B, G, R = reg[..., 0], reg[..., 1], reg[..., 2]
    m = ((R - B > 28) & (R > 70) & (R >= G)).astype(np.uint8)
    m = cv2.morphologyEx(m, cv2.MORPH_OPEN, np.ones((5, 5), np.uint8))
    n, lab, st, cen = cv2.connectedComponentsWithStats(m)
    best = None
    for k in range(1, n):
        x, y, w, h, a = st[k]
        if a < 400: continue
        sc = a - (0 if prev is None else 3 * abs(cen[k][0] - prev[0]))
        if best is None or sc > best[0]: best = (sc, cen[k][0], y0 + y + h)
    if best is None: pts.append(prev); continue
    prev = (float(best[1]), float(best[2])); pts.append(prev)
# suaviza
xs = np.array([q[0] if q else np.nan for q in pts]); ys = np.array([q[1] if q else np.nan for q in pts])
for arr in (xs, ys):
    ok = ~np.isnan(arr); arr[~ok] = np.interp(np.flatnonzero(~ok), np.flatnonzero(ok), arr[ok])
k = np.ones(5) / 5; xs = np.convolve(np.pad(xs, 2, mode='edge'), k, 'valid'); ys = np.convolve(np.pad(ys, 2, mode='edge'), k, 'valid')
# a cor pega a orelha (parte mais clara); o pé fica ~115 px abaixo e ~40 px atrás
xs, ys = xs - 40, ys + 115
json.dump([[round(a, 1), round(b, 1)] for a, b in zip(xs, ys)], open(os.path.join(EP, 'h3', f'rastro_{S}.json'), 'w'))
print(S, len(xs), 'quadros; x', int(xs[0]), '->', int(xs[-1]), '; y', int(ys[0]), '->', int(ys[-1]))
