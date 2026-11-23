"""Montagem de EXEMPLO no contrato do ciclo: renderiza só os segmentos pedidos, cada um num arquivo.
uso: python montar.py LINHA BASE --segs 0,2 --pasta DIR      -> DIR/seg_000.mp4, DIR/seg_002.mp4
Os "planos" são falsos, desenhados por código (numpy), 540×960, 30 qps, mudos. Troque o corpo de `cor()` pelo seu render de verdade.
Ajustes do laço que este script respeita, por segmento:
  fx: ["congela"]  o plano fica parado no 1º quadro (é o defeito que o teste injeta)
  vivo: N          aproximação lenta da câmera (N níveis). É o conserto do "parado".
"""
import sys, json, os, math, argparse, subprocess
import numpy as np

W, H, FPS = 540, 960, 30
PALETA = {'P1': ((24, 30, 60), (240, 170, 60)), 'P2': ((46, 22, 50), (110, 200, 220)), 'P3': ((16, 44, 40), (240, 110, 110))}
YY, XX = np.mgrid[0:H, 0:W].astype(np.float32)


def cor(plano, u, zoom):
    """um quadro do plano no instante u (0–1), com a câmera aproximada em `zoom`"""
    fundo, tinta = PALETA.get(plano, ((30, 30, 30), (220, 220, 220)))
    x = (XX - W / 2) / zoom + W / 2; y = (YY - H / 2) / zoom + H / 2          # câmera: aproxima pelo centro
    img = np.empty((H, W, 3), np.float32); img[:] = fundo
    img += (((x // 60 + y // 60) % 2) * 14)[..., None]                         # xadrez de fundo (dá textura para medir movimento)
    cx = 120 + 300 * u; cy = 480 + 160 * math.sin(u * math.pi * 2)            # a "ação": um disco que atravessa o quadro
    disco = ((x - cx) ** 2 + (y - cy) ** 2) < 90 ** 2
    img[disco] = tinta
    barra = (np.abs(y - 800) < 16) & (x > 60) & (x < 60 + 420 * u)            # barra de progresso do plano
    img[barra] = (235, 235, 235)
    return np.clip(img, 0, 255).astype(np.uint8)


def render(seg, arq):
    n = int(round(seg['dur'] * FPS)); congela = 'congela' in seg.get('fx', []); vivo = seg.get('vivo', 0)
    enc = subprocess.Popen(['ffmpeg', '-v', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{W}x{H}', '-r', str(FPS), '-i', '-',
                            '-an', '-c:v', 'libx264', '-crf', '20', '-pix_fmt', 'yuv420p', arq], stdin=subprocess.PIPE)
    for k in range(n):
        p = k / max(1, n - 1)
        u = 0.35 if congela else p                       # congelado: a ação não anda
        zoom = 1 + 0.22 * vivo * p                       # vivo: a câmera aproxima devagar (o plano deixa de estar parado)
        enc.stdin.write(cor(seg['plano'], u, zoom).tobytes())
    enc.stdin.close(); enc.wait()


if __name__ == '__main__':
    ap = argparse.ArgumentParser(); ap.add_argument('linha'); ap.add_argument('base'); ap.add_argument('--segs'); ap.add_argument('--pasta')
    a = ap.parse_args()
    S = json.load(open(a.linha, encoding='utf-8'))['segmentos']
    quais = [int(x) for x in a.segs.split(',')] if a.segs else range(len(S))
    os.makedirs(a.pasta, exist_ok=True)
    for i in quais: render(S[i], os.path.join(a.pasta, f'seg_{i:03d}.mp4'))
