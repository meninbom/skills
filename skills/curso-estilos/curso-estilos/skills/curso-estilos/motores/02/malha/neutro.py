"""Tira de um movimento a postura "parada neutra" da fonte, para o boneco não herdar o jeito do esqueleto de captura.
As rotações do JSON são relativas à pose em T do esqueleto de origem; mas em pé e relaxado esse esqueleto NÃO fica com rotação zero
(na 100STYLE o pescoço e a cabeça ficam ~20 graus para a frente; no SMPL os pés abrem ~24 graus). Como o repouso do nosso boneco já é a pose natural dele,
a rotação certa é a diferença para o parado neutro: q' = q * N^-1.
uso: python neutro.py referencia.json juntas(,) alvo1.json alvo2.json ...
"""
import sys, json, numpy as np
ref, juntas, alvos = sys.argv[1], sys.argv[2].split(','), sys.argv[3:]
def mul(a, b):
    ax, ay, az, aw = a; bx, by, bz, bw = b
    return [aw*bx + ax*bw + ay*bz - az*by, aw*by - ax*bz + ay*bw + az*bx, aw*bz + ax*by - ay*bx + az*bw, aw*bw - ax*bx - ay*by - az*bz]
R = json.load(open(ref)); N = {}
for j in juntas:
    qs = np.array([q[j][3:] for q in R['quadros']]); qs[(qs @ qs[0]) < 0] *= -1; m = qs.mean(0); N[j] = (m / np.linalg.norm(m)).tolist()
for a in alvos:
    M = json.load(open(a))
    if set(juntas) & set(M.get('calibrado', [])): print('ja calibrado', a); continue
    for q in M['quadros']:
        for j in juntas:
            n = N[j]; q[j][3:] = [round(v, 5) for v in mul(q[j][3:], [-n[0], -n[1], -n[2], n[3]])]
    M['calibrado'] = M.get('calibrado', []) + juntas; json.dump(M, open(a, 'w')); print('ok', a)
