# Confere um clipe do H3: folha de contato (6 quadros) + metricas de movimento e de deriva de enquadramento.
# uso: python h3_check.py CLIPE.mp4 FOLHA.jpg
import sys, cv2, numpy as np

src, sheet = sys.argv[1], sys.argv[2]
cap = cv2.VideoCapture(src)
fps = cap.get(cv2.CAP_PROP_FPS)
frames = []
while True:
    ok, f = cap.read()
    if not ok:
        break
    frames.append(f)
n = len(frames)
H, W = frames[0].shape[:2]
small = [cv2.cvtColor(cv2.resize(f, (W // 4, H // 4), interpolation=cv2.INTER_AREA), cv2.COLOR_BGR2GRAY).astype(np.float32) for f in frames]

# movimento: diferenca media entre quadros vizinhos (0-255) e primeiro x ultimo
cons = [float(np.mean(np.abs(small[i + 1] - small[i]))) for i in range(n - 1)]
fl = float(np.mean(np.abs(small[-1] - small[0])))
# movimento por faixa horizontal (topo/meio/base) do primeiro x ultimo
bands = [float(np.mean(np.abs(small[-1][a:b] - small[0][a:b]))) for a, b in
         [(0, small[0].shape[0] // 3), (small[0].shape[0] // 3, 2 * small[0].shape[0] // 3), (2 * small[0].shape[0] // 3, small[0].shape[0])]]

# deriva de camera: afim parcial (escala+translacao) por ORB+RANSAC entre o quadro 0 e quadros ao longo do clipe
orb = cv2.ORB_create(3000)
g0 = cv2.cvtColor(frames[0], cv2.COLOR_BGR2GRAY)
k0, d0 = orb.detectAndCompute(g0, None)
bf = cv2.BFMatcher(cv2.NORM_HAMMING, crossCheck=True)
drift = []
for idx in [n // 4, n // 2, 3 * n // 4, n - 1]:
    g = cv2.cvtColor(frames[idx], cv2.COLOR_BGR2GRAY)
    k, d = orb.detectAndCompute(g, None)
    if d is None or d0 is None:
        drift.append((idx, None)); continue
    m = bf.match(d0, d)
    if len(m) < 12:
        drift.append((idx, f'{len(m)} matches')); continue
    p0 = np.float32([k0[x.queryIdx].pt for x in m]); p1 = np.float32([k[x.trainIdx].pt for x in m])
    A, inl = cv2.estimateAffinePartial2D(p0, p1, method=cv2.RANSAC, ransacReprojThreshold=2.0)
    if A is None:
        drift.append((idx, 'sem afim')); continue
    s = float(np.sqrt(A[0, 0] ** 2 + A[1, 0] ** 2))
    drift.append((idx, f'esc={s:.3f} dx={A[0, 2]:+.1f} dy={A[1, 2]:+.1f} inl={int(inl.sum())}/{len(m)}'))

print(f'{src}: {W}x{H} {n} q @ {fps:.2f} fps = {n / fps:.2f}s')
print(f'  mov. vizinhos med={np.mean(cons):.2f} min={np.min(cons):.2f} max={np.max(cons):.2f} | prim x ult={fl:.2f} | faixas topo/meio/base={bands[0]:.1f}/{bands[1]:.1f}/{bands[2]:.1f}')
for idx, d in drift:
    print(f'  deriva q{idx} ({idx / fps:.2f}s): {d}')

# folha: 8 quadros uniformes em 2 linhas de 4, 360x640 cada, com rotulo do tempo
idxs = [round(k * (n - 1) / 7) for k in range(8)]
tiles = []
for i in idxs:
    t = cv2.resize(frames[min(i, n - 1)], (360, 640), interpolation=cv2.INTER_AREA)
    cv2.rectangle(t, (0, 0), (150, 34), (0, 0, 0), -1)
    cv2.putText(t, f'{min(i, n - 1) / fps:.2f}s', (6, 25), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255, 255, 255), 2)
    tiles.append(t)
img = np.vstack([np.hstack(tiles[:4]), np.hstack(tiles[4:])])
cv2.imwrite(sheet, img, [cv2.IMWRITE_JPEG_QUALITY, 88])
