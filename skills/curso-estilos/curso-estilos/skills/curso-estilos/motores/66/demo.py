"""Demo do estilo 66: a HUD de RPG (hud.py) + montagem em corte seco + push-in em código, sobre 3 imagens-placeholder
desenhadas aqui mesmo (uma fachada à noite, a placa de perto, o beco). Não usa IA, GPU, internet nem áudio.
uso: python demo.py   ->  saida/demo.mp4 (3 s, 540x960, 24 qps, mudo, yuv420p)
Para ver a HUD sobre as SUAS ilustrações: ponha demo_quadros/1.png, 2.png e 3.png (9:16) nesta pasta e rode de novo.
DEMO_CPU=1 é aceito e não muda nada: este demo já roda só em CPU.
"""
import os, random, subprocess, sys, time
import numpy as np
from PIL import Image, ImageDraw

AQUI = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, AQUI)
from hud import (W, H, F, FX, BRANCO, AMARELO, VERM, e_out, status, relogio, cartao, alvo, rotulo_ameaca, botoes, legenda, fundo_claro)

FPS, SAIDA_W, SAIDA_H = 24, 540, 960
FFMPEG = os.environ.get('FFMPEG_PATH', 'ffmpeg')
NOITE, NOITE2, TIJOLO, TIJOLO2, QUENTE, VIDRO = (22, 30, 62), (34, 46, 92), (74, 52, 70), (58, 40, 58), (255, 190, 96), (44, 66, 110)

# ------------------------------------------------------------------ as 3 imagens-placeholder (no lugar das ilustrações de IA)
def ceu(d):
    for y in range(0, H, 8):
        k = y / H
        d.rectangle((0, y, W, y + 8), fill=tuple(int(a + (b - a) * k) for a, b in zip(NOITE, NOITE2)))
    rnd = random.Random(7)
    for _ in range(60):
        x, y = rnd.randrange(W), rnd.randrange(700); d.ellipse((x, y, x + 3, y + 3), fill=(200, 215, 255))

def fachada():
    """Plano aberto: prédio de tijolo, janela quente, porta de vidro com a placa. Devolve (imagem, caixa da placa)."""
    im = Image.new('RGB', (W, H)); d = ImageDraw.Draw(im); ceu(d)
    d.rectangle((0, 330, W, H), fill=TIJOLO)
    for y in range(350, 1500, 46):
        d.line((0, y, W, y), fill=TIJOLO2, width=3)
    d.rectangle((0, 1500, W, H), fill=(30, 32, 52))                               # calçada
    d.rounded_rectangle((110, 520, 420, 860), 10, fill=QUENTE)                    # janela quente
    d.line((265, 520, 265, 860), fill=TIJOLO2, width=10); d.line((110, 690, 420, 690), fill=TIJOLO2, width=10)
    d.rounded_rectangle((560, 640, 960, 1500), 12, fill=(20, 24, 44))             # batente
    d.rectangle((584, 664, 936, 1500), fill=VIDRO)                                # vidro
    d.polygon(((584, 1100), (936, 760), (936, 900), (584, 1240)), fill=(58, 84, 134))
    d.rounded_rectangle((900, 1010, 922, 1170), 8, fill=(210, 214, 226))          # maçaneta
    placa = (668, 800, 852, 930)
    d.rounded_rectangle(placa, 6, fill=(244, 244, 238))
    d.text(((placa[0] + placa[2]) / 2, (placa[1] + placa[3]) / 2), 'PUSH', font=F(FX, 78), fill=(24, 24, 30), anchor='mm')
    d.ellipse((330, 1180, 470, 1320), fill=(46, 30, 78)); d.rounded_rectangle((320, 1300, 480, 1560), 40, fill=(86, 58, 150))   # "você", de costas
    return im, placa

def beco():
    """O beco ao lado: escuro, com um par de olhos vermelhos. Devolve (imagem, centro dos olhos)."""
    im = Image.new('RGB', (W, H)); d = ImageDraw.Draw(im); ceu(d)
    d.rectangle((0, 260, 330, H), fill=TIJOLO2); d.rectangle((750, 200, W, H), fill=TIJOLO)
    d.rectangle((330, 420, 750, H), fill=(12, 15, 32))
    d.polygon(((0, H), (330, 1380), (750, 1380), (W, H)), fill=(30, 32, 52))
    d.ellipse((440, 1010, 660, 1330), fill=(6, 7, 16)); d.polygon(((455, 1040), (480, 940), (520, 1030)), fill=(6, 7, 16))
    d.polygon(((580, 1030), (622, 940), (645, 1040)), fill=(6, 7, 16))
    for x in (506, 594):
        d.ellipse((x - 16, 1104, x + 16, 1128), fill=(255, 60, 50))
    d.rounded_rectangle((820, 520, 1000, 800), 8, fill=QUENTE)
    return im, (550, 1116)

