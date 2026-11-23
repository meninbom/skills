"""Mattes por quadro para o tipo/foto ATRAS do heroi e para as maos por cima da capa.

- Z01a, Z01b, Z01c (e Z01a_rev): rembg (u2net_human_seg) em cada quadro do clipe tratado -> public/mattes/<id>/NNNN.png
  (RGBA branco com alfa = heroi; NNNN = quadro do clipe a 24 fps, o mesmo indice que o Robot.tsx pede)
- Z03_maos: pele (r-b) so na faixa de baixo (y > 1250, como o frames3.k2) -> public/mattes/Z03_maos/NNNN.png
Rodar DEPOIS do tratar_clipes.py. Depois: python preparar.py --sem-voz (inventario).

uso: python mattes.py [Z01a Z01b Z01c Z03_maos]
"""
import sys, os, numpy as np, cv2
from scipy import ndimage

HERE = os.path.dirname(os.path.abspath(__file__))
PUB = os.path.abspath(os.path.join(HERE, '..', 'public'))


def frames(path):
    cap = cv2.VideoCapture(path)
    ok, f = cap.read()
    while ok:
        yield cv2.cvtColor(f, cv2.COLOR_BGR2RGB)
        ok, f = cap.read()


def salvar(alpha, d, i):
    a8 = (np.clip(alpha, 0, 1) * 255).astype(np.uint8)
    cv2.imwrite(os.path.join(d, f'{i:04d}.png'), np.dstack([np.full_like(a8, 255)] * 3 + [a8]))


def heroi(key):
    from rembg import new_session, remove
    from PIL import Image
    sess = new_session('u2net_human_seg')
    src = os.path.join(PUB, 'clips', f'{key}.mp4')
    d = os.path.join(PUB, 'mattes', key); os.makedirs(d, exist_ok=True)
    prev = None
    for i, rgb in enumerate(frames(src)):
        m = np.asarray(remove(Image.fromarray(rgb), session=sess, only_mask=True)).astype(np.float32) / 255
        m = cv2.GaussianBlur(m, (0, 0), 1.0)
        if prev is not None:                       # estabiliza a borda (sem tremor de matte entre quadros)
            m = 0.6 * m + 0.4 * prev
        prev = m
        salvar(m, d, i)
    print('ok', key, i + 1, 'quadros')


def maos_z03():
    src = os.path.join(PUB, 'clips', 'Z03.mp4')
    d = os.path.join(PUB, 'mattes', 'Z03_maos'); os.makedirs(d, exist_ok=True)
    for i, rgb in enumerate(frames(src)):
        a = rgb.astype(np.float32) / 255
        L = 0.2126 * a[..., 0] + 0.7152 * a[..., 1] + 0.0722 * a[..., 2]
        sk = ((a[..., 0] - a[..., 2] > 0.06) & (L > 0.28)).astype(np.uint8)
        sk[:1250] = 0
        sk = ndimage.binary_opening(sk, np.ones((3, 3)))
        sk = ndimage.binary_fill_holes(ndimage.binary_closing(sk, np.ones((9, 9)))).astype(np.float32)
        salvar(cv2.GaussianBlur(sk, (0, 0), 1.0), d, i)
    print('ok Z03_maos', i + 1, 'quadros')


if __name__ == '__main__':
    keys = sys.argv[1:] or ['Z01a', 'Z01b', 'Z01c', 'Z03_maos']
    for k in keys:
        if k == 'Z03_maos':
            maos_z03()
        else:
            heroi(k)
            if k == 'Z01a' and os.path.exists(os.path.join(PUB, 'clips', 'Z01a_rev.mp4')):
                heroi('Z01a_rev')
