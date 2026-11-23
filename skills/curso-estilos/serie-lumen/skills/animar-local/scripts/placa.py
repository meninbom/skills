"""Quadro do storyboard -> placa do H3 (recorte central, 768x1344 por padrão).

Lê <ep>/gpt/<PLANO>.png (ou .jpg/.jpeg/.webp) e grava <ep>/h3/placas/<PLANO>.png.
O tamanho vem de h3.largura / h3.altura do kit.config.json (sem config: 768x1344).

uso: python placa.py <pasta do ep> [PLANO ...] [--todas]
  sem PLANO   faz só as placas que faltam
  PLANO ...   refaz essas (a placa antiga vai pra h3/placas/_antigo/)
  --todas     refaz todas (idem)
"""
import os, sys, shutil, time

for _s in (sys.stdout, sys.stderr):   # acento certo no Git Bash (sem isso o Windows usa cp1252 no pipe)
    try:
        _s.reconfigure(encoding='utf-8')
    except Exception:
        pass
AQUI = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, AQUI)
import kitcfg  # noqa: E402

EXT = ('.png', '.jpg', '.jpeg', '.webp')


def quadros(gpt):
    out = {}
    for f in sorted(os.listdir(gpt)):
        n, e = os.path.splitext(f)
        if e.lower() in EXT and not n.startswith('_'):
            out.setdefault(n, os.path.join(gpt, f))
    return out


def placa(src, dst, W, H):
    from PIL import Image
    im = Image.open(src).convert('RGB')
    k = max(W / im.width, H / im.height)
    im2 = im.resize((round(im.width * k), round(im.height * k)), Image.LANCZOS)
    x = (im2.width - W) // 2; y = (im2.height - H) // 2
    im2.crop((x, y, x + W, y + H)).save(dst)
    cl, ca = 1 - W / im2.width, 1 - H / im2.height
    return im.size, (cl, 'da largura') if cl >= ca else (ca, 'da altura')


def main():
    args = [a for a in sys.argv[1:] if not a.startswith('--')]
    if not args:
        raise SystemExit(__doc__)
    ep = args[0]; pedidos = args[1:]; todas = '--todas' in sys.argv
    W = int(kitcfg.get('h3.largura', 768)); H = int(kitcfg.get('h3.altura', 1344))
    gpt = os.path.join(ep, 'gpt'); dest = os.path.join(ep, 'h3', 'placas')
    if not os.path.isdir(gpt):
        raise SystemExit(f'PAREI: não achei {gpt} (os quadros do storyboard ficam lá, nome = plano).')
    Q = quadros(gpt)
    if not Q:
        raise SystemExit(f'PAREI: nenhum quadro em {gpt}.')
    falta = [p for p in pedidos if p not in Q]
    if falta:
        raise SystemExit(f'PAREI: não achei em {gpt}: {", ".join(falta)}')
    alvo = pedidos or sorted(Q)
    os.makedirs(dest, exist_ok=True)
    feitas = 0
    for p in alvo:
        dst = os.path.join(dest, p + '.png')
        if os.path.exists(dst):
            if not (pedidos or todas):
                continue
            os.makedirs(os.path.join(dest, '_antigo'), exist_ok=True)
            shutil.move(dst, os.path.join(dest, '_antigo', f'{p}_{int(time.time())}.png'))
        tam, (corte, onde) = placa(Q[p], dst, W, H)
        aviso = f'  << cortou {corte:.0%} {onde}: confira se ninguém saiu do quadro' if corte > 0.2 else ''
        print(f'{p}: {tam[0]}x{tam[1]} -> {W}x{H}{aviso}')
        feitas += 1
    print(f'{feitas} placa(s) em {dest}' if feitas else 'Nenhuma placa nova (todas já existem; use --todas pra refazer).')


if __name__ == '__main__':
    main()
