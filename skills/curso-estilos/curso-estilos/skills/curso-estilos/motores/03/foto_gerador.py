"""Salva a prancha do gerador (gerador.html?folha[&seed=N]) em PNG/JPG. uso: python foto_gerador.py --out _poses/gerador_folha.jpg [--seed N]"""
import os, base64, threading, functools, http.server, argparse
from playwright.sync_api import sync_playwright
from _chrome import abre
ROOT = os.path.dirname(os.path.abspath(__file__))
ap = argparse.ArgumentParser(); ap.add_argument('--out', required=True); ap.add_argument('--seed', default='0'); ap.add_argument('--q', default='folha'); ap.add_argument('--t', type=float, default=0); ap.add_argument('--port', type=int, default=8890); ap.add_argument('--page', default='gerador.html')
a = ap.parse_args()
class Q(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *x): pass
srv = http.server.ThreadingHTTPServer(('127.0.0.1', a.port), functools.partial(Q, directory=ROOT)); threading.Thread(target=srv.serve_forever, daemon=True).start()
with sync_playwright() as p:
    b = abre(p); pg = b.new_page(viewport={"width": 1080, "height": 1920}); pg.on('pageerror', lambda e: print('[ERRO]', e))
    pg.goto(f'http://127.0.0.1:{a.port}/{a.page}?{a.q}&seed={a.seed}'); pg.wait_for_function('window.READY === true', timeout=60000)
    d = pg.evaluate(f'(async()=>{{await window.seek({a.t}); return document.getElementById("c").toDataURL("image/jpeg", 0.92);}})()')
    os.makedirs(os.path.dirname(os.path.join(ROOT, a.out)) or '.', exist_ok=True); open(os.path.join(ROOT, a.out), 'wb').write(base64.b64decode(d.split(',')[1])); b.close()
srv.shutdown(); print('ok', a.out)
