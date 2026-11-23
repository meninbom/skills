"""Regua v3 (antes de qualquer render), sobre src/data/cenas.json:
  - planos: quantos cortes, plano mais curto, cortes de camera e punches (v3 quer poucos)
  - texto: essencial >= 40 px (credito >= 44), dentro de x 60-960 (info) / 60-1020 (titulo), informacao com base <= 1500
    e topo >= 290; NA TELA >= 1,2 s (>= 29 quadros a 24 fps, contando o corte do plano e o 'ate')
  - credito: 1 linha; legenda impressa cabe na largura da copia
uso: python tools/checar_v3.py   (sai 1 se algo quebrar a regua)
"""
import json, math, os, sys
from PIL import ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
C = json.load(open(os.path.join(HERE, '..', 'src', 'data', 'cenas.json'), encoding='utf-8'))
FD = os.path.join(HERE, '..', 'public', 'fonts') + '/'
FONTS = {'heroi': 'Fixture-ExpandedBlack.ttf', 'info': 'Fixture-SemiBold.ttf', 'cond': 'Fixture-CondensedBlack.ttf'}
FPS = 24
prob, aviso = [], []

cenas = C['cenas']
durs = [c['t1'] - c['t0'] for c in cenas]
cortes_cam = sum(1 for c in cenas for k in c.get('cam', []) if k.get('corte'))
punches = sum(len(c.get('punch', []) or []) for c in cenas)
print(f'planos: {len(cenas)} | cortes: {len(cenas) - 1} | cortes de camera: {cortes_cam} | punches: {punches} | '
      f'plano medio {sum(durs) / len(durs):.2f} s | mais curto {min(durs):.2f} s (plano {cenas[durs.index(min(durs))]["n"]})')
for a, b in zip(cenas, cenas[1:]):
    if abs(a['t1'] - b['t0']) > 1e-6:
        prob.append(f"buraco/sobreposicao entre planos {a['n']} e {b['n']}: {a['t1']} x {b['t0']}")

n_txt = n_cred = 0
for c in cenas:
    f0, f1 = math.ceil(c['t0'] * FPS - 1e-6), math.ceil(c['t1'] * FPS - 1e-6)
    for tx in c.get('textos', []):
        n_txt += 1
        cred = bool(tx.get('cred'))
        n_cred += cred
        fa = math.ceil(tx['t'] * FPS - 1e-6)
        fb = math.ceil(tx['ate'] * FPS - 1e-6) if tx.get('ate') is not None else f1
        if tx.get('esvai'):
            fb -= int(tx['esvai'] * FPS * 0.5)        # metade do esvai ainda nao conta como legivel
        q = max(0, min(fb, f1) - max(fa, f0))
        nome = f"plano {c['n']} '{tx['txt']}'"
        if q < 29:
            prob.append(f'{nome}: na tela {q / FPS:.2f} s ({q} quadros) < 1,2 s')
        if '\n' in tx['txt']:
            prob.append(f'{nome}: mais de 1 linha')
        lim = 44 if (cred or tx['f'] == 'info') else 40
        if tx['s'] < lim:
            prob.append(f"{nome}: {tx['s']} px < {lim}")
        ft = ImageFont.truetype(FD + FONTS[tx['f']], tx['s'])
        wpx = ft.getlength(tx['txt']) + tx.get('track', 0) * (len(tx['txt']) - 1)
        x0 = tx['x'] - (wpx / 2 if tx.get('ancora') == 'middle' else 0)
        x1 = x0 + wpx
        top = tx['y'] - ft.getmetrics()[0] + ft.getbbox(tx['txt'])[1]
        if x0 < 59.5 or x1 > (960.5 if tx['f'] == 'info' else 1020.5):
            prob.append(f'{nome}: sai da largura x {x0:.0f}-{x1:.0f}')
        if tx['f'] == 'info' and tx['y'] > 1500:
            prob.append(f"{nome}: base {tx['y']} > 1500")
        if top < 289.5 and not tx.get('atras'):
            aviso.append(f'{nome}: topo em y {top:.0f} (< 290)')
    for p in c.get('papeis', []):
        if p.get('legenda'):
            n_cred += 1
            ft = ImageFont.truetype(FD + FONTS['info'], 44)
            wl = ft.getlength(p['legenda'])
            if wl > p['w'] - 8:
                prob.append(f"plano {c['n']} legenda '{p['legenda']}' ({wl:.0f} px) nao cabe na copia ({p['w']} px)")
            fa = math.ceil(p['t'] * FPS - 1e-6)
            q = max(0, f1 - max(fa, f0))
            if q < 29:
                prob.append(f"plano {c['n']} legenda '{p['legenda']}': {q / FPS:.2f} s < 1,2 s")
print(f'textos: {n_txt} | creditos (1 linha): {n_cred}')
for a in aviso:
    print('aviso:', a)
print('\n'.join(prob) if prob else 'ok: regua v3 cumprida')
sys.exit(1 if prob else 0)
