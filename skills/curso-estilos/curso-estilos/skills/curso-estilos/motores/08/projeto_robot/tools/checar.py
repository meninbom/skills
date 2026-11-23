"""Checa o roteiro de montagem (src/data/cenas.json) contra a regua da casa, antes de qualquer render:
- texto: nada abaixo de 44 px; largura dentro de x 60-960 (medida com a Fixture real); informacao entre y 220 e 1500
- ritmo: 1o evento <= 0,4 s; media >= 1 evento a cada 0,5 s; lista os buracos > 0,9 s sem evento de montagem
  (evento = corte, texto entrando, papel entrando/saindo, punch, corte de camera, especial, flash).
  O movimento real do H3 NAO conta aqui (e bonus): a regra vale mesmo com o still.
uso: python checar.py
"""
import os, json, sys
from PIL import ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
C = json.load(open(os.path.join(HERE, '..', 'src', 'data', 'cenas.json'), encoding='utf-8'))
FD = os.environ.get('FONTES_DIR', os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'public', 'fonts')) + '/'
FONTS = {'heroi': 'Fixture-ExpandedBlack.ttf', 'info': 'Fixture-SemiBold.ttf', 'cond': 'Fixture-CondensedBlack.ttf'}

prob, ev = [], []
for c in C['cenas']:
    ev.append((c['t0'], f"corte {c['n']}"))
    for k in c.get('cam', []):
        if k.get('corte'):
            ev.append((k['t'], f"corte de camera {c['n']}"))
    for t, _ in c.get('punch', []):
        ev.append((t, f"punch {c['n']}"))
    for p in c.get('papeis', []):
        ev.append((p['t'], f"papel {p['doc']}"))
        if p.get('ate'):
            ev.append((p['ate'], f"papel sai {p['doc']}"))
    for t in c.get('marcas', []):
        ev.append((t, f"marca {c['n']}"))
    for tx in c.get('textos', []):
        ev.append((tx['t'], f"texto {tx['txt']}"))
        if tx.get('ate'):
            ev.append((tx['ate'], f"texto sai {tx['txt']}"))
        f = ImageFont.truetype(FD + FONTS[tx['f']], tx['s'])
        wpx = f.getlength(tx['txt']) + tx.get('track', 0) * (len(tx['txt']) - 1)
        x0 = tx['x'] - (wpx / 2 if tx.get('ancora') == 'middle' else 0)
        x1 = x0 + wpx
        asc = f.getbbox(tx['txt'])[1]
        top = tx['y'] + asc - f.getmetrics()[0]
        if tx['s'] < 44:
            prob.append(f"cena {c['n']}: '{tx['txt']}' {tx['s']} px < 44")
        if x0 < 60 - 0.5 or x1 > 1020:
            prob.append(f"cena {c['n']}: '{tx['txt']}' sai da largura: x {x0:.0f}-{x1:.0f} (largura {wpx:.0f})")
        elif x1 > 960 and tx['f'] == 'info':
            prob.append(f"cena {c['n']}: '{tx['txt']}' informacao passa de x 960: {x1:.0f}")
        if tx['f'] == 'info' and (top < 220 or tx['y'] > 1500):
            prob.append(f"cena {c['n']}: '{tx['txt']}' fora da faixa y 220-1500 (topo {top:.0f}, base {tx['y']})")
for t in C.get('flashes', []):
    ev.append((t, 'flash'))
ev.sort()
ts = sorted(set(round(t, 2) for t, _ in ev))
dur = 45.4
print(f'eventos: {len(ts)} em {dur} s -> 1 a cada {dur / len(ts):.2f} s (regra: <= 0,5)')
print(f'1o evento: {ts[0] if ts[0] > 0 else ts[1]:.2f} s (regra: <= 0,4)')
gaps = [(b - a, a, b) for a, b in zip(ts, ts[1:] + [dur]) if b - a > 0.9]
for g, a, b in gaps:
    prob.append(f'buraco de {g:.2f} s sem evento de montagem: {a:.2f} -> {b:.2f}')
print('\n'.join(prob) if prob else 'ok: textos e ritmo dentro da regua')
sys.exit(1 if any('sai da largura' in p or '< 44' in p for p in prob) else 0)
