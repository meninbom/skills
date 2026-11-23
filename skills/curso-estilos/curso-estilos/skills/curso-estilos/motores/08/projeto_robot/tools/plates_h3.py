"""Placas de entrada do H3 (robot, CARNE E NEVE).

Cada placa = o ENQUADRAMENTO FINAL do quadro-chave (mesmo view() dos styleframes), sem texto, sem documento*
e sem grade, em 1120x1920 (= 7:12, o mesmo aspecto de 448x768): o H3 nao corta nada, o upscale volta
para 1120x1920 e o Remotion corta 20 px de cada lado (objectFit cover em 1080) -> bate pixel a pixel com o styleframe.
(*excecao: Z03 leva a capa real composta, para a luz e as maos do H3 conversarem com o livro; na montagem a capa
 nitida e recomposta por cima com o matte das maos.)

Tambem grava, para a previa antes dos clipes: public/stills/<id>.jpg (placa com grade2 via LUT) e, nos planos do
heroi, public/stills/<id>_matte.png (matte do heroi no mesmo enquadramento, para o tipo atras da cabeca).

uso: python plates_h3.py            (todas)      python plates_h3.py Z01a Z04   (algumas)
"""
import sys, os, numpy as np, cv2

HERE = os.path.dirname(os.path.abspath(__file__))
ROBOT = os.path.abspath(os.path.join(HERE, '..', '..'))
sys.path.insert(0, os.path.join(ROBOT, '_build'))
from lib import load, save, grade, W, H  # noqa: E402
from frames import view, Z, RAW  # noqa: E402
from frames2 import lum, view1  # noqa: E402
from frames3 import extend_top, desk_light  # noqa: E402
from scipy import ndimage  # noqa: E402

PW, PH = 1120, 1920            # placa 7:12
PAD = (PW - W) // 2            # 20 px de cada lado alem do quadro final
OUT_H3 = os.path.join(ROBOT, 'h3_in')
OUT_ST = os.path.join(ROBOT, 'projeto', 'public', 'stills')

# stills novos escolhidos (zimg/), preenchido depois da revisao da fila jobs6
ESCOLHA = {
    'Z02': 'Z02v2_1221',   # corpo inteiro no palco, ~80% da altura, janela a esquerda, lampada de servico a direita
    'Z06': 'Z06v2_1622',   # servo da frente grande, fila atras, feitor a cavalo, casa senhorial no alto (tilt)
    'Z08': 'Z08v2_1821',   # mao grande com veias na luz da janela (palma para baixo: os dedos fecham sobre a mesa)
    'Z09': 'Z09v2_1922',   # o da frente maior e centrado, fileiras identicas atras
    'Z10': 'Z10v2_2021',   # mais ceu no terco de cima (HRADEC KRALOVE no plano 18), sem placa
    'Z12': 'Z12v2_2222',   # padeiro maior, rindo com a touca; espelho de lampadas a direita
    'Z14': 'Z14v2_2422',   # robo de lata maior, engrenagem do peito legivel (punch)
}


def vw(src, z, x0, y0):
    """view() do styleframe, alargado 20 px de cada lado (em coords de saida)."""
    return view(src, z, x0 - PAD / z, y0, out=(PW, PH))


def pad_still(name):
    a = load(Z + name + '.png')                      # 1088x1920
    h, w = a.shape[:2]
    x0 = (w - W) / 2                                 # centro de 1080 = o que o styleframe usa (x0=4)
    return vw(a, 1.0, x0, 0)


def hero_matte(name, ext, z, x0, y0):
    m = cv2.imread(Z + name + '_matte.png', 0).astype(np.float32) / 255
    yy, xx = np.mgrid[0:m.shape[0], 0:m.shape[1]]
    m = m * ((xx >= 190) | (yy > 1250))
    m = np.concatenate([np.zeros((ext, m.shape[1]), np.float32), m], 0)
    M = np.float32([[z, 0, -(x0 - PAD / z) * z], [0, z, -y0 * z]])
    return np.clip(cv2.warpAffine(m, M, (PW, PH), flags=cv2.INTER_LINEAR), 0, 1)


