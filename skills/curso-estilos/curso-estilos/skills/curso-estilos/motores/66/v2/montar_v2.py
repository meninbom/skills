"""EP01 "O Apagão": o montador REAL do episódio, como exemplo completo (29 planos <= 3 s, corte seco, HUD de 4 peças de hud.py).
É específico deste episódio: a ordem dos planos, os textos da HUD e os tempos estão no código. Para a sua história, copie e
troque CORTES, RELOGIO, PUSH e a função hud(). Para ver as peças funcionando sem nada disso, rode o demo (../demo.py).
uso: python montar_v2.py [--so A1,H1] [--quadros]  ->  final/_video.mp4 (sem som) | final/_quadros/<plano>.png
Tempos: ../voz/timeline.json (sai do voz/montar_voz.py). Clipes: clipes/<plano>.mp4 (animados a partir de quadros/<plano>.png).
Plano sem clipe vira quadro preto com a HUD por cima (dá para conferir a HUD antes de animar).
"""
import os, sys, json, subprocess
import numpy as np
import cv2
from PIL import Image, ImageDraw

AQUI = os.path.dirname(os.path.abspath(__file__))
EP = os.path.dirname(AQUI)                       # a pasta do motor (ou do seu episódio): tem hud.py, fontes/, voz/ e esta pasta
sys.path.insert(0, EP)
from hud import (W, H, F, FB, FX, BRANCO, AMARELO, VERM, VERDE, AMBAR, cl, prog, e_out, caixa, status, relogio, cartao, alvo,
                 rotulo_ameaca, botoes, fundo_claro)
import hud as pecas
FPS = 24
TL = json.load(open(os.path.join(EP, 'voz', 'timeline.json'), encoding='utf-8'))
B = {}
for b in TL['blocos']:
    B.setdefault(b['rotulo'], b)
DUR = TL['duracao']
PAL = TL['palavras']

def limpa(w): return w.strip('.,!?…:;').lower()
def _w(txt, bloco, n=1):
    c = 0
    for w in PAL:
        if w['bloco'] == bloco and limpa(w['w']) == txt.lower():
            c += 1
            if c == n: return w['start']
    raise SystemExit(f'não achei {txt} em {bloco}')

# ------------------------------------------------------------------ planos: (id, início em s). Corte seco em todos.
CORTES = [
    ('A1', 0.0), ('A2', _w('perder', 'P1') - 0.05), ('A3', _w('abrir', 'P1') - 0.1),
    ('A4', _w('e', 'P1') - 0.04),                     # v5: "E pra ajudar... apareceu um cachorro querendo te pegar" (o cão no gancho)
    ('B1', B['P2']['start']), ('B2', _w('todas', 'P2') - 0.05),
    ('C1', B['P3']['start']), ('C2', _w('ninguém', 'P3', 2) - 0.04),
    ('D1', B['P4']['start']), ('D2', _w('o', 'P4', 2) - 0.04),
    ('E1', B['P5']['start']),
    ('F1', B['P6']['start']), ('F2', _w('perde', 'P6') - 0.04),
    ('G1', B['P7']['start']), ('G2', _w('dia', 'P7') - 0.05), ('G3', _w('palavra', 'P7') - 0.05),
    ('H1', B['P8']['start']),
    ('I1', B['P9']['start']), ('I2', _w('tá', 'P9') - 0.03),
    ('J1', B['P10']['start']), ('J2', B['POR']['start']),
    ('K1', B['P11']['start']), ('K2', _w('você', 'P11') - 0.04), ('K3', B['P11']['end'] + 0.02),
    ('L1', _w('e', 'P12') - 0.04),
    ('M1', B['P13']['start']), ('M2', _w('pra', 'P13') - 0.04),
    ('N1', B['P14']['start']), ('N2', _w('e', 'P14') - 0.03),
    ('N3', _w('empurra', 'P14') - 0.06), ('N4', _w('o', 'P14') - 0.03),
]
ORDEM = [c[0] for c in CORTES]
INI = dict(CORTES)
FIM = {p: (INI[ORDEM[i + 1]] if i + 1 < len(ORDEM) else DUR) for i, p in enumerate(ORDEM)}
CLIPE = {p: os.path.join(AQUI, 'clipes', f'{p}.mp4') for p in ORDEM}
# v4: N4 é a continuação do N3 (mesmo plano): o clipe acaba e o quadro congela (o voto)
CLIPE.update({'K2': CLIPE['A2'], 'A3': CLIPE['A1'], 'N2': CLIPE['M2'], 'N4': CLIPE['N3']})
# de onde começa a leitura de cada clipe (s): pula o começo quase parado do H3; reaproveitamentos leem outro trecho
ENTRADA = {p: 0.25 for p in ORDEM}
ENTRADA.update({'A1': 0.2, 'A3': 2.0, 'I2': 0.4, 'K2': 1.7, 'N2': 1.6, 'C1': 0.3, 'C2': 0.4, 'J1': 0.3,
                'G1': 0.1, 'G2': 0.1, 'G3': 0.1,      # a fala/expressão do H3 está no 1º meio segundo; depois congela
                'K3': 0.05, 'E1': 0.0})               # o tombo com a maçaneta acontece logo no começo
