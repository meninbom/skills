# VFX em 4 camadas (glow, rim, meio, miolo) desenhadas como pinceladas, à moda das contas de efeitos visuais para Roblox.
# Cada camada é um PNG branco com alfa (a cor vem do ParticleEmitter), pra recolorir à vontade.
# Uso: python desenhar.py   -> grava os PNGs e a folha de conferência _folha.png nesta pasta.
import math, os, random
os.chdir(os.path.dirname(os.path.abspath(__file__)))
from PIL import Image, ImageDraw, ImageFilter
S = 512
def novo(): return Image.new("L", (S, S), 0)
def salva(a, nome):
    im = Image.new("RGBA", (S, S), (255, 255, 255, 0)); im.putalpha(a); im.save(nome)
def pincel(d, pts, w0, w1, v=255):
    # traço afinando de w0 até w1 ao longo dos pontos
    n = len(pts)
    for i in range(n - 1):
        t = i / (n - 1); w = w0 + (w1 - w0) * t
        d.line([pts[i], pts[i + 1]], fill=v, width=max(1, int(w)))
        r = w / 2; x, y = pts[i]; d.ellipse([x - r, y - r, x + r, y + r], fill=v)
def raio(c, ang, L, curva, n=14):
    pts = []
    for i in range(n):
        t = i / (n - 1); a = ang + curva * t * t
        pts.append((c[0] + math.cos(a) * L * t, c[1] + math.sin(a) * L * t))
    return pts
C = (S / 2, S / 2)

def estouro(seed):
    R = random.Random(seed)
    angs = [i * 2 * math.pi / 9 + R.uniform(-0.25, 0.25) for i in range(9)]
    Ls = [R.uniform(150, 235) for _ in angs]; cv = [R.uniform(-0.35, 0.35) for _ in angs]
    # meio: pinceladas grossas que afinam
    meio = novo(); d = ImageDraw.Draw(meio)
    for a, L, k in zip(angs, Ls, cv): pincel(d, raio(C, a, L, k), 70, 4)
    d.ellipse([C[0]-80, C[1]-80, C[0]+80, C[1]+80], fill=255)
    # rim: o contorno da mesma forma (dilata - original), traço de tinta
    big = meio.filter(ImageFilter.MaxFilter(15))
    rim = Image.eval(Image.composite(big, novo(), big), lambda v: v)
    rim = Image.fromarray(__import__("numpy").clip(__import__("numpy").asarray(big, float) - __import__("numpy").asarray(meio, float) * 0.85, 0, 255).astype("uint8"))
    # miolo: estrela menor, branca quente
    mio = novo(); d = ImageDraw.Draw(mio)
    for a, L, k in zip(angs, Ls, cv): pincel(d, raio(C, a, L * 0.45, k * 0.6, 10), 30, 2)
    d.ellipse([C[0]-42, C[1]-42, C[0]+42, C[1]+42], fill=255); mio = mio.filter(ImageFilter.GaussianBlur(2))
    # glow: mancha macia grande
    glow = big.filter(ImageFilter.GaussianBlur(38)); glow = Image.eval(glow, lambda v: int(v * 0.8))
    return glow, rim.filter(ImageFilter.GaussianBlur(1)), meio.filter(ImageFilter.GaussianBlur(1.2)), mio

def chama(seed):
    R = random.Random(seed)
    meio = novo(); d = ImageDraw.Draw(meio)
    base = (S / 2, S * 0.88)
    for i in range(7):
        x0 = base[0] + R.uniform(-90, 90); L = R.uniform(260, 400); sway = R.uniform(-0.6, 0.6)
        pts = [(x0 + math.sin(t * 3 + sway * 4) * 40 * t, base[1] - L * t) for t in [j / 15 for j in range(16)]]
        pincel(d, pts, R.uniform(70, 110), 3)
    import numpy as np
    big = meio.filter(ImageFilter.MaxFilter(13))
    rim = Image.fromarray(np.clip(np.asarray(big, float) - np.asarray(meio, float) * 0.85, 0, 255).astype("uint8"))
    mio = novo(); d = ImageDraw.Draw(mio)
    for i in range(3):
        x0 = base[0] + R.uniform(-40, 40); L = R.uniform(150, 220)
        pts = [(x0 + math.sin(t * 3) * 20 * t, base[1] - 10 - L * t) for t in [j / 12 for j in range(13)]]
        pincel(d, pts, 55, 2)
    glow = big.filter(ImageFilter.GaussianBlur(40)); glow = Image.eval(glow, lambda v: int(v * 0.75))
    return glow, rim.filter(ImageFilter.GaussianBlur(1)), meio.filter(ImageFilter.GaussianBlur(1.2)), mio.filter(ImageFilter.GaussianBlur(2))

def faisca(seed):
    R = random.Random(seed)
    meio = novo(); d = ImageDraw.Draw(meio)
    pincel(d, [(S*0.5, S*0.1 + i * S*0.8/12) for i in range(13)], 6, 60)  # gota que engrossa
    import numpy as np
    big = meio.filter(ImageFilter.MaxFilter(11))
    rim = Image.fromarray(np.clip(np.asarray(big, float) - np.asarray(meio, float) * 0.85, 0, 255).astype("uint8"))
    mio = novo(); d = ImageDraw.Draw(mio); pincel(d, [(S*0.5, S*0.45 + i * S*0.4/8) for i in range(9)], 3, 26)
    glow = big.filter(ImageFilter.GaussianBlur(30))
    return glow, rim, meio.filter(ImageFilter.GaussianBlur(1)), mio.filter(ImageFilter.GaussianBlur(1.5))

for nome, fn in (("estouro", estouro), ("chama", chama), ("faisca", faisca)):
    for k, a in zip(("glow", "rim", "meio", "miolo"), fn(7)): salva(a, f"{nome}_{k}.png")
# folha de conferência (camadas coloridas empilhadas)
from PIL import Image as I
folha = I.new("RGB", (S * 3, S), (20, 22, 30))
cores = {"glow": (255, 120, 30), "rim": (120, 30, 10), "meio": (255, 170, 40), "miolo": (255, 250, 220)}
for i, nome in enumerate(("estouro", "chama", "faisca")):
    for k in ("glow", "rim", "meio", "miolo"):
        a = I.open(f"{nome}_{k}.png").split()[3]
        cor = I.new("RGB", (S, S), cores[k]); folha.paste(cor, (i * S, 0), a)
folha.save("_folha.png"); print("ok")