# ------------------------------------------------------------------ heroi
def p_Z01a():  # K1: olhos meio abertos, olhar na janela
    src = load(Z + 'Z01v2_half_1101_clean.png')
    can = extend_top(src, 200, 320)
    return vw(can, 1.2, 188, 52), hero_matte('Z01v2_half_1101_clean', 320, 1.2, 188, 52)


def p_Z01b():  # plano 28: mesmo enquadramento do K1 (ROBO no mesmo lugar), olhos ja na lente
    src = load(Z + 'Z01v2_open_1101_clean.png')
    can = extend_top(src, 200, 320)
    return vw(can, 1.2, 188, 52), hero_matte('Z01v2_open_1101_clean', 320, 1.2, 188, 52)


def p_Z01c():  # K6: olhos na lente, parede alta para a foto da Theatre Guild
    src = load(Z + 'Z01v2_open_1101_clean.png')
    ext, z, x0 = 560, 1.1, 106
    y0 = 600 + ext - 1112 / z
    can = extend_top(src, 200, ext)
    return vw(can, z, x0, y0), hero_matte('Z01v2_open_1101_clean', ext, z, x0, y0)


# ------------------------------------------------------------------ cenas com quadro-chave
def p_Z03():  # K2: mesa vista de cima, livro gerado trocado pela capa real (mesmo codigo do frames3.k2, sem grade/texto)
    src = load(Z + 'Z03v3_1312.png')
    h, w = src.shape[:2]
    Ls = lum(src)
    sat = src.max(2) - src.min(2)
    desk = (Ls > 0.45) & (sat < 0.12)
    desk[:240] = False; desk[1360:] = False
    desk[600:1040, 250:830] = False
    illum = desk_light(src, desk)
    reg = np.zeros((h, w), np.float32); reg[598:1048, 258:884] = 1
    regf = cv2.GaussianBlur(reg, (0, 0), 4)
    med = np.median(src[desk], axis=0).astype(np.float32)
    cl = cv2.warpAffine(src, np.float32([[1, 0, 0], [0, 1, -440]]), (w, h), borderMode=cv2.BORDER_REFLECT)
    hf = cl - cv2.GaussianBlur(cl, (0, 0), 4)
    synth = np.clip(med[None, None, :] * illum[..., None] + hf, 0, 1)
    src = src * (1 - regf[..., None]) + synth * regf[..., None]
    Ls = lum(src)
    r, b = src[..., 0], src[..., 2]
    sk = ((r - b > 0.06) & (Ls > 0.28)).astype(np.uint8); sk[:1300] = 0
    sk = ndimage.binary_opening(sk, np.ones((3, 3)))
    sk = ndimage.binary_fill_holes(ndimage.binary_closing(sk, np.ones((9, 9)))).astype(np.float32)
    hand = cv2.GaussianBlur(sk, (0, 0), 1.0)
    cov = load(RAW + 'cz1920_2.jpg')[:, 148:]
    bw, bh = 560, int(round(560 * cov.shape[0] / cov.shape[1]))
    bx, by = 262, 566
    covr = grade(cv2.resize(cov, (bw, bh), interpolation=cv2.INTER_AREA), white=236, black=16, sat=0.95, split=0.0, mid=0.0)
    rim = np.ones((bh, bw), np.float32)
    rim[:, -4:] *= 0.72; rim[-4:, :] *= 0.72; rim[:, :2] *= 0.85; rim[:2, :] *= 0.9
    covr = covr * rim[..., None]
    alpha = np.zeros((h, w), np.float32); alpha[by:by + bh, bx:bx + bw] = 1
    alpha = cv2.GaussianBlur(alpha, (0, 0), 0.6)
    lay = np.zeros_like(src); lay[by:by + bh, bx:bx + bw] = covr
    Mr = cv2.getRotationMatrix2D((bx + bw / 2, by + bh / 2), 1.2, 1.0)
    lay = cv2.warpAffine(lay, Mr, (w, h)); alpha = cv2.warpAffine(alpha, Mr, (w, h))
    lay = lay * np.clip(0.30 + 0.70 * illum, 0.25, 1.35)[..., None]
    shs = cv2.warpAffine(alpha, np.float32([[1, 0, 24], [0, 1, 15]]), (w, h))
    shs = cv2.GaussianBlur(shs, (0, 0), 2.6) * (1 - alpha) * 0.55
    out = src * (1 - shs[..., None])
    out = out * (1 - alpha[..., None]) + lay * alpha[..., None]
    hs = cv2.warpAffine(hand, np.float32([[1, 0, 20], [0, 1, 12]]), (w, h))
    hs = cv2.GaussianBlur(hs, (0, 0), 3.0) * alpha * (1 - hand) * 0.5
    out = out * (1 - hs[..., None])
    out = out * (1 - hand[..., None]) + src * hand[..., None]
    return vw(np.clip(out, 0, 1), 1.0, 4, 0)


