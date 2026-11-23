"""Montagem de um episódio no estilo LUMEN (isekai em massinha com escolha).
Lê a linha do tempo (linha.json: estimada antes da voz; real depois do linha_voz.py) e os clipes animados
(<ep>/h3/clips60/<PLANO>.mp4, 60 qps; ou <ep>/h3/clips/<PLANO>.mp4). Se o clipe de um plano ainda não existe, usa o quadro
parado (<ep>/quadros/<PLANO>.png) com um empurrão lento de câmera: dá pra montar o animatic antes de animar.
<ep> = a pasta onde está o linha.json (ou a que vier em --ep).

Efeitos em código, ligados por campo no segmento da linha (ver LINHA.md): pula-quadro, rebobinar em glitch, selo do voto,
lembrança sépia, flash de troca, monitor de sinais vitais, raio-X com coração, sonar (só o som desenha o mundo), soco de zoom,
holograma, anéis de passo, cartões 1/2 por cima do último plano e loop no 1º quadro.

uso: python montar.py <ep>/linha.json <saida_base> [--tam 540x960] [--segs 3,7 --pasta dir]
     sai <saida_base>_mudo.mp4 (o mixar.py põe o som). As coordenadas dos efeitos são sempre do quadro 1080x1920; --tam só reduz na saída.
"""
import os, sys, json, math, subprocess
import numpy as np
from PIL import Image, ImageDraw, ImageFilter
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from comum import ouro, fonte, CREME  # noqa: E402

_pos = [a for i, a in enumerate(sys.argv[1:], 1) if not a.startswith('--') and sys.argv[i - 1] not in ('--segs', '--pasta', '--tam', '--ep')]
if not _pos: raise SystemExit(__doc__)
W, H, FPS = 1080, 1920, 30
LINHA = json.load(open(_pos[0], encoding='utf-8'))
EP = os.path.abspath(sys.argv[sys.argv.index('--ep') + 1]) if '--ep' in sys.argv else os.path.dirname(os.path.abspath(_pos[0]))
SAIDA = _pos[1] if len(_pos) > 1 else os.path.join(EP, 'animatic')
TAM = sys.argv[sys.argv.index('--tam') + 1].lower().split('x') if '--tam' in sys.argv else None
ESCOLHA = LINHA.get('escolha', [['1 · ATIRA', 'e vira ALVO do General'], ['2 · FICA PARADO', 'e a Iara é levada']])
rng = np.random.default_rng(6)


def ease(x): x = min(max(x, 0), 1); return 1 - (1 - x) ** 3


