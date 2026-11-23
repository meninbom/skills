# Monta o diálogo de um episódio de "O Caseiro" a partir de 1 arquivo por fala (sem recortar take).
# Uso: python montar.py ep01
# Saída: <ep>/dialogo.wav (48 kHz mono, Caio a -16 LUFS) e <ep>/timeline.json com:
#   blocos  = onde cada bloco cai no vídeo
#   palavras = só as do Caio (legenda karaokê)
#   outros  = falas da voz no escuro e do rádio (legenda fria)
import json, re, subprocess, sys
import numpy as np

SR = 48000
EP = sys.argv[1]
SPEED = 1.06                      # o take inteiro do Caio, abaixo do teto de 1,1x
LONGE = 'lowpass=f=5200,highpass=f=200,aecho=0.8:0.6:160|330:0.26|0.14'          # a voz no escuro: longe, com eco de lago
RADIO = 'highpass=f=420,lowpass=f=3300,asoftclip=type=tanh,aecho=0.8:0.4:60:0.2'  # o patrão no rádio do cinto
FX = {'caio': f'atempo={SPEED}', 'voz': LONGE, 'dono': RADIO}
LVL = {'caio': -16.0, 'voz': -17.5, 'dono': -18.0}

# plano: (id do bloco, fala ou None, segundos de silêncio antes)
PLANS = {
 'ep01': [('A', 'c01', 0), ('B', 'c02', 0.25), ('C', 'c03', 0.3), ('D', 'c04', 0.25), ('noite', None, 1.3), ('V1', 'v01', 0), ('E', 'c05', 0.35),
          ('V2', 'v02', 0.25), ('F', 'c06', 0.35), ('congela', None, 0.35), ('G', 'c07', 0), ('cauda', None, 0.45)],
 'ep02a': [('A', 'a01', 0), ('estalo', None, 0.65), ('B', 'a02', 0), ('C', 'a03', 0.45), ('R', 'r01', 0.35), ('D', 'a04', 0.25), ('racha', None, 0.9),
           ('E', 'a05', 0), ('F', 'a06', 0.35), ('congela', None, 0.35), ('G', 'a07', 0), ('cauda', None, 0.45)],
 'ep02b': [('A', 'b01', 0), ('V3', 'v03', 0.35), ('B', 'b02', 0.2), ('chegada', None, 0.9), ('C', 'b03', 0), ('D', 'b04', 0.35), ('V4', 'v04', 0.45),
           ('E', 'b05', 0.35), ('congela', None, 0.35), ('G', 'b06', 0), ('cauda', None, 0.45)],
}

def load(path, filters=None):
    cmd = ['ffmpeg', '-v', 'error', '-i', path] + (['-af', filters] if filters else []) + ['-ac', '1', '-ar', str(SR), '-f', 'f32le', '-']
    return np.frombuffer(subprocess.run(cmd, capture_output=True, check=True).stdout, dtype=np.float32).copy()

def lufs(x):
    p = subprocess.run(['ffmpeg', '-hide_banner', '-f', 'f32le', '-ar', str(SR), '-ac', '1', '-i', '-', '-af', 'ebur128', '-f', 'null', '-'],
                       input=x.astype(np.float32).tobytes(), capture_output=True)
    return float([l for l in p.stderr.decode().splitlines() if l.strip().startswith('I:')][-1].split()[1])

def trim(x, thr=1e-3, pad=0.03):
    """Cut leading/trailing silence of a single line, keeping 30 ms."""
    idx = np.where(np.abs(x) > thr)[0]
    if not len(idx): return x, 0.0
    a, b = max(0, idx[0] - int(pad * SR)), min(len(x), idx[-1] + int(pad * SR))
    return x[a:b], a / SR

def fade(x, ms=10):
    n = int(SR * ms / 1000); x = x.copy()
    if len(x) > 2 * n: x[:n] *= np.linspace(0, 1, n); x[-n:] *= np.linspace(1, 0, n)
    return x

falas = json.load(open('falas.json', encoding='utf-8'))
quem = {fid: (who, re.sub(r'\[[^\]]*\]\s*', '', txt)) for fid, who, txt in falas[EP]}
out, t, tl = [], 0.0, {'ep': EP, 'speed': SPEED, 'blocos': [], 'palavras': [], 'outros': []}
for bid, fid, gap in PLANS[EP]:
    if gap: out.append(np.zeros(int(gap * SR), np.float32)); t += gap
    if fid is None:
        tl['blocos'].append({'id': bid, 'start': round(t, 3), 'end': round(t, 3)}); continue
    who, txt = quem[fid]
    x = load(f'{EP}/{fid}.mp3', FX[who]); x, cut0 = trim(x); x = fade(x * (10 ** ((LVL[who] - lufs(x)) / 20)))
    k = SPEED if who == 'caio' else 1.0
    if who == 'caio':
        for w in json.load(open(f'{EP}/{fid}.words.json', encoding='utf-8')):
            if w['w'].startswith('[') or w['w'].endswith(']'): continue  # tags with a comma split in 2 tokens ('[uneasy,' + 'reading]')
            tl['palavras'].append({'w': w['w'], 'start': round(t + w['start'] / k - cut0, 3), 'end': round(t + w['end'] / k - cut0, 3), 'bloco': bid})
    else:
        tl['outros'].append({'quem': who, 'texto': txt, 'start': round(t, 3), 'end': round(t + len(x) / SR, 3), 'bloco': bid})
    tl['blocos'].append({'id': bid, 'start': round(t, 3), 'end': round(t + len(x) / SR, 3)})
    out.append(x); t += len(x) / SR
y = np.concatenate(out); tl['duracao'] = round(t, 3)
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 'f32le', '-ar', str(SR), '-ac', '1', '-i', '-', '-c:a', 'pcm_s16le', f'{EP}/dialogo.wav'],
               input=y.astype(np.float32).tobytes(), check=True)
json.dump(tl, open(f'{EP}/timeline.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print(EP, 'duração', round(t, 2), 's')
for b in tl['blocos']: print(f"  {b['id']:8s} {b['start']:6.2f} – {b['end']:6.2f}")
