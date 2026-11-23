"""Demo do motor 06: monta 3 s de episódio (selo do voto, monitor de batimentos, soco de zoom, glitch, cartões de escolha)
por cima de 3 quadros-placeholder desenhados por código. Não usa IA, GPU, voz nem internet.

uso: python demo.py        -> saida/demo.mp4 (540x960, 30 qps, 3 s, mudo)
Para ver com a sua arte: ponha P1.png, P2.png e P3.png (9:16) em saida/_demo_ep/quadros/ e rode de novo com --manter.
"""
import os, sys, json, shutil, subprocess, time
from PIL import Image, ImageDraw, ImageFilter

AQUI = os.path.dirname(os.path.abspath(__file__))
SAIDA = os.path.join(AQUI, 'saida'); EP = os.path.join(SAIDA, '_demo_ep'); Q = os.path.join(EP, 'quadros')
W, H = 768, 1344


def fundo(seed):
    """bosque pintado: degradê frio, troncos em 3 planos com névoa entre eles, facho de luz"""
    import random
    r = random.Random(seed)
    im = Image.new('RGB', (W, H)); d = ImageDraw.Draw(im)
    for y in range(H):
        u = y / H; d.line((0, y, W, y), fill=(int(22 + 40 * u), int(42 + 58 * u), int(58 + 50 * u)))
    for plano, (cor, larg, n, blur) in enumerate([((44, 70, 82), 46, 9, 7), ((26, 46, 56), 80, 6, 4), ((12, 24, 30), 130, 3, 2)]):
        cam = Image.new('RGBA', (W, H), (0, 0, 0, 0)); dc = ImageDraw.Draw(cam)
        for _ in range(n):
            x = r.randint(-40, W); l = int(larg * r.uniform(0.7, 1.3))
            dc.polygon([(x, 0), (x + l, 0), (x + l * 1.25, H), (x - l * 0.25, H)], fill=cor + (255,))
        im.paste(cam.filter(ImageFilter.GaussianBlur(blur)), (0, 0), cam.filter(ImageFilter.GaussianBlur(blur)))
        nev = Image.new('RGBA', (W, H), (0, 0, 0, 0)); dn = ImageDraw.Draw(nev)
        for _ in range(5):
            x, y = r.randint(0, W), r.randint(H // 3, H); dn.ellipse((x - 320, y - 90, x + 320, y + 90), fill=(170, 200, 205, 34))
        im.paste(nev.filter(ImageFilter.GaussianBlur(60)), (0, 0), nev.filter(ImageFilter.GaussianBlur(60)))
    luz = Image.new('RGBA', (W, H), (0, 0, 0, 0)); ImageDraw.Draw(luz).polygon([(W * 0.55, 0), (W * 0.8, 0), (W * 0.5, H), (W * 0.1, H)], fill=(255, 236, 190, 46))
    im.paste(luz.filter(ImageFilter.GaussianBlur(50)), (0, 0), luz.filter(ImageFilter.GaussianBlur(50)))
    ch = Image.new('RGBA', (W, H), (0, 0, 0, 0)); ImageDraw.Draw(ch).ellipse((-200, H - 260, W + 200, H + 200), fill=(18, 34, 30, 255))
    im.paste(ch.filter(ImageFilter.GaussianBlur(12)), (0, 0), ch.filter(ImageFilter.GaussianBlur(12)))
    return im


def massinha(im, cx, base, k, cores, arco=False, medo=False):
    """boneco de massinha: cabeça redonda, membros de cápsula, cachecol; luz de cima-esquerda e sombra no chão"""
    pele, roupa, lenco, calca = cores
    esc = lambda c, f: tuple(int(v * f) for v in c)
    cam = Image.new('RGBA', im.size, (0, 0, 0, 0)); d = ImageDraw.Draw(cam)
    def capsula(x0, y0, x1, y1, r, cor):
        d.line((x0, y0, x1, y1), fill=cor + (255,), width=int(2 * r)); d.ellipse((x0 - r, y0 - r, x0 + r, y0 + r), fill=cor + (255,)); d.ellipse((x1 - r, y1 - r, x1 + r, y1 + r), fill=cor + (255,))
    s = lambda v: v * k
    d.ellipse((cx - s(150), base - s(26), cx + s(150), base + s(26)), fill=(4, 10, 10, 150))                     # sombra
    for dx in (-48, 48): capsula(cx + s(dx), base - s(210), cx + s(dx * 1.1), base - s(34), s(34), calca)        # pernas
    for dx in (-52, 52): d.ellipse((cx + s(dx) - s(46), base - s(48), cx + s(dx) + s(46), base + s(6)), fill=esc(calca, 0.7) + (255,))   # botas
    d.rounded_rectangle((cx - s(105), base - s(470), cx + s(105), base - s(190)), int(s(90)), fill=roupa + (255,))   # tronco
    d.rounded_rectangle((cx - s(105), base - s(470), cx - s(30), base - s(190)), int(s(60)), fill=esc(roupa, 1.18) + (255,))
    if arco:
        capsula(cx - s(100), base - s(420), cx - s(235), base - s(400), s(30), roupa); d.ellipse((cx - s(275), base - s(432), cx - s(215), base - s(372)), fill=pele + (255,))
        d.arc((cx - s(380), base - s(600), cx - s(160), base - s(200)), 90, 270, fill=(120, 78, 40, 255), width=int(s(14)))
        d.line((cx - s(270), base - s(600), cx - s(270), base - s(200)), fill=(230, 225, 210, 255), width=max(2, int(s(4))))
        capsula(cx + s(100), base - s(420), cx + s(40), base - s(330), s(30), roupa)
    else:
        for dx in (-1, 1): capsula(cx + s(100 * dx), base - s(420), cx + s(128 * dx), base - s(250), s(30), roupa); d.ellipse((cx + s(128 * dx) - s(32), base - s(262), cx + s(128 * dx) + s(32), base - s(198)), fill=pele + (255,))
    hy = base - s(610)
    d.ellipse((cx - s(170), hy - s(170), cx + s(170), hy + s(170)), fill=pele + (255,))                          # cabeça
    d.ellipse((cx - s(150), hy - s(160), cx + s(40), hy + s(10)), fill=esc(pele, 1.1) + (255,))
    d.pieslice((cx - s(180), hy - s(190), cx + s(180), hy + s(110)), 180, 360, fill=(48, 30, 20, 255))            # cabelo
    for dx in (-62, 62): d.ellipse((cx + s(dx) - s(17), hy + s(8), cx + s(dx) + s(17), hy + s(42)), fill=(16, 12, 10, 255))   # olho de bolinha
    if medo: d.ellipse((cx - s(20), hy + s(80), cx + s(20), hy + s(112)), fill=(60, 26, 20, 255))
    else: d.arc((cx - s(34), hy + s(60), cx + s(34), hy + s(104)), 20, 160, fill=(60, 26, 20, 255), width=max(2, int(s(7))))
    d.rounded_rectangle((cx - s(135), base - s(505), cx + s(135), base - s(425)), int(s(40)), fill=lenco + (255,))   # cachecol
    capsula(cx + s(70), base - s(450), cx + s(95), base - s(330), s(26), esc(lenco, 0.86))
    cam = cam.filter(ImageFilter.GaussianBlur(max(1, k * 1.4)))
    im.paste(cam, (0, 0), cam)


def general(im, cx, base, k, nitido=True):
    """caçador alto e fino, capacete-concha sem rosto com anéis azuis"""
    cam = Image.new('RGBA', im.size, (0, 0, 0, 0)); d = ImageDraw.Draw(cam); s = lambda v: v * k; c = (34, 38, 46, 255)
    d.ellipse((cx - s(200), base - s(30), cx + s(200), base + s(30)), fill=(4, 8, 10, 150))
    for dx in (-50, 50): d.line((cx + s(dx), base - s(520), cx + s(dx * 1.4), base), fill=c, width=int(s(44)))
    d.polygon([(cx - s(150), base - s(900)), (cx + s(150), base - s(900)), (cx + s(100), base - s(480)), (cx - s(100), base - s(480))], fill=c)
    d.polygon([(cx - s(160), base - s(880)), (cx - s(260), base - s(330)), (cx - s(170), base - s(380)), (cx - s(90), base - s(480))], fill=(52, 56, 62, 255))   # capa
    for dx in (-1, 1): d.line((cx + s(150 * dx), base - s(880), cx + s(200 * dx), base - s(500)), fill=c, width=int(s(36)))
    hy = base - s(1040)
    d.ellipse((cx - s(190), hy - s(150), cx + s(190), hy + s(150)), fill=(44, 50, 60, 255))
    d.ellipse((cx - s(160), hy - s(118), cx + s(160), hy + s(122)), fill=(8, 12, 20, 255))
    for r in (120, 82, 44): d.ellipse((cx - s(r * 1.25), hy - s(r * 0.9), cx + s(r * 1.25), hy + s(r * 0.9)), outline=(90, 190, 255, 255), width=max(2, int(s(7))))
    cam = cam.filter(ImageFilter.GaussianBlur(1.5 if nitido else 9))
    if not nitido: cam.putalpha(cam.getchannel('A').point(lambda v: int(v * 0.72)))
    im.paste(cam, (0, 0), cam)


def quadros():
    os.makedirs(Q, exist_ok=True)
    menino = ((196, 140, 100), (62, 110, 70), (214, 168, 52), (92, 62, 40))
    a = fundo(1); general(a, 560, 1180, 0.62, nitido=False); massinha(a, 330, 1700, 1.55, menino, medo=True); a.save(os.path.join(Q, 'P1.png'))
    b = fundo(2); general(b, 400, 1290, 0.95); massinha(b, 640, 1310, 0.42, menino, medo=True); b.save(os.path.join(Q, 'P2.png'))
    c = fundo(3); general(c, 590, 1130, 0.5, nitido=False); massinha(c, 300, 1080, 0.72, menino, arco=True); c.save(os.path.join(Q, 'P3.png'))


LINHA = {
    'fonte': 'demo (sem voz)', 'total': 3.0, 'selo_txt': 'EP. 1 · VOCÊS VOTARAM 1', 'monitor_txt': 'SINAIS VITAIS',
    'escolha': [['1 · ATIRA', 'e vira o ALVO'], ['2 · FICA PARADO', 'e perde a mestra']], 'chamada': 'COMENTA 1 OU 2',
    'segmentos': [
        {'plano': 'P1', 't': 0.0, 'dur': 1.0, 'selo': [0.05, 0.5], 'monitor': [0.5, 0.9, 84, 79]},
        {'plano': 'P2', 't': 1.0, 'dur': 0.9, 'soco': 0.4, 'fx': ['pula', 'glitch_fim'], 'flash_entrada': True},
        {'plano': 'P3', 't': 1.9, 'dur': 1.1, 'cartoes': 0.1, 'vivo': 1},
    ],
}


def main():
    t0 = time.time()
    if '--manter' not in sys.argv or not os.path.isdir(Q): quadros()
    json.dump(LINHA, open(os.path.join(EP, 'linha.json'), 'w', encoding='utf-8'), indent=1, ensure_ascii=False)
    base = os.path.join(SAIDA, '_demo')
    subprocess.run([sys.executable, os.path.join(AQUI, 'montagem', 'montar.py'), os.path.join(EP, 'linha.json'), base, '--tam', '540x960'], check=True)
    shutil.move(base + '_mudo.mp4', os.path.join(SAIDA, 'demo.mp4'))
    print(f'ok: {os.path.join("saida", "demo.mp4")} em {time.time() - t0:.0f} s')


if __name__ == '__main__':
    main()
