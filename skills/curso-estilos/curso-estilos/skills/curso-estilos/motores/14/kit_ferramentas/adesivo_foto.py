# Foto -> "foto-adesivo" do estilo emoji: retícula de pontos duotone (tinta sobre a cor do token clareada)
# + borda branca de adesivo recortado (cantos arredondados). Saída: PNG com transparência.
#
#   pip install numpy pillow scipy
#   python adesivo_foto.py foto.jpg saida.png --cor rosa --largura 1100
#
# --cor       rosa | azul | lima (um token por bloco de assunto)
# --largura   largura final em px. Use ~1,5x o tamanho que ele vai ocupar na tela (a câmera aproxima).
# --cel       tamanho da célula da retícula (9 p/ adesivo pequeno, 11-12 p/ grande)
# --gama      <1 clareia sombras (foto escura de noite: 0,55-0,7); >1 escurece (desenho/mapa: 1,2-1,4)
# --clareia   quanto o fundo do ponto é clareado (0,3 = cor forte; 0,6 = pastel)
import argparse
import numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage

TINTA = np.array([0x1B, 0x16, 0x31])
COR = {'rosa': (0xFF, 0x4F, 0xA3), 'azul': (0x31, 0x57, 0xFF), 'lima': (0x9A, 0xDB, 0x2A)}


def reticula(rgb, cel=11, ang=15, cor='rosa', clareia=0.5, gama=1.0):
    g = np.asarray(Image.fromarray(rgb).convert('L')).astype(float) / 255
    g = np.clip((g - 0.06) / 0.88, 0, 1) ** gama
    h, w = g.shape
    yy, xx = np.mgrid[0:h, 0:w].astype(float)
    t = np.deg2rad(ang)
    u = (xx * np.cos(t) + yy * np.sin(t)) / cel
    v = (-xx * np.sin(t) + yy * np.cos(t)) / cel
    d = np.sqrt((u - np.floor(u) - 0.5) ** 2 + (v - np.floor(v) - 0.5) ** 2)
    gs = ndimage.gaussian_filter(g, cel * 0.35)
    raio = np.sqrt(np.clip(1 - gs, 0, 1)) * 0.62          # escuro -> ponto grande
    a = np.clip((raio - d) * cel * 1.4 + 0.5, 0, 1)        # anti-alias ~1 px
    base = np.array(COR[cor], float) * (1 - clareia) + 255 * clareia
    return (base[None, None] * (1 - a[..., None]) + TINTA[None, None] * a[..., None]).astype(np.uint8)


def cantos(h, w, raio=8):
    m = np.ones((h, w), bool)
    yy, xx = np.mgrid[0:h, 0:w]
    for cy, cx in [(raio, raio), (raio, w - raio - 1), (h - raio - 1, raio), (h - raio - 1, w - raio - 1)]:
        zona = (abs(yy - cy) <= raio) & (abs(xx - cx) <= raio) & ((yy < raio) | (yy > h - raio - 1)) & ((xx < raio) | (xx > w - raio - 1))
        m[zona & (((yy - cy) ** 2 + (xx - cx) ** 2) > raio ** 2)] = False
    return m


def borda_branca(rgb, mask, borda=18):
    pad = borda + 6
    h, w = mask.shape
    M = np.zeros((h + 2 * pad, w + 2 * pad), bool); M[pad:pad + h, pad:pad + w] = mask
    R = np.zeros((h + 2 * pad, w + 2 * pad, 3), np.uint8); R[pad:pad + h, pad:pad + w] = rgb
    yy, xx = np.mgrid[-borda:borda + 1, -borda:borda + 1]
    Mb = ndimage.binary_dilation(M, structure=(xx ** 2 + yy ** 2) <= borda ** 2)
    al_b = np.asarray(Image.fromarray((Mb * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(0.8))).astype(float) / 255
    al_i = np.asarray(Image.fromarray((M * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(0.6))).astype(float) / 255
    col = R.astype(float) * al_i[..., None] + 255 * (1 - al_i[..., None])
    return Image.fromarray(np.dstack([col, al_b * 255]).astype(np.uint8), 'RGBA')


if __name__ == '__main__':
    ap = argparse.ArgumentParser()
    ap.add_argument('entrada'); ap.add_argument('saida')
    ap.add_argument('--cor', default='rosa', choices=COR)
    ap.add_argument('--largura', type=int, default=1100)
    ap.add_argument('--cel', type=int, default=11)
    ap.add_argument('--gama', type=float, default=1.0)
    ap.add_argument('--clareia', type=float, default=0.5)
    a = ap.parse_args()
    im = Image.open(a.entrada).convert('RGB')
    im = im.resize((a.largura, round(im.height * a.largura / im.width)), Image.LANCZOS)
    r = reticula(np.asarray(im), cel=a.cel, cor=a.cor, clareia=a.clareia, gama=a.gama)
    borda_branca(r, cantos(*r.shape[:2])).save(a.saida)
    print('ok', a.saida)
