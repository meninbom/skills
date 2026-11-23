# python mix.py A  -> A.mix.wav
# Voz na frente; cada efeito entra pelo ATAQUE no tempo do evento da tela e fica N dB abaixo do pico da voz; master em -14 LUFS.
# Os eventos ficam em eventos.json: {"sfx": arquivo em sfx/, "t": expressão de tempo, "db": nível, "dur": expressão opcional}.
# Nas expressões valem: T(i) início da linha i, E(i) fim, D(i) duração, P(i, f) ponto dentro da linha,
# ini('cena') e fim('cena'), DUR, e hN (momento da notificação do gancho, igual ao do ep.js).
import json, re, subprocess, sys, numpy as np
V = sys.argv[1]
src = open('../cues.js', encoding='utf-8').read()
CUES = json.loads(re.search(r'CUES=(\[.*?\]);', src).group(1)); DUR = float(re.search(r'DUR=([\d.]+)', src).group(1))
CENAS = re.findall(r"sc: '(\w+)'", open('../lines.js', encoding='utf-8').read())
T = lambda i: CUES[i]['s']; E = lambda i: CUES[i]['e']; D = lambda i: E(i) - T(i); P = lambda i, f: T(i) + D(i) * f
first = {}
for i, sc in enumerate(CENAS): first.setdefault(sc, i)
ordem = list(first)
ini = lambda sc: 0 if sc == ordem[0] else T(first[sc]) - 0.12
fim = lambda sc: DUR if ordem.index(sc) == len(ordem) - 1 else ini(ordem[ordem.index(sc) + 1])
h0 = max(.7, T(1) - .12); hd = min(1.9, max(1.0, (ini(ordem[1]) - h0) * .42)); hN = max(h0 + hd * .8, P(1, .42))
ENV = dict(T=T, E=E, D=D, P=P, ini=ini, fim=fim, DUR=DUR, h0=h0, hN=hN, min=min, max=max)
LEAD = float(open(f'{V}.lead.txt').read())

def pcm(f):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', f, '-ac', '1', '-ar', '48000', '-f', 'f32le', '-'], capture_output=True).stdout
    return np.frombuffer(raw, dtype=np.float32)
def ataque(f):  # 1o ponto acima de 30% do envelope, com 30 ms de folga
    x = np.abs(pcm(f)); n = 480; env = x[:len(x) // n * n].reshape(-1, n).max(axis=1)
    i = int(np.argmax(env > 0.3 * env.max())); return max(0.0, i * n / 48000 - 0.03), float(env.max())
def lufs(f):
    out = subprocess.run(['ffmpeg', '-i', f, '-af', 'ebur128', '-f', 'null', '-'], capture_output=True, text=True).stderr
    return float(re.findall(r'I:\s+(-?[\d.]+) LUFS', out)[-1])

EV = json.load(open('eventos.json', encoding='utf-8'))
pv = float(np.abs(pcm(f'{V}.mp3')).max())
ins = ['-i', f'{V}.mp3']; fc = [f'[0:a]adelay={int(LEAD * 1000)}:all=1,aresample=48000[v]']; tags = ['[v]']; rel = []
for k, ev in enumerate(EV):
    f = f"sfx/{ev['sfx']}.mp3"; t = float(eval(ev['t'], ENV)); dmax = float(eval(ev['dur'], ENV)) if ev.get('dur') else None
    at, pk = ataque(f); ini_s = max(0, t - at); g = pv * 10 ** (ev['db'] / 20) / pk
    d = f',atrim=0:{dmax:.2f},afade=t=out:st={max(0, dmax - .5):.2f}:d=0.5' if dmax else ''
    fi = ',afade=t=in:st=0:d=0.6' if ev.get('ambiente') else ''
    ins += ['-i', f]; fc.append(f'[{k + 1}:a]aresample=48000,pan=mono|c0=c0{d}{fi},volume={g:.4f},adelay={int(ini_s * 1000)}:all=1[s{k}]'); tags.append(f'[s{k}]')
    rel.append((ev['sfx'], round(t, 2), ev['db']))
fc.append(''.join(tags) + f'amix=inputs={len(tags)}:normalize=0:duration=longest,apad=whole_dur={DUR},atrim=0:{DUR},loudnorm=I=-14:TP=-1.5:LRA=11[m]')
subprocess.run(['ffmpeg', '-v', 'error', '-y'] + ins + ['-filter_complex', ';'.join(fc), '-map', '[m]', '-ar', '48000', '-ac', '2', f'{V}.mix.wav'], check=True)
print(V, 'duracao', DUR, 'LUFS', lufs(f'{V}.mix.wav'), 'eventos', rel)
