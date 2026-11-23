"""Atlas de roupa 512x512 -> moldes clássicos de Shirt e Pants do Roblox (585x559).

Uso: python montar_moldes.py atlas_teo.png teo      grava camisa_teo.png e calca_teo.png nesta pasta
Layout esperado do atlas (grade de 64 px): frente do tronco em (0,128)-(128,256), manga+mão em (128,128)-(192,256),
calça+tênis em (192,128)-(256,256). Se o seu atlas for diferente, ajuste os retângulos abaixo.
Nossa nota: roupa desenhada assim ficou fraca; vale mais como ponto de partida do que como resultado final.
"""
import os, sys
from PIL import Image

O = os.path.dirname(os.path.abspath(__file__))


def molde(atlas, rect_front, alvo):
    im = Image.open(atlas).convert('RGBA'); W = Image.new('RGBA', (585, 559), (0, 0, 0, 0))
    def crop(r, size): return im.crop(r).resize(size, Image.LANCZOS)
    cor = im.crop((40, 170, 88, 220)).resize((1, 1), Image.BOX).getpixel((0, 0))
    f = crop((0, 128, 128, 256), (128, 128)); W.paste(f, (231, 74)); W.paste(Image.new('RGBA', (128, 128), cor), (427, 74))  # costas = cor lisa
    side = crop((40, 150, 72, 250), (64, 128)); W.paste(side, (165, 74)); W.paste(side, (361, 74))
    W.paste(Image.new('RGBA', (128, 64), cor), (231, 8)); W.paste(Image.new('RGBA', (128, 64), cor), (231, 204))
    a = crop(rect_front, (64, 128))
    for x in (19, 85, 151, 217, 308, 374, 440, 506): W.paste(a, (x, 355))
    cap = crop((rect_front[0], rect_front[1], rect_front[2], rect_front[1] + 10), (64, 64))
    for x in (217, 308): W.paste(cap, (x, 289))
    bot = crop((rect_front[0], rect_front[3] - 8, rect_front[2], rect_front[3]), (64, 64))
    for x in (217, 308): W.paste(bot, (x, 485))
    W.save(alvo)


if len(sys.argv) < 3: raise SystemExit(__doc__)
atlas, nome = sys.argv[1], sys.argv[2]
molde(atlas, (128, 128, 192, 256), os.path.join(O, f'camisa_{nome}.png'))   # manga + mão
molde(atlas, (192, 128, 256, 256), os.path.join(O, f'calca_{nome}.png'))    # calça + tênis
print('ok', nome)