ENTRADA['N4'] = ENTRADA['N3'] + (FIM['N3'] - INI['N3'])   # segue o mesmo clipe
# E1: o quadro 0 do H3 é o dedo NO "INGLÊS"; o clipe tira o dedo. Toca de trás pra frente até a palavra "inglês" e depois segue.
TOQUE_E1 = _w('inglês', 'P5')
# onde procurar os olhos do cão em cada plano (região, área mínima da mancha, distância entre os olhos)
OLHO_REG = {'A1': ((0, 950, 280, 1300), 2, 8, 60), 'A4': ((280, 820, 780, 1300), 4, 20, 150), 'I2': ((0, 900, 330, 1250), 4, 10, 80), 'L1': ((100, 1060, 330, 1190), 3, 20, 80),
            'N3': ((0, 900, 450, 1350), 8, 20, 200), 'N4': ((0, 900, 450, 1350), 8, 20, 200)}
# câmera em código só onde o H3 deixa o plano aberto quase parado: push-in com destino (zoom final, centro em fração do quadro)
# (zoom final, foco no quadro do clipe, onde o foco termina na tela) em frações de W/H; foco == destino = push-in puro
PUSH = {'A1': (1.10, (0.25, 0.60), (0.25, 0.60)),          # o push ancora entre o cão (beco à esquerda) e a porta: o cão não sai do quadro
         'H1': (1.32, (0.55, 0.52), (0.52, 0.36)),
        'B1': (1.14, (0.62, 0.40), (0.56, 0.40)),          # rosto no espelho
        'C2': (1.08, (0.50, 0.45), (0.50, 0.45)),
        'E1': (1.10, (0.68, 0.42), (0.62, 0.42)),          # vai até a palavra escolhida (janela flutuante, v4)
        'D1': (1.10, (0.70, 0.50), (0.62, 0.48)),          # puxa a janela do sistema pro centro sem perder o rosto dele
        'J1': (1.08, (0.45, 0.45), (0.45, 0.45)),          # aproxima devagar do porteiro acordando (centro do quadro)
        # G: a placa do mundo (EXIT/OPEN/STOP) nasce colada na borda direita: o push puxa a placa pra dentro do quadro
        'G1': (1.10, (0.88, 0.17), (0.80, 0.18)), 'G2': (1.10, (0.92, 0.37), (0.84, 0.37)), 'G3': (1.10, (0.82, 0.22), (0.76, 0.24)),
        'I1': (1.10, (0.62, 0.40), (0.58, 0.40)),
        'M2': (1.10, (0.55, 0.50), (0.55, 0.50)), 'N1': (1.06, (0.50, 0.50), (0.50, 0.50)),
        'A3': (1.35, (0.50, 0.58), (0.50, 0.50)),          # volta ao largo já mais perto da porta (não repete o A1)
        'M1': (1.10, (0.58, 0.45), (0.55, 0.45)), 'F1': (1.15, (0.50, 0.20), (0.50, 0.27)),   # relógio do sistema no céu desce um pouco, longe do HUD
       
        }

def push_in(frames, z1, foco, alvo):
    n = len(frames); out = []; mats = []
    fx, fy = W * foco[0], H * foco[1]
    for i, f in enumerate(frames):
        k = e_out(i / max(1, n - 1)) * 0.8 + 0.2 * (i / max(1, n - 1))
        z = 1 + (z1 - 1) * k
        tx, ty = fx + (W * alvo[0] - fx) * k, fy + (H * alvo[1] - fy) * k
        M = np.float32([[z, 0, tx - z * fx], [0, z, ty - z * fy]])
        out.append(cv2.warpAffine(f, M, (W, H), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_REFLECT)); mats.append(M)
    return out, mats

