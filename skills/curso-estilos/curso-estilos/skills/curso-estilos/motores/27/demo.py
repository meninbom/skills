# demo.py: gera um clipe-placeholder por código (dois blocos, um golpe com hit-stop e tremida) e aplica um efeito nele.
# Uso: python demo.py            → saida/demo.mp4 (540×960, 30 qps, 3 s, mudo)
#      python demo.py Blow1      → troca o efeito (qualquer pasta de quadros/)
# Só CPU. Precisa de numpy, opencv-python e FFmpeg no PATH.
import os, sys, subprocess, math, json
import numpy as np, cv2
AQUI = os.path.dirname(os.path.abspath(__file__)); SAIDA = os.path.join(AQUI, 'saida'); os.makedirs(SAIDA, exist_ok=True)
W, H, FPS, DUR = 540, 960, 30, 3.0
IMPACTO = 1.0; HITSTOP = 8 / 30          # o golpe encosta em 1,0 s e a cena congela 8 quadros
T_FX = round(IMPACTO + HITSTOP, 3)       # o estouro cai logo DEPOIS do hit-stop
PX, PY = 300, 560                        # ponto do impacto

def fundo():
    y = np.linspace(0, 1, H, dtype=np.float32)[:, None]
    g = np.zeros((H, W, 3), np.float32)
    g[..., 0] = 26 + 30 * y; g[..., 1] = 30 + 26 * y; g[..., 2] = 52 + 20 * y      # RGB: azul-noite
    g[700:] = (38, 34, 46)                                                          # chão
    cv2.line(g, (0, 700), (W, 700), (70, 64, 84), 3)
    for i in range(9): cv2.circle(g, (40 + i * 60, 120 + (i * 97) % 300), 2, (120, 120, 150), -1)   # pontos para o rastreio ter onde agarrar
    return g

def quadro(k, F):
    t = k / FPS; img = F.copy()
    tt = min(t, IMPACTO) if t < IMPACTO + HITSTOP else t - HITSTOP                  # tempo da cena (congela no hit-stop)
    # atacante: antecipa (recua), dispara e encosta em IMPACTO
    if tt < 0.55: ax = 90 - 26 * math.sin(tt / 0.55 * math.pi / 2)
    elif tt < IMPACTO: p = (tt - 0.55) / (IMPACTO - 0.55); ax = 64 + (200 - 64) * p ** 3
    else: ax = 200 - 30 * (1 - math.exp(-(tt - IMPACTO) * 6))
    # alvo: parado até o impacto, depois é empurrado e freia
    u = max(0.0, tt - IMPACTO); bx = 310 + 150 * (1 - math.exp(-u * 4)); rot = -14 * (1 - math.exp(-u * 5))
    # tremida depois do hit-stop
    v = t - (IMPACTO + HITSTOP); sx = sy = 0.0
    if 0 <= v < 0.35: a = 14 * (1 - v / 0.35) ** 2; sx, sy = a * math.sin(v * 90), a * math.cos(v * 70)
    cv2.rectangle(img, (int(ax + sx), int(470 + sy)), (int(ax + 100 + sx), int(700 + sy)), (232, 150, 70), -1)        # atacante (laranja)
    cv2.rectangle(img, (int(ax + 70 + sx), int(540 + sy)), (int(ax + 110 + sx), int(580 + sy)), (255, 196, 120), -1)  # punho
    caixa = cv2.boxPoints(((bx + 60 + sx, 585 + sy), (120, 230), rot)).astype(np.int32)
    cv2.fillPoly(img, [caixa], (92, 150, 210))                                                                       # alvo (azul)
    return np.clip(img, 0, 255).astype(np.uint8)

def main():
    fx = sys.argv[1] if len(sys.argv) > 1 else 'ToonHit'
    base = os.path.join(SAIDA, 'placeholder.mp4'); final = os.path.join(SAIDA, 'demo.mp4')
    enc = subprocess.Popen(['ffmpeg', '-v', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{W}x{H}', '-r', str(FPS), '-i', '-',
                            '-an', '-c:v', 'libx264', '-crf', '18', '-pix_fmt', 'yuv420p', base], stdin=subprocess.PIPE)
    F = fundo()
    for k in range(int(DUR * FPS)): enc.stdin.write(quadro(k, F).tobytes())
    enc.stdin.close(); enc.wait()
    golpes = [dict(fx=fx, t=T_FX, x=PX, y=PY, escala=0.9, forca=0.8, dur=0.45, fade=0.18, carga=0.25, flash=1, flash_forca=0.35)]
    gj = os.path.join(SAIDA, 'golpes_demo.json'); json.dump(golpes, open(gj, 'w', encoding='utf-8'), indent=1)
    subprocess.run([sys.executable, os.path.join(AQUI, 'aplicar_fx.py'), base, final, '--linha', gj], check=True)
    print('pronto:', os.path.relpath(final, AQUI), '| sem o efeito:', os.path.relpath(base, AQUI))

if __name__ == '__main__':
    main()
