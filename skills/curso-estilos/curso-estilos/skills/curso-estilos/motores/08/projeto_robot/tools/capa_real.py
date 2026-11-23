"""v3: a capa REAL (scan da 1a edicao, Aventinum 1920) por cima da capa que o H3 redesenhou no Z03
('ROSSIIM'S' no lugar de ROSSUM'S e um logo inventado no pe a partir de ~1,5 s).

Por quadro do clipe Z03 (124 quadros), sai public/capa_real/NNNN.png (RGBA 1080x1920, so a capa):
  1. ALINHAMENTO: o H3 deslocou/escalou a capa em relacao ao quads.capa. Similaridade scan->quadro por ORB+RANSAC num
     quadro sem maos (q90), refinada por quadro com ECC so na metade de cima da capa (as maos ficam embaixo).
  2. LUZ: o scan alinhado e multiplicado pela razao de baixa frequencia quadro/scan (sigma 22) medida no q90:
     as faixas de sol da janela atravessam a capa real como atravessavam a do H3.
  3. MAOS POR CIMA: onde o quadro difere muito do scan iluminado E a mancha encosta na borda de baixo da capa
     (os dedos entram por baixo), a capa real some (alfa 0, borda macia). Letras diferentes do H3 sao manchas soltas,
     nao encostam na borda -> ficam cobertas pela capa real.
Tambem grava quads.json > capa_h3 (centro, largura, rotacao da capa como o H3 a desenhou) para o livro da avalanche
pousar exatamente nela.
uso: python tools/capa_real.py [--folha]
"""
import json, os, subprocess, sys, numpy as np, cv2

HERE = os.path.dirname(os.path.abspath(__file__))
PROJ = os.path.abspath(os.path.join(HERE, '..'))
PUB = os.path.join(PROJ, 'public')
OUT = os.path.join(PUB, 'capa_real')
REF = 90


def frames():
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', os.path.join(PUB, 'clips', 'Z03.mp4'), '-f', 'rawvideo', '-pix_fmt', 'bgr24', '-'],
                         capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.uint8).reshape(-1, 1920, 1080, 3)