# ------------------------------------------------------------------ leitura de clipe e rastreio
def _escala(fr):
    h, w = fr.shape[:2]
    s = H / h; wn = round(w * s); x0 = (wn - W) // 2
    return cv2.resize(fr, (wn, H), interpolation=cv2.INTER_LANCZOS4)[:, x0:x0 + W]

def ler_clipe(path, t0, dur):
    pr = json.loads(subprocess.check_output(['ffprobe', '-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height',
                                             '-of', 'json', path]))['streams'][0]
    w, h = pr['width'], pr['height']
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-ss', f'{t0:.3f}', '-i', path, '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'],
                         capture_output=True).stdout
    fr = np.frombuffer(raw, np.uint8).reshape(-1, h, w, 3)
    n = int(round(dur * FPS))
    return [_escala(fr[min(i, len(fr) - 1)]) for i in range(n)], len(fr)

ULTIMO_OLHO = {}
def travar_janela(frames):
    """D1: o H3 troca a linha cinza/cadeado da janela flutuante no meio do clipe. Cola a janela do 1º quadro em todos."""
    f0 = frames[0]; g = cv2.cvtColor(f0, cv2.COLOR_RGB2GRAY)
    m = (g < 90).astype(np.uint8); m[:, :W // 2] = 0
    m = cv2.morphologyEx(m, cv2.MORPH_CLOSE, np.ones((25, 25), np.uint8))
    n, lab, st, _ = cv2.connectedComponentsWithStats(m)
    if n < 2: return frames
    k = 1 + int(np.argmax(st[1:, 4]))
    mk = cv2.dilate((lab == k).astype(np.uint8), np.ones((21, 21), np.uint8)).astype(np.float32)
    a = cv2.GaussianBlur(mk, (0, 0), 6)[..., None]
    return [(f * (1 - a) + f0 * a).astype(np.uint8) for f in frames]

def achar_placa(f, regiao=None):
    """Caixa da placa de papel PUSH: maior mancha clara e pouco saturada (papel branco)."""
    hsv = cv2.cvtColor(f, cv2.COLOR_RGB2HSV)
    m = ((hsv[..., 2] > 200) & (hsv[..., 1] < 45)).astype(np.uint8)
    if regiao: x0, y0, x1, y1 = regiao; mm = np.zeros_like(m); mm[y0:y1, x0:x1] = m[y0:y1, x0:x1]; m = mm
    m = cv2.morphologyEx(m, cv2.MORPH_CLOSE, np.ones((15, 15), np.uint8))
    n, _, st, cen = cv2.connectedComponentsWithStats(m)
    if n < 2: return None
    k = 1 + int(np.argmax(st[1:, 4]))
    x, y, w, h, a = st[k]
    return (x, y, x + w, y + h) if a > 1500 else None

def rastrear(frames, caixa):
    x0, y0, x1, y1 = caixa
    tpl = cv2.cvtColor(frames[0][y0:y1, x0:x1], cv2.COLOR_RGB2GRAY)
    sx, sy = (x0 + x1) / 2, (y0 + y1) / 2; out = []
    for f in frames:
        g = cv2.cvtColor(f, cv2.COLOR_RGB2GRAY); m = 80
        ax, ay = int(max(0, sx - (x1 - x0) / 2 - m)), int(max(0, sy - (y1 - y0) / 2 - m))
        jan = g[ay:int(min(H, sy + (y1 - y0) / 2 + m)), ax:int(min(W, sx + (x1 - x0) / 2 + m))]
        if jan.shape[0] >= tpl.shape[0] and jan.shape[1] >= tpl.shape[1]:
            r = cv2.matchTemplate(jan, tpl, cv2.TM_CCOEFF_NORMED); _, mv, _, ml = cv2.minMaxLoc(r)
            if mv > 0.45:
                sx = 0.6 * sx + 0.4 * (ax + ml[0] + (x1 - x0) / 2); sy = 0.6 * sy + 0.4 * (ay + ml[1] + (y1 - y0) / 2)
        out.append((sx, sy, (x1 - x0), (y1 - y0)))
    return out

def olhos_vermelhos(frames, regiao, amin=40, dxmin=30, dxmax=320, semente=None):
    """Segue o par de olhos vermelhos do cão dentro de uma região apertada em volta dele.
    Par = duas manchas na mesma altura; entre os candidatos, fica o mais perto da posição anterior."""
    x0, y0, x1, y1 = regiao
    sx = sy = None; out = []
    for f in frames:
        sub = f[y0:y1, x0:x1].astype(np.int16)
        r, g, b = sub[..., 0], sub[..., 1], sub[..., 2]
        # vermelho do olho: r alto, g e b baixos e parecidos (a janela laranja tem g bem maior que b; a pele tem g alto)
        m = ((r > 140) & (g < 110) & (r - g > 60) & (r - b > 50) & (np.abs(g - b) < 45)).astype(np.uint8)
        n, _, st, cen = cv2.connectedComponentsWithStats(m)
        bl = [(cen[k][0] + x0, cen[k][1] + y0, st[k, 4]) for k in range(1, n) if amin <= st[k, 4] <= 8000]
        pares = [((a[0] + b_[0]) / 2, (a[1] + b_[1]) / 2, a[2] + b_[2]) for i, a in enumerate(bl) for b_ in bl[i + 1:]
                 if abs(a[1] - b_[1]) < max(6, abs(a[0] - b_[0]) / 3) and dxmin < abs(a[0] - b_[0]) < dxmax]
        if pares:
            if sx is None:
                nx, ny, _ = max(pares, key=lambda q: q[2])
            else:
                nx, ny, _ = min(pares, key=lambda q: (q[0] - sx) ** 2 + (q[1] - sy) ** 2)
                if (nx - sx) ** 2 + (ny - sy) ** 2 > 120 ** 2: nx, ny = sx, sy      # salto grande = outra coisa vermelha
            sx, sy = (nx, ny) if sx is None else (0.3 * sx + 0.7 * nx, 0.3 * sy + 0.7 * ny)
        out.append((sx, sy) if sx is not None else None)
    first = next((o for o in out if o), semente or ((x0 + x1) / 2, (y0 + y1) / 2))
    res = []; ult = first
    for o in out:
        ult = o or ult; res.append(ult)
    return res

# as 4 peças (status, relogio, cartao, alvo) e os botões do voto vêm de ../hud.py
# o cão é plantado desde a abertura: mira vermelha + distância que encolhe (a tela sabe mais que a voz)
# plano -> (distância, raio da mira, deslocamento do centro abaixo dos olhos, quando a mira entra)
# v5: a 1ª mira entra no plano do beco (A4) exatamente no "cachorro" da fala; no A1 o cão fica só plantado no fundo
T_CAO = _w('cachorro', 'P1')
AMEACA = {'A4': ('15 m', 110, 15, T_CAO - INI['A4'] - 0.1), 'I2': ('15 m', 70, 10, None), 'L1': ('3 m', 150, 30, None),
          'N3': ('1 m', 130, 25, None), 'N4': ('1 m', 130, 25, None)}
# ------------------------------------------------------------------ legenda: 1-2 palavras da fala, branca, palavra-chave amarela, sem pílula
CHAVE = {'voz', 'porta', 'línguas', 'sumiram', 'português', 'bloqueado', 'inglês', 'nível', '1', '2', 'meia-noite', 'palavra', 'push',
         'puxe', 'puxa', 'puxar', 'porteiro', 'grita', 'maçaneta', 'cachorro', 'seta', 'dentro', 'empurra', 'sempre', 'falava', 'lia'}
PEQ = {'a', 'o', 'e', 'as', 'os', 'do', 'da', 'de', 'no', 'na', 'pra', 'um', 'uma', 'se', 'às', 'ou', 'é', 'tá', 'não', 'que'}

def _num(ws):
    out = []; pula = 0
    for i, w in enumerate(ws):
        tx = w['w']; l = limpa(tx); ant = limpa(ws[i - 1]['w']) if i else ''
        if pula: pula -= 1; continue
        if l == 'seis' and i + 2 < len(ws) and limpa(ws[i + 1]['w']) == 'e' and limpa(ws[i + 2]['w']) == 'sete':
            out.append(dict(w, w='6:07', end=ws[i + 2]['end'])); pula = 2; continue
        if (ant == 'nível' and l in ('um', 'dois')) or (w['bloco'] == 'P14' and l in ('um', 'dois')):
            tx = tx.lower().replace('um', '1').replace('dois', '2')
        out.append(dict(w, w=tx))
    return out

def montar_legendas():
    ws = _num(PAL); grupos = []; cur = []
    for i, w in enumerate(ws):
        cur.append(w)
        cont = sum(1 for x in cur if limpa(x['w']) not in PEQ)
        prox = ws[i + 1] if i + 1 < len(ws) else None
        pausa = prox is None or prox['start'] - w['end'] > 0.22 or prox['bloco'] != w['bloco']
        pont = w['w'][-1] in '.,!?…:' or w['w'] == '6:07'
        if cont >= 2 or pausa or pont or len(cur) >= 3:
            grupos.append(cur); cur = []
    leg = []
    for k, g in enumerate(grupos):
        t0 = g[0]['start'] - 0.04
        t1 = grupos[k + 1][0]['start'] - 0.04 if k + 1 < len(grupos) else g[-1]['end'] + 0.3
        t1 = min(t1, g[-1]['end'] + 0.45)
        leg.append((t0, t1, [(x['w'].upper(), limpa(x['w']) in CHAVE) for x in g]))
    # o grito do porteiro (bloco POR não tem palavras alinhadas)
    leg.append((B['POR']['start'] + 0.05, B['POR']['end'] + 0.05, [('PUSH!', True), ('PUSH!', True)]))
    return sorted(leg)
LEG = montar_legendas()

TARJA = {}      # plano -> legenda com tarja escura (decidido no 1º quadro do plano, não pisca)
def legenda(img, t, tarja=False): pecas.legenda(img, t, LEG, tarja=tarja)

# ------------------------------------------------------------------ HUD de cada plano
# a abertura (23:52, "faltam oito minutos") é o 1º puxão da volta à porta (I2): a hora anda daí em diante (revisão da v2, erro E6)
RELOGIO = {'A1': '23:52', 'A2': '23:52', 'A3': '23:52', 'A4': '23:52', 'B1': '06:07', 'B2': '06:07', 'C1': '06:08', 'C2': '06:08', 'D1': '06:09', 'D2': '06:09',
           'E1': '06:10', 'F1': '06:11', 'F2': '06:11', 'G1': '09:14', 'G2': '15:40', 'G3': '21:03', 'H1': '23:51', 'I1': '23:51',
           'I2': '23:52', 'J1': '23:52', 'J2': '23:52', 'K1': '23:53', 'K2': '23:53', 'K3': '23:53', 'L1': '23:54', 'M1': '23:55',
           'M2': '23:55', 'N1': '23:56', 'N2': '23:56', 'N3': '23:56', 'N4': '23:56'}

def hud(p, t, img, extra):
    t0 = INI[p]; tl = t - t0; trilha = extra.get('trilha') or extra.get('olho') or [0]; i = int(min(len(trilha) - 1, tl * FPS))
    ui = Image.new('RGBA', (W, H)); d = ImageDraw.Draw(ui)
    relogio(d, RELOGIO[p])
    if p in ('B1', 'B2', 'C1', 'C2', 'D1', 'D2') or (p == 'E1' and t < _w('inglês', 'P5')):
        status(d, 'sem')
    elif p in ('E1', 'F1', 'F2'):
        status(d, 1, 0)
    elif p in ('G1', 'G2', 'G3'):
        k = 'G1 G2 G3'.split().index(p); xp0 = 60 + 10 * k
        xp = xp0 + 10 * e_out(prog(t, t0 + 0.12, 0.3))
        status(d, 1, xp, '+10', t, t0 + 0.12)
    else:
        status(d, 1, 90)
    if p in ('F1', 'F2'):
        cartao(d, t, INI['F1'] + 0.35 if p == 'F1' else -1, 'REGRA', VERM, 'NÍVEL 2 ATÉ 00:00')
    if p in ('H1', 'I1'):
        tr = extra['trilha'][i] if extra.get('trilha') else None
        if tr: alvo(d, t, t0 + 0.15 if p == 'H1' else -1, tr[:2], max(tr[2], tr[3]) * 0.72)
        cartao(d, t, INI['H1'] + 0.55 if p == 'H1' else -1, 'ÚLTIMA PALAVRA', AMARELO, 'PUSH  =  ???')
    if p in ('J1', 'J2'):
        cartao(d, t, INI['J1'] + 0.3 if p == 'J1' else -1, 'PORTEIRO', AMBAR, 'INGLÊS · LV 7')
    if p == 'K3':
        cartao(d, t, t0 + 0.35, 'ITEM OBTIDO', VERDE, 'MAÇANETA')
    if p in AMEACA and extra.get('olho'):
        dist, raio, dy, t_on = AMEACA[p]
        t_on = (INI['N3'] + 0.2 if p in ('N3', 'N4') else t0 + 0.15) if t_on is None else t0 + t_on
        c = extra['olho'][i]; c = (c[0], c[1] + dy)
        alvo(d, t, t_on, c, raio, VERM); rotulo_ameaca(d, t, t_on + 0.08, c, raio, dist, cima=p in ('N3', 'N4'))
    if p in ('N3', 'N4'):
        botoes(d, t, INI['N3'] + 0.1)
    img.alpha_composite(ui)
    if p not in TARJA:            # fundo claro na faixa da legenda (placa branca, calçada de dia): tarja
        TARJA[p] = fundo_claro(img)
    if p != 'D2':
        legenda(img, t, tarja=TARJA[p])

def main():
    so = sys.argv[sys.argv.index('--so') + 1].split(',') if '--so' in sys.argv else ORDEM
    so_quadros = '--quadros' in sys.argv
    os.makedirs(os.path.join(AQUI, 'final', '_quadros'), exist_ok=True)
    saida = os.path.join(AQUI, 'final', '_video.mp4')
    pf = None
    if not so_quadros:
        pf = subprocess.Popen(['ffmpeg', '-v', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{W}x{H}', '-r', str(FPS), '-i', '-',
                               '-c:v', 'libx264', '-preset', 'medium', '-crf', '17', '-pix_fmt', 'yuv420p', saida], stdin=subprocess.PIPE)
    n_total = 0
    for p in so:
        dur = FIM[p] - INI[p]; n = int(round(FIM[p] * FPS)) - int(round(INI[p] * FPS))
        if not CLIPE[p] or not os.path.exists(CLIPE[p]):
            print(f'{p}: falta o clipe, quadro preto'); frames = [np.zeros((H, W, 3), np.uint8)] * n; nclip = 0
        else:
            frames, nclip = ler_clipe(CLIPE[p], ENTRADA[p], n / FPS)
            if p == 'E1':
                k = max(1, int(round((TOQUE_E1 - INI['E1']) * FPS)))
                # o dedo chega no "inglês" e FICA (escolheu): seguir o clipe tirava o dedo e apagava o amarelo ("piscou")
                frames = [frames[k - j] for j in range(k)] + [frames[0]] * (n - k)
        frames = frames[:n] + [frames[-1]] * (n - len(frames))
        if p == 'D1' and nclip:
            frames = travar_janela(frames)
        extra = {}
        if p in ('H1', 'I1') and nclip:
            cx = achar_placa(frames[0], (0, 300, W, 1500))
            extra['trilha'] = rastrear(frames, cx) if cx else [None] * n
        if p in AMEACA and nclip:
            extra['olho'] = olhos_vermelhos(frames, *OLHO_REG[p], semente=ULTIMO_OLHO.get(p))
            if p == 'N3': ULTIMO_OLHO['N4'] = extra['olho'][-1]       # o N4 é o mesmo plano: segue de onde o N3 parou
        if p in PUSH and nclip:                      # câmera em código: os pontos rastreados andam junto
            frames, mats = push_in(frames, *PUSH[p])
            for k in ('trilha', 'olho'):
                if k in extra:
                    extra[k] = [None if v is None else
                                (M[0, 0] * v[0] + M[0, 2], M[1, 1] * v[1] + M[1, 2]) + tuple(x * M[0, 0] for x in v[2:])
                                for v, M in zip(extra[k], mats)]
        idx = range(n) if not so_quadros else [int(n * 0.6)]
        for i in idx:
            t = INI[p] + i / FPS
            img = Image.fromarray(frames[i]).convert('RGBA')
            hud(p, t, img, extra)
            if so_quadros:
                img.convert('RGB').save(os.path.join(AQUI, 'final', '_quadros', f'{p}.png'))
            else:
                pf.stdin.write(np.asarray(img.convert('RGB')).tobytes())
        n_total += n
        print(f'{p}: {INI[p]:.2f}-{FIM[p]:.2f} ({dur:.2f} s, clipe {nclip} quadros)', flush=True)
    if pf:
        pf.stdin.close(); pf.wait(); print('ok', saida, n_total / FPS, 's')

if __name__ == '__main__':
    main()
