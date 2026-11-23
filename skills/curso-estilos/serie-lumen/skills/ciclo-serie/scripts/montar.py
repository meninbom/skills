"""montar: o vídeo MUDO do ep, plano por plano, a partir da linha do tempo (linha_voz.json).

uso: python montar.py <linha.json> <saida_base>                       -> <saida_base>_mudo.mp4 (vídeo inteiro)
     python montar.py <linha.json> <saida_base> --segs 3,7 --pasta D  -> D/seg_003.mp4, D/seg_007.mp4 (o ciclo emenda)

Imagem de cada plano (pasta do ep = "ep" da linha, ou a pasta onde a linha está):
  h3/clips60/<PLANO>.mp4  clipe de 60 qps, lido a 30 qps (vel = velocidade, ini = de onde começa);
  sem clipe: a placa gpt/<PLANO>.png (ou h3/placas/<PLANO>.png) com um empurrão lento de câmera.
Campos por segmento (todos opcionais, tempos em segundos dentro do plano):
  fx: ["congela", "glitch", "sepia", "frio", "flash_entrada"]   vivo: N (aproximação lenta; o ciclo põe)
  soco: 1.2                                 zoom-soco + flash de 2 quadros
  raiox: {t0, t1, titulo, linhas: [...], cx, cy}   bordas ciano + título + linhas com número em dourado
  aviso: {t, dur, texto}                    selo de buff carimbado ("◆ OLHO DO FALCÃO · ATIVO")
  selo:  {t0, t1, texto}                    selo do voto no topo
  cartoes: {t, op1: [titulo, sub], op2: [titulo, sub], chamada}   tela de escolha 1/2 por cima do plano
  loop: 0.5                                 funde no 1º quadro do vídeo nos últimos N s
  ui_dy: -200                               sobe cartões e o painel do raio-X (o ciclo põe)
Texto nunca entra nos 15% de baixo nem encosta na borda. Fonte = ferramentas.fonte do kit.config.json.
"""
import sys as _sys_utf8
for _s in (_sys_utf8.stdout, _sys_utf8.stderr):   # acento certo no terminal do Windows, inclusive nas mensagens de erro
    try: _s.reconfigure(encoding='utf-8')
    except Exception: pass
import os, sys, json, math, re, subprocess, zlib
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

AQUI = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, AQUI)
import kitcfg  # noqa: E402

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
FF = kitcfg.get('ferramentas.ffmpeg', 'ffmpeg'); FP = kitcfg.get('ferramentas.ffprobe', 'ffprobe')
W, H = 1080, 1920
UI_Y = int(H * 0.85) - 24          # nada de texto abaixo disso (UI do Instagram + folga)
MARGEM = 60                        # nada de texto mais perto da borda que isso

if len(sys.argv) < 3:
    raise SystemExit(__doc__)
LINHA_ARQ = os.path.abspath(sys.argv[1]); SAIDA = sys.argv[2]
LINHA = json.load(open(LINHA_ARQ, encoding='utf-8'))
EP = LINHA['ep'] if LINHA.get('ep') and os.path.isdir(LINHA['ep']) else os.path.dirname(LINHA_ARQ)
FPS = int(LINHA.get('fps', 30))
if (LINHA.get('w', W), LINHA.get('h', H)) != (W, H):
    print(f'aviso: a linha pede {LINHA.get("w")}x{LINHA.get("h")}; o montar faz sempre {W}x{H} (Reel 9:16).')
ARQS = {k: (v if os.path.isabs(v) else os.path.join(EP, v)) for k, v in LINHA.get('arquivos', {}).items()}


def ease(x): x = min(max(x, 0.0), 1.0); return 1 - (1 - x) ** 3
def ease_io(x): x = min(max(x, 0.0), 1.0); return x * x * (3 - 2 * x)


