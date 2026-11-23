"""Folha de poses em tamanho grande: um ladrilho por instante, rótulo com plano e tempo.
uso: python folha_poses.py --out _poses/agora.jpg [--video saida/filme.mp4] [--tw 540] PLANO:u,u,u PLANO:u ...
sem --video, desenha ao vivo do episodio.html; com --video, tira os quadros do arquivo (mesmos tempos)."""
import os, io, sys, re, base64, threading, functools, http.server, argparse, subprocess
from PIL import Image, ImageDraw, ImageFont
from playwright.sync_api import sync_playwright
from _chrome import abre
ROOT = os.path.dirname(os.path.abspath(__file__))
ap = argparse.ArgumentParser(); ap.add_argument('--out', required=True); ap.add_argument('--video'); ap.add_argument('--tw', type=int, default=540)
ap.add_argument('--cols', type=int, default=4); ap.add_argument('--port', type=int, default=8880); ap.add_argument('pedidos', nargs='+')
a = ap.parse_args()
class Q(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *x): pass
srv = http.server.ThreadingHTTPServer(('127.0.0.1', a.port), functools.partial(Q, directory=ROOT))
threading.Thread(target=srv.serve_forever, daemon=True).start()
tw = a.tw; th = tw * 16 // 9; ims = []
with sync_playwright() as p:
    b = abre(p)
    pg = b.new_page(viewport={"width": 1080, "height": 1920}); pg.on('pageerror', lambda e: print('[ERRO]', e))
    pg.goto(f'http://127.0.0.1:{a.port}/episodio.html'); pg.wait_for_function('window.READY === true', timeout=60000)
    t0 = {pl['id']: pl['t0'] for pl in pg.evaluate('window.PLANOS')}
    for ped in a.pedidos:
        pid, us = ped.split(':')
        for u in us.split(','):
            t = t0[pid] + float(u)
            if a.video:
                raw = subprocess.run(['ffmpeg', '-loglevel', 'error', '-ss', f'{t:.3f}', '-i', os.path.join(ROOT, a.video), '-frames:v', '1', '-f', 'image2pipe', '-c:v', 'mjpeg', '-'], capture_output=True).stdout
            else:
                d = pg.evaluate(f'(async()=>{{await window.seek({t}); return document.getElementById("c").toDataURL("image/jpeg", 0.93);}})()'); raw = base64.b64decode(d.split(',')[1])
            im = Image.open(io.BytesIO(raw)).convert('RGB').resize((tw, th), Image.LANCZOS)
            dr = ImageDraw.Draw(im); lab = f'{pid}  u={float(u):.2f}  t={t:.2f}'
            try: fn = ImageFont.truetype('arial.ttf', max(14, tw // 22))
            except Exception: fn = ImageFont.load_default()
            dr.rectangle([0, 0, tw, tw // 14 + 8], fill=(0, 0, 0)); dr.text((8, 4), lab, fill=(255, 230, 120), font=fn); ims.append(im)
    b.close()
srv.shutdown()
cols = min(a.cols, len(ims)); rows = (len(ims) + cols - 1) // cols
sh = Image.new('RGB', (cols * tw, rows * th), (20, 20, 20))
for i, im in enumerate(ims): sh.paste(im, ((i % cols) * tw, (i // cols) * th))
os.makedirs(os.path.dirname(os.path.join(ROOT, a.out)) or '.', exist_ok=True); sh.save(os.path.join(ROOT, a.out), quality=90); print('ok', a.out, len(ims), 'ladrilhos')
