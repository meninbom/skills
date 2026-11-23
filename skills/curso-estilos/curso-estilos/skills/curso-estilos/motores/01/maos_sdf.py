# Mão de desenho (direita) por SDF: palma arredondada + dedos gordos em cápsulas com união suave -> marching cubes -> maos.json
# Eixos da mão: pulso na origem, dedos para -Z, costas da mão +Y, polegar no lado -X.
import numpy as np, json
from skimage.measure import marching_cubes
def rot(v, ax, a):
    ax = np.array(ax, float); ax /= np.linalg.norm(ax); v = np.array(v, float)
    return v * np.cos(a) + np.cross(ax, v) * np.sin(a) + ax * np.dot(ax, v) * (1 - np.cos(a))
def caps(P, a, b, r):
    pa = P - a; ba = b - a; h = np.clip((pa @ ba) / (ba @ ba), 0, 1)
    return np.linalg.norm(pa - h[:, None] * ba, axis=1) - r
def rbox(P, c, hs, r):
    q = np.abs(P - c) - (np.array(hs) - r)
    return np.linalg.norm(np.maximum(q, 0), axis=1) + np.minimum(q.max(1), 0) - r
def smin(a, b, k):
    h = np.clip(0.5 + 0.5 * (b - a) / k, 0, 1); return b * (1 - h) + a * h - k * h * (1 - h)
D = np.radians
POSES = {
  # c1,c2,c3 = curvatura das 3 falanges; abre = leque; pol = (dir. base, curva)
  "borda":   dict(c=(55, 60, 45), abre=3, pol=((-0.55, -0.55, -0.62), 35)),
  "celular": dict(c=(48, 55, 30), abre=2, pol=((-0.75, -0.5, -0.3), 30)),
  "parede":  dict(c=(6, 4, 2), abre=7, pol=((-0.85, -0.1, -0.5), 8)),
  "aponta":  dict(c=[(5, 3, 2), (80, 95, 50), (85, 95, 50), (85, 95, 50)], abre=2, pol=((-0.35, -0.8, -0.45), 40)),
  "agarra":  dict(c=(35, 45, 35), abre=5, pol=((-0.6, -0.6, -0.4), 30), longo=1.35, magro=0.8),
}
def mao(p):
    segs = []
    # pulso e palma
    segs.append(("c", np.array([0, 0, 0.03]), np.array([0, 0, -0.02]), 0.027))
    xs = [-0.029, -0.0095, 0.0095, 0.028]; rs = [0.0125, 0.013, 0.0125, 0.0112]; ls = [1.0, 1.1, 1.03, 0.82]
    rs = [r * p.get("magro", 1) for r in rs]; ls = [l * p.get("longo", 1) for l in ls]
    for i in range(4):
        base = np.array([xs[i], 0.003, -0.083 + abs(i - 1.5) * 0.004 + (0.004 if i == 3 else 0)])
        d = rot([0, 0, -1], [0, 1, 0], D((i - 1.5) * p["abre"]))
        pt = base; L = [0.032, 0.024, 0.02]
        for j in range(3):
            cc = p["c"][i] if isinstance(p["c"][0], (list, tuple)) else p["c"]
            d = rot(d, [1, 0, 0], -D(cc[j]))   # dobra para o lado da palma (-Y)
            q = pt + d * L[j] * ls[i]; segs.append(("c", pt, q, rs[i] * (1 - 0.06 * j))); pt = q
    # polegar
    b0 = np.array([-0.03, -0.006, -0.025]); d = np.array(p["pol"][0], float); d /= np.linalg.norm(d)
    q1 = b0 + d * 0.036; segs.append(("c", np.array([-0.012, -0.004, -0.01]), b0, 0.02)); segs.append(("c", b0, q1, 0.0165))
    d2 = rot(d, [0, 1, 0], -D(p["pol"][1])); q2 = q1 + d2 * 0.03; segs.append(("c", q1, q2, 0.015))
    return segs
out = {}
for nome, p in [(k, v) for k, v in POSES.items() if k in ('aponta', 'agarra')]:
    segs = mao(p)
    lo = np.array([-0.1, -0.1, -0.2]); hi = np.array([0.08, 0.06, 0.06]); st = 0.0019
    g = [np.arange(lo[k], hi[k], st) for k in range(3)]
    X, Y, Z = np.meshgrid(*g, indexing="ij"); P = np.stack([X.ravel(), Y.ravel(), Z.ravel()], 1)
    f = rbox(P, np.array([0, -0.002, -0.048]), (0.041, 0.0175, 0.042), 0.016)
    for s in segs: f = smin(f, caps(P, s[1], s[2], s[3]), 0.007)
    vol = f.reshape(X.shape)
    v, fa, n, _ = marching_cubes(vol, 0, spacing=(st, st, st)); v += lo
    n = -n / np.linalg.norm(n, axis=1, keepdims=True)   # skimage aponta para dentro com nível 0 crescente
    out[nome] = {"p": np.round(v.astype(np.float64), 5).ravel().tolist(), "n": np.round(n.astype(np.float64), 3).ravel().tolist(), "i": fa.ravel().tolist()}
    print(nome, len(v), "vértices", len(fa), "tri")
json.dump(out, open("maos.json", "w"), separators=(",", ":"))
