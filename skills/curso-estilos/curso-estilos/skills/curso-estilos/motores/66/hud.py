"""As 4 peças fixas da HUD de RPG (+ o par de botões do voto), desenhadas com Pillow num quadro 1080x1920.
Regra do estilo: linha fina branca, preto translúcido, SEM brilho, glitch ou vinheta. Cada peça tem lugar fixo:
  (1) status (canto esq.) + relógio (canto dir.)   (2) cartão no slot fixo y 1040-1220
  (3) círculo de alvo fino (+ rótulo de ameaça)    (4) legenda de 1-2 palavras, palavra-chave em amarelo
Só depende de numpy + Pillow. Fontes: Barlow Condensed (OFL) em fontes/.
uso:  from hud import *  ->  ui = Image.new('RGBA', (W, H)); d = ImageDraw.Draw(ui); relogio(d, '23:52'); img.alpha_composite(ui)
"""
import os
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter

FD = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'fontes')
_fc = {}
def F(n, s):
    if (n, s) not in _fc: _fc[(n, s)] = ImageFont.truetype(os.path.join(FD, n + '.ttf'), s)
    return _fc[(n, s)]
FB, FX = 'BarlowCondensed-Bold', 'BarlowCondensed-ExtraBold'
W, H = 1080, 1920
BRANCO, AMARELO, VERM, VERDE, AMBAR = (255, 255, 255), (255, 210, 63), (255, 86, 86), (120, 230, 140), (255, 178, 62)
CIANO_V, MAGENTA_V = (120, 205, 255), (255, 105, 190)        # só nos botões do voto

def cl(x, a=0.0, b=1.0): return max(a, min(b, x))
def prog(t, t0, dur): return cl((t - t0) / dur) if dur > 0 else float(t >= t0)
def e_out(x): return 1 - (1 - x) ** 3

LINHA, FUNDO = (255, 255, 255, 178), (0, 0, 0, 92)
def caixa(d, box, a=1.0, raio=14):
    d.rounded_rectangle([int(v) for v in box], raio, fill=FUNDO[:3] + (int(FUNDO[3] * a),), outline=LINHA[:3] + (int(LINHA[3] * a),), width=2)

def status(d, estado, xp=0, mais=None, t=0, t_mais=0, rotulo='INGLÊS', vazio='SEM IDIOMA'):
    """Canto esquerdo. estado: 'sem' (texto `vazio` em vermelho) ou nível (int). xp 0-100 vira só a barra. mais = '+10' subindo."""
    caixa(d, (48, 120, 470, 262))
    if estado == 'sem':
        d.text((76, 134), vazio, font=F(FX, 64), fill=VERM + (255,))
        d.rectangle((78, 222, 440, 240), outline=(255, 255, 255, 120), width=2)
        return
    d.text((76, 134), f'{rotulo} · LV {estado}', font=F(FX, 64), fill=BRANCO + (255,))
    d.rectangle((78, 220, 440, 240), outline=(255, 255, 255, 190), width=2)
    d.rectangle((81, 223, 81 + int(356 * cl(xp / 100)), 237), fill=AMARELO + (255,))
    if mais and t >= t_mais:
        q = prog(t, t_mais, 0.5); a = int(255 * (1 - cl((q - 0.7) / 0.3)))
        d.text((490, 214 - 26 * e_out(q)), mais, font=F(FX, 64), fill=AMARELO + (a,), anchor='ls')

def relogio(d, hhmm):
    caixa(d, (W - 48 - 272, 120, W - 48, 262))
    d.text((W - 48 - 136, 191), hhmm, font=F(FX, 104), fill=BRANCO + (255,), anchor='mm')

SLOT = (60, 1040, W - 60, 1220)
def cartao(d, t, t0, rotulo, cor, texto):
    """Cartão de sistema no slot fixo: entra em 0,16 s subindo 18 px. t0 = -1 para já estar na tela."""
    p = prog(t, t0, 0.16)
    if p <= 0: return
    dy = int(18 * (1 - e_out(p))); x0, y0, x1, y1 = SLOT
    caixa(d, (x0, y0 + dy, x1, y1 + dy), a=p)
    a = int(255 * p)
    d.text((x0 + 34, y0 + 18 + dy), rotulo, font=F(FB, 52), fill=cor + (a,))
    d.text((x0 + 34, y0 + 74 + dy), texto, font=F(FX, 92), fill=BRANCO + (a,))

def alvo(d, t, t0, c, r, cor=BRANCO):
    """Círculo de alvo fino em volta do ponto c (x, y): fecha de 1,35x para 1x em 0,22 s."""
    p = prog(t, t0, 0.22)
    if p <= 0 or c is None: return
    rr = r * (1 + 0.35 * (1 - e_out(p))); a = int(235 * p); cx, cy = c
    d.ellipse((cx - rr, cy - rr, cx + rr, cy + rr), outline=cor + (a,), width=4)