def main():
    folha = '--folha' in sys.argv
    os.makedirs(OUT, exist_ok=True)
    F = frames()
    n = len(F)
    scan = cv2.imread(os.path.join(PUB, 'docs', 'capa_k2.jpg'))
    sh, sw = scan.shape[:2]
    q = json.load(open(os.path.join(PROJ, 'src', 'data', 'quads.json'), encoding='utf-8'))['capa']
    # chute inicial = quads.capa (posicao em que a capa foi composta no still antes do H3)
    s0 = q['w'] / sw
    c0 = (q['x'] + q['w'] / 2, q['y'] + sh * s0 / 2)
    M0 = cv2.getRotationMatrix2D((sw / 2, sh / 2), -q['rot'], s0)
    M0[:, 2] += np.array(c0) - np.array([sw / 2, sh / 2])
    # 1. ORB + RANSAC no quadro de referencia (sem maos)
    ref = F[REF]
    small = cv2.resize(scan, None, fx=s0 * 1.0, fy=s0 * 1.0, interpolation=cv2.INTER_AREA)
    orb = cv2.ORB_create(4000)
    g1 = cv2.cvtColor(small, cv2.COLOR_BGR2GRAY); g2 = cv2.cvtColor(ref, cv2.COLOR_BGR2GRAY)
    k1, d1 = orb.detectAndCompute(g1, None); k2, d2 = orb.detectAndCompute(g2, None)
    bf = cv2.BFMatcher(cv2.NORM_HAMMING, crossCheck=True)
    ms = sorted(bf.match(d1, d2), key=lambda m: m.distance)[:600]
    p1 = np.float32([k1[m.queryIdx].pt for m in ms]) / s0       # em px do scan
    p2 = np.float32([k2[m.trainIdx].pt for m in ms])
    A, inl = cv2.estimateAffinePartial2D(p1, p2, method=cv2.RANSAC, ransacReprojThreshold=4.0, maxIters=5000)
    n_in = int(inl.sum()) if inl is not None else 0
    if A is None or n_in < 25:
        print('ORB fraco (', n_in, 'inliers): uso quads.capa'); A = M0
    sc = float(np.hypot(A[0, 0], A[1, 0])); rot = float(np.degrees(np.arctan2(A[1, 0], A[0, 0])))
    cx, cy = (A @ np.array([sw / 2, sh / 2, 1.0]))
    print(f'ORB inliers {n_in} | escala {sc:.4f} (quads {s0:.4f}) | rot {rot:.2f} (quads {q["rot"]}) | centro {cx:.1f},{cy:.1f} (quads {c0[0]:.1f},{c0[1]:.1f})')

    # mascara da capa e da metade de cima (para o ECC)
    def warp(M, img, interp=cv2.INTER_LINEAR):
        return cv2.warpAffine(img, M, (1080, 1920), flags=interp, borderMode=cv2.BORDER_CONSTANT, borderValue=0)
    ones = np.full((sh, sw), 255, np.uint8)
    # 2. luz: razao de baixa frequencia no quadro de referencia
    capa_m = warp(A, ones, cv2.INTER_NEAREST) > 127
    sc_w = warp(A, scan).astype(np.float32)
    er = cv2.erode(capa_m.astype(np.uint8), np.ones((9, 9), np.uint8)).astype(np.float32)
    # o que o H3 inventou (logo, letras trocadas) nao entra na medida da luz: fora onde o quadro foge muito do scan
    g = float(np.median(cv2.cvtColor(ref, cv2.COLOR_BGR2GRAY)[er > 0]) / max(1.0, np.median(cv2.cvtColor(sc_w.astype(np.uint8), cv2.COLOR_BGR2GRAY)[er > 0])))
    d0 = np.abs(ref.astype(np.float32) - sc_w * g).max(2)
    er *= (cv2.dilate((d0 > 50).astype(np.uint8), np.ones((25, 25), np.uint8)) == 0)
    num = cv2.GaussianBlur(ref.astype(np.float32) * er[..., None], (0, 0), 22)
    den = cv2.GaussianBlur(sc_w * er[..., None], (0, 0), 22)
    razao = np.clip(num / np.maximum(den, 1.0), 0.5, 1.6)
    # 3. por quadro: ECC (so a metade de cima da capa), luz, maos
    ys = np.where(capa_m.any(1))[0]; y_top, y_bot = int(ys[0]), int(ys[-1])
    cima = np.zeros((1920, 1080), np.uint8); cima[y_top:int(y_top + 0.6 * (y_bot - y_top)), :] = 1
    cima &= cv2.erode(capa_m.astype(np.uint8), np.ones((15, 15), np.uint8))
    sc_rep = cv2.warpAffine(scan, A, (1080, 1920), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE).astype(np.float32)
    lit_ref = np.clip(sc_rep * cv2.dilate(razao, np.ones((9, 9), np.uint8)), 0, 255).astype(np.uint8)
    rel = {'orb_inliers': n_in, 'escala': sc, 'rot': rot, 'centro': [float(cx), float(cy)], 'quadros': []}
    amostras = []
    ordem = list(range(REF, n)) + list(range(REF - 1, -1, -1))   # a partir do quadro de referencia, com continuidade
    prev = {REF: (0.0, 0.0)}
    for i in ordem:
        fr = F[i]
        p0 = prev.get(i - 1 if i > REF else i + 1, (0.0, 0.0))
        W2 = np.float32([[1, 0, p0[0]], [0, 1, p0[1]]])
        try:
            _, W2 = cv2.findTransformECC(cv2.cvtColor(lit_ref, cv2.COLOR_BGR2GRAY).astype(np.float32),
                                         cv2.cvtColor(fr, cv2.COLOR_BGR2GRAY).astype(np.float32), W2, cv2.MOTION_TRANSLATION,
                                         (cv2.TERM_CRITERIA_EPS | cv2.TERM_CRITERIA_COUNT, 60, 1e-4), cima, 5)
        except cv2.error:
            pass
        dx, dy = float(W2[0, 2]), float(W2[1, 2])
        if abs(dx - p0[0]) > 6 or abs(dy - p0[1]) > 6 or abs(dx) > 40 or abs(dy) > 40:   # salto = ECC perdido: mantem o anterior
            dx, dy = p0
        prev[i] = (dx, dy)
        T = np.float32([[1, 0, dx], [0, 1, dy]])
        lit = cv2.warpAffine(lit_ref, T, (1080, 1920), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)
        m = warp(T, capa_m.astype(np.uint8) * 255, cv2.INTER_NEAREST) > 127
        m_cobre = cv2.dilate(m.astype(np.uint8), np.ones((7, 7), np.uint8)) > 0   # +3 px: cobre a aresta da capa do H3
        # maos: diferenca grande, mancha encostada na borda de baixo da capa
        d = np.abs(fr.astype(np.int16) - lit.astype(np.int16)).max(2)
        cand = ((d > 48) & m).astype(np.uint8)
        cand = cv2.morphologyEx(cand, cv2.MORPH_OPEN, np.ones((5, 5), np.uint8))
        cand = cv2.morphologyEx(cand, cv2.MORPH_CLOSE, np.ones((9, 9), np.uint8))
        nl, lab, st, _ = cv2.connectedComponentsWithStats(cand, 8)
        borda = np.zeros_like(cand); yb = int(np.where(m.any(1))[0][-1])
        borda[yb - 18:yb + 1, :] = 1
        mao = np.zeros((1920, 1080), np.uint8)
        for k in range(1, nl):
            if st[k, cv2.CC_STAT_AREA] > 900 and (borda[lab == k]).any():
                mao[lab == k] = 1
        mao = cv2.dilate(mao, np.ones((7, 7), np.uint8))
        a = m_cobre.astype(np.float32) * (1 - mao.astype(np.float32))
        a = cv2.GaussianBlur(a, (0, 0), 1.3) * m_cobre
        rgba = np.dstack([lit, (np.clip(a, 0, 1) * 255).astype(np.uint8)])
        rgba[rgba[..., 3] == 0, :3] = 0
        cv2.imwrite(os.path.join(OUT, f'{i:04d}.png'), rgba, [cv2.IMWRITE_PNG_COMPRESSION, 6])
        rel['quadros'].append({'q': i, 'dx': round(dx, 2), 'dy': round(dy, 2), 'mao_px': int(mao.sum())})
        if folha and i in (0, 30, 60, REF):
            comp = (fr.astype(np.float32) * (1 - a[..., None]) + lit.astype(np.float32) * a[..., None]).astype(np.uint8)
            amostras.append(np.hstack([fr[1000:1560, 200:900], comp[1000:1560, 200:900]]))
    rel['quadros'].sort(key=lambda x: x['q'])
    json.dump(rel, open(os.path.join(PROJ, 'out', 'capa_real.json'), 'w'), indent=1)
    qq = json.load(open(os.path.join(PROJ, 'src', 'data', 'quads.json'), encoding='utf-8'))
    qq['capa_h3'] = {'cx': round(float(cx), 1), 'cy': round(float(cy), 1), 'w': round(sw * sc, 1), 'rot': round(rot, 2),
                     'nota': 'capa como o H3 a desenhou (capa_real.py, ORB+RANSAC no q90): o livro da avalanche pousa aqui'}
    json.dump(qq, open(os.path.join(PROJ, 'src', 'data', 'quads.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    if folha:
        cv2.imwrite(os.path.join(PROJ, 'out', 'capa_real_folha.jpg'), np.vstack(amostras), [cv2.IMWRITE_JPEG_QUALITY, 88])
    dd = [abs(x['dx']) + abs(x['dy']) for x in rel['quadros']]
    print(f'ok {n} quadros | deriva max {max(dd):.1f} px | quadros com mao {sum(1 for x in rel["quadros"] if x["mao_px"] > 0)}')


if __name__ == '__main__':
    main()