# ---------- fonte
_FONTE = kitcfg.get('ferramentas.fonte'); _fontes = {}; _avisou = []
def fonte(px):
    px = max(8, int(px))
    if px in _fontes: return _fontes[px]
    f = None
    if _FONTE and os.path.isfile(_FONTE):
        try: f = ImageFont.truetype(_FONTE, px)
        except OSError: f = None
    if f is None:
        if not _avisou:
            print('aviso: "ferramentas.fonte" não configurada ou não achada no kit.config.json; usando a fonte padrão do PIL.', flush=True)
            _avisou.append(1)
        try: f = ImageFont.load_default(size=px)
        except TypeError: f = ImageFont.load_default()
    _fontes[px] = f; return f


def largura(txt, f):
    l, t, r, b = ImageDraw.Draw(Image.new('L', (4, 4))).textbbox((0, 0), txt, font=f); return r - l


def cabe(txt, px, max_w, minimo=28):
    while px > minimo and largura(txt, fonte(px)) > max_w: px -= 2
    return px


# ---------- letreiro dourado (título de jogo): degradê vertical, contorno escuro, brilho em cima, sombra caída
_ouro = {}
OURO = ((255, 238, 168), (244, 184, 62), (170, 92, 24))
CREME = ((250, 246, 232), (234, 224, 202), (198, 182, 152))
def ouro(txt, px, cores=OURO, sombra=True, max_w=W - 2 * MARGEM):
    px = cabe(txt, int(px), max_w); chave = (txt, px, cores, sombra)
    if chave in _ouro: return _ouro[chave]
    f = fonte(px); borda = max(3, px // 10)
    l, t, r, b = ImageDraw.Draw(Image.new('L', (4, 4))).textbbox((0, 0), txt, font=f, stroke_width=borda)
    pad = borda + px // 5; w, h = r - l + 2 * pad, b - t + 2 * pad
    cheio = Image.new('L', (w, h), 0); ImageDraw.Draw(cheio).text((pad - l, pad - t), txt, font=f, fill=255)
    grosso = Image.new('L', (w, h), 0)
    ImageDraw.Draw(grosso).text((pad - l, pad - t), txt, font=f, fill=255, stroke_width=borda, stroke_fill=255)
    y = np.linspace(0, 1, h, dtype=np.float32)[:, None]
    c0, c1, c2 = (np.array(c, np.float32) for c in cores)
    cima = c0 + (c1 - c0) * (y / 0.5)[..., None]; baixo = c1 + (c2 - c1) * ((y - 0.5) / 0.5)[..., None]
    grad = np.where((y < 0.5)[..., None], cima, baixo)
    grad = np.repeat(grad, w, axis=1).clip(0, 255).astype(np.uint8)
    out = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    if sombra:
        sm = grosso.filter(ImageFilter.GaussianBlur(px // 14 + 2)).point(lambda v: int(v * 0.7))
        cam = Image.new('RGBA', (w, h), (0, 0, 0, 0)); cam.paste((12, 6, 0, 255), (0, max(2, px // 12)), sm)
        out = Image.alpha_composite(out, cam)
    out.paste((48, 24, 8, 255), (0, 0), grosso)
    out.paste(Image.fromarray(grad, 'RGB').convert('RGBA'), (0, 0), cheio)
    m = np.array(cheio, np.int16)
    brilho = np.clip(m - np.roll(m, max(2, px // 28), axis=0), 0, 255).astype(np.uint8)
    out.paste((255, 251, 228, 255), (0, 0), Image.fromarray(brilho).point(lambda v: int(v * 0.75)))
    _ouro[chave] = out; return out


def cola(fr, peca, cx, cy, alpha=1.0, k=1.0):
    if alpha <= 0: return
    if k != 1.0: peca = peca.resize((max(1, int(peca.width * k)), max(1, int(peca.height * k))), Image.BILINEAR)
    if alpha < 1: peca = peca.copy(); peca.putalpha(peca.getchannel('A').point(lambda v: int(v * alpha)))
    x = int(min(max(cx - peca.width / 2, 8), W - 8 - peca.width)); y = int(cy - peca.height / 2)
    fr.alpha_composite(peca, (x, y))


# ---------- fontes de imagem
def dur_arquivo(f):
    r = subprocess.run([FP, '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f], capture_output=True, text=True)
    try: return float(r.stdout.strip())
    except ValueError: return None


class Clipe:
    """lê o clipe em sequência (pouca memória): quadro(k) só anda pra frente; voltar reabre o arquivo"""
    def __init__(s, arq):
        s.arq = arq; d = dur_arquivo(arq) or 0.0; s.n = max(1, int(d * FPS)); s.p = None; s.i = -1; s.q = None

    def _abre(s):
        vf = f'fps={FPS},scale={W}:{H}:force_original_aspect_ratio=increase:flags=lanczos,crop={W}:{H}'
        s.p = subprocess.Popen([FF, '-v', 'error', '-i', s.arq, '-vf', vf, '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'],
                               stdout=subprocess.PIPE); s.i = -1

    def quadro(s, k):
        k = min(max(0, int(k)), s.n - 1)
        if s.p is None or k < s.i: s.fecha(); s._abre()
        while s.i < k:
            b = s.p.stdout.read(W * H * 3)
            if len(b) < W * H * 3:
                s.n = max(1, s.i + 1); break
            s.q = np.frombuffer(b, np.uint8).reshape(H, W, 3); s.i += 1
        if s.q is None: raise SystemExit(f'montar: não consegui ler quadros de {s.arq}')
        return s.q.copy()

    def fecha(s):
        if s.p:
            try: s.p.stdout.close()
            except OSError: pass
            s.p.kill(); s.p.wait(); s.p = None


_placas = {}
def placa(plano):
    if plano not in _placas:
        cands = [os.path.join(EP, 'gpt', f'{plano}.png'), os.path.join(EP, 'gpt', f'{plano}.jpg'), os.path.join(EP, 'h3', 'placas', f'{plano}.png')]
        arq = next((c for c in cands if os.path.exists(c)), None)
        if not arq: raise SystemExit(f'montar: plano {plano} sem clipe e sem placa (procurei gpt/{plano}.png e h3/placas/{plano}.png).')
        im = Image.open(arq).convert('RGB'); k = max(W / im.width, H / im.height) * 1.14
        _placas[plano] = im.resize((round(im.width * k), round(im.height * k)), Image.LANCZOS)
    return _placas[plano]


def quadro_placa(im, t):
    """empurrão lento em velocidade constante (placa parada nunca fica parada): aproxima ~2,5%/s e sobe ~1%/s.
    t = segundos dentro do plano (0 = congelado)."""
    z = 1.0 + min(0.25, 0.025 * t)
    cw, ch = W / z, H / z
    x0 = (im.width - cw) / 2 + min(0.04 * W, 0.004 * W * t); y0 = (im.height - ch) / 2 - 0.011 * H * t
    x0 = min(max(x0, 0), im.width - cw); y0 = min(max(y0, 0), im.height - ch)
    return np.array(im.resize((W, H), Image.BILINEAR, box=(x0, y0, x0 + cw, y0 + ch)))


# ---------- efeitos de imagem
yy, xx = np.mgrid[0:H, 0:W]
VIN = (1 - 0.36 * (((xx - W / 2) / (W / 2)) ** 2 + ((yy - H / 2) / (H / 1.6)) ** 2).clip(0, 1) ** 1.5)[..., None].astype(np.float32)
LUMA = np.array([0.3, 0.59, 0.11], np.float32)


def grao_vinheta(a, f):
    g = np.random.default_rng(f).normal(0, 7, (H // 2, W // 2, 1)).astype(np.float32)
    g = np.repeat(np.repeat(g, 2, 0), 2, 1)
    return ((a.astype(np.float32) + g) * VIN).clip(0, 255).astype(np.uint8)


def split_rgb(a, k):
    o = a.copy(); o[..., 0] = np.roll(a[..., 0], k, 1); o[..., 2] = np.roll(a[..., 2], -k, 1); return o


def glitch(a, forca, seed):
    g = np.random.default_rng(seed); o = a.copy()
    for _ in range(int(5 + 14 * forca)):
        y0 = int(g.integers(0, H - 20)); hh = int(g.integers(6, 20 + 80 * forca)); dx = int(g.integers(-1, 2) * g.integers(10, 30 + 140 * forca))
        o[y0:y0 + hh] = np.roll(o[y0:y0 + hh], dx, 1)
    o = split_rgb(o, int(4 + 18 * forca)); o[::3] = (o[::3] * (1 - 0.3 * forca)).astype(np.uint8)
    return o


def sepia(a):
    f = a.astype(np.float32); l = f @ LUMA
    o = np.stack([l * 1.07 + 18, l * 0.95 + 8, l * 0.78], -1)
    return (f * 0.25 + o * 0.75).clip(0, 255).astype(np.uint8)


def frio(a, k):
    f = a.astype(np.float32); l = f @ LUMA
    return (f * (1 - k) + np.stack([l * 0.92, l * 0.98, l * 1.1], -1) * k).clip(0, 255).astype(np.uint8)


def empurra(a, z):
    if z <= 1.0001: return a
    cw, ch = int(W / z), int(H / z); x0, y0 = (W - cw) // 2, (H - ch) // 2
    return np.array(Image.fromarray(a[y0:y0 + ch, x0:x0 + cw]).resize((W, H), Image.BILINEAR))


def flash(a, k, cor=(255, 250, 240)):
    if k <= 0: return a
    return (a.astype(np.float32) * (1 - k) + np.array(cor, np.float32) * k).astype(np.uint8)


def bordas(a):
    l = a.astype(np.float32) @ LUMA
    gx = np.zeros_like(l); gy = np.zeros_like(l)
    gx[:, 1:-1] = l[:, 2:] - l[:, :-2]; gy[1:-1, :] = l[2:, :] - l[:-2, :]
    return np.clip(np.sqrt(gx * gx + gy * gy) / 28.0, 0, 1)


def raiox_img(a, t):
    """a cena vira raio-X: bordas claras em ciano sobre fundo escuro + linhas de varredura + uma faixa que desce"""
    l = a.astype(np.float32) @ LUMA / 255.0; e = bordas(a)
    v = np.clip((1 - l) * 0.3 + e * 1.4, 0, 1)
    o = np.stack([v * 110, v * 225, v * 255], -1) + np.array([4, 10, 22], np.float32)
    o[::3] *= 0.8
    yb = (t / 1.3 % 1.0) * (H + 300) - 150
    faixa = np.exp(-((np.arange(H, dtype=np.float32) - yb) / 55.0) ** 2)[:, None, None]
    o += faixa * np.array([30, 80, 95], np.float32) + faixa * o * 0.6
    return o.clip(0, 255).astype(np.uint8)


# ---------- camadas de texto/HUD (PIL RGBA)
def caixa(d, x0, y0, x1, y1, al, borda=(214, 170, 80), fundo=(10, 14, 20), r=18, w=3):
    d.rounded_rectangle((x0, y0, x1, y1), r, fill=fundo + (int(185 * al),), outline=borda + (int(230 * al),), width=w)


def selo(fr, txt, al):
    if al <= 0: return fr
    d = ImageDraw.Draw(fr, 'RGBA'); px = cabe(txt, 40, W - 2 * MARGEM - 60); f = fonte(px)
    l, t, r, b = d.textbbox((0, 0), txt, font=f); w = r - l + 60; h = b - t + 34; x, y = (W - w) // 2, 150
    caixa(d, x, y, x + w, y + h, al)
    d.text((x + 30 - l, y + 17 - t), txt, font=f, fill=(250, 240, 215, int(255 * al)))
    return fr


def aviso(fr, txt, s, dur, chave):
    """selo de buff com cara de IMPRESSO: entra carimbado (escala 1,2 → 1 em 0,12 s), placa escurece a imagem
    por baixo (multiplica), tinta dourada com falha de impressão, levemente torto, pequeno. Fica no topo, à esquerda."""
    if s < 0 or s > dur: return fr
    al = min(1.0, s / 0.06) * min(1.0, (dur - s) / 0.25)
    k = 1.0 + 0.2 * max(0.0, 1 - s / 0.12)
    diamante = txt.strip().startswith('◆'); txt = txt.replace('◆', '').strip()
    f = fonte(cabe(txt, 40, W - 2 * MARGEM - 140)); l, t, r, b = ImageDraw.Draw(fr).textbbox((0, 0), txt, font=f)
    w = r - l + (110 if diamante else 60); h = 84
    tinta = (236, 196, 104)
    plac = Image.new('RGBA', (w + 20, h + 20), (0, 0, 0, 0)); d = ImageDraw.Draw(plac)
    d.rounded_rectangle((10, 10, 10 + w, 10 + h), 10, outline=tinta + (255,), width=3)
    d.rounded_rectangle((18, 18, 2 + w, 2 + h), 6, outline=tinta + (110,), width=1)
    x_txt = 10 + (78 if diamante else 30)
    if diamante:
        cx, cy = 10 + 42, 10 + h // 2
        d.polygon([(cx, cy - 15), (cx + 13, cy), (cx, cy + 15), (cx - 13, cy)], fill=tinta + (255,))
    d.text((x_txt - l, 10 + h / 2 - (b + t) / 2), txt, font=f, fill=tinta + (255,))
    ruido = np.random.default_rng(zlib.crc32(repr(chave).encode('utf-8'))).uniform(0.72, 1.0, (plac.height // 3 + 1, plac.width // 3 + 1))
    ruido = np.repeat(np.repeat(ruido, 3, 0), 3, 1)[:plac.height, :plac.width]
    arr = np.array(plac); arr[..., 3] = (arr[..., 3] * ruido * al).astype(np.uint8); tinta_img = Image.fromarray(arr, 'RGBA')
    fundo = Image.new('L', plac.size, 0); ImageDraw.Draw(fundo).rounded_rectangle((10, 10, 10 + w, 10 + h), 10, fill=int(150 * al))
    tinta_img = tinta_img.rotate(1.6, resample=Image.BICUBIC, expand=False); fundo = fundo.rotate(1.6, resample=Image.BICUBIC, expand=False)
    k = min(k, (W - 16) / plac.width)
    if k != 1.0:
        nw, nh = int(plac.width * k), int(plac.height * k)
        tinta_img = tinta_img.resize((nw, nh), Image.BILINEAR); fundo = fundo.resize((nw, nh), Image.BILINEAR)
    x0 = MARGEM - 10 - (tinta_img.width - plac.width) // 2; y0 = 260 - (tinta_img.height - plac.height) // 2
    x0 = int(min(max(x0, 8), W - 8 - tinta_img.width)); y0 = int(max(y0, 8))
    base = np.array(fr, np.float32); m = np.array(fundo, np.float32)[..., None] / 255.0
    ys, xs = slice(y0, y0 + tinta_img.height), slice(x0, x0 + tinta_img.width)
    base[ys, xs, :3] *= (1 - m * 0.72)            # multiplica: a placa "absorve" a imagem, não pinta por cima
    fr = Image.fromarray(base.clip(0, 255).astype(np.uint8), 'RGBA')
    fr.alpha_composite(tinta_img, (x0, y0)); return fr


NUM = re.compile(r'(\d[\d.,]*\s?(?:%|×|x)?)')
def linha_numero(d, x, y, txt, f, al, cor=(205, 240, 255), cor_num=(255, 214, 110)):
    """escreve a linha com os números em dourado"""
    for peca in NUM.split(txt):
        if not peca: continue
        c = cor_num if NUM.fullmatch(peca) else cor
        d.text((x, y), peca, font=f, fill=c + (int(255 * al),), anchor='lm', stroke_width=2, stroke_fill=(4, 10, 20, int(220 * al)))
        x += d.textlength(peca, font=f)


def raiox_hud(fr, r, t, dy, y_titulo):
    """título + marcador pulsando no ponto (cx, cy) + painel com as linhas (uma por vez)"""
    t0, t1 = float(r.get('t0', 0)), float(r.get('t1', 99)); s = t - t0
    if s < 0 or t > t1 + 0.2: return fr
    al = min(1.0, s / 0.2) * min(1.0, (t1 + 0.2 - t) / 0.2)
    c = Image.new('RGBA', (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(c)
    titulo = str(r.get('titulo', 'RAIO-X')); ft = fonte(cabe('● ' + titulo, 52, W - 2 * MARGEM - 60))
    wt = d.textlength('● ' + titulo, font=ft) + 60
    caixa(d, MARGEM, y_titulo, MARGEM + wt, y_titulo + 86, al, borda=(120, 230, 255))
    d.text((MARGEM + wt / 2, y_titulo + 43), '● ' + titulo, font=ft, fill=(150, 238, 255, int(255 * al)), anchor='mm')
    cx, cy = float(r.get('cx', W / 2)), float(r.get('cy', H * 0.42))
    cy = min(cy, UI_Y - 120)
    pulso = 0.5 + 0.5 * math.sin(s * 2 * math.pi * 1.4)
    for k_, rr in enumerate((62 + 14 * pulso, 96 + 22 * pulso)):
        d.ellipse((cx - rr, cy - rr, cx + rr, cy + rr), outline=(255, 214, 110, int((230 - 90 * k_) * al)), width=5 - 2 * k_)
    d.line((cx - 26, cy, cx + 26, cy), fill=(255, 214, 110, int(230 * al)), width=3); d.line((cx, cy - 26, cx, cy + 26), fill=(255, 214, 110, int(230 * al)), width=3)
    linhas = [str(x) for x in r.get('linhas', [])][:3]
    if linhas:
        fl = fonte(min(cabe(x, 60, W - 2 * MARGEM - 80) for x in linhas)); lh = 92
        y0 = min(1120, UI_Y - 40 - lh * len(linhas)) + dy; y1 = y0 + 36 + lh * len(linhas)
        aparece = [ease((s - 0.3 - 0.35 * j) / 0.25) for j in range(len(linhas))]
        if aparece[0] > 0:
            caixa(d, MARGEM, y0, W - MARGEM, y1, al * aparece[0], borda=(120, 230, 255), fundo=(6, 12, 22))
            d.line((cx, cy + 100 + 22 * pulso, cx, y0), fill=(120, 230, 255, int(140 * al * aparece[0])), width=2)
            for j, x in enumerate(linhas):
                if aparece[j] > 0: linha_numero(d, MARGEM + 40 + 30 * (1 - aparece[j]), y0 + 18 + lh * j + lh / 2, x, fl, al * aparece[j])
    fr.alpha_composite(c); return fr


def cartoes(fr, cfg, s, t, dy):
    """tela de escolha: metade de baixo escurece, 2 botões grandes com a consequência dentro, o aceso pulsa, 'COMENTA 1 OU 2'"""
    u = s / 0.35
    if u <= 0: return fr
    a = ease(u)
    rampa = np.clip((np.arange(H, dtype=np.float32) / H - 0.46) / 0.16, 0, 1) * 0.8 * a
    som = Image.new('RGBA', (W, H), (0, 0, 0, 0)); som.putalpha(Image.fromarray(np.repeat((rampa * 255).astype(np.uint8)[:, None], W, 1)))
    fr.alpha_composite(som)
    cam = Image.new('RGBA', (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(cam)
    ops = [cfg.get('op1') or ['1', ''], cfg.get('op2') or ['2', '']]
    for i, op in enumerate(ops):
        if isinstance(op, str): op = [op, '']
        tit, sub = (list(op) + ['', ''])[:2]
        aceso = (int(t * 1.4) % 2) == i
        al = ease((u - 0.4 * i) * 1.2)
        if al <= 0: continue
        bw, bh = W - 2 * MARGEM, 190; cy = 1090 + 220 * i + dy + 50 * (1 - al)
        pulso = 1.0 + (0.025 * math.sin(t * 9) if aceso else 0)
        d.rounded_rectangle((W / 2 - bw / 2 * pulso, cy - bh / 2 * pulso, W / 2 + bw / 2 * pulso, cy + bh / 2 * pulso), 30,
                            fill=(12, 10, 8, int(228 * al)), outline=(245, 196, 80, int((255 if aceso else 110) * al)), width=8 if aceso else 3)
        cola(cam, ouro(tit, 80 if aceso else 74, max_w=bw - 60), W / 2, cy - (28 if sub else 0), alpha=al * (1 if aceso else 0.8), k=pulso)
        if sub: cola(cam, ouro(sub, 46, cores=CREME, sombra=False, max_w=bw - 60), W / 2, cy + 52, alpha=al * (1 if aceso else 0.8))
    cola(cam, ouro(str(cfg.get('chamada', 'COMENTA 1 OU 2')), 58), W / 2, 1500 + dy, alpha=ease((u - 0.8) * 1.5))
    fr.alpha_composite(cam); return fr


# ---------- render
def n_quadros(sg): return max(1, int(round(float(sg['dur']) * FPS)))


def inicios(segs):
    out, f = [], 0
    for sg in segs: out.append(f); f += n_quadros(sg)
    return out


def t_cartoes(sg):
    c = sg.get('cartoes')
    return float(c.get('t', 0)) if isinstance(c, dict) else float(c)


def prepara(sg):
    """a fonte de imagem do segmento: clipe (com a velocidade efetiva) ou placa"""
    plano = sg['plano']; arq = ARQS.get(plano) or os.path.join(EP, 'h3', 'clips60', f'{plano}.mp4')
    if os.path.exists(arq):
        c = Clipe(arq); ini = float(sg.get('ini', 0)); vel = float(sg.get('vel', 1.0)); lim = c.n / FPS - 0.05
        if ini + float(sg['dur']) * vel > lim and 'congela' not in sg.get('fx', []):
            vel = max(0.25, (lim - ini) / float(sg['dur']))          # clipe curto: estica em câmera lenta, não congela no fim
        return dict(clipe=c, vel=vel, ini=ini)
    return dict(placa=placa(plano))


def t_clip(sg, t_rel, vel):
    """tempo dentro do clipe; durante o raio-X a cena anda a 35% (câmera lenta)"""
    r = sg.get('raiox')
    if isinstance(r, dict):
        r0, r1 = float(r.get('t0', 0)), float(r.get('t1', 0))
        dt = min(t_rel, r0) + 0.35 * min(max(t_rel - r0, 0), max(0, r1 - r0)) + max(0, t_rel - r1)
    else:
        dt = t_rel
    return dt * vel


def faz_quadro(si, sg, i, n, f_glob, primeiro, fonte_img):
    u = i / max(1, n - 1); t_rel = i / FPS; fx = sg.get('fx', []); congela = 'congela' in fx
    if 'clipe' in fonte_img:
        tc = fonte_img['ini'] + (0 if congela else t_clip(sg, t_rel, fonte_img['vel']))
        a = fonte_img['clipe'].quadro(round(tc * FPS))
    else:
        a = quadro_placa(fonte_img['placa'], 0 if congela else t_clip(sg, t_rel, 1.0))
    if sg.get('vivo'): a = empurra(a, 1 + 0.06 * float(sg['vivo']) * u)
    r = sg.get('raiox') if isinstance(sg.get('raiox'), dict) else None
    if r:
        r0, r1 = float(r.get('t0', 0)), float(r.get('t1', 0))
        k = min(1.0, (t_rel - r0) / 0.15, (r1 + 0.15 - t_rel) / 0.15)
        if k > 0:
            x = raiox_img(a, t_rel - r0)
            a = x if k >= 1 else (a.astype(np.float32) * (1 - k) + x.astype(np.float32) * k).astype(np.uint8)
    if 'sepia' in fx: a = sepia(a)
    if 'frio' in fx: a = frio(a, 0.55 * u)
    if 'glitch' in fx:
        forca = 0.8 if t_rel < 0.35 else (0.5 if np.random.default_rng(f_glob + 7).random() < 0.3 else 0.12)
        a = glitch(a, forca, f_glob)
    if 'soco' in sg:
        k = float(sg['soco']) - t_rel
        if k <= 0: a = empurra(a, 1 + 0.07 * math.exp(k * 9))
        a = flash(a, 0.55 if -2.0 / FPS < k <= 0 else 0)
    if i < 2 and ('flash_entrada' in fx or sg.get('flash_entrada')): a = flash(a, 0.8 if i == 0 else 0.35)
    a = grao_vinheta(a, f_glob)
    fr = Image.fromarray(a).convert('RGBA'); dy = int(sg.get('ui_dy', 0))
    sl = sg.get('selo')
    if isinstance(sl, dict):
        s0, s1 = float(sl.get('t0', 0)), float(sl.get('t1', sg['dur']))
        if s0 <= t_rel <= s1:
            fr = selo(fr, str(sl.get('texto', LINHA.get('selo_txt', ''))), min(1, (t_rel - s0) / 0.25) * min(1, (s1 - t_rel) / 0.3))
    av = sg.get('aviso')
    if isinstance(av, dict): fr = aviso(fr, str(av.get('texto', '')), t_rel - float(av.get('t', 0)), float(av.get('dur', 1.6)), (si, av.get('texto')))
    if r: fr = raiox_hud(fr, r, t_rel, dy, 370 if isinstance(av, dict) else 260)
    if 'cartoes' in sg: fr = cartoes(fr, sg['cartoes'] if isinstance(sg['cartoes'], dict) else {}, t_rel - t_cartoes(sg), t_rel, dy)
    if 'loop' in sg and primeiro is not None and t_rel > float(sg['dur']) - float(sg['loop']):
        k = (t_rel - (float(sg['dur']) - float(sg['loop']))) / float(sg['loop'])
        fr = Image.blend(fr.convert('RGB'), Image.fromarray(primeiro), ease(k)).convert('RGBA')
    return np.array(fr.convert('RGB'))


def encoder(arq):
    return subprocess.Popen([FF, '-v', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{W}x{H}', '-r', str(FPS), '-i', '-',
                             '-c:v', 'libx264', '-crf', '18', '-preset', 'medium', '-pix_fmt', 'yuv420p', arq], stdin=subprocess.PIPE)


def render_seg(si, sg, f0, primeiro, enc):
    n = n_quadros(sg); fi = prepara(sg); out0 = None
    try:
        for i in range(n):
            q = faz_quadro(si, sg, i, n, f0 + i, primeiro, fi)
            if out0 is None: out0 = q
            enc.stdin.write(q.tobytes())
    finally:
        if 'clipe' in fi: fi['clipe'].fecha()
    return n, out0, 'clipe' if 'clipe' in fi else 'placa'


def primeiro_quadro(segs):
    fi = prepara(segs[0])
    try: return faz_quadro(0, segs[0], 0, n_quadros(segs[0]), 0, None, fi)
    finally:
        if 'clipe' in fi: fi['clipe'].fecha()


def main():
    segs = LINHA['segmentos']; enc = encoder(f'{SAIDA}_mudo.mp4'); f, primeiro, usou = 0, None, {}
    if any('loop' in sg for sg in segs): primeiro = primeiro_quadro(segs)
    for si, sg in enumerate(segs):
        n, _, tipo = render_seg(si, sg, f, primeiro, enc); f += n; usou[sg['plano']] = tipo
        print(f'seg {si} {sg["plano"]} {n} quadros ({tipo})', flush=True)
    enc.stdin.close(); enc.wait()
    print('quadros', f, 'dur', round(f / FPS, 2), '| clipe:', sorted(k for k, v in usou.items() if v == 'clipe'),
          '| placa:', sorted(k for k, v in usou.items() if v == 'placa'))


def main_segs(lista, pasta):
    os.makedirs(pasta, exist_ok=True)
    segs = LINHA['segmentos']; ini = inicios(segs)
    primeiro = primeiro_quadro(segs) if any('loop' in segs[k] for k in lista) else None
    for si in lista:
        sg = segs[si]; enc = encoder(os.path.join(pasta, f'seg_{si:03d}.mp4'))
        n, _, tipo = render_seg(si, sg, ini[si], primeiro, enc)
        enc.stdin.close(); enc.wait()
        print('seg', si, sg['plano'], n, 'quadros', f'({tipo})', flush=True)


if __name__ == '__main__':
    if '--segs' in sys.argv:
        lista = [int(x) for x in sys.argv[sys.argv.index('--segs') + 1].split(',') if x.strip() != '']
        pasta = sys.argv[sys.argv.index('--pasta') + 1] if '--pasta' in sys.argv else os.path.dirname(os.path.abspath(SAIDA))
        main_segs(lista, pasta)
    else:
        main()
