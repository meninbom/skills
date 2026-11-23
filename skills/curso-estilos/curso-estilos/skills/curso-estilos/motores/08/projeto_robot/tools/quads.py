"""Geometria do tipo no mundo e dos documentos em homografia, em coordenadas do QUADRO 1080x1920,
tirada dos mesmos numeros dos styleframes (k3v2, k4v2, k78v2, frames3.k2) -> src/data/quads.json.
O Remotion usa matrix3d (lib/homografia.ts) com esses 4 cantos. Camera travada no H3 = homografia fixa
(validar deriva com ECC em tratar_clipes.py --ecc; plano B = still com push em codigo).

uso: python quads.py
"""
import sys, os, json, numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
ROBOT = os.path.abspath(os.path.join(HERE, '..', '..'))
sys.path.insert(0, os.path.join(ROBOT, '_build'))
from lib import FD, font  # noqa: E402

OUT = os.path.join(ROBOT, 'projeto', 'src', 'data', 'quads.json')


def to_frame(pts, z, x0, y0):
    return [[round(float((x - x0) * z), 2), round(float((y - y0) * z), 2)] for x, y in pts]


def homog(src, dst):
    import cv2
    return cv2.getPerspectiveTransform(np.float32(src), np.float32(dst))


def k4_patent():
    pw_, ph_ = 2248, 3543
    TL, TR = np.float32([172, 381]), np.float32([889, 370])
    wdoc = float(np.linalg.norm(TR - TL)); hdoc = wdoc * ph_ / pw_
    down = np.float32([-0.012, 1.0]); down /= np.linalg.norm(down)
    BL, BR = TL + down * hdoc, TR + down * (hdoc - 6)
    z, x0 = 1.12, 60
    y0 = TL[1] - 430 / z
    return dict(doc='patent1738', size=[pw_, ph_], quad=to_frame([TL, TR, BR, BL], z, x0, y0),
                nota='K4: Patent inteiro, sem esticar; a luz do papel gerado (razao por quadro) multiplica o documento')


def k8_osoby():
    pw_, ph_ = 2097, 3281
    BLs, BRs = (135, 1331), (957, 1328)
    TLs0, TRs0 = (127, 298), (958, 293)
    kk = (831 / pw_ * ph_) / 1033.0
    TLs = (BLs[0] + (TLs0[0] - BLs[0]) * kk, BLs[1] + (TLs0[1] - BLs[1]) * kk)
    TRs = (BRs[0] + (TRs0[0] - BRs[0]) * kk, BRs[1] + (TRs0[1] - BRs[1]) * kk)
    sx = 831 / pw_
    line_x0 = TLs[0] + 220 * sx
    line_y = TLs[1] + 2623 * (BLs[1] - TLs[1]) / ph_
    zK = 2.45
    # quad em coords do STILL (z=1, x0=4): a camera do Remotion empurra de 1,0 ate 2,45 no ponto (line_x0, line_y)
    return dict(doc='cz1920_8', size=[pw_, ph_], quad=to_frame([TLs, TRs, BRs, BLs], 1.0, 4, 0),
                alvo_sluha=[round(float(line_x0 - 4), 1), round(float(line_y), 1)], zoom_final=zK,
                camera_k8=dict(z=zK, x0=round(float(line_x0 - 160 / zK - 4), 1), y0=round(float(line_y - 850 / zK), 1)),
                nota='K8: pagina OSOBY na folha em branco do Z16; push 1,0 -> 2,45 (nativo) ate Robotsky sluha')


def k3_roboti():
    quadS = [(190, 578), (1015, 505), (1005, 1432), (182, 1336)]
    quad = to_frame(quadS, 1.0, 4, 0)
    PW, PH = 1000, 1100
    S, theta, pad = 250, 20.0, 40
    f = font(FD + 'Fixture-CondensedBlack.ttf', S)
    word = 'ROBOTI'
    bb = f.getbbox(word)
    capH = bb[3] - bb[1]
    xl = pad + f.getlength(word[:-1])
    wI = f.getlength('I')
    import cv2
    Mq = cv2.getPerspectiveTransform(np.float32([(0, 0), (PW, 0), (PW, PH), (0, PH)]), np.float32(quad))
    v = np.linalg.inv(Mq) @ np.array([718 - 4, 848 - 0, 1.0])
    bpt = v[:2] / v[2]
    t = np.deg2rad(theta)
    R = np.array([[np.cos(t), -np.sin(t)], [np.sin(t), np.cos(t)]])
    loc = np.array([xl + wI / 2, pad + capH * 0.70])
    off = bpt - R @ loc
    base_left = R @ np.array([pad - bb[0], pad + capH]) + off     # canto esquerdo da linha de base, no plano
    return dict(quad=quad, plano=[PW, PH], fonte='Fixture-CondensedBlack', size=S, angulo=theta,
                base_esq=[round(float(base_left[0]), 1), round(float(base_left[1]), 1)],
                pincel=[round(float(bpt[0]), 1), round(float(bpt[1]), 1)],
                largura=round(float(f.getlength(word)), 1), largura_ate_T=round(float(xl - pad), 1),
                nota='K3: ROBOTI na diagonal da tela, write-on da esquerda p/ direita; o I termina sob o pincel do H3')


def k2_capa():
    # capa real (scan cz1920_2, cortada 148 px a esquerda) num livro retrato 560 px, girado -1,2 graus, em (262,566) da fonte
    import cv2
    cw, ch = 2224 - 148, None
    return dict(doc='cz1920_2', x=262 - 4, y=566, w=560, rot=-1.2, crop_esq=148,
                nota='K2: na montagem a capa nitida volta por cima do clipe; as maos do H3 por cima dela (matte de pele y>1250)')


if __name__ == '__main__':
    q = dict(patent=k4_patent(), osoby=k8_osoby(), roboti=k3_roboti(), capa=k2_capa(),
             briullov=dict(doc='briullov', size=[2560, 1903], quad=None, nota='preencher depois de escolher o Z17v2 (cantos da tela nua)'))
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    json.dump(q, open(OUT, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    print(json.dumps(q, ensure_ascii=False)[:1500])
