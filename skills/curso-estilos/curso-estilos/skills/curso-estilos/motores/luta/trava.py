"""Trava das articulações: percorre todos os planos do episódio e acusa joelho pra trás, cotovelo pra frente
(braço abaixo do ombro), membro torto de frente e mão/pé fora do alcance. Usa checaJuntas() do boneco.js.
uso: python trava.py [--page episodio.html] [--qps 12] [--out TRAVA.md]
sai com código 1 se houver reprovação."""
import os, sys, threading, functools, http.server, argparse, json
from playwright.sync_api import sync_playwright
from _chrome import abre
ROOT = os.path.dirname(os.path.abspath(__file__))
ap = argparse.ArgumentParser(); ap.add_argument('--page', default='episodio.html'); ap.add_argument('--qps', type=int, default=12)
ap.add_argument('--out', default='TRAVA.md'); ap.add_argument('--port', type=int, default=8870); ap.add_argument('--json')
a = ap.parse_args()
class Q(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *x): pass
srv = http.server.ThreadingHTTPServer(('127.0.0.1', a.port), functools.partial(Q, directory=ROOT))
threading.Thread(target=srv.serve_forever, daemon=True).start()
JS = """async ([t0, D, qps]) => { const res = []; const n = Math.max(1, Math.floor(D * qps));
  for (let i = 0; i < n; i++) { const t = t0 + i / qps; globalThis.TRAVA_LOG = []; await window.seek(t);
    for (const p of globalThis.TRAVA_LOG) res.push({ t, ...p }); }
  globalThis.TRAVA_LOG = null; return res; }"""
with sync_playwright() as p:
    b = abre(p)
    pg = b.new_page(viewport={"width": 1080, "height": 1920}); ERROS = []; pg.on('pageerror', lambda e: ERROS.append(str(e)))
    pg.on('console', lambda m: ERROS.append(m.text) if m.text.startswith('sem ') else None)
    pg.goto(f'http://127.0.0.1:{a.port}/{a.page}'); pg.wait_for_function('window.READY === true', timeout=60000)
    planos = pg.evaluate('window.PLANOS'); achados = []
    if ERROS: print('REPROVOU: a página não carregou inteira:', *ERROS, sep='\n  '); sys.exit(2)
    for pl in planos:
        for r in pg.evaluate(JS, [pl['t0'], pl['D'], a.qps]): r['plano'] = pl['id']; r['u'] = r['t'] - pl['t0']; achados.append(r)
    b.close()
srv.shutdown()
# agrupa por plano + boneco + membro + tipo
grupos = {}
for r in achados:
    k = (r['plano'], r['q'], r['m'], r['tipo']); g = grupos.setdefault(k, {'n': 0, 'px': 0, 'u0': r['u'], 'u1': r['u'], 'vista': r['vista']})
    g['n'] += 1; g['px'] = max(g['px'], abs(r['px'])); g['u0'] = min(g['u0'], r['u']); g['u1'] = max(g['u1'], r['u'])
ordem = {pl['id']: i for i, pl in enumerate(planos)}
L = [f'# Trava das articulações ({a.page}, {a.qps} quadros/s amostrados, {sum(int(pl["D"] * a.qps) for pl in planos)} quadros)', '']
if not grupos: L.append('**PASSOU**: nenhuma articulação reprovada.')
else:
    L += [f'**REPROVOU**: {len(grupos)} problema(s) em {len({k[0] for k in grupos})} plano(s).', '', '| plano | boneco | membro | problema | quadros | pior | trecho (s no plano) |', '|---|---|---|---|---|---|---|']
    for k in sorted(grupos, key=lambda k: (ordem[k[0]], k[1], k[2], k[3])):
        g = grupos[k]; un = '%' if 'cotovelo fixo' in k[3] else ' px'
        L.append(f'| {k[0]} | {k[1]} ({g["vista"]}) | {"perto" if k[2] == "N" else "longe"} | {k[3]} | {g["n"]} | {g["px"]:.0f}{un} | {g["u0"]:.2f}–{g["u1"]:.2f} |')
open(os.path.join(ROOT, a.out), 'w', encoding='utf-8').write('\n'.join(L) + '\n')
if a.json: json.dump(achados, open(a.json, 'w', encoding='utf-8'), ensure_ascii=False)
print('\n'.join(L)); sys.exit(1 if grupos else 0)
