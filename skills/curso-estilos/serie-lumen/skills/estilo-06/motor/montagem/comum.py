"""Peças comuns da montagem: fontes do pacote, letreiro dourado de jogo (ouro), colagem e o ataque de um som."""
import os, subprocess
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter

AQUI = os.path.dirname(os.path.abspath(__file__)); MOTOR = os.path.dirname(AQUI)
FONTES = os.environ.get('FONTES_DIR') or os.path.join(MOTOR, 'fontes')
SERIF = os.path.join(FONTES, 'YoungSerif-Regular.ttf')        # letreiro dourado (OFL)
SANS = os.path.join(FONTES, 'Montserrat-ExtraBold.ttf')       # HUD, selo, monitor (OFL)
MARROM = (52, 26, 10)
CREME = ((250, 246, 232), (232, 222, 200), (196, 180, 150))
_cache = {}


def fonte(px, arq=SANS):
    return ImageFont.truetype(arq, int(px))


def ouro(s, px, cores=((255, 240, 170), (245, 186, 60), (176, 96, 22)), contorno=None, sombra=True):
    """letreiro de jogo: degradê vertical, contorno marrom grosso, brilho fino em cima, sombra caída. Devolve RGBA."""
    px = max(8, int(px) // 2 * 2); chave = (s, px, cores, sombra)
    if chave in _cache: return _cache[chave]
    f = ImageFont.truetype(SERIF, px); sw = contorno or max(3, px // 9)
    l, t, r, b = f.getbbox(s); pad = sw + px // 4
    w, h = r - l + 2 * pad, b - t + 2 * pad
    m = Image.new('L', (w, h), 0); ImageDraw.Draw(m).text((pad - l, pad - t), s, font=f, fill=255)
    mo = Image.new('L', (w, h), 0); ImageDraw.Draw(mo).text((pad - l, pad - t), s, font=f, fill=255, stroke_width=sw, stroke_fill=255)
    y = np.linspace(0, 1, h)[:, None]
    c0, c1, c2 = (np.array(c, float) for c in cores)
    gr = np.where(y[..., None] < 0.5, c0 + (c1 - c0) * (y[..., None] / 0.5), c1 + (c2 - c1) * ((y[..., None] - 0.5) / 0.5))
    gr = np.repeat(gr, w, axis=1).clip(0, 255).astype(np.uint8)
    out = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    if sombra:
        sh = mo.filter(ImageFilter.GaussianBlur(px // 14 + 2)); som = Image.new('RGBA', (w, h), (0, 0, 0, 0))
        som.paste(Image.new('RGBA', (w, h), (10, 4, 0, 255)), (0, px // 12), sh.point(lambda v: int(v * 0.75)))
        out = Image.alpha_composite(out, som)
    out.paste(Image.new('RGBA', (w, h), MARROM + (255,)), (0, 0), mo)
    out.paste(Image.fromarray(gr, 'RGB').convert('RGBA'), (0, 0), m)
    # brilho: borda de cima da letra (máscara menos ela mesma deslocada pra baixo)
    hl = np.clip(np.array(m, int) - np.roll(np.array(m, int), max(2, px // 30), axis=0), 0, 255).astype(np.uint8)
    out.paste(Image.new('RGBA', (w, h), (255, 252, 225, 255)), (0, 0), Image.fromarray(hl).point(lambda v: int(v * 0.8)))
    _cache[chave] = out
    return out


def cola(cam, peca, x, y, anchor='mm', k=1.0, alpha=1.0):
    if k != 1.0: peca = peca.resize((max(1, int(peca.width * k)), max(1, int(peca.height * k))), Image.LANCZOS)
    if alpha < 1: peca = peca.copy(); peca.putalpha(peca.getchannel('A').point(lambda v: int(v * alpha)))
    x0 = x - peca.width // 2 if anchor[0] == 'm' else (x if anchor[0] == 'l' else x - peca.width)
    cam.alpha_composite(peca, (int(x0), int(y - peca.height // 2)))


def ataque_audio(arq, sr=8000):
    """segundo em que o som 'bate': 1º ponto acima de 30% do envelope, com 30 ms de folga antes.
    SFX se alinha por aqui, não pelo pico: alinhado pelo pico, o golpe soa atrasado."""
    x = np.abs(np.frombuffer(subprocess.check_output(['ffmpeg', '-v', 'error', '-i', arq, '-ac', '1', '-ar', str(sr), '-f', 's16le', '-']), np.int16).astype(np.float32))
    w = sr // 200; env = np.array([x[i:i + w].max() for i in range(0, len(x) - w, w)])
    if not len(env) or env.max() == 0: return 0.0
    i = int(np.argmax(env >= 0.3 * env.max()))
    return max(0, i * w / sr - 0.03)
