"""Folha de deriva (item 11 do REVISOR): placa de entrada | 0,1 s | meio | fim, lado a lado.
Serve pra pegar o clipe que "virou outra coisa" (rosto de estúdio, traço novo) logo no começo.

uso: python deriva.py <pasta h3 do ep> P01 [P02 ...]
     python deriva.py <pasta h3 do ep> P29=clips_nuvem/P29.mp4     (outro clipe do mesmo plano -> deriva/P29_b.jpg)
lê <h3>/placas/<P>.png e <h3>/clips60/<P>.mp4 (ou clips/<P>.mp4); grava <h3>/deriva/<P>.jpg
"""
import sys as _sys_utf8
for _s in (_sys_utf8.stdout, _sys_utf8.stderr):   # acento certo no terminal do Windows, inclusive nas mensagens de erro
    try: _s.reconfigure(encoding='utf-8')
    except Exception: pass
import os, sys, subprocess
from PIL import Image, ImageDraw, ImageFont

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import kitcfg  # noqa: E402


def fonte(px):
    f = kitcfg.get('ferramentas.fonte')
    for cand in (f, 'arialbd.ttf', 'DejaVuSans-Bold.ttf'):
        try:
            if cand:
                return ImageFont.truetype(cand, px)
        except OSError:
            pass
    return ImageFont.load_default()


def main():
    if len(sys.argv) < 3:
        raise SystemExit(__doc__)
    H3 = sys.argv[1]; FF = kitcfg.get('ferramentas.ffmpeg', 'ffmpeg'); FP = kitcfg.get('ferramentas.ffprobe', 'ffprobe')
    os.makedirs(os.path.join(H3, 'deriva'), exist_ok=True); F = fonte(28)
    for arg in sys.argv[2:]:
        if '=' in arg:
            T, v = arg.split('=', 1); rot0 = T + '_b'
        else:
            T, rot0 = arg, arg
            v = next((p for p in (f'clips60/{T}.mp4', f'clips/{T}.mp4') if os.path.isfile(os.path.join(H3, p))), f'clips60/{T}.mp4')
        v = v if os.path.isabs(v) else os.path.join(H3, v)
        placa = os.path.join(H3, 'placas', f'{T}.png')
        if not os.path.isfile(v) or not os.path.isfile(placa):
            print('falta', T, '(clipe ou placa)'); continue
        d = float(subprocess.check_output([FP, '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', v]))
        ims = [Image.open(placa).convert('RGB')]; rot = ['entrada']
        for t in (0.1, d / 2, max(0.0, d - 0.05)):
            f = os.path.join(H3, 'deriva', f'_{T}_{t:.2f}.png')
            subprocess.run([FF, '-v', 'error', '-y', '-ss', f'{t:.3f}', '-i', v, '-frames:v', '1', f], check=True)
            ims.append(Image.open(f).convert('RGB')); rot.append(f'{t:.1f} s'); os.remove(f)
        w, h = 384, 672; W = Image.new('RGB', (4 * w + 30, h + 44), (20, 20, 24)); dr = ImageDraw.Draw(W)
        for i, (im, r) in enumerate(zip(ims, rot)):
            W.paste(im.resize((w, h)), (i * (w + 10), 44)); dr.text((i * (w + 10) + 8, 6), f'{rot0} · {r}', font=F, fill=(255, 255, 255))
        saida = os.path.join(H3, 'deriva', f'{rot0}.jpg'); W.save(saida, quality=88); print('ok', saida, round(d, 2), 's')


if __name__ == '__main__':
    main()