def p_Z04():  # K3: ateliê limpo (mastro/garra do cavalete e po apagados), tela nua
    from k3v2 import clean_src
    return vw(clean_src(), 1.0, 4, 0)


def p_Z05():  # K4: quadro de avisos, papel em branco (a luz dele vai para o Patent na montagem)
    src = load(Z + 'Z05v2_1511.png')
    z, x0 = 1.12, 60
    y0 = 381 - 430 / z
    return vw(src, z, x0, y0)


def p_Z07a():  # K5: geada de samambaia + servo no vidro limpo (meia-lua apagada)
    from k5v2 import clean_src
    return vw(clean_src(), 1.1, 50, 40)


def p_Z11():  # K7: ombro de la, reenquadrado 1,15x, flocos-pipoca encolhidos
    from k78v2 import shrink_flakes
    src = load(Z + 'Z11_2101.png')
    coat = cv2.GaussianBlur(lum(src), (0, 0), 8) < 0.30
    return vw(shrink_flakes(src, coat), 1.15, 120, 250)


def _new(key):
    def f():
        return pad_still(ESCOLHA[key])
    return f


PLATES = {
    'Z01a': p_Z01a, 'Z01b': p_Z01b, 'Z01c': p_Z01c,
    'Z02': _new('Z02'), 'Z03': p_Z03, 'Z04': p_Z04, 'Z05': p_Z05, 'Z06': _new('Z06'),
    'Z07a': p_Z07a, 'Z08': _new('Z08'), 'Z09': _new('Z09'), 'Z10': _new('Z10'),
    'Z11': p_Z11, 'Z12': _new('Z12'), 'Z14': _new('Z14'),
}
NOITE = {'Z07a', 'Z10', 'Z11'}


def main(keys):
    sys.path.insert(0, HERE)
    from lut import apply_grade
    os.makedirs(OUT_H3, exist_ok=True); os.makedirs(OUT_ST, exist_ok=True)
    for k in keys:
        r = PLATES[k]()
        plate, matte = (r if isinstance(r, tuple) else (r, None))
        assert plate.shape[:2] == (PH, PW), (k, plate.shape)
        save(plate, os.path.join(OUT_H3, f'robot_{k}.png'))
        # previa: placa com a grade do filme, recortada no quadro final 1080x1920
        g = apply_grade(plate[:, PAD:PAD + W], key=k)
        save(g, os.path.join(OUT_ST, f'{k}.jpg'), q=93)
        if matte is not None:   # RGBA: alfa = heroi (o CSS mask-image le o alfa)
            a8 = (matte[:, PAD:PAD + W] * 255).astype(np.uint8)
            cv2.imwrite(os.path.join(OUT_ST, f'{k}_matte.png'), np.dstack([np.full_like(a8, 255)] * 3 + [a8]))
        print('ok', k, flush=True)


if __name__ == '__main__':
    main(sys.argv[1:] or list(PLATES))
