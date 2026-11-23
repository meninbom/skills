"""NPZ do HY-Motion (ComfyUI-HY-Motion1) -> JSON de movimento do gente3.js (mesmo formato do fbx2mov.py).
uso: python npz2mov.py entrada.npz saida.json
O NPZ traz keypoints3d (posicao das juntas por quadro), rot6d (rotacao local das 22 juntas SMPL) e transl.
Rotacao em mundo = produto pela arvore do esqueleto; o repouso SMPL e a pose em T com rotacao identidade, entao ja e "relativa ao repouso".
"""
import sys, json, numpy as np
NOMES = ['Pelvis', 'L_Hip', 'R_Hip', 'Spine1', 'L_Knee', 'R_Knee', 'Spine2', 'L_Ankle', 'R_Ankle', 'Spine3', 'L_Foot', 'R_Foot', 'Neck', 'L_Collar', 'R_Collar', 'Head',
         'L_Shoulder', 'R_Shoulder', 'L_Elbow', 'R_Elbow', 'L_Wrist', 'R_Wrist']
PAI = [-1, 0, 0, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 9, 9, 12, 13, 14, 16, 17, 18, 19]


def r6(d):  # (..., 6) -> matriz 3x3 (duas primeiras colunas, Gram-Schmidt)
    a1, a2 = d[..., 0::2], d[..., 1::2]  # o HY-Motion guarda intercalado: view(3, 2)
    b1 = a1 / np.linalg.norm(a1, axis=-1, keepdims=True); b2 = a2 - (b1 * a2).sum(-1, keepdims=True) * b1; b2 /= np.linalg.norm(b2, axis=-1, keepdims=True)
    return np.stack([b1, b2, np.cross(b1, b2)], axis=-1)


def quat(m):  # matriz -> [x, y, z, w]
    t = np.trace(m)
    if t > 0: s = np.sqrt(t + 1) * 2; return [(m[2, 1] - m[1, 2]) / s, (m[0, 2] - m[2, 0]) / s, (m[1, 0] - m[0, 1]) / s, s / 4]
    i = int(np.argmax(np.diag(m))); j, k = (i + 1) % 3, (i + 2) % 3; s = np.sqrt(1 + m[i, i] - m[j, j] - m[k, k]) * 2; q = [0, 0, 0, 0]
    q[i] = s / 4; q[j] = (m[j, i] + m[i, j]) / s; q[k] = (m[k, i] + m[i, k]) / s; q[3] = (m[k, j] - m[j, k]) / s; return q


src, dst = sys.argv[1:3]; z = np.load(src, allow_pickle=True); K = z['keypoints3d'][:, :22] + z['transl'][:, None, :]; R6 = z['rot6d']; n = len(K)  # as juntas vêm sem o deslocamento da raiz
RL = r6(R6) if R6.shape[-1] == 6 else R6; modo = sys.argv[3] if len(sys.argv) > 3 else 'col'
if modo == 'lin': RL = np.swapaxes(RL, -1, -2)
RW = np.zeros_like(RL)
for j in range(22): RW[:, j] = RL[:, j] if PAI[j] < 0 else RW[:, PAI[j]] @ RL[:, j]
quadros = []; ant = {}
for f in range(n):
    q = {}
    for j, nome in enumerate(NOMES):
        qq = quat(RW[f, j])
        if nome in ant and sum(a * b for a, b in zip(qq, ant[nome])) < 0: qq = [-v for v in qq]
        ant[nome] = qq; q[nome] = [round(float(v), 5) for v in list(K[f, j]) + qq]
    for lado, sx in (('L', 1), ('R', -1)):  # ponta da mao: no repouso em T a mao aponta para +x (esquerda) / -x (direita)
        j = NOMES.index(lado + '_Wrist'); p = K[f, j] + RW[f, j] @ np.array([sx * 0.1, 0, 0]); q[lado + '_Middle1'] = [round(float(v), 5) for v in p] + q[lado + '_Wrist'][3:]
    quadros.append(q)
rep = {k: v[:3] for k, v in quadros[0].items()}
json.dump({'fps': 30, 'ossos': NOMES, 'texto': str(z['text']) if 'text' in z else '', 'repouso': rep, 'quadros': quadros}, open(dst, 'w')); print('ok', dst, n, 'quadros', 'rot6d', R6.shape)
