"""Estúdio de comparação: renderiza o modelo em 3 vistas e monta conceito em cima, modelo embaixo.
  python estudio.py --out recon/e1            -> recon/e1_full.jpg + faixas e1_cabeca / e1_tronco / e1_pernas
  python estudio.py --t 1 --solo --out recon/guarda   (só o modelo; t = 0 descanso, 1 ombro, 2 erguida, 3 golpe)
  [--q "yc=0.918&d=5.93&v=0.45,0.62,2.8"]  enquadramento: altura do alvo, distância, rotação das 3 vistas (radianos)
  [--ref escolhido.jpg]  folha de conceito dentro de conceito/ (3 vistas lado a lado, proporção 3:2)
Precisa de: npm install (quem renderiza é o render.mjs) e pip install -r requirements.txt. DEMO_CPU=1 renderiza por software."""
import os, subprocess, argparse, tempfile
from PIL import Image
HERE = os.path.dirname(os.path.abspath(__file__))
ap = argparse.ArgumentParser(); ap.add_argument('--out', required=True); ap.add_argument('--t', type=float, default=0); ap.add_argument('--solo', action='store_true')
ap.add_argument('--q', default=''); ap.add_argument('--bands', default='cabeca,tronco,pernas'); ap.add_argument('--ref', default='escolhido.jpg')
a = ap.parse_args()
os.makedirs(os.path.dirname(os.path.abspath(a.out)), exist_ok=True)
tmp = os.path.join(tempfile.gettempdir(), f'estudio_{os.getpid()}.jpg')
subprocess.run(['node', os.path.join(HERE, 'render.mjs'), '--page', 'estudio.html', '--shot', tmp, '--t', str(a.t)] + (['--q', a.q] if a.q else []), check=True)
mine = Image.open(tmp).convert('RGB'); mine.load(); os.remove(tmp)   # 3072x2048
if a.solo:
    mine.resize((1536, 1024), Image.LANCZOS).save(a.out + '.jpg', quality=92); print('ok', a.out + '.jpg'); raise SystemExit
ref = Image.open(os.path.join(HERE, 'conceito', a.ref)).convert('RGB').resize((1536, 1024), Image.LANCZOS)
full = Image.new('RGB', (1536, 2048)); full.paste(ref, (0, 0)); full.paste(mine.resize((1536, 1024), Image.LANCZOS), (0, 1024)); full.save(a.out + '_full.jpg', quality=92)
BANDS = {'cabeca': (90, 360), 'tronco': (290, 620), 'pernas': (540, 990)}
for k in a.bands.split(','):
    if k not in BANDS: continue
    y0, y1 = BANDS[k]; h = (y1 - y0) * 2
    sh = Image.new('RGB', (3072, h * 2)); sh.paste(ref.crop((0, y0, 1536, y1)).resize((3072, h), Image.LANCZOS), (0, 0)); sh.paste(mine.crop((0, y0 * 2, 3072, y1 * 2)), (0, h))
    sh.resize((2048, h * 2 * 2048 // 3072), Image.LANCZOS).save(f'{a.out}_{k}.jpg', quality=92)
print('ok', a.out)
