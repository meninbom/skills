# Rastreia a rotação da câmera de um vídeo de referência com LK + Kabsch em raios do olho de peixe.
# uso: python rastrear_cam.py REFERENCIA.mp4 [fim_em_s=44] [saida=cam_ref.json]   (pip install opencv-python numpy)
# Ajuste W, H, TAN e K para a lente da sua referência (aqui: 1080x1920, 46 graus, barril 0,7).
import cv2, numpy as np, json, sys
REF = sys.argv[1]
W, H, TAN, K = 1080, 1920, np.tan(np.radians(46)), 0.7
SC = 0.5  # trabalha em meia resolução
def raios(pts):
    x = pts[:, 0] / SC; y = pts[:, 1] / SC
    px = (x / W * 2 - 1) * W / H; py = -(y / H * 2 - 1)
    r2 = px * px + py * py; s = TAN * (1 + K * r2)
    v = np.stack([px * s, py * s, -np.ones_like(px)], 1)
    return v / np.linalg.norm(v, axis=1, keepdims=True)
def kabsch(a, b):  # R tal que b ≈ R a
    Hm = a.T @ b; U, S, Vt = np.linalg.svd(Hm); d = np.sign(np.linalg.det(Vt.T @ U.T))
    return Vt.T @ np.diag([1, 1, d]) @ U.T
cap = cv2.VideoCapture(REF); fim = float(sys.argv[2]) if len(sys.argv) > 2 else 44.0
mask = np.zeros((int(H * SC), int(W * SC)), np.uint8); mask[int(0.1 * H * SC):int(0.66 * H * SC), :] = 255  # tira título/legenda/mãos
prev = None; Racc = np.eye(3); out = []; t = 0; i = 0
while True:
    ok, f = cap.read()
    if not ok or i / 30 > fim: break
    g = cv2.cvtColor(cv2.resize(f, None, fx=SC, fy=SC), cv2.COLOR_BGR2GRAY)
    inl = 0
    if prev is not None:
        p0 = cv2.goodFeaturesToTrack(prev, 600, 0.01, 8, mask=mask)
        if p0 is not None and len(p0) > 20:
            p1, st, _ = cv2.calcOpticalFlowPyrLK(prev, g, p0, None, winSize=(21, 21), maxLevel=4)
            st = st.ravel() == 1; a = raios(p0.reshape(-1, 2)[st]); b = raios(p1.reshape(-1, 2)[st])
            best = (0, None)
            if len(a) < 12: a = a[:0]
            rng = np.random.default_rng(i)
            for _ in range(60 if len(a) else 0):
                idx = rng.choice(len(a), 3, replace=False); R = kabsch(a[idx], b[idx])
                e = np.linalg.norm(b - a @ R.T, axis=1); n = (e < 0.004).sum()
                if n > best[0]: best = (n, e < 0.004)
            if best[0] >= 12:
                R = kabsch(a[best[1]], b[best[1]]); inl = int(best[0])
                # rotação dos pontos = inverso da rotação da câmera
                Racc = Racc @ R.T
    out.append({"t": round(i / 30, 4), "R": Racc.round(6).tolist(), "inl": inl})
    prev = g; i += 1
json.dump(out, open(sys.argv[3] if len(sys.argv) > 3 else "cam_ref.json", "w"))
print(len(out), "quadros")
