# aplicar_fx.py v2: aplica efeitos da biblioteca Effekseer (pasta quadros/ ao lado deste arquivo) num vídeo, com timing de golpe.
#
# Um golpe só (linha de comando) ou vários (--linha golpes.json). Campos de cada golpe (padrão entre parênteses):
#   fx       nome (aceita pedaço: "ToonHit")         t        segundo do impacto, ou "auto" + janela [a, b]
#   x, y     ponto do impacto (centro da tela)       escala   tamanho relativo à largura do vídeo (0.75)
#   forca    intensidade 0–1 (0.55)                  cor      gelo | ouro | original | "H,S" (gelo)
#   modo     screen | add (screen)
#   antes    quadros do efeito (30 qps) mostrados ANTES do estouro dele (5)
#   dur      segundos depois do estouro até começar a sumir (None = efeito inteiro)
#   fade     segundos do sumiço no fim (0.15)
#   carga    segundos de brilho crescendo no ponto antes do impacto (0) ; carga_forca (0.5) ; carga_raio px (220)
#   flash    quadros de tela branca no impacto (0)  ; flash_forca (0.5)
#   seguir   "auto" = rastreia o ponto no vídeo (OpenCV) e o efeito acompanha a câmera/tremida (não)
#   matte    {"dir": pasta, "ini": segundo do 1º quadro}: máscaras RGBA/cinza, branco = fica NA FRENTE do efeito
#   sfx      caminho de um .wav ; sfx_db ganho em dB (-8) ; o ATAQUE do som cai no impacto
# O estouro do efeito (1º quadro com ≥30% do brilho máximo) cai exatamente em t.
# Receita que funcionou no episódio 5 da série: escala 0.75, forca 0.55, cor gelo, screen.
# Os quadros do efeito são 9:16, 30 qps, no preto, com o centro do efeito no centro do quadro (qualquer resolução).
#
# Exemplos:
#   python aplicar_fx.py IN.mp4 OUT.mp4 --fx ToonHit --t 14.85 --x 540 --y 860 --corte 13.9 17.9
#   python aplicar_fx.py IN.mp4 OUT.mp4 --fx ToonHit --t auto --janela 54.6 55.2 --x 464 --y 1184 --seguir --dur 0.5 --carga 0.3
#   python aplicar_fx.py IN.mp4 OUT.mp4 --linha golpes.json [--corte A B]
import argparse, subprocess, os, json, glob, math, sys, tempfile
import numpy as np, cv2
AQUI = os.path.dirname(os.path.abspath(__file__)); QD = os.path.join(AQUI, 'quadros'); FPS_FX = 30
PADRAO = dict(escala=0.75, forca=0.55, cor='gelo', modo='screen', antes=5, dur=None, fade=0.15,
              carga=0.0, carga_forca=0.5, carga_raio=220, flash=0, flash_forca=0.5, seguir=False, matte=None, sfx=None, sfx_db=-8.0)

# ---------- utilidades ----------
def sonda(v):
    j = json.loads(subprocess.check_output(['ffprobe', '-v', 'error', '-show_entries', 'stream=codec_type,width,height,r_frame_rate:format=duration', '-of', 'json', v]))
    vs = next(s for s in j['streams'] if s['codec_type'] == 'video'); n, d = map(int, vs['r_frame_rate'].split('/'))
    return vs['width'], vs['height'], n / d, float(j['format']['duration']), any(s['codec_type'] == 'audio' for s in j['streams'])

def ataque_audio(arq, a=None, b=None, sr=8000):
    """1º ponto acima de 30% do envelope (com 30 ms de folga antes); a/b = janela em segundos."""
    cmd = ['ffmpeg', '-v', 'error']
    if a is not None: cmd += ['-ss', str(a), '-to', str(b)]
    cmd += ['-i', arq, '-ac', '1', '-ar', str(sr), '-f', 's16le', '-']
    x = np.abs(np.frombuffer(subprocess.check_output(cmd), np.int16).astype(np.float32))
    w = sr // 200; env = np.array([x[i:i + w].max() for i in range(0, len(x) - w, w)])
    if not len(env) or env.max() == 0: return a or 0.0
    # na janela, o golpe é o maior SALTO de energia (não a voz que já vinha alta)
    sm = np.convolve(env, np.ones(3) / 3, 'same'); salto = sm[4:] - sm[:-4]
    if a is not None:
        k = int(np.argmax(salto)); base = sm[max(0, k - 4)]; alvo = base + 0.3 * (sm[k:k + 40].max() - base)
        i = k + int(np.argmax(sm[k:k + 40] >= alvo))
    else:
        i = int(np.argmax(env >= 0.3 * env.max()))
    return (a or 0.0) + max(0, i * w / sr - 0.03)

