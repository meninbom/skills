"""Compõe o personagem (imagem do Flow, mangá P&B em fundo branco) sobre o cenário do motor.
- recorta o personagem: fundo branco ligado à borda vira transparente (fecha frestas do traço antes)
- passa o tom do personagem pela MESMA retícula do cenário (pontos a 45°, mesmo passo e fase)
- halo branco em volta (separação de mangá) + sombra de contato em retícula nos pés

Uso: python compor.py <fundo.png> <personagem.jpg> <saida.png> --alt 1150 --cx 540 --base 1890 [--recorte x0,y0,x1,y1] [--sombra] [--espelhar]
"""
import argparse
import numpy as np
from PIL import Image, ImageDraw, ImageFont
from scipy import ndimage as ndi

CRED = "© OpenStreetMap contributors · relevo: Terrain Tiles (AWS Open Data)"
CELL = 4.2          # passo da retícula em px de saída (o mesmo do render a 1080 de largura)


def recorta(g, lim=0.55, dil=2, vaos=False):
    """g: cinza 0..1 do desenho em fundo branco -> máscara do personagem.
    Barreira só com traço escuro (chuva desenhada fica de fora); maior peça + peças grandes;
    vão branco puro fechado (entre as pernas) volta a ser fundo."""
    escuro = g < lim
    fechado = ndi.binary_dilation(escuro, iterations=dil)
    lab, _ = ndi.label(~fechado)
    borda = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))) - {0}
    m = ~np.isin(lab, list(borda))
    # vãos fechados de branco puro e grandes -> fundo
    for i in (set(np.unique(lab)) - borda - {0}) if vaos else ():
        r = lab == i
        if r.sum() > 0.003 * g.size and g[r].mean() > 0.975:
            m &= ~ndi.binary_dilation(r, iterations=dil)
    m = ndi.binary_erosion(m, iterations=max(1, dil - 1))
    lab2, n = ndi.label(m)
    if n > 1:
        tam = ndi.sum(m, lab2, range(1, n + 1)); mx = tam.max()
        m = np.isin(lab2, [i + 1 for i, t in enumerate(tam) if t > 0.15 * mx])
    return ndi.binary_opening(m, iterations=2)


