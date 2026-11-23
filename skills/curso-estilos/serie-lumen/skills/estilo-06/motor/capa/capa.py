"""Capa do episódio no estilo RPG: 1 quadro em tela cheia + "EP. N" dourado grande (+ "PARTE N") + o nome da série,
tudo dentro do recorte 3:4 do grid do Instagram (y 240–1680 do 1080x1920). Sem título do episódio e sem spoiler:
a capa mostra só o começo. Gera uma opção por linha de OP e uma folha com todas lado a lado.
uso: python capa.py <pasta do episódio> <nº do ep> ["NOME DA SÉRIE"]      (edite OP abaixo: quais quadros e onde vai o texto)
"""
import os, sys
import numpy as np, cv2
from PIL import Image, ImageDraw
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'montagem'))
from comum import ouro, cola  # noqa: E402
if len(sys.argv) < 3: raise SystemExit(__doc__)
EP6 = os.path.abspath(sys.argv[1]); N_EP = sys.argv[2]; SERIE_TXT = sys.argv[3] if len(sys.argv) > 3 else 'O MUNDO DE LUMEN'
AQUI = os.path.join(EP6, 'capa'); os.makedirs(AQUI, exist_ok=True)
W, H = 1080, 1920
CREME = ((250, 250, 245), (232, 226, 210), (180, 168, 150)); LINHA = (232, 182, 80, 255)


def cobre(img, z, cx, cy):
    h, w = img.shape[:2]; s = max(W / w, H / h) * z
    img = cv2.resize(img, (round(w * s), round(h * s)), interpolation=cv2.INTER_LANCZOS4)
    h, w = img.shape[:2]; x0 = int(min(max(cx * w - W / 2, 0), w - W)); y0 = int(min(max(cy * h - H / 2, 0), h - H))
    return img[y0:y0 + H, x0:x0 + W]


# nome da opção: (quadro, parte [0 = sem "PARTE N"], zoom, cx, cy, onde vai o texto: 'baixo' | 'baixo2' | 'cima' | 'meio', pad)
# pad = px de céu acrescentados em cima (espelho borrado) pra descer a cabeça do personagem pra dentro do recorte 3:4
OP = {'A': ('S01', 0, 1.0, 0.5, 0.5, 'baixo', 0), 'B': ('S02', 0, 1.0, 0.5, 0.0, 'baixo', 150)}


def le(q, pad):
    im = cv2.imread(os.path.join(EP6, 'quadros', f'{q}.png'))
    if not pad: return im
    im2 = np.vstack([cv2.flip(im[:pad], 0), im]).astype(np.float32); bl = cv2.GaussianBlur(im2, (0, 0), 18)
    a = np.clip((np.arange(im2.shape[0]) - (pad - 90)) / 180.0, 0, 1)[:, None, None]      # borrado em cima, passando pro original sem emenda
    return (bl * (1 - a) + im2 * a).clip(0, 255).astype(np.uint8)
for nome, (q, parte, z, cx, cy, onde, pad) in OP.items():
    img = cobre(le(q, pad), z, cx, cy).astype(np.float32); yy = np.arange(H)[:, None, None] / H
    g = {'baixo': np.clip((yy - 0.52) / 0.30, 0, 1) ** 1.3 * 0.75, 'baixo2': np.clip((yy - 0.66) / 0.20, 0, 1) ** 1.2 * 0.78,
         'cima': np.clip((0.40 - yy) / 0.26, 0, 1) ** 1.2 * 0.7, 'meio': np.exp(-((yy - 0.45) / 0.07) ** 2) * 0.45}[onde]
    img = (img * (1 - g)).clip(0, 255).astype(np.uint8)
    cam = Image.fromarray(cv2.cvtColor(img, cv2.COLOR_BGR2RGB)).convert('RGBA'); d = ImageDraw.Draw(cam)
    # título do episódio na capa polui: só EP. N grande + PARTE N pequeno
    y_ep, y_parte, y_marca = {'baixo': (1290, 1430, 1625), 'baixo2': (1440, 1570, 1650), 'cima': (380, 520, 640), 'meio': (740, 875, 965)}[onde]
    cola(cam, ouro(f'EP. {N_EP}', 200), W // 2, y_ep)
    rot = ouro(f'PARTE {parte}', 60, cores=CREME); meia = rot.width // 2 + 26
    if parte: d.line((W // 2 - meia - 110, y_parte, W // 2 - meia, y_parte), fill=LINHA, width=3); d.line((W // 2 + meia, y_parte, W // 2 + meia + 110, y_parte), fill=LINHA, width=3)
    if parte: cola(cam, rot, W // 2, y_parte)
    cola(cam, ouro(SERIE_TXT, 40, cores=CREME, sombra=False), W // 2, y_marca)
    cam.convert('RGB').save(os.path.join(AQUI, f'capa_{nome}.jpg'), quality=94)
S = Image.new('RGB', (len(OP) * 370 + 10, 480 + 20), (12, 12, 12))
for i, n in enumerate(OP): S.paste(Image.open(os.path.join(AQUI, f'capa_{n}.jpg')).crop((0, 240, W, 1680)).resize((360, 480)), (10 + i * 370, 10))
S.save(os.path.join(AQUI, 'capas_opcoes.jpg'), quality=92); print('ok')
