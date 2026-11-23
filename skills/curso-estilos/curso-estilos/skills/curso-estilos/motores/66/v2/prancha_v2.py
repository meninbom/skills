"""Prancha: os quadros-fonte de cada plano (quadros/<plano>.png), na ordem do episódio, com o rótulo e a fala. -> prancha.jpg
Rode de dentro desta pasta. Plano sem quadro aparece como caixa vermelha."""
import os, sys
from PIL import Image, ImageDraw, ImageFont
sys.argv = ['x']
import importlib.util
s = importlib.util.spec_from_file_location('m', os.path.join(os.path.dirname(os.path.abspath(__file__)), 'montar_v2.py')); m = importlib.util.module_from_spec(s); s.loader.exec_module(m)
fonte = {p: f'quadros/{p}.png' for p in m.ORDEM}
fonte.update({'K2': 'quadros/A2.png', 'A3': 'quadros/A1.png', 'A4': 'quadros/A4.png', 'N3': 'quadros/N3.png', 'N2': 'quadros/M2.png', 'N4': 'quadros/N3.png'})
SAIDA = 'prancha.jpg'
cw, ch, cols = 240, 430, 10
rows = (len(m.ORDEM) + cols - 1) // cols
c = Image.new('RGB', (cols * cw, rows * (ch + 70)), (14, 14, 18)); d = ImageDraw.Draw(c)
f = m.F(m.FX, 30); f2 = m.F(m.FB, 22)
for i, p in enumerate(m.ORDEM):
    x, y = (i % cols) * cw, (i // cols) * (ch + 70)
    if os.path.exists(fonte[p]):
        im = Image.open(fonte[p]).convert('RGB'); im = im.resize((cw - 8, int((cw - 8) * im.height / im.width)))
        c.paste(im.crop((0, 0, cw - 8, ch)), (x + 4, y + 4))
    else:
        d.rectangle((x + 4, y + 4, x + cw - 4, y + ch), outline=(200, 60, 60), width=3)
    leg = ' '.join(t for l in m.LEG if m.INI[p] <= l[0] < m.FIM[p] for t, _ in l[2])[:24]
    d.text((x + 8, y + ch + 6), f'{p}  {m.FIM[p] - m.INI[p]:.1f}s', font=f, fill=(255, 210, 63))
    d.text((x + 8, y + ch + 40), leg, font=f2, fill=(230, 230, 230))
c.save(SAIDA, quality=88); print('ok', c.size)