def pontos(h, w, y0, x0, H, cov):
    """retícula a 45° em coordenadas da imagem final (fase igual à do shader). cov: cobertura por pixel."""
    yy, xx = np.mgrid[y0:y0 + h, x0:x0 + w].astype(np.float32)
    fx, fy = xx * 2 + 1, (H - yy) * 2 - 1                         # coordenadas do buffer 2x do render
    c = CELL * 2
    px = (0.7071 * fx + 0.7071 * fy) / c
    py = (-0.7071 * fx + 0.7071 * fy) / c
    d = np.hypot(px - np.floor(px) - 0.5, py - np.floor(py) - 0.5) * c
    r_ink = np.sqrt(np.clip(cov, 0, 1) / np.pi) * c
    r_wht = np.sqrt(np.clip(1 - cov, 0, 1) / np.pi) * c
    aa = 2.0
    ink_lo = 1 - np.clip((d - r_ink) / aa + 0.5, 0, 1)            # pontos pretos (cov <= .5)
    ink_hi = np.clip((d - r_wht) / aa + 0.5, 0, 1)                # pontos brancos (cov > .5)
    return np.where(cov > 0.5, ink_hi, ink_lo) * (cov > 0)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("fundo"); ap.add_argument("pers"); ap.add_argument("saida")
    ap.add_argument("--alt", type=int, default=1150); ap.add_argument("--cx", type=int, default=540)
    ap.add_argument("--base", type=int, default=1890); ap.add_argument("--recorte", default="")
    ap.add_argument("--sombra", action="store_true"); ap.add_argument("--espelhar", action="store_true")
    ap.add_argument("--halo", type=int, default=5); ap.add_argument("--sem-credito", action="store_true")
    ap.add_argument("--vaos", action="store_true", help="vão branco fechado e grande vira fundo (ex.: entre as pernas)")
    a = ap.parse_args()

    bg = np.asarray(Image.open(a.fundo).convert("L")).astype(np.float32) / 255
    H, W = bg.shape
    im = Image.open(a.pers).convert("L")
    if a.recorte:
        im = im.crop(tuple(int(v) for v in a.recorte.split(",")))
    if a.espelhar:
        im = im.transpose(Image.FLIP_LEFT_RIGHT)
    g0 = np.asarray(im).astype(np.float32) / 255
    m0 = recorta(g0, vaos=a.vaos)
    ys, xs = np.nonzero(m0)
    y0, y1, x0, x1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
    if a.recorte:                                                 # recorte manual: a borda de baixo é corte de quadro
        y1 = g0.shape[0]
    g0, m0 = g0[y0:y1, x0:x1], m0[y0:y1, x0:x1]
    k = a.alt / g0.shape[0]
    nw, nh = max(1, round(g0.shape[1] * k)), a.alt
    g = np.asarray(Image.fromarray((g0 * 255).astype(np.uint8)).resize((nw, nh), Image.LANCZOS)).astype(np.float32) / 255
    m = np.asarray(Image.fromarray((m0 * 255).astype(np.uint8)).resize((nw, nh), Image.BILINEAR)).astype(np.float32) / 255

    # posição: centro x, pé em base
    top, left = a.base - nh, a.cx - nw // 2
    # recorte para dentro da tela
    sy0, sx0 = max(0, -top), max(0, -left)
    sy1, sx1 = min(nh, H - top), min(nw, W - left)
    g, m = g[sy0:sy1, sx0:sx1], m[sy0:sy1, sx0:sx1]
    top, left = top + sy0, left + sx0
    h, w = g.shape

    out = bg.copy()
    # sombra de contato (elipse em retícula média) atrás dos pés
    if a.sombra:
        yy, xx = np.mgrid[0:H, 0:W]
        cy, rx, ry = a.base - nh * 0.01, nw * 0.42, nh * 0.025
        el = ((xx - a.cx) / rx) ** 2 + ((yy - cy) / ry) ** 2 < 1
        sh = pontos(H, W, 0, 0, H, np.full((H, W), 0.58, np.float32))
        out = np.where(el, np.minimum(out, 1 - sh), out)

    # tom do personagem -> 4 níveis da nossa retícula; traço fica traço
    gb = ndi.gaussian_filter(g, 1.6)
    lev = 1 - gb
    cov = np.select([lev < 0.12, lev < 0.30, lev < 0.55, lev < 0.90], [0.0, 0.13, 0.30, 0.58], 1.0).astype(np.float32)
    tone = 1 - pontos(h, w, top, left, H, cov)
    linha = np.clip((0.52 - g) / 0.30, 0, 1)                      # traço com antisserrilhado
    pers = tone * (1 - linha)

    # halo branco + personagem
    region = out[top:top + h, left:left + w]
    if a.halo:
        halo = ndi.binary_dilation(m > 0.5, iterations=a.halo).astype(np.float32)
        halo = ndi.gaussian_filter(halo, 0.8)
        region = region * (1 - halo) + halo
    region = region * (1 - m) + pers * m
    out[top:top + h, left:left + w] = region

    res = Image.fromarray((np.clip(out, 0, 1) * 255).astype(np.uint8)).convert("RGB")
    if not a.sem_credito:
        d = ImageDraw.Draw(res); f = ImageFont.load_default(max(12, W // 90))
        tw = d.textlength(CRED, font=f); pad = W // 120
        x, y = W - tw - pad * 2, H - f.size - pad * 2
        d.rectangle([x - pad, y - pad // 2, W, H], fill="white"); d.text((x, y), CRED, fill="black", font=f)
    res.save(a.saida)
    print("ok", a.saida, (w, h), "topo", top)


if __name__ == "__main__":
    main()
