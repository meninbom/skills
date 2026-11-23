"""Recorta uma folha gerada (fundo magenta chapado) em sprites individuais com alpha.
uso: python -I recortar_folha.py folha.jpg pasta_saida prefixo [area_min]
- chave magenta: min(R,B) - G > 60 e perto da cor do fundo; remove tudo ligado ou não à borda (magenta não existe nos personagens)
- pena 1,5 px + despill; separa por componentes conexos (dilatados 9 px para juntar partes soltas: pés, gotas)
- grava prefixo_NN.png (RGBA recortado) e prefixo_indice.jpg (folha numerada)"""
import sys, os, numpy as np, cv2
src, outd, pre = sys.argv[1], sys.argv[2], sys.argv[3]; amin = int(sys.argv[4]) if len(sys.argv) > 4 else 2500
os.makedirs(outd, exist_ok=True)
img = cv2.imread(src, cv2.IMREAD_COLOR).astype(np.int32); B, G, R = img[..., 0], img[..., 1], img[..., 2]
bgcol = np.median(np.concatenate([img[0], img[-1], img[:, 0], img[:, -1]]), axis=0)
dist = np.linalg.norm(img - bgcol, axis=2)
key = np.minimum(R, B) - G
bg = ((key > 60) & (dist < 120)) | (dist < 45)
alpha = (~bg).astype(np.uint8) * 255
alpha = cv2.morphologyEx(alpha, cv2.MORPH_OPEN, np.ones((3, 3), np.uint8))
a = cv2.GaussianBlur(alpha.astype(np.float32), (0, 0), 0.8)
# despill: puxa R e B para perto de G+algo onde a cor ainda tem magenta na borda
edge = cv2.dilate((a < 250).astype(np.uint8), np.ones((5, 5), np.uint8)).astype(bool)
out = img.copy(); spill = np.clip(np.minimum(R, B) - G - 20, 0, None)
out[..., 2] = np.where(edge, R - spill, R); out[..., 0] = np.where(edge, B - spill, B)
rgba = np.dstack([np.clip(out, 0, 255).astype(np.uint8), a.astype(np.uint8)])
grp = cv2.dilate((a > 40).astype(np.uint8), np.ones((9, 9), np.uint8))
n, lab, st, _ = cv2.connectedComponentsWithStats(grp, connectivity=8)
items = [i for i in range(1, n) if st[i, cv2.CC_STAT_AREA] >= amin]
items.sort(key=lambda i: (st[i, 1] // 150, st[i, 0]))
idx = img.astype(np.uint8).copy()
for k, i in enumerate(items):
    x, y, w, h = st[i, 0], st[i, 1], st[i, 2], st[i, 3]
    m = (lab[y:y+h, x:x+w] == i)
    s = rgba[y:y+h, x:x+w].copy(); s[..., 3] = np.where(m, s[..., 3], 0)
    cv2.imwrite(os.path.join(outd, f'{pre}_{k:02d}.png'), s)
    cv2.rectangle(idx, (x, y), (x+w, y+h), (0, 255, 0), 2); cv2.putText(idx, str(k), (x+4, y+28), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 0), 4); cv2.putText(idx, str(k), (x+4, y+28), cv2.FONT_HERSHEY_SIMPLEX, 1, (255, 255, 255), 2)
    print(k, x, y, w, h)
cv2.imwrite(os.path.join(outd, f'{pre}_indice.jpg'), idx)
