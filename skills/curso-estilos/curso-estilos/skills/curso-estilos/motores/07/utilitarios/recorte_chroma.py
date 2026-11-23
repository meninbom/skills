"""Recorte por chroma (receita do prompt): chave > 40, só região ligada à borda, pena 2 px, despill.
uso: python recorte_chroma.py entrada.png saida.png [verde|magenta]"""
import sys, numpy as np, cv2
src, dst = sys.argv[1], sys.argv[2]; modo = sys.argv[3] if len(sys.argv) > 3 else 'verde'
img = cv2.imread(src, cv2.IMREAD_COLOR).astype(np.int32); B, G, R = img[..., 0], img[..., 1], img[..., 2]
key = (G - np.maximum(R, B)) if modo == 'verde' else (np.minimum(R, B) - G)
borda = np.concatenate([key[0], key[-1], key[:, 0], key[:, -1]])
med = np.median(borda)
# fundo candidato: chave forte E perto da cor mediana do fundo
bgcol = np.median(np.concatenate([img[0], img[-1], img[:, 0], img[:, -1]]), axis=0)
dist = np.linalg.norm(img - bgcol, axis=2)
cand = ((key > 40) & (dist < 90)).astype(np.uint8)
# só o que está ligado à borda
n, lab = cv2.connectedComponents(cand, connectivity=4)
ids = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))) - {0}
bg = np.isin(lab, list(ids))
if len(sys.argv) > 4 and sys.argv[4] == 'furos':  # magenta não existe na folha: furos internos grandes também saem
    for i in range(1, n):
        m = lab == i
        if i not in ids and m.sum() > 400: bg |= m
alpha = (~bg).astype(np.uint8) * 255
alpha = cv2.morphologyEx(alpha, cv2.MORPH_OPEN, np.ones((3, 3), np.uint8))
# pena 2 px
a = cv2.GaussianBlur(alpha.astype(np.float32), (0, 0), 1.0)
a = np.clip((a - 40) * 255 / 175, 0, 255)
# despill na borda (faixa onde alpha < 255 ou perto)
edge = cv2.dilate((a < 250).astype(np.uint8), np.ones((7, 7), np.uint8)).astype(bool)
out = img.copy()
if modo == 'verde':
    lim = np.maximum(R, B); out[..., 1] = np.where(edge & (G > lim), lim, G)
else:
    lim = G + 10
    out[..., 2] = np.where(edge & (R > lim) & (B > lim), np.maximum(lim, R - (np.minimum(R, B) - G)), R)
    out[..., 0] = np.where(edge & (R > lim) & (B > lim), np.maximum(lim, B - (np.minimum(R, B) - G)), B)
rgba = np.dstack([np.clip(out, 0, 255).astype(np.uint8), a.astype(np.uint8)])
ys, xs = np.where(a > 8); rgba = rgba[ys.min():ys.max() + 1, xs.min():xs.max() + 1]
cv2.imwrite(dst, rgba); print(dst, rgba.shape, 'mediana chave borda', med)
