"""Imagem gerada (ChatGPT, Flow ou outro) -> quadro do episódio + placa do animador (768x1344, recorte central 9:16).
Guarda a versão anterior em quadros/_antigo/ em vez de apagar.
uso: python placa.py <pasta do episódio> <imagem baixada> <PLANO>      ex.: python placa.py ../meu_ep ~/Downloads/cena1.png S01
     grava <ep>/quadros/S01.png e <ep>/h3/placas/S01.png"""
import os, sys, shutil, time
from PIL import Image
if len(sys.argv) < 4: raise SystemExit(__doc__)
EP, src, s = os.path.abspath(sys.argv[1]), os.path.expanduser(sys.argv[2]), sys.argv[3]
W, H = 768, 1344
os.makedirs(os.path.join(EP, 'quadros', '_antigo'), exist_ok=True); os.makedirs(os.path.join(EP, 'h3', 'placas'), exist_ok=True)
dst = os.path.join(EP, 'quadros', f'{s}.png')
if os.path.exists(dst): shutil.move(dst, os.path.join(EP, 'quadros', '_antigo', f'{s}_{int(time.time())}.png'))
im = Image.open(src).convert('RGB'); im.save(dst)
k = max(W / im.width, H / im.height)
im2 = im.resize((round(im.width * k), round(im.height * k)), Image.LANCZOS)
x = (im2.width - W) // 2; y = (im2.height - H) // 2
im2.crop((x, y, x + W, y + H)).save(os.path.join(EP, 'h3', 'placas', f'{s}.png'))
print(s, im.size, 'ok')
