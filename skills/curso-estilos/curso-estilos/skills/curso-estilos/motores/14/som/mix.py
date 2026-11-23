# Mix do exemplo "Emoji": voz (-16 LUFS) + trilha (~11 dB abaixo, duck leve na fala)
# + 5 SFX de foley real (passa-baixa, >=12 dB abaixo da voz). Master -13,5 LUFS, TP <= -1,5.
#
# NAO roda no demo e nao traz audio: voce aponta os SEUS arquivos em som/arquivos.json
# (copie som/arquivos.exemplo.json e troque os caminhos). Use a sua biblioteca de efeitos ou um pack CC0.
#   pip install numpy scipy soundfile pyloudnorm
#   python som/mix.py
import os, json, subprocess
os.environ["CUDA_VISIBLE_DEVICES"] = ""
import numpy as np, soundfile as sf, pyloudnorm as pyln
from scipy.signal import butter, sosfilt
from scipy.ndimage import uniform_filter1d

R = os.path.dirname(os.path.abspath(__file__))
SR = 48000
DUR = 56.4
N = int(DUR * SR)
CFG = os.path.join(R, 'arquivos.json')
if not os.path.exists(CFG):
    raise SystemExit('Falta som/arquivos.json. Copie som/arquivos.exemplo.json, renomeie e aponte para os seus arquivos de audio.')
ARQ = json.load(open(CFG, encoding='utf-8'))
VOZ, MUS = ARQ['voz'], ARQ['trilha']
KEY, CARD, PENC, SLID = ARQ['sfx_tecla'], ARQ['sfx_carta'], ARQ['sfx_lapis'], ARQ['sfx_papel']
for _n, _p in ARQ.items():
    if not _n.startswith('_') and not os.path.exists(_p):
        raise SystemExit(f'som/arquivos.json: "{_n}" aponta para um arquivo que nao existe: {_p}')
meter = pyln.Meter(SR)


def dec(path, ch=1):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', path, '-f', 'f32le', '-ac', str(ch), '-ar', str(SR), '-'], capture_output=True).stdout
    a = np.frombuffer(raw, np.float32).copy()
    return a.reshape(-1, ch) if ch > 1 else a


def lp(x, hz):
    return sosfilt(butter(4, hz, 'low', fs=SR, output='sos'), x, axis=0)


def hp(x, hz):
    return sosfilt(butter(2, hz, 'high', fs=SR, output='sos'), x, axis=0)


def db(x): return 10 ** (x / 20)


def mom_max(x):  # pico de loudness momentânea (400 ms)
    m = x if x.ndim == 1 else x.mean(1)
    if len(m) < int(0.45 * SR): m = np.r_[m, np.zeros(int(0.45 * SR) - len(m))]
    best = -99
    for i in range(0, max(1, len(m) - int(0.4 * SR)), int(0.05 * SR)):
        seg = m[i:i + int(0.4 * SR)]
        if len(seg) < int(0.4 * SR): break
        best = max(best, meter.integrated_loudness(np.c_[seg, seg]) if np.abs(seg).max() > 1e-6 else -99)
    return best


# ---------- voz ----------
voz = dec(VOZ)
voz = hp(voz, 70)
L = meter.integrated_loudness(np.c_[voz, voz])
voz *= db(-16 - L)
V = np.zeros(N); V[:min(N, len(voz))] = voz[:N]

# ---------- trilha ----------
mus = dec(MUS, 2)[:N]
M = np.zeros((N, 2)); M[:len(mus)] = mus
fo = int(0.6 * SR); M[N - fo:] *= np.linspace(1, 0, fo)[:, None]
M = hp(M, 90)
Lm = meter.integrated_loudness(M)
M *= db(-25.2 - Lm)
# duck leve (−2,5 dB) quando há fala, envelope suave de 250 ms
env = uniform_filter1d(np.abs(V), int(0.05 * SR))
fala = (env > db(-40)).astype(float)
fala = uniform_filter1d(fala, int(0.25 * SR))
M *= (1 - (1 - db(-2.5)) * np.clip(fala * 1.5, 0, 1))[:, None]

# ---------- SFX ----------
X = np.zeros(N)
cues = []


def poe(path, t, ganho_abaixo, ini=0.0, fim=None, lp_hz=6000, pico=None):
    a = dec(path)
    a = a[int(ini * SR): int(fim * SR) if fim else None]
    a = lp(a, lp_hz)
    k = int(0.01 * SR); a[:k] *= np.linspace(0, 1, k); a[-k * 3:] *= np.linspace(1, 0, k * 3)
    p = pico if pico is not None else np.argmax(np.abs(a)) / SR
    s0 = int((t - p) * SR)
    alvo = -16 - ganho_abaixo
    mm = mom_max(a)
    a = a * db(alvo - mm)
    s1 = max(0, s0); X[s1:s0 + len(a)] += a[s1 - s0: N - s0][:len(X[s1:s0 + len(a)])]
    cues.append({'t': t, 'arquivo': os.path.basename(path), 'abaixo_voz_db': ganho_abaixo})


poe(CARD, 6.37, 14)                                  # pouso da foto de Tóquio
for i, t in enumerate([13.36, 13.62, 13.90, 14.18, 14.47, 14.76]):   # teclas do celular enquanto o contador sobe
    poe(KEY, t, 17 + (i % 2) * 2, ini=0.0, fim=0.16, lp_hz=4500)
poe(PENC, 30.32, 15)                                 # o lápis na grade (sol)
poe(CARD, 47.40, 14)                                 # pouso da foto do museu
poe(SLID, 52.05, 13, lp_hz=5000)                     # o recuo: a página inteira desliza

# ---------- soma + master ----------
mix = np.c_[V, V] + M + np.c_[X, X]
Lmix = meter.integrated_loudness(mix)
mix *= db(-13.5 - Lmix)
sf.write(os.path.join(R, 'pre_master.wav'), mix.astype(np.float32), SR, subtype='FLOAT')
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', os.path.join(R, 'pre_master.wav'), '-af',
                'alimiter=limit=0.82:attack=2:release=60:level=disabled', '-ar', '48000', '-c:a', 'pcm_s16le',
                os.path.join(R, 'mix.wav')], check=True)
sf.write(os.path.join(R, 'stem_voz.wav'), np.c_[V, V].astype(np.float32) * db(-13.5 - Lmix), SR)
sf.write(os.path.join(R, 'stem_trilha.wav'), M.astype(np.float32) * db(-13.5 - Lmix), SR)
sf.write(os.path.join(R, 'stem_sfx.wav'), np.c_[X, X].astype(np.float32) * db(-13.5 - Lmix), SR)
json.dump(cues, open(os.path.join(R, 'cues.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print('voz', round(meter.integrated_loudness(np.c_[V, V]), 1), 'trilha', round(meter.integrated_loudness(M), 1), 'mix pre', round(Lmix, 1))