def acha_fx(nome):
    if os.path.isdir(os.path.join(QD, nome)): return nome
    c = sorted(os.path.basename(p) for p in glob.glob(os.path.join(QD, f'*{nome}*')))
    if len(c) == 1: return c[0]
    exato = [x for x in c if x.split('__')[-1] == nome]
    if len(exato) == 1: return exato[0]
    base = [x for x in exato if not x.startswith('X_')]   # nome igual nos packs extras (X_): fica o do pack de exemplo
    if len(base) == 1: return base[0]
    raise SystemExit(f'efeito "{nome}" não achado ou ambíguo: {c[:12]}')

class Efeito:
    def __init__(s, nome):
        s.nome = acha_fx(nome); s.fs = sorted(glob.glob(os.path.join(QD, s.nome, 'f*.jpg'))); s.cache = {}
        br = [cv2.imread(f, cv2.IMREAD_REDUCED_GRAYSCALE_8).mean() for f in s.fs]
        s.ataque = int(np.argmax(np.array(br) >= 0.3 * max(br)))
    def quadro(s, i):
        if i < 0 or i >= len(s.fs): return None
        if i not in s.cache: s.cache[i] = cv2.cvtColor(cv2.imread(s.fs[i]), cv2.COLOR_BGR2RGB)
        return s.cache[i]

def colore(img, cor):
    if cor == 'original': return img.astype(np.float32)
    if cor == 'ouro': return img.astype(np.float32) * np.array([1.0, 0.95, 0.85], np.float32)
    h, sat = (165, 0.55) if cor == 'gelo' else map(float, str(cor).split(','))
    hsv = cv2.cvtColor(img, cv2.COLOR_RGB2HSV_FULL).astype(np.float32)
    hsv[..., 0] = (hsv[..., 0] + h / 360 * 256) % 256; hsv[..., 1] *= sat
    return cv2.cvtColor(np.clip(hsv, 0, 255).astype(np.uint8), cv2.COLOR_HSV2RGB_FULL).astype(np.float32)

def rastreia(quadros, k0, x, y, raio=140):
    """Deslocamento do ponto (x,y) do quadro k0 em diante (fluxo óptico LK nos cantos ao redor, mediana)."""
    out = {k0: (0.0, 0.0)}; g0 = cv2.cvtColor(quadros[k0], cv2.COLOR_RGB2GRAY)
    m = np.zeros_like(g0); cv2.circle(m, (int(x), int(y)), raio, 255, -1)
    p0 = cv2.goodFeaturesToTrack(g0, 80, 0.01, 8, mask=m)
    if p0 is None: return lambda k: (0.0, 0.0)
    ini = p0.copy(); prev, pts = g0, p0; dx = dy = 0.0
    for k in range(k0 + 1, len(quadros)):
        g = cv2.cvtColor(quadros[k], cv2.COLOR_RGB2GRAY)
        p1, st, _ = cv2.calcOpticalFlowPyrLK(prev, g, pts, None, winSize=(31, 31), maxLevel=3)
        ok = st.ravel() == 1
        if ok.sum() >= 5:
            d = (p1[ok] - ini[ok]).reshape(-1, 2); dx, dy = map(float, np.median(d, 0)); pts, ini = p1[ok].reshape(-1, 1, 2), ini[ok].reshape(-1, 1, 2)
        out[k] = (dx, dy); prev = g
    return lambda k: out.get(k, (0.0, 0.0)) if k >= k0 else (0.0, 0.0)

