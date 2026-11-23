"""Grade do filme (lib.grade2 dos styleframes aprovados) como funcao e como LUT 3D .cube.

A grade2 e ponto a ponto em RGB (curva S, saturacao com faixa de pele preservada, split tone ardosia, niveis 12-242),
entao cabe inteira numa LUT 3D: o ffmpeg aplica nos clipes do H3 com lut3d (rapido e identico ao still).
A vinheta e o grao NAO entram aqui: sao camadas do Remotion (Grao.tsx / Vinheta), por cima de tudo, como no finish2().

uso: python lut.py   -> projeto/luts/<id>.cube (um por clipe, com a exposicao/noite de cada quadro-chave)
"""
import sys, os, numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
ROBOT = os.path.abspath(os.path.join(HERE, '..', '..'))
sys.path.insert(0, os.path.join(ROBOT, '_build'))
from lib import grade2  # noqa: E402

LUTS = os.path.join(ROBOT, 'projeto', 'luts')

# parametros por plano, copiados dos styleframes (frames3/k3v2/k4v2/k5v2/k78v2)
PARAMS = {
    'dia': dict(expo=1.04),
    'Z01a': dict(expo=1.06), 'Z01b': dict(expo=1.06), 'Z01c': dict(expo=1.06),
    'Z02': dict(expo=1.04), 'Z03': dict(expo=1.04), 'Z04': dict(expo=1.06), 'Z05': dict(expo=1.02),
    'Z06': dict(expo=1.02), 'Z08': dict(expo=1.04), 'Z09': dict(expo=1.04), 'Z12': dict(expo=1.04),
    'Z13': dict(expo=1.04), 'Z14': dict(expo=1.04), 'Z16': dict(expo=1.04), 'Z17': dict(expo=1.04),
    'Z07a': dict(night=True, sh=0.88, sat=0.62), 'Z07b': dict(night=True, sh=0.88, sat=0.62),
    'Z10': dict(night=True, sh=0.88), 'Z11': dict(night=True, sh=0.88, cool=True),
}


def _grade(a, cool=False, **kw):
    g = grade2(a.astype(np.float32), **kw)
    if cool:  # K7: sombras da la puxadas para frio (k78v2.k7)
        Y = (0.2126 * g[..., 0] + 0.7152 * g[..., 1] + 0.0722 * g[..., 2])[..., None]
        wsh = np.clip((0.72 - Y) / 0.25, 0, 1) * 0.7
        g = np.clip(g * (1 - wsh) + Y * np.array([0.97, 1.0, 1.05], np.float32) * wsh, 0, 1)
    return g


def apply_grade(img, key=None, noite=False):
    p = dict(PARAMS.get(key) or (dict(night=True, sh=0.88) if noite else PARAMS['dia']))
    return _grade(img, **p)


def write_cube(key, n=33):
    p = dict(PARAMS[key])
    v = np.linspace(0, 1, n, dtype=np.float32)
    b, g, r = np.meshgrid(v, v, v, indexing='ij')          # r varia mais rapido (ordem .cube)
    grid = np.stack([r, g, b], -1).reshape(n * n, n, 3)
    out = _grade(grid, **p).reshape(-1, 3)
    os.makedirs(LUTS, exist_ok=True)
    path = os.path.join(LUTS, f'{key}.cube')
    with open(path, 'w') as f:
        f.write(f'TITLE "robot {key} grade2"\nLUT_3D_SIZE {n}\nDOMAIN_MIN 0 0 0\nDOMAIN_MAX 1 1 1\n')
        for c in out:
            f.write(f'{c[0]:.6f} {c[1]:.6f} {c[2]:.6f}\n')
    return path


if __name__ == '__main__':
    for k in (sys.argv[1:] or list(PARAMS)):
        print(write_cube(k))
