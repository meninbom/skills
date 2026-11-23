"""Correcao v3 (critico 2, item 1): limpa o rosto do heroi nas 3 sequencias (Z01a, Z01b, Z01c) quadro a quadro.

O defeito vem do still mestre (conserto da sobrancelha loira) e o H3 levou para todos os quadros:
  1. arcada esquerda com borda serrilhada ('papel rasgado') contra a parede;
  2. pontinhos brancos no cranio.
Sem H3: a correcao e feita aqui, no fundo (NNNN.jpg) e no recorte (fNNNN.png) do MESMO quadro, com os mesmos pixels.

  borda: silhueta limpa = contorno esquerdo do heroi linha a linha (mediana de 61 linhas corta os fiapos, suaviza 4 px
         e entra 5 px para tirar a franja clara da sobrancelha apagada); tudo que fica FORA dela numa faixa de
         ~40 px no lado esquerdo do rosto (da testa ao olho) vira a PAREDE LIMPA (placa = media dos quadros em que a
         cabeca nao cobre o pixel). O alfa do recorte segue a silhueta limpa.
  pontos: no cranio (mascara erodida 10 px, do topo ate 300 px abaixo), pixel mais claro que a mediana 7x7 em > 9 niveis
          vira a mediana.
Original guardado em projeto/_v2_antes/seq/. Idempotente (le sempre do _v2_antes).

uso: python tools/heroi_limpo.py [Z01a Z01b Z01c] [--folha]
"""
import os, sys, numpy as np, cv2

HERE = os.path.dirname(os.path.abspath(__file__))
PROJ = os.path.abspath(os.path.join(HERE, '..'))
SRC = os.path.join(PROJ, '_v2_antes', 'seq')
DST = os.path.join(PROJ, 'public', 'seq')


def placa(s, n):
    """parede limpa atras do heroi: media dos quadros em que o pixel NAO esta coberto (a cabeca vira e descobre a parede);
    o que nunca aparece e preenchido so a partir da propria parede (inpaint Telea na placa, sem pele por perto)"""
    soma = np.zeros((1920, 1080, 3), np.float64); cont = np.zeros((1920, 1080), np.float64)
    for i in range(0, n, 2):
        bg = cv2.imread(os.path.join(s, f'{i:04d}.jpg'))
        A = cv2.imread(os.path.join(s, f'f{i:04d}.png'), cv2.IMREAD_UNCHANGED)[..., 3]
        livre = cv2.dilate((A > 2).astype(np.uint8), np.ones((45, 45), np.uint8)) == 0   # 22 px de folga: os fiapos da arcada ficam fora do matte
        soma[livre] += bg[livre]; cont[livre] += 1
    ok = cont > 0
    pl = np.zeros((1920, 1080, 3), np.uint8)
    pl[ok] = (soma[ok] / cont[ok][:, None]).round().astype(np.uint8)
    buraco = (~ok).astype(np.uint8) * 255
    return cv2.inpaint(pl, buraco, 9, cv2.INPAINT_TELEA) if buraco.any() else pl