# ---------- principal ----------
def main():
    a = argparse.ArgumentParser(); a.add_argument('video'); a.add_argument('saida')
    a.add_argument('--linha'); a.add_argument('--corte', type=float, nargs=2)
    a.add_argument('--fx'); a.add_argument('--t'); a.add_argument('--janela', type=float, nargs=2)
    a.add_argument('--x', type=float); a.add_argument('--y', type=float)
    for k, v in PADRAO.items():
        if k in ('seguir',): a.add_argument('--seguir', action='store_true')
        elif k in ('matte',): a.add_argument('--matte', nargs=2, metavar=('PASTA', 'INI'))
        elif k in ('cor', 'modo', 'sfx'): a.add_argument('--' + k)
        else: a.add_argument('--' + k, type=float)
    o = a.parse_args()
    W, H, FPS, DUR, tem_audio = sonda(o.video)
    if o.linha: golpes = json.load(open(o.linha, encoding='utf-8'))
    else:
        g = {k: getattr(o, k) for k in PADRAO if getattr(o, k, None) not in (None, False)}
        if o.matte: g['matte'] = {'dir': o.matte[0], 'ini': float(o.matte[1])}
        g.update(fx=o.fx, t=o.t, x=o.x, y=o.y)
        if o.janela: g['janela'] = o.janela
        golpes = [g]
    ini, fim = (o.corte if o.corte else (0.0, DUR))
    G = []
    for g in golpes:
        g = {**PADRAO, **{k: v for k, v in g.items() if v is not None}}
        if str(g['t']) == 'auto':
            g['t'] = ataque_audio(o.video, *g['janela']); print(f"  {g['fx']}: impacto achado no som em {g['t']:.3f}s")
        g['t'] = float(g['t']); g['x'] = W / 2 if g.get('x') is None else g['x']; g['y'] = H / 2 if g.get('y') is None else g['y']
        g['E'] = Efeito(g['fx']); w = round(W * g['escala'] / 2) * 2; g['wh'] = (w, round(w * 16 / 9 / 2) * 2)
        if g['matte']:
            g['M'] = sorted(glob.glob(os.path.join(g['matte']['dir'], '*.png')))
        G.append(g)
    # janela de cada golpe em quadros do trecho
    def janela(g):
        t0 = g['t'] - max(g['antes'] / FPS_FX, g['carga']) - 0.05
        resto = (len(g['E'].fs) - g['E'].ataque) / FPS_FX
        t1 = g['t'] + (min(resto, g['dur'] + g['fade']) if g['dur'] is not None else resto)
        return max(0, int((t0 - ini) * FPS)), int(math.ceil((t1 - ini) * FPS)) + 1
    for g in G: g['jan'] = janela(g)
    # decodifica o trecho
    N = int(round((fim - ini) * FPS)); tam = W * H * 3
    dec = subprocess.Popen(['ffmpeg', '-v', 'error', '-ss', str(ini), '-to', str(fim), '-i', o.video, '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'], stdout=subprocess.PIPE)
    tmp = tempfile.mkdtemp(); vtmp = os.path.join(tmp, 'v.mp4')
    enc = subprocess.Popen(['ffmpeg', '-v', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{W}x{H}', '-r', str(FPS), '-i', '-',
                            '-c:v', 'libx264', '-crf', '18', '-pix_fmt', 'yuv420p', vtmp], stdin=subprocess.PIPE)
    precisa = {}   # golpes que seguem: guardam os quadros da janela para rastrear
    for g in G:
        if g['seguir']: g['buf'] = {}
    k = 0
    pend = []      # quadros esperando o rastreio (só quando algum golpe segue)
    seg = [g for g in G if g['seguir']]
    def compoe(k, img):
        t = ini + k / FPS; out = None
        for g in G:
            a0, a1 = g['jan']
            if not (a0 <= k < a1): continue
            if out is None: out = img.astype(np.float32) / 255
            dx, dy = g['trilha'](k) if g['seguir'] else (0.0, 0.0)
            cx, cy = g['x'] + dx, g['y'] + dy; u = t - g['t']
            camada = np.zeros((H, W, 3), np.float32)
            # carga: brilho que cresce no ponto antes do impacto
            if g['carga'] > 0 and -g['carga'] <= u < 0:
                p = (1 + u / g['carga']) ** 2
                R = g['carga_raio'] * (0.6 + 0.4 * p); yy, xx = np.ogrid[:H, :W]
                d2 = ((xx - cx) ** 2 + (yy - cy) ** 2) / (R * R)
                cor = colore(np.full((1, 1, 3), (255, 200, 120), np.uint8), g['cor'])[0, 0] / 255
                camada += (np.exp(-d2 * 3) * p * g['carga_forca'])[..., None] * cor
            # efeito
            i = g['E'].ataque + int(math.floor(u * FPS_FX + 1e-6))
            if i >= g['E'].ataque - g['antes']:
                q = g['E'].quadro(i)
                if q is not None:
                    ganho = g['forca']
                    if g['dur'] is not None and u > g['dur']: ganho *= max(0.0, 1 - (u - g['dur']) / max(g['fade'], 1e-3))
                    if ganho > 0:
                        ew, eh = g['wh']; e = cv2.resize(colore(q, g['cor']), (ew, eh), interpolation=cv2.INTER_LINEAR) / 255 * ganho
                        x0, y0 = int(round(cx - ew / 2)), int(round(cy - eh / 2))
                        xs, ys, xe, ye = max(0, x0), max(0, y0), min(W, x0 + ew), min(H, y0 + eh)
                        if xe > xs and ye > ys: camada[ys:ye, xs:xe] += e[ys - y0:ye - y0, xs - x0:xe - x0]
            if g['matte']:
                j = int(round((t - g['matte']['ini']) * FPS))
                if 0 <= j < len(g['M']):
                    m = cv2.imread(g['M'][j], cv2.IMREAD_UNCHANGED); m = m[..., 3] if m.ndim == 3 and m.shape[2] == 4 else (m if m.ndim == 2 else m[..., 0])
                    camada *= (1 - m.astype(np.float32) / 255)[..., None]
            camada = np.clip(camada, 0, 1)
            out = out + camada if g['modo'] == 'add' else 1 - (1 - out) * (1 - camada)
            if g['flash'] and 0 <= u < g['flash'] / FPS: out = out + (1 - out) * g['flash_forca']
        return img if out is None else (np.clip(out, 0, 1) * 255 + 0.5).astype(np.uint8)
    if seg:   # rastreio precisa ver a janela inteira antes de compor
        quadros = []
        while True:
            b = dec.stdout.read(tam)
            if len(b) < tam: break
            quadros.append(np.frombuffer(b, np.uint8).reshape(H, W, 3))
        for g in seg:
            k0 = max(0, min(len(quadros) - 1, int(round((g['t'] - ini) * FPS))))
            g['trilha'] = rastreia(quadros, k0, g['x'], g['y'])
        for k, img in enumerate(quadros): enc.stdin.write(compoe(k, img).tobytes())
    else:
        while True:
            b = dec.stdout.read(tam)
            if len(b) < tam: break
            enc.stdin.write(compoe(k, np.frombuffer(b, np.uint8).reshape(H, W, 3)).tobytes()); k += 1
    enc.stdin.close(); enc.wait(); dec.wait()
    # áudio: original do trecho + SFX com o ataque no impacto
    cmd = ['ffmpeg', '-v', 'error', '-y', '-i', vtmp]
    filtros, ent = [], []
    if tem_audio:
        cmd += ['-ss', str(ini), '-to', str(fim), '-i', o.video]; ent.append('[1:a]')
    n = 1 + (1 if tem_audio else 0)
    for g in G:
        if not g['sfx']: continue
        at = ataque_audio(g['sfx']); atraso = max(0, (g['t'] - ini - at) * 1000)
        cmd += ['-i', g['sfx']]; filtros.append(f"[{n}:a]volume={g['sfx_db']}dB,adelay={atraso:.0f}:all=1[s{n}]"); ent.append(f'[s{n}]'); n += 1
    if len(ent) > 1:
        filtros.append(''.join(ent) + f'amix=inputs={len(ent)}:normalize=0:duration=first[a]')
        cmd += ['-filter_complex', ';'.join(filtros), '-map', '0:v', '-map', '[a]']
    elif tem_audio: cmd += ['-map', '0:v', '-map', '1:a']
    cmd += ['-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-shortest', o.saida]
    subprocess.run(cmd, check=True)
    for f in glob.glob(os.path.join(tmp, '*')): os.remove(f)
    os.rmdir(tmp)
    for g in G: print(f"  {g['E'].nome}: estouro do efeito = quadro {g['E'].ataque}, impacto {g['t']:.3f}s")
    print('ok', o.saida)

if __name__ == '__main__':
    main()