# ---------- fontes de imagem
_cache_clip = {}
ARQS = {k: os.path.join(EP, v) for k, v in LINHA.get('arquivos', {}).items()}
def quadros_clip(s):
    """lista de quadros (np RGB 1080x1920) do clipe 60 qps reamostrado a 30 qps; None se não houver clipe."""
    if s in _cache_clip: return _cache_clip[s]
    arq = ARQS.get(s) or next((a for a in (os.path.join(EP, 'h3', 'clips60', f'{s}.mp4'), os.path.join(EP, 'h3', 'clips', f'{s}.mp4')) if os.path.exists(a)), '')
    if not os.path.exists(arq):
        _cache_clip[s] = None; return None
    p = subprocess.Popen(['ffmpeg', '-v', 'error', '-i', arq, '-vf', f'fps={FPS},scale={W}:{H}:flags=lanczos', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'], stdout=subprocess.PIPE)
    qs = []
    while True:
        b = p.stdout.read(W * H * 3)
        if len(b) < W * H * 3: break
        qs.append(np.frombuffer(b, np.uint8).reshape(H, W, 3))
    p.wait(); _cache_clip[s] = qs; return qs


_cache_placa = {}
def placa(s):
    if s not in _cache_placa:
        arq = next((a for a in (os.path.join(EP, 'quadros', s + e) for e in ('.png', '.jpg', '.jpeg')) if os.path.exists(a)), None)
        if arq is None: raise SystemExit(f'plano {s}: não achei quadros/{s}.png nem clipe em h3/clips60/ na pasta do episódio')
        im = Image.open(arq).convert('RGB')
        k = max(W / im.width, H / im.height) * 1.12
        _cache_placa[s] = im.resize((round(im.width * k), round(im.height * k)), Image.LANCZOS)
    return _cache_placa[s]


def quadro(s, t_clip, u):
    """quadro do plano s no tempo t_clip (s do clipe); u = progresso 0..1 do segmento (pra câmera da placa)"""
    qs = quadros_clip(s)
    if qs:
        i = min(len(qs) - 1, max(0, int(round(t_clip * FPS))))
        return qs[i].copy()
    im = placa(s); z = 1.0 + 0.06 * u
    cw, ch = int(W / z), int(H / z)
    x0 = (im.width - cw) // 2; y0 = (im.height - ch) // 2
    return np.array(im.crop((x0, y0, x0 + cw, y0 + ch)).resize((W, H), Image.BILINEAR))


# ---------- efeitos
def grao_vinheta(a, f):
    g = np.random.default_rng(f).normal(0, 7, (H // 2, W // 2, 1)).astype(np.float32)
    g = np.repeat(np.repeat(g, 2, 0), 2, 1)
    out = a.astype(np.float32) + g
    out *= VIN
    return out.clip(0, 255).astype(np.uint8)


yy, xx = np.mgrid[0:H, 0:W]
VIN = (1 - 0.38 * (((xx - W / 2) / (W / 2)) ** 2 + ((yy - H / 2) / (H / 1.6)) ** 2).clip(0, 1) ** 1.5)[..., None].astype(np.float32)


def split_rgb(a, k):
    o = a.copy(); o[..., 0] = np.roll(a[..., 0], k, 1); o[..., 2] = np.roll(a[..., 2], -k, 1); return o


def glitch(a, forca, seed):
    g = np.random.default_rng(seed); o = a.copy()
    for _ in range(int(5 + 14 * forca)):
        y0 = g.integers(0, H - 20); hh = int(g.integers(6, 20 + 80 * forca)); dx = int(g.integers(-1, 2) * g.integers(10, 30 + 140 * forca))
        o[y0:y0 + hh] = np.roll(o[y0:y0 + hh], dx, 1)
    o = split_rgb(o, int(4 + 18 * forca)); o[::3] = (o[::3] * (1 - 0.3 * forca)).astype(np.uint8)
    return o


def sepia(a):
    f = a.astype(np.float32); l = f @ np.array([0.3, 0.59, 0.11], np.float32)
    o = np.stack([l * 1.07 + 18, l * 0.95 + 8, l * 0.78], -1)
    return (f * 0.25 + o * 0.75).clip(0, 255).astype(np.uint8)


def frio(a, k):
    f = a.astype(np.float32); l = f @ np.array([0.3, 0.59, 0.11], np.float32)
    cinza = np.stack([l * 0.92, l * 0.98, l * 1.1], -1)
    return (f * (1 - k) + cinza * k).clip(0, 255).astype(np.uint8)


_prev = {}
def visao_general(a, chave):
    """tudo cinza-azulado; só o que mudou desde o quadro anterior mantém a cor; linhas de varredura"""
    f = a.astype(np.float32); l = f @ np.array([0.3, 0.59, 0.11], np.float32)
    cinza = np.stack([l * 0.75, l * 0.85, l * 1.0], -1)
    p = _prev.get(chave)
    if p is None: m = np.zeros((H, W, 1), np.float32)
    else:
        d = np.abs(f - p).sum(-1) / 3.0
        m = np.clip((d - 4) / 14, 0, 1)[..., None]
        m = np.array(Image.fromarray((m[..., 0] * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(6)), np.float32)[..., None] / 255
    _prev[chave] = f
    o = cinza * (1 - m) + f * 1.15 * m
    o[::4] *= 0.82
    return o.clip(0, 255).astype(np.uint8)


def soco(a, k):
    if k <= 0: return a
    z = 1 + 0.07 * k; im = Image.fromarray(a); cw, ch = int(W / z), int(H / z)
    return np.array(im.crop(((W - cw) // 2, (H - ch) // 2, (W - cw) // 2 + cw, (H - ch) // 2 + ch)).resize((W, H), Image.BILINEAR))


def flash(a, k, cor=(255, 250, 240)):
    return (a.astype(np.float32) * (1 - k) + np.array(cor, np.float32) * k).astype(np.uint8)


# ---------- camadas de texto/HUD
def selo(fr, alpha):
    if alpha <= 0: return fr
    d = ImageDraw.Draw(fr, 'RGBA'); txt = LINHA.get('selo_txt', 'EP. 1'); f = fonte(34)
    l, t, r, b = d.textbbox((0, 0), txt, font=f); w = r - l + 48; h = b - t + 28; x, y = (W - w) // 2, 150
    d.rounded_rectangle((x, y, x + w, y + h), 18, fill=(10, 14, 20, int(170 * alpha)), outline=(214, 170, 80, int(220 * alpha)), width=3)
    d.text((x + 24 - l, y + 14 - t), txt, font=f, fill=(250, 240, 215, int(255 * alpha)))
    return fr


def monitor(fr, t_rel, bpm, alpha):
    if alpha <= 0: return fr
    x0, y0, x1, y1 = 590, 150, 1030, 430
    d = ImageDraw.Draw(fr, 'RGBA')
    d.rounded_rectangle((x0, y0, x1, y1), 22, fill=(6, 16, 20, int(175 * alpha)), outline=(90, 230, 190, int(200 * alpha)), width=3)
    d.text((x0 + 24, y0 + 16), LINHA.get('monitor_txt', 'SINAIS VITAIS'), font=fonte(22), fill=(150, 240, 210, int(230 * alpha)))
    d.text((x0 + 24, y0 + 46), f'{int(round(bpm))}', font=fonte(112), fill=(120, 255, 200, int(255 * alpha)))
    d.text((x0 + 250, y0 + 120), 'BPM', font=fonte(34), fill=(150, 240, 210, int(230 * alpha)))
    # ECG rolando: um "pico" a cada 60/bpm s
    per = 60.0 / max(bpm, 30); pts = []
    for i in range(0, 400, 3):
        tt = t_rel - (400 - i) / 400 * 2.2
        ph = (tt % per) / per
        v = 0
        if 0.10 < ph < 0.13: v = -60 * math.sin((ph - 0.10) / 0.03 * math.pi)
        elif 0.13 < ph < 0.16: v = 25 * math.sin((ph - 0.13) / 0.03 * math.pi)
        elif 0.30 < ph < 0.40: v = -10 * math.sin((ph - 0.30) / 0.10 * math.pi)
        pts.append((x0 + 20 + i, y1 - 60 + v))
    d.line(pts, fill=(120, 255, 200, int(255 * alpha)), width=4)
    return fr


def cartoes(fr, u, t, dy=0):
    """tela de escolha por cima do último plano: a metade de baixo escurece, 2 botões grandes empilhados com a consequência
    dentro (linha['escolha'] = [[opção, consequência], [opção, consequência]]), o aceso pulsa. Botão pequeno ou só o número
    fica difícil de enxergar no celular."""
    if u <= 0: return fr
    a = ease(u)
    sombra = np.zeros((H, W), np.float32); yy_ = np.arange(H)[:, None] / H
    sombra[:] = np.clip((yy_ - 0.50) / 0.14, 0, 1) * 0.78 * a
    esc = Image.new('RGBA', (W, H), (0, 0, 0, 0)); esc.putalpha(Image.fromarray((sombra * 255).astype(np.uint8)))
    fr.alpha_composite(esc)
    camada = Image.new('RGBA', (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(camada)
    for i, (txt, sub, y0) in enumerate([(ESCOLHA[0][0], ESCOLHA[0][1], 1170), (ESCOLHA[1][0], ESCOLHA[1][1], 1400)]):
        aceso = (int(t * 1.4) % 2) == i
        w, h = W - 120, 196; y = y0 + dy + 50 * (1 - ease((u - 0.15 * i) * 1.2))
        al = ease((u - 0.15 * i) * 1.2)
        if al <= 0: continue
        d.rounded_rectangle((W / 2 - w / 2, y - h / 2, W / 2 + w / 2, y + h / 2), 30, fill=(12, 10, 8, int(225 * al)),
                            outline=(245, 196, 80, int((255 if aceso else 110) * al)), width=8 if aceso else 3)
        for peca, oy in ((ouro(txt, 84 if aceso else 78), -30), (ouro(sub, 46, cores=CREME, sombra=False), 52)):
            p2 = peca.copy(); p2.putalpha(p2.getchannel('A').point(lambda v, k=al * (1 if aceso else 0.8): int(v * k)))
            camada.alpha_composite(p2, (int(W / 2 - peca.width / 2), int(y + oy - peca.height / 2)))
    p = ouro(LINHA.get('chamada', 'COMENTA 1 OU 2'), 58); p2 = p.copy(); p2.putalpha(p2.getchannel('A').point(lambda v: int(v * ease((u - 0.3) * 1.5))))
    camada.alpha_composite(p2, (int(W / 2 - p.width / 2), int(1585 + dy - p.height / 2)))
    fr.alpha_composite(camada); return fr


def continua(fr, a, dy=0):
    if a <= 0: return fr
    p = ouro(LINHA.get('continua_txt', 'CONTINUA NA PARTE 2'), 64); p2 = p.copy(); p2.putalpha(p2.getchannel('A').point(lambda v: int(v * a)))
    fr.alpha_composite(p2, (int(W / 2 - p.width / 2), 1450 + dy)); return fr


def holograma(fr, t, a):
    """jogo de tiro valendo choque, desenhado fino em ciano por cima do próprio Nico"""
    if a <= 0: return fr
    c = Image.new('RGBA', (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(c); cor = (110, 240, 255, int(235 * a)); fina = (110, 240, 255, int(120 * a))
    ox, oy = 150, 360
    d.rectangle((ox + 470, oy + 20, ox + 760, oy + 230), outline=cor, width=4)            # tela com alvo
    for r in (70, 45, 20): d.ellipse((ox + 615 - r, oy + 125 - r, ox + 615 + r, oy + 125 + r), outline=cor, width=3)
    d.ellipse((ox + 95, oy + 70, ox + 145, oy + 120), outline=cor, width=4)               # pessoa de pé
    d.line((ox + 120, oy + 120, ox + 120, oy + 260), fill=cor, width=5)
    d.line((ox + 120, oy + 160, ox + 330, oy + 150), fill=cor, width=5)                   # braço mirando
    d.line((ox + 120, oy + 260, ox + 80, oy + 360), fill=cor, width=5); d.line((ox + 120, oy + 260, ox + 160, oy + 360), fill=cor, width=5)
    d.rectangle((ox + 40, oy + 362, ox + 210, oy + 384), outline=cor, width=4)            # plataforma de equilíbrio
    bal = 6 * math.sin(t * 2.2) * (1 - min(1, t / 3))                                     # balanço diminuindo (congelando)
    d.line((ox + 30 + bal, oy + 396, ox + 220 + bal, oy + 396), fill=fina, width=3)
    for i in range(4): d.line((ox + 340 + i * 30, oy + 150, ox + 360 + i * 30, oy + 150), fill=fina, width=3)   # linha de mira
    d.rounded_rectangle((ox + 470, oy - 60, ox + 700, oy - 8), 12, outline=(255, 220, 90, int(240 * a)), width=3)
    zx, zy = ox + 500, oy - 52                                                             # raio desenhado (a fonte não tem ⚡)
    d.polygon([(zx + 14, zy), (zx + 2, zy + 22), (zx + 12, zy + 22), (zx + 4, zy + 40), (zx + 24, zy + 15), (zx + 14, zy + 15), (zx + 22, zy)], fill=(255, 225, 100, int(255 * a)))
    d.text((ox + 600, oy - 34), 'CHOQUE', font=fonte(32), fill=(255, 225, 100, int(255 * a)), anchor='mm')
    d.text((W / 2, oy + 470), 'QUEM TRAVA MAIS', font=fonte(46), fill=cor, anchor='mm')
    d.text((W / 2, oy + 530), '→ ATIRA MAIS RÁPIDO', font=fonte(46), fill=cor, anchor='mm')
    arr = np.array(c); arr[::4, :, 3] = (arr[::4, :, 3] * 0.55).astype(np.uint8)                 # varredura de holograma
    fr.alpha_composite(Image.fromarray(arr, 'RGBA')); return fr


# ---------- raio-X, sonar (visão de quem caça pelo som), holograma de bicho, quadro-fantasma
def bordas(a):
    l = a.astype(np.float32) @ np.array([0.3, 0.59, 0.11], np.float32)
    gx = np.zeros_like(l); gy = np.zeros_like(l)
    gx[:, 1:-1] = l[:, 2:] - l[:, :-2]; gy[1:-1, :] = l[2:, :] - l[:-2, :]
    e = np.sqrt(gx * gx + gy * gy); return np.clip(e / 28.0, 0, 1)


def raiox(a, t_rel, hx, hy, bpm):
    """osso claro sobre fundo escuro, ciano; coração aceso no peito batendo no bpm"""
    l = a.astype(np.float32) @ np.array([0.3, 0.59, 0.11], np.float32) / 255.0
    e = bordas(a)
    v = np.clip((1 - l) * 0.35 + e * 1.4, 0, 1)
    o = np.stack([v * 120, v * 230, v * 255], -1) + np.array([4, 10, 22], np.float32)
    o[::3] *= 0.8
    per = 60.0 / bpm; ph = (t_rel % per) / per
    pulso = math.exp(-ph * 9) + 0.6 * math.exp(-max(0, ph - 0.18) * 12) * (ph > 0.18)
    r = 105 * (1 + 0.2 * pulso)
    yy2, xx2 = np.ogrid[0:H, 0:W]
    d = np.sqrt((xx2 - hx) ** 2 + ((yy2 - hy) * 1.15) ** 2)
    g = np.clip(1 - d / r, 0, 1) ** 1.5 * (0.55 + 0.45 * pulso)
    halo = np.exp(-(d / (r * 2.2)) ** 2) * 0.5 * pulso
    o += (g[..., None] * np.array([255, 70, 60]) + halo[..., None] * np.array([255, 90, 70]))
    return o.clip(0, 255).astype(np.uint8)


def sonar(a, t_rel, aneis, esconde=None):
    """visão do General: tudo escuro azul/preto; cada som abre um anel tipo gota que desenha o que encosta e apaga"""
    e = bordas(a)
    yy2, xx2 = np.ogrid[0:H, 0:W]
    luz = np.zeros((H, W), np.float32)
    for an in aneis:
        t0, cx, cy, vel, rmax, forca = an[:6]; tudo = len(an) > 6 and an[6]
        if t_rel < t0: continue
        rr = (t_rel - t0) * vel
        if rr > rmax * 1.3: continue
        d = np.sqrt((xx2 - cx) ** 2 + (yy2 - cy) ** 2)
        frente = np.exp(-((d - rr) / 14.0) ** 2)                       # a linha do anel
        rastro = np.exp(-np.clip(rr - d, 0, None) / 90.0) * (d < rr)   # o que o anel já passou ainda brilha um pouco
        k = forca * max(0, 1 - rr / (rmax * 1.3))
        m = (frente * 0.9 + rastro * 0.55) * k
        if esconde is not None and not tudo:
            x0, y0, x1, y1 = esconde; m = m.copy(); m[y0:y1, x0:x1] = 0
        luz = np.maximum(luz, m)
        # o próprio anel (água) aparece fraco mesmo onde não tem borda
        luz = np.maximum(luz, frente * 0.45 * k)
    base = e * 0.07                                                   # o mundo quase invisível, só pra ter chão
    if esconde is not None:
        x0, y0, x1, y1 = esconde; base = base.copy(); base[y0:y1, x0:x1] = 0
    v = np.clip(e * luz * 3.2 + luz * 0.18 + base, 0, 1)
    o = np.stack([v * 150 + 3, v * 225 + 7, v * 255 + 18], -1)
    o[::4] *= 0.85
    return o.clip(0, 255).astype(np.uint8)


def pos_tela(s, nx, ny, u):
    """ponto (nx, ny normalizados na imagem original) -> pixel no quadro: clipe animado = imagem inteira; quadro parado = recorte com zoom"""
    if quadros_clip(s): return nx * W, ny * H
    im = placa(s); z = 1.0 + 0.06 * u; cw, ch = W / z, H / z
    return (nx * im.width - (im.width - cw) / 2) * z, (ny * im.height - (im.height - ch) / 2) * z


_rastro = {}
def rastro(s):
    """posição do pé do rato por quadro do clipe (h3/rastro_<s>.json, feito pelo rastro.py); None se não houver"""
    if s not in _rastro:
        f = os.path.join(EP, 'h3', f'rastro_{s}.json')
        _rastro[s] = json.load(open(f)) if (os.path.exists(f) and quadros_clip(s)) else None
    return _rastro[s]


def passos(fr, t, s, u, nx, ny, ini=0.0, vel=1.0):
    """cada passinho do rato solta um anel dourado no chão, no pé dele NA HORA do passo
    (com o clipe animado, segue o rastro; com a placa parada, ponto fixo)"""
    R = rastro(s)
    c = Image.new('RGBA', (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(c)
    t0 = 0.15
    while t0 <= t:
        v = (t - t0) / 0.9
        if R: cx, cy = R[min(len(R) - 1, max(0, int(round((ini + t0 * vel) * FPS))))]
        else: cx, cy = pos_tela(s, nx, ny, u)
        if v < 1:
            r = 30 + 230 * (1 - (1 - v) ** 2); al = int(210 * (1 - v) ** 1.5)
            d.ellipse((cx - r, cy - r * 0.32, cx + r, cy + r * 0.32), outline=(255, 214, 120, al), width=max(2, int(5 * (1 - v)) + 1))
        t0 += 0.38
    glow = c.filter(ImageFilter.GaussianBlur(6))
    fr.alpha_composite(glow); fr.alpha_composite(c); return fr


def some(a, t, s, u, nx, ny):
    """o rato parado afunda no escuro (escurece a região dele em ~1,4 s)"""
    cx, cy = pos_tela(s, nx, ny, u)
    k = 0.88 * min(1.0, max(0.0, (t - 0.2) / 1.4)) ** 1.2
    if k <= 0: return a
    m = np.exp(-(((xx - cx) / 150.0) ** 2 + ((yy - cy) / 95.0) ** 2))[..., None].astype(np.float32)
    return (a.astype(np.float32) * (1 - k * m)).clip(0, 255).astype(np.uint8)


def morcego_besouro(fr, t, a):
    """holograma em traço fino (exemplo de desenho por código; na série, o bicho como imagem gerada ficou melhor): coruja num galho virando a cabeça atrás de um rato que acende a cada passo; rato parado some"""
    if a <= 0: return fr
    c = Image.new('RGBA', (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(c)
    cor = (120, 235, 255, int(235 * a)); fina = (120, 235, 255, int(130 * a)); ouro_ = (255, 230, 120)
    # rato: anda até 5,2 s e para; some 0,6 s depois
    PARA = 5.2; rx = 380 + min(t, PARA) * 110; ry = 1180
    andando = t < PARA; vis = 1.0 if andando else max(0, 1 - (t - PARA - 0.4) / 0.6)
    # galho + coruja (corpo parado, cabeça gira atrás do rato)
    d.line((40, 800, 640, 750), fill=cor, width=8); d.line((380, 770, 460, 690), fill=fina, width=5)
    ox, oy = 330, 610
    d.ellipse((ox - 110, oy - 140, ox + 110, oy + 150), outline=cor, width=6, fill=(120, 235, 255, int(35 * a)))          # corpo
    for k in range(4): d.arc((ox - 75, oy - 60 + k * 38, ox + 75, oy + 15 + k * 38), 20, 160, fill=fina, width=3)          # penas do peito
    vira = max(-1.0, min(1.0, (rx - 650) / 300.0)) if vis > 0 else 0.0                                                     # cabeça segue o rato (-1 esquerda, +1 direita)
    hx, hy = ox + 14 * vira, oy - 210
    d.ellipse((hx - 100, hy - 88, hx + 100, hy + 88), outline=cor, width=6, fill=(120, 235, 255, int(35 * a)))             # cabeça
    d.polygon([(hx - 80, hy - 66), (hx - 60, hy - 135), (hx - 32, hy - 76)], outline=cor)                                  # tufos
    d.polygon([(hx + 80, hy - 66), (hx + 60, hy - 135), (hx + 32, hy - 76)], outline=cor)
    fx_ = hx + 55 * vira                                                                                                       # disco facial virado pro rato
    for sx in (-34, 34):
        d.ellipse((fx_ + sx * (1 - 0.25 * abs(vira)) - 28, hy - 24, fx_ + sx * (1 - 0.25 * abs(vira)) + 28, hy + 32), outline=cor, width=5)
        d.ellipse((fx_ + sx * (1 - 0.25 * abs(vira)) - 9 + 12 * vira, hy + 10, fx_ + sx * (1 - 0.25 * abs(vira)) + 9 + 12 * vira, hy + 28), fill=cor)
    d.polygon([(fx_ - 10, hy + 30), (fx_ + 10, hy + 30), (fx_ + 2 * vira, hy + 50)], fill=cor)
    # o som dos passos chegando na coruja (linhas finas)
    if vis > 0:
        aa = int(255 * a * vis)
        d.ellipse((rx - 62, ry - 34, rx + 62, ry + 34), outline=ouro_ + (aa,), width=5)                                       # rato
        d.ellipse((rx + 44, ry - 46, rx + 90, ry - 8), outline=ouro_ + (aa,), width=4)
        d.line((rx - 62, ry, rx - 170, ry + 40), fill=ouro_ + (aa,), width=4)
        if andando:
            ph = (t % 0.42) / 0.42; r = 50 + ph * 220
            d.ellipse((rx - r, ry - r * 0.55, rx + r, ry + r * 0.55), outline=ouro_ + (int(aa * (1 - ph)),), width=4)
            d.line((rx, ry - 40, fx_, hy + 60), fill=(255, 230, 120, int(90 * a * (1 - ph))), width=3)
    if t > PARA + 0.9:
        d.text((W / 2, 1360), 'RATO QUIETO = SOME', font=fonte(58), fill=ouro_ + (int(255 * a * min(1, (t - PARA - 0.9) / 0.3)),), anchor='mm')
    arr = np.array(c); arr[::4, :, 3] = (arr[::4, :, 3] * 0.6).astype(np.uint8)
    fr.alpha_composite(Image.fromarray(arr, 'RGBA')); return fr


# ---------- render
def empurra(a, z):
    """aproximação lenta (ajuste 'vivo' do ciclo pra plano que ficou parado)"""
    if z <= 1.0001: return a
    cw, ch = int(W / z), int(H / z); x0, y0 = (W - cw) // 2, (H - ch) // 2
    return np.array(Image.fromarray(a[y0:y0 + ch, x0:x0 + cw]).resize((W, H), Image.BILINEAR))


def faz_quadro(si, sg, i, n, f_glob, primeiro):
    """um quadro final (RGB) do segmento si; f_glob = índice do quadro no vídeo inteiro (grão, glitch e raio-X dependem dele)"""
    u = i / max(1, n - 1); t_rel = i / FPS; s = sg['plano']; fx = sg.get('fx', [])
    t_clip = sg.get('ini', 0.0) + t_rel * sg.get('vel', 1.0)
    if 'pula' in fx: t_clip = math.floor(t_clip * 8) / 8          # o General "pula quadro" (8 qps)
    if 'ao_contrario' in fx: t_clip = sg.get('ini', 0.0) + (1 - u) * sg.get('vel', 1.0) * sg['dur']
    if 'congela' in fx: t_clip = sg.get('ini', 0.0)
    a = quadro(s, t_clip, u if 'congela' not in fx else 0)
    if sg.get('vivo'): a = empurra(a, 1 + 0.06 * sg['vivo'] * u)
    if 'raiox' in sg:
        r0, r1, hx, hy, b0, b1 = sg['raiox']
        if r0 <= t_rel <= r1: a = raiox(a, f_glob / FPS, hx, hy, b0 + (b1 - b0) * ease((t_rel - r0) / max(0.1, r1 - r0)))
    if 'sonar' in sg: a = sonar(a, t_rel, sg['sonar'], sg.get('esconde'))
    if 'fantasma' in sg:
        f0, pl, al = sg['fantasma']
        if f0 <= t_rel < f0 + 0.1: a = (a.astype(np.float32) * (1 - al) + np.array(placa(pl).resize((W, H)), np.float32) * al).astype(np.uint8)
    if 'some' in sg: a = some(a, t_rel, s, u, *sg['some'])
    if 'sepia' in fx: a = sepia(a)
    if 'frio' in fx: a = frio(a, 0.55 * u)
    if 'visao' in fx: a = visao_general(a, si)
    if 'glitch' in fx: a = glitch(a, 0.8, f_glob)
    if 'glitch_fim' in fx and u > 0.6: a = glitch(a, (u - 0.6) / 0.4, f_glob)
    if 'pula' in fx and (i % 8 == 0) and np.random.default_rng(f_glob).random() < 0.35: a = split_rgb(a, 10)
    if 'soco' in sg: k = sg['soco'] - t_rel; a = soco(a, math.exp(-max(0, -k) * 9) if k <= 0 else 0); a = flash(a, 0.55 if -0.07 < k <= 0 else 0)
    if i < 2 and sg.get('flash_entrada'): a = flash(a, 0.8 if i == 0 else 0.35)
    a = grao_vinheta(a, f_glob)
    fr = Image.fromarray(a).convert('RGBA'); dy = sg.get('ui_dy', 0)
    if 'selo' in sg: s0, s1 = sg['selo']; fr = selo(fr, min(1, (t_rel - s0) / 0.25) * (1 - max(0, (t_rel - s1 + 0.3) / 0.3)) if s0 <= t_rel <= s1 else 0)
    if 'monitor' in sg:
        m0, m1, b0, b1 = sg['monitor']
        if m0 <= t_rel <= m1 + 0.4:
            bpm = b0 + (b1 - b0) * ease((t_rel - m0) / max(0.1, m1 - m0))
            fr = monitor(fr, f_glob / FPS, bpm, min(1, (t_rel - m0 + 0.01) / 0.25))
    if 'cartoes' in sg: fr = cartoes(fr, (t_rel - sg['cartoes']) / 0.35, t_rel, dy)
    if 'bicho' in sg:
        h0, h1 = sg['bicho']
        if h0 <= t_rel <= h1: fr = morcego_besouro(fr, t_rel - h0, min(1, (t_rel - h0) / 0.3) * min(1, (h1 - t_rel) / 0.3))
    if 'passos' in sg and t_rel < sg['dur'] - 0.1: fr = passos(fr, t_rel, s, u, *sg['passos'], sg.get('ini', 0.0), sg.get('vel', 1.0))
    if 'continua' in sg and t_rel >= sg['continua']: fr = continua(fr, min(1, (t_rel - sg['continua']) / 0.25), dy)
    if 'holo' in sg:
        h0, h1 = sg['holo']
        if h0 <= t_rel <= h1: fr = holograma(fr, t_rel - h0, min(1, (t_rel - h0) / 0.3) * min(1, (h1 - t_rel) / 0.3))
    if 'loop' in sg and t_rel > sg['dur'] - sg['loop'] and primeiro is not None:      # funde no 1º quadro do vídeo
        k = (t_rel - (sg['dur'] - sg['loop'])) / sg['loop']
        fr = Image.blend(fr.convert('RGB'), Image.fromarray(primeiro), ease(k)).convert('RGBA')
    return np.array(fr.convert('RGB'))


def n_quadros(sg): return max(1, int(round(sg['dur'] * FPS)))


def inicios(segs):
    out, f = [], 0
    for sg in segs: out.append(f); f += n_quadros(sg)
    return out


def encoder(arq):
    vf = ['-vf', f'scale={TAM[0]}:{TAM[1]}:flags=lanczos'] if TAM else []
    return subprocess.Popen(['ffmpeg', '-v', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{W}x{H}', '-r', str(FPS), '-i', '-', *vf, '-an',
                             '-c:v', 'libx264', '-crf', '16', '-preset', 'medium', '-pix_fmt', 'yuv420p', arq], stdin=subprocess.PIPE)


def main():
    enc = encoder(f'{SAIDA}_mudo.mp4')
    segs = LINHA['segmentos']; f_glob = 0; primeiro = None
    for si, sg in enumerate(segs):
        n = n_quadros(sg)
        for i in range(n):
            out = faz_quadro(si, sg, i, n, f_glob, primeiro)
            if primeiro is None: primeiro = out.copy()
            enc.stdin.write(out.tobytes()); f_glob += 1
    enc.stdin.close(); enc.wait()
    print('quadros', f_glob, 'dur', round(f_glob / FPS, 2), 'clipes animados usados:', sorted(k for k, v in _cache_clip.items() if v))


def main_segs(lista, pasta):
    """(ciclo) renderiza só os segmentos da lista, cada um em <pasta>/seg_XXX.mp4, com o mesmo quadro global do vídeo inteiro.
    Depois o ciclo emenda tudo com concat (-c copy). Uso: montar.py linha.json saida --segs 3,7 --pasta dir"""
    os.makedirs(pasta, exist_ok=True)
    segs = LINHA['segmentos']; ini = inicios(segs)
    primeiro = faz_quadro(0, segs[0], 0, n_quadros(segs[0]), 0, None) if any('loop' in segs[k] for k in lista) else None
    for si in lista:
        sg = segs[si]; n = n_quadros(sg); enc = encoder(os.path.join(pasta, f'seg_{si:03d}.mp4'))
        for i in range(n): enc.stdin.write(faz_quadro(si, sg, i, n, ini[si] + i, primeiro).tobytes())
        enc.stdin.close(); enc.wait()
        print('seg', si, sg['plano'], n, 'quadros', flush=True)


if __name__ == '__main__':
    if '--segs' in sys.argv:
        lista = [int(x) for x in sys.argv[sys.argv.index('--segs') + 1].split(',') if x != '']
        main_segs(lista, sys.argv[sys.argv.index('--pasta') + 1])
    else:
        main()