def limpa(bg, fg, pl):
    A = fg[..., 3].astype(np.float32) / 255
    b = (A > 0.5).astype(np.uint8)
    rows = np.where(b.any(1))[0]
    if len(rows) == 0:
        return bg, fg, 0, 0
    ytop = int(rows[0])
    # ---------------- borda da arcada: contorno esquerdo linha a linha, sem os fiapos e 5 px para dentro (tira a franja clara)
    S = b.copy()
    y0, y1 = ytop + 200, min(1920, ytop + 660)
    lin = np.arange(y0, y1)
    tem = b[y0:y1].any(1)
    xl = np.where(tem, b[y0:y1].argmax(1), 0).astype(np.float32)
    if tem.sum() > 20:
        from scipy.ndimage import median_filter, gaussian_filter1d
        xt = median_filter(xl, size=61, mode='nearest')
        xc = np.maximum(xl, xt - 4)
        xc = gaussian_filter1d(xc, 4) + 5
        # v3: entra e sai da correcao em rampa de 70 linhas (sem degrau/entalhe no comeco e no fim da faixa)
        r = np.clip(np.minimum(np.arange(len(xc)), len(xc) - 1 - np.arange(len(xc))) / 70.0, 0, 1)
        r = r * r * (3 - 2 * r)
        xc = xl * (1 - r) + xc * r
        for j, y in enumerate(lin):
            if tem[j]:
                S[y, :int(round(xc[j]))] = 0
    cols = np.where(S.any(0))[0]
    xmid = int((cols[0] + cols[-1]) / 2) if len(cols) else 540
    faixa = np.zeros((1920, 1080), np.float32)
    faixa[y0:y1, :xmid] = 1
    faixa = cv2.GaussianBlur(faixa, (0, 0), 12)                     # entra e sai da faixa sem degrau
    dist = cv2.distanceTransform((1 - S).astype(np.uint8), cv2.DIST_L2, 5)
    fora = np.clip((48 - dist) / 10, 0, 1) * (S == 0)              # 0-38 px fora da silhueta = parede limpa
    Ss = cv2.GaussianBlur(S.astype(np.float32), (0, 0), 1.8)   # v3: borda tao macia quanto o resto do cranio
    w = np.clip(fora + (1 - Ss) * (dist == 0), 0, 1) * faixa       # peso da placa
    n_borda = int(((w > 0.5) & (b == 1)).sum())
    bg2 = np.clip(bg * (1 - w[..., None]) + pl * w[..., None], 0, 255).astype(np.uint8)
    # alfa: dentro da faixa segue a silhueta limpa
    A2 = A * (1 - faixa) + np.minimum(A, Ss) * faixa
    # ---------------- pontos no cranio
    er = cv2.erode(b, np.ones((21, 21), np.uint8))
    cran = np.zeros_like(b)
    cran[ytop:min(1920, ytop + 300), :] = 1
    zona = (er == 1) & (cran == 1)
    L2 = cv2.cvtColor(bg2, cv2.COLOR_BGR2GRAY).astype(np.int16)
    med = cv2.medianBlur(bg2, 7)
    Lm = cv2.cvtColor(med, cv2.COLOR_BGR2GRAY).astype(np.int16)
    pts = ((L2 - Lm) > 9) & zona
    pts = cv2.dilate(pts.astype(np.uint8), np.ones((3, 3), np.uint8)).astype(bool) & zona
    n_pts = int(pts.sum())
    bg2[pts] = med[pts]
    a8 = (np.clip(A2, 0, 1) * 255).astype(np.uint8)
    fg2 = np.dstack([bg2, a8])
    fg2[a8 == 0, :3] = 0
    return bg2, fg2, n_borda, n_pts


def run(key, folha=False):
    s, d = os.path.join(SRC, key), os.path.join(DST, key)
    n = len([f for f in os.listdir(s) if f.endswith('.jpg')])
    tot_b = tot_p = 0
    amostras = []
    pl = placa(s, n)
    for i in range(n):
        bg = cv2.imread(os.path.join(s, f'{i:04d}.jpg'))
        fg = cv2.imread(os.path.join(s, f'f{i:04d}.png'), cv2.IMREAD_UNCHANGED)
        bg2, fg2, nb, npt = limpa(bg, fg, pl)
        tot_b += nb; tot_p += npt
        cv2.imwrite(os.path.join(d, f'{i:04d}.jpg'), bg2, [cv2.IMWRITE_JPEG_QUALITY, 95])
        cv2.imwrite(os.path.join(d, f'f{i:04d}.png'), fg2, [cv2.IMWRITE_PNG_COMPRESSION, 6])
        if folha and i in (0, n // 2, n - 1):
            amostras.append(np.hstack([bg[480:1120, 0:620], bg2[480:1120, 0:620]]))
    if folha:
        cv2.imwrite(os.path.join(PROJ, 'out', f'heroi_limpo_{key}.jpg'), np.vstack(amostras), [cv2.IMWRITE_JPEG_QUALITY, 88])
    print(f'{key}: {n} quadros | pixels de borda refeitos {tot_b} | pontos do cranio {tot_p}', flush=True)


if __name__ == '__main__':
    args = [a for a in sys.argv[1:] if not a.startswith('--')]
    for k in (args or ['Z01a', 'Z01b', 'Z01c']):
        run(k, '--folha' in sys.argv)
