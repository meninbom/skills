"""BVH da biblioteca 100STYLE (60 fps, cm, repouso em T) -> JSON de movimento do gente3.js (30 fps, m, nomes SMPL).
uso: python bvh2mov.py entrada.bvh saida.json quadro_ini quadro_fim [--reto]
--reto: a gravação anda em círculos; endireita (tira o rumo quadro a quadro) e reconstrói o deslocamento em linha reta para +z com a velocidade real.
"""
import sys, json, numpy as np
NOME = {'Hips': 'Pelvis', 'Chest': 'Spine1', 'Chest2': 'Spine2', 'Chest4': 'Spine3', 'LeftCollar': 'L_Collar', 'RightCollar': 'R_Collar', 'Neck': 'Neck', 'Head': 'Head', 'LeftHip': 'L_Hip', 'LeftKnee': 'L_Knee', 'LeftAnkle': 'L_Ankle', 'LeftToe': 'L_Foot', 'RightHip': 'R_Hip', 'RightKnee': 'R_Knee',
        'RightAnkle': 'R_Ankle', 'RightToe': 'R_Foot', 'LeftShoulder': 'L_Shoulder', 'LeftElbow': 'L_Elbow', 'LeftWrist': 'L_Wrist', 'LeftWrist_fim': 'L_Middle1', 'RightShoulder': 'R_Shoulder', 'RightElbow': 'R_Elbow',
        'RightWrist': 'R_Wrist', 'RightWrist_fim': 'R_Middle1'}
src, dst, f0, f1 = sys.argv[1], sys.argv[2], int(sys.argv[3]), int(sys.argv[4]); reto = '--reto' in sys.argv
L = open(src).read().split('\n'); J = []; pilha = []; i = 0
while not L[i].startswith('MOTION'):
    t = L[i].split()
    if t and t[0] in ('ROOT', 'JOINT'): J.append({'n': t[1], 'pai': pilha[-1] if pilha else -1, 'ch': []}); pilha.append(len(J) - 1)
    elif t and t[0] == 'End': J.append({'n': J[pilha[-1]]['n'] + '_fim', 'pai': pilha[-1], 'ch': []}); pilha.append(len(J) - 1)
    elif t and t[0] == 'OFFSET': J[pilha[-1]]['off'] = np.array([float(v) for v in t[1:4]]) * 0.01
    elif t and t[0] == 'CHANNELS': J[pilha[-1]]['ch'] = t[2:]
    elif t and t[0] == '}': pilha.pop()
    i += 1
dt = float(L[i + 2].split()[-1]); passo = max(1, round((1 / 30) / dt)); D = np.array([[float(v) for v in l.split()] for l in L[i + 3 + f0:i + 3 + f1:passo] if l.strip()]); n = len(D)


def rot(eixo, a):
    c, s = np.cos(a), np.sin(a); R = np.zeros((len(a), 3, 3)); k = 'XYZ'.index(eixo); p, q = (k + 1) % 3, (k + 2) % 3
    R[:, k, k] = 1; R[:, p, p] = c; R[:, q, q] = c; R[:, p, q] = -s; R[:, q, p] = s; return R


col = 0; RW, PW = [], []
for j in J:
    R = np.tile(np.eye(3), (n, 1, 1)); T = np.tile(j['off'], (n, 1))
    for c in j['ch']:
        v = D[:, col]; col += 1
        if c.endswith('position'): T = T.copy(); T[:, 'XYZ'.index(c[0])] = v * 0.01
        else: R = R @ rot(c[0], np.radians(v))
    if j['pai'] < 0: RW.append(R); PW.append(T)
    else: RW.append(RW[j['pai']] @ R); PW.append(PW[j['pai']] + np.einsum('nij,nj->ni', RW[j['pai']], T))
RW, PW = np.array(RW), np.array(PW)  # [junta, quadro, ...]
if reto:
    raiz = PW[0].copy(); k = 15; ker = np.ones(2 * k + 1) / (2 * k + 1); sm = np.stack([np.convolve(np.pad(raiz[:, a], k, mode='edge'), ker, 'valid') for a in (0, 2)], 1)
    v = np.gradient(sm, axis=0); vel = np.hypot(v[:, 0], v[:, 1]); hp = PW[[i for i, j in enumerate(J) if j['n'] == 'LeftHip'][0]] - PW[[i for i, j in enumerate(J) if j['n'] == 'RightHip'][0]]
    rumo = np.unwrap(np.arctan2(-hp[:, 2], hp[:, 0])); rumo = np.convolve(np.pad(rumo, k, mode='edge'), ker, 'valid')  # rumo = para onde a bacia aponta (alisado), não a velocidade: em curva fechada a velocidade engana
    Y = rot('Y', -rumo); z = np.cumsum(vel) - vel[0]
    lat = raiz[:, [0, 2]] - sm  # balanço da bacia em torno da trajetória alisada: fica
    for a in range(len(J)): PW[a] = np.einsum('nij,nj->ni', Y, PW[a] - raiz); RW[a] = Y @ RW[a]
    lr = np.einsum('nij,nj->ni', Y, np.stack([lat[:, 0], np.zeros(n), lat[:, 1]], 1)); base = np.stack([lr[:, 0], raiz[:, 1], z + lr[:, 2]], 1)
    for a in range(len(J)): PW[a] += base
    print('velocidade media %.2f m/s' % (z[-1] / ((n - 1) / 30)))


def quat(m):
    t = np.trace(m)
    if t > 0: s = np.sqrt(t + 1) * 2; return [(m[2, 1] - m[1, 2]) / s, (m[0, 2] - m[2, 0]) / s, (m[1, 0] - m[0, 1]) / s, s / 4]
    i = int(np.argmax(np.diag(m))); j, k = (i + 1) % 3, (i + 2) % 3; s = np.sqrt(1 + m[i, i] - m[j, j] - m[k, k]) * 2; q = [0, 0, 0, 0]
    q[i] = s / 4; q[j] = (m[j, i] + m[i, j]) / s; q[k] = (m[k, i] + m[i, k]) / s; q[3] = (m[k, j] - m[j, k]) / s; return q


quadros = []; ant = {}
for f in range(n):
    q = {}
    for a, j in enumerate(J):
        if j['n'] not in NOME: continue
        nm = NOME[j['n']]; qq = quat(RW[a if not j['n'].endswith('_fim') else j['pai'], f])
        if nm in ant and sum(x * y for x, y in zip(qq, ant[nm])) < 0: qq = [-x for x in qq]
        ant[nm] = qq; q[nm] = [round(float(x), 5) for x in list(PW[a, f]) + qq]
    quadros.append(q)
json.dump({'fps': 30, 'ossos': list(quadros[0]), 'repouso': {k: v[:3] for k, v in quadros[0].items()}, 'quadros': quadros}, open(dst, 'w')); print('ok', dst, n, 'quadros')
