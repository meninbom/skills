# rotulos da peca muda: titulo, contador de profundidade + palavra da camada, palavra final.
# Nunito Black branca, contorno escuro fino, sombra leve. Sem cor de destaque.
# uso: python run/legenda.py <dir_entrada> <dir_saida> [--force]   (os tamanhos sao relativos a altura do quadro)
import json, os, sys, math
from PIL import Image, ImageDraw, ImageFont, ImageFilter
HERE = os.path.dirname(os.path.abspath(__file__))
FPS = 24
src, dst = sys.argv[1], sys.argv[2]
os.makedirs(dst, exist_ok=True)
FONT = os.path.join(HERE, "..", "fonte", "Nunito.ttf")
TL = json.load(open(os.path.join(HERE, "tempos.json"), encoding="utf8"))
R = TL["rotulos"]
fonts = {}
def font(sz):
    if sz not in fonts:
        f = ImageFont.truetype(FONT, sz); f.set_variation_by_name("Black"); fonts[sz] = f
    return fonts[sz]

def ease_io(a, b, t):
    if t <= a: return 0.0
    if t >= b: return 1.0
    x = (t - a) / (b - a)
    return x * x * x * (x * (x * 6 - 15) + 10)

def linhas_do(r, t):
    """devolve [(texto, tamanho_rel)]"""
    if r.get("tipo") == "titulo":
        return [(l, 0.046) for l in r["linhas"]]
    if "conta" in r:
        a, b, c0, c1 = r["conta"]
        v = c0 + (c1 - c0) * ease_io(a, b, t)
        return [(f"{int(math.floor(v + 0.5))} m", 0.085), (r["palavra"], 0.042)]
    return [(r["grande"], 0.075)]

# poeira no ar (2D, deterministica): pontos quentes desfocados subindo devagar, com parallax
import random
_r = random.Random(72)
POEIRA = [(_r.random(), _r.random(), _r.uniform(0.6, 2.2), _r.uniform(0.004, 0.02), _r.uniform(0, 6.28)) for _ in range(46)]
def poeira(im, t):
    W, H = im.size
    lay = Image.new("RGBA", im.size, (0, 0, 0, 0)); d = ImageDraw.Draw(lay)
    for x0, y0, z, v, ph in POEIRA:
        x = (x0 * W + math.sin(t * 0.5 + ph) * 18 * z - t * 9 * z) % W
        y = (y0 * H - t * v * H * z * 0.5) % H
        r = 1.2 + 1.8 * z
        a = int(70 * (0.5 + 0.5 * math.sin(t * 1.3 + ph * 3)) * min(1, z / 1.2))
        d.ellipse((x - r, y - r, x + r, y + r), fill=(255, 214, 160, a))
    lay = lay.filter(ImageFilter.GaussianBlur(1.6))
    return Image.alpha_composite(im, lay)

files = sorted(f for f in os.listdir(src) if f.endswith(".png"))
for f in files:
    out = os.path.join(dst, f)
    if os.path.exists(out) and "--force" not in sys.argv: continue
    fr = int(f[2:7]); t = (fr - 1) / FPS
    im = Image.open(os.path.join(src, f)).convert("RGBA")
    W, H = im.size
    im = poeira(im, t)
    cur =next((r for r in R if r["t"][0] <= t < r["t"][1]), None)
    if cur:
        a, b = cur["t"]
        kin = min(1.0, (t - a) / 0.14); kout = min(1.0, (b - t) / 0.22)
        alpha = max(0.0, min(kin, kout))
        s = 1.0 + 0.10 * (1 - kin) ** 2
        lay = Image.new("RGBA", im.size, (0, 0, 0, 0)); d = ImageDraw.Draw(lay)
        sh = Image.new("RGBA", im.size, (0, 0, 0, 0)); ds = ImageDraw.Draw(sh)
        L = linhas_do(cur, t)
        y = H * (0.15 if cur.get("tipo") == "titulo" else 0.17)
        for txt, rel in L:
            sz = int(H * rel * s); ft = font(sz); sw = max(2, int(sz * 0.06))
            x0, y0, x1, y1 = d.textbbox((0, 0), txt, font=ft, stroke_width=sw)
            x = (W - (x1 - x0)) / 2 - x0
            A = int(255 * alpha)
            ds.text((x + sz * 0.03, y + sz * 0.06 - y0), txt, font=ft, fill=(0, 0, 0, int(140 * alpha)), stroke_width=sw, stroke_fill=(0, 0, 0, int(140 * alpha)))
            d.text((x, y - y0), txt, font=ft, fill=(255, 255, 255, A), stroke_width=sw, stroke_fill=(26, 22, 20, A))
            y += (y1 - y0) + sz * 0.18
        sh = sh.filter(ImageFilter.GaussianBlur(H * 0.004))
        im = Image.alpha_composite(Image.alpha_composite(im, sh), lay)
    im.convert("RGB").save(out)
print("ok", len(files))