def rotulo_ameaca(d, t, t0, c, r, dist, cima=False, nome='AMEAÇA'):
    """Etiqueta vermelha ao lado da mira (ou acima, quando os botões do voto ocupam a faixa de baixo)."""
    p = prog(t, t0, 0.18)
    if p <= 0 or c is None: return
    a = int(255 * p); f = F(FX, 50); txt = f'{nome} · {dist}'
    w = d.textlength(txt, font=f) + 36
    if cima:
        x = max(48, min(W - 48 - w, c[0] - w / 2)); y = c[1] - r - 96
    else:
        x = c[0] + r + 14; x = min(x, W - 48 - w) if x + w <= W - 48 else c[0] - r - 14 - w
        y = c[1] - 40
    caixa(d, (x, y, x + w, y + 80), a=p, raio=10)
    d.text((x + 18, y + 40), txt, font=f, fill=VERM + (a,), anchor='lm')

def botoes(d, t, t_c, opcoes=(('1', 'EMPURRAR'), ('2', 'PUXAR'))):
    """Voto: dois botões lado a lado, abaixo da legenda (o que está em jogo continua à vista)."""
    for i, ((n, txt), cor) in enumerate(zip(opcoes, (CIANO_V, MAGENTA_V))):
        p = prog(t, t_c + i * 0.3, 0.16)
        if p <= 0: continue
        dy = int(18 * (1 - e_out(p))); x0 = 60 + i * 490; x1 = x0 + 470; y0, y1 = 1488 + dy, 1628 + dy
        d.rounded_rectangle((x0, y0, x1, y1), 18, fill=cor + (int(235 * p),))
        d.ellipse((x0 + 26, y0 + 30, x0 + 106, y0 + 110), fill=(20, 20, 30, int(255 * p)))
        d.text((x0 + 66, y0 + 70), n, font=F(FX, 70), fill=cor + (int(255 * p),), anchor='mm')
        d.text((x0 + 128, y0 + 70), txt, font=F(FX, 84), fill=(20, 20, 30, int(255 * p)), anchor='lm')

def legenda(img, t, leg, y=1420, tam=92, tarja=False):
    """leg = lista de (t0, t1, [(PALAVRA, é_chave), ...]). Branca, palavra-chave amarela, sombra suave, sem pílula.
    tarja=True põe uma faixa escura atrás (só com fundo claro ali: decida no 1º quadro do plano, para não piscar)."""
    ativo = [l for l in leg if l[0] <= t < l[1]]
    if not ativo: return
    t0, t1, partes = ativo[-1]
    fC = F(FX, tam); d0 = ImageDraw.Draw(img)
    sp = d0.textlength(' ', font=fC)
    larg = sum(d0.textlength(p, font=fC) for p, _ in partes) + sp * (len(partes) - 1)
    lay = Image.new('RGBA', (W, 260)); dl = ImageDraw.Draw(lay)
    x = (W - larg) / 2
    for txt, ch in partes:
        dl.text((x, 80), txt, font=fC, fill=(AMARELO if ch else BRANCO) + (255,))
        x += dl.textlength(txt, font=fC) + sp
    a = np.asarray(lay).copy()
    al = Image.fromarray(a[..., 3]).filter(ImageFilter.MaxFilter(9)).filter(ImageFilter.GaussianBlur(4))
    sh0 = Image.fromarray(np.dstack([np.full(a.shape[:2] + (3,), 12, np.uint8), (np.asarray(al) * 0.82).astype(np.uint8)]))
    sh = Image.new('RGBA', sh0.size); sh.paste(sh0, (0, 3))
    q = prog(t, t0, 0.07)
    if q < 1:
        a2 = np.asarray(sh).copy(); a2[..., 3] = (a2[..., 3] * q).astype(np.uint8); sh = Image.fromarray(a2)
        a3 = np.asarray(lay).copy(); a3[..., 3] = (a3[..., 3] * q).astype(np.uint8); lay = Image.fromarray(a3)
    x0, x1 = int((W - larg) / 2) - 28, int((W + larg) / 2) + 28; y0, y1 = y - tam // 2 - 14, y + tam // 2 + 22
    if tarja:
        tj = Image.new('RGBA', (W, H)); ImageDraw.Draw(tj).rounded_rectangle((x0, y0, x1, y1), 14, fill=(10, 10, 14, int(170 * q)))
        img.alpha_composite(tj)
    img.alpha_composite(sh, (0, y - 80 - tam // 2))
    img.alpha_composite(lay, (0, y - 80 - tam // 2))

def fundo_claro(img):
    """True se a faixa da legenda está sobre fundo claro (placa branca, céu de dia): aí a legenda pede tarja."""
    return (np.asarray(img.convert('L'))[1330:1530, 120:960] > 165).mean() > 0.25