def carregar(n, padrao):
    """Usa demo_quadros/<n>.png se existir (cortado em 9:16 pelo centro); senão, o placeholder."""
    p = os.path.join(AQUI, 'demo_quadros', f'{n}.png')
    if not os.path.exists(p): return padrao
    im = Image.open(p).convert('RGB'); k = max(W / im.width, H / im.height)
    im = im.resize((round(im.width * k), round(im.height * k)), Image.LANCZOS)
    x0, y0 = (im.width - W) // 2, (im.height - H) // 2
    return im.crop((x0, y0, x0 + W, y0 + H))

# ------------------------------------------------------------------ câmera em código: push-in com destino (nunca plano parado)
def camera(im, k, z1, foco, destino):
    """k 0-1. Zoom de 1 a z1 levando o ponto `foco` (px do quadro) até `destino` (px da tela). Devolve (quadro, função ponto->tela)."""
    q = e_out(k) * 0.8 + 0.2 * k; z = 1 + (z1 - 1) * q
    tx, ty = foco[0] + (destino[0] - foco[0]) * q, foco[1] + (destino[1] - foco[1]) * q
    x0, y0 = (0 - (tx - z * foco[0])) / z, (0 - (ty - z * foco[1])) / z
    x0 = min(max(x0, 0), W - W / z); y0 = min(max(y0, 0), H - H / z)
    fr = im.resize((W, H), Image.BILINEAR, box=(x0, y0, x0 + W / z, y0 + H / z))
    return fr, (lambda p: ((p[0] - x0) * z, (p[1] - y0) * z)), z

def chuva(d, i):
    rnd = random.Random(i // 2)
    for _ in range(46):
        x, y = rnd.randrange(-100, W), rnd.randrange(H); d.line((x, y, x + 18, y + 70), fill=(190, 210, 255, 70), width=2)

# ------------------------------------------------------------------ os 3 planos (1 s cada, corte seco) e a HUD de cada um
LEG = [(0.10, 0.95, [('FALTA', False), ('UMA', True)]), (1.05, 1.95, [('TÁ ESCRITO', False), ('PUXE', True)]),
       (2.05, 3.00, [('COMENTA', False), ('1 OU 2', True)])]

def main():
    t_ini = time.time()
    f1, placa = fachada(); f3, olhos = beco()
    cp = ((placa[0] + placa[2]) / 2, (placa[1] + placa[3]) / 2)
    planos = [  # (imagem, zoom final, foco, destino, relógio)
        (carregar(1, f1), 1.10, cp, (W * 0.56, H * 0.44), '23:52'),
        (carregar(2, f1.resize((W, H), Image.LANCZOS, box=(400, 440, 400 + 620, 440 + 620 * H / W))), 1.12, (W * 0.58, H * 0.36), (W * 0.52, H * 0.36), '23:53'),
        (carregar(3, f3), 1.08, olhos, (W * 0.5, H * 0.55), '23:56'),
    ]
    os.makedirs(os.path.join(AQUI, 'saida'), exist_ok=True)
    saida = os.path.join(AQUI, 'saida', 'demo.mp4')
    pf = subprocess.Popen([FFMPEG, '-v', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{SAIDA_W}x{SAIDA_H}', '-r', str(FPS),
                           '-i', '-', '-an', '-c:v', 'libx264', '-preset', 'medium', '-crf', '18', '-pix_fmt', 'yuv420p',
                           '-movflags', '+faststart', saida], stdin=subprocess.PIPE)
    tarja = {}
    for i in range(3 * FPS):
        t = i / FPS; p = min(2, int(t)); tl = t - p
        im, z1, foco, dest, hora = planos[p]
        fr, na_tela, z = camera(im, tl, z1, foco, dest)
        img = fr.convert('RGBA')
        ui = Image.new('RGBA', (W, H)); d = ImageDraw.Draw(ui)
        chuva(d, i)
        relogio(d, hora)
        status(d, 1, 90)
        if p == 0:
            alvo(d, t, 0.20, na_tela(cp), 130 * z)
            cartao(d, t, 0.45, 'ÚLTIMA PALAVRA', AMARELO, 'PUSH  =  ???')
        elif p == 1:
            cartao(d, t, -1, 'ÚLTIMA PALAVRA', AMARELO, 'PUSH  =  ???')
        else:
            c = na_tela(olhos)
            alvo(d, t, 2.15, c, 150 * z, VERM); rotulo_ameaca(d, t, 2.23, c, 150 * z, '3 m', cima=True)
            botoes(d, t, 2.30)
        img.alpha_composite(ui)
        if p not in tarja: tarja[p] = fundo_claro(img)
        legenda(img, t, LEG, tarja=tarja[p])
        pf.stdin.write(np.asarray(img.convert('RGB').resize((SAIDA_W, SAIDA_H), Image.LANCZOS)).tobytes())
    pf.stdin.close()
    if pf.wait() != 0: raise SystemExit('o ffmpeg falhou: ele está instalado e no PATH? (ou aponte FFMPEG_PATH)')
    print(f'ok {saida}  ({time.time() - t_ini:.1f} s)')

if __name__ == '__main__':
    main()
