"""Mede o 'ofício' de um quadro: cor, valor, densidade de formas, bordas. uso: python medir.py img1 [img2 ...]"""
import sys, cv2, numpy as np
def medir(p):
    im = cv2.imread(p); h, w = im.shape[:2]; s = (921600 / (h * w)) ** .5
    im = cv2.resize(im, (int(w * s), int(h * s)), interpolation=cv2.INTER_AREA)
    f = im.astype(np.float32) / 255; B, G, R = f[..., 0], f[..., 1], f[..., 2]
    rg, yb = R - G, .5 * (R + G) - B
    colorf = (np.sqrt(rg.std() ** 2 + yb.std() ** 2) + .3 * np.sqrt(rg.mean() ** 2 + yb.mean() ** 2)) * 255
    hsv = cv2.cvtColor(im, cv2.COLOR_BGR2HSV).astype(np.float32); S, V = hsv[..., 1] / 255, hsv[..., 2] / 255
    lab = cv2.cvtColor(im, cv2.COLOR_BGR2LAB).astype(np.float32); L = lab[..., 0] / 2.55
    e = cv2.Canny(cv2.GaussianBlur(im, (3, 3), 0), 60, 140); edens = e.mean() / 255 * 100
    # regiões chapadas: quantiza em 20 cores e conta componentes conectados >= 40 px
    Z = cv2.resize(im, (im.shape[1] // 2, im.shape[0] // 2)).reshape(-1, 3).astype(np.float32)
    _, lab_, cen = cv2.kmeans(Z, 20, None, (cv2.TERM_CRITERIA_EPS + cv2.TERM_CRITERIA_MAX_ITER, 20, 1), 2, cv2.KMEANS_PP_CENTERS)
    q = lab_.reshape(im.shape[0] // 2, im.shape[1] // 2); nreg = 0
    for k in range(20):
        n, _, st, _ = cv2.connectedComponentsWithStats((q == k).astype(np.uint8), connectivity=4)
        nreg += int((st[1:, 4] >= 10).sum())
    cnt = np.bincount(lab_.ravel(), minlength=20) / lab_.size; order = np.argsort(-cnt)
    pal = ' '.join('#%02X%02X%02X:%d%%' % (int(cen[k][2]), int(cen[k][1]), int(cen[k][0]), round(cnt[k] * 100)) for k in order[:8])
    # cor de sombra: sombras (L 25-45) têm matiz deslocado em relação aos tons médios?
    Hh = hsv[..., 0] * 2
    def hmean(m):
        a = np.deg2rad(Hh[m]); return (np.rad2deg(np.arctan2(np.sin(a).mean(), np.cos(a).mean())) % 360) if m.sum() else -1
    sh = (L > 15) & (L < 40) & (S > .3); md = (L > 50) & (L < 75) & (S > .3)
    return dict(colorido=round(colorf, 1), sat_media=round(S.mean(), 2), sat_alta=f'{(S > .6).mean() * 100:.0f}%', L_media=round(L.mean()), L_desvio=round(L.std()),
                escuro=f'{(L < 25).mean() * 100:.0f}%', claro=f'{(L > 85).mean() * 100:.0f}%', bordas=round(edens, 2), regioes_por_100k=round(nreg / (q.size / 100000) / 4, 1) if False else round(nreg / (q.size * 4 / 100000), 1),
                matiz_sombra=round(hmean(sh)), matiz_meio=round(hmean(md)), paleta=pal)
for p in sys.argv[1:]:
    d = medir(p); print('==', p); [print(f'  {k}: {v}') for k, v in d.items()]
