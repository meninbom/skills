"""Mix pela timeline da voz: voz no topo; ambiente, efeitos e música cada um >= 10 dB abaixo dela; -14 LUFS no final.
Os sons são SEUS (sua biblioteca de efeitos ou um pack CC0): o mix.json diz qual arquivo entra em que segundo e quantos dB
abaixo da voz. Só numpy + FFmpeg. Não toca nada: só escreve arquivos.
uso: python mix.py mix.json   ->  final/mix.wav (48 kHz estéreo) + final/_voz.wav, _sfx.wav, _amb.wav, _mus.wav (para medir)
Campos do mix.json (caminhos relativos ao próprio json; "db" = dB em relação à voz, negativo):
  voz, timeline         a trilha de voz e o timeline.json dela (saem do ../voz/montar_voz.py)
  ambiente_dos_clipes   db do som que veio dentro de cada clipe animado (usa os cortes do montar_v2.py), ou null para não usar
  camas                 [{arquivo, de, ate, db}]  som contínuo (chuva) entre dois tempos
  sfx                   [{arquivo, t, db, dur?}]  um efeito no tempo t (dur corta com fade)
  musica                {arquivo, entra, sai, db, cauda}  entra na virada, sai com fade de `cauda` segundos (ou null)
  silencio_de           segundo a partir do qual o ambiente some (o mundo congela no voto), ou null
"""
import json, pathlib, subprocess, sys
import numpy as np

SR = 48000
HERE = pathlib.Path(__file__).resolve().parent
CONF = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else HERE / 'mix.json').resolve()
C = json.loads(CONF.read_text(encoding='utf-8')); BASE = CONF.parent
TL = json.loads((BASE / C['timeline']).read_text(encoding='utf-8'))
DUR = TL['duracao']; N = int((DUR + 0.3) * SR)

def load(p, t0=0.0, dur=None):
    cmd = ['ffmpeg', '-v', 'error', '-ss', f'{t0:.3f}', '-i', str(p)] + (['-t', f'{dur:.3f}'] if dur else []) + ['-vn', '-ac', '2', '-ar', str(SR), '-f', 'f32le', '-']
    raw = subprocess.run(cmd, capture_output=True).stdout
    return np.frombuffer(raw, np.float32).reshape(-1, 2).T.astype(np.float64)
def rms_db(x):
    k = np.abs(x).max(0) > 1e-4
    x = x[:, k] if k.any() else x
    return 20 * np.log10(np.sqrt(np.mean(x ** 2)) + 1e-9)
def at_db(x, alvo, teto=None):
    g = alvo - rms_db(x)
    if teto is not None: g = min(g, teto)
    return x * 10 ** (g / 20)
def fade(x, n_in=0, n_out=0):
    x = x.copy(); n_in, n_out = min(n_in, x.shape[1]), min(n_out, x.shape[1])
    if n_in: x[:, :n_in] *= np.linspace(0, 1, n_in)
    if n_out: x[:, -n_out:] *= np.linspace(1, 0, n_out)
    return x
def add(buf, x, t):
    i = int(t * SR); j = min(buf.shape[1], i + x.shape[1])
    if i < 0: x = x[:, -i:]; i = 0
    if j > i: buf[:, i:j] += x[:, :j - i]
def suave(mask, seg):
    """Média móvel de uma curva de ganho (para o ganho não dar degrau)."""
    n = max(1, int(seg * SR)); c = np.cumsum(np.concatenate([[0.0], np.pad(mask, (n // 2, n - n // 2 - 1), mode='edge')]))
    return (c[n:] - c[:-n]) / n
def lufs(x):
    p = subprocess.run(['ffmpeg', '-hide_banner', '-f', 'f32le', '-ar', str(SR), '-ac', '2', '-i', '-', '-af', 'ebur128', '-f', 'null', '-'],
                       input=x.T.astype(np.float32).tobytes(), capture_output=True)
    return float([l for l in p.stderr.decode(errors='ignore').splitlines() if l.strip().startswith('I:')][-1].split()[1])
def teto(x, db=-2.0):
    """Limitador simples: o que passa do teto é dobrado com tanh (o AAC ainda sobe o pico real ~0,6 dB)."""
    lim = 10 ** (db / 20); k = lim * 0.8; a = np.abs(x)
    return np.where(a <= k, x, np.sign(x) * (k + (lim - k) * np.tanh((a - k) / (lim - k))))

voz = np.zeros((2, N)); sfx = np.zeros((2, N)); amb = np.zeros((2, N)); mus = np.zeros((2, N))
add(voz, load(BASE / C['voz']), 0)
VOZ = rms_db(voz)
fala = np.zeros(N)
for w in TL['palavras']: fala[int(max(0, w['start'] - 0.05) * SR):int((w['end'] + 0.1) * SR)] = 1

if C.get('ambiente_dos_clipes') is not None:          # o som que o modelo de vídeo gerou em cada plano, no mesmo trecho do vídeo
    import importlib.util
    spec = importlib.util.spec_from_file_location('m', HERE / 'montar_v2.py'); M = importlib.util.module_from_spec(spec)
    arg = sys.argv; sys.argv = ['x']; spec.loader.exec_module(M); sys.argv = arg
    for p in M.ORDEM:
        if not M.CLIPE[p] or not pathlib.Path(M.CLIPE[p]).exists(): continue
        y = load(M.CLIPE[p], M.ENTRADA[p], M.FIM[p] - M.INI[p])
        if y.shape[1] > SR * 0.3:                     # áudio quase mudo do clipe não sobe mais que +6 dB
            add(amb, at_db(fade(y, int(0.03 * SR), int(0.05 * SR)), VOZ + C['ambiente_dos_clipes'], teto=6), M.INI[p])
for c in C.get('camas') or []:
    y = load(BASE / c['arquivo']); n = int((c['ate'] - c['de']) * SR)
    y = np.tile(y, (1, n // y.shape[1] + 1))[:, :n]
    add(amb, at_db(fade(y, int(0.05 * SR), int(0.1 * SR)), VOZ + c['db']), c['de'])
for s in C.get('sfx') or []:
    y = load(BASE / s['arquivo'])
    e = np.abs(y).max(0); y = y[:, int(np.argmax(e > e.max() * 0.2)):]            # alinha pelo ataque, não pelo começo do arquivo
    if s.get('dur'): y = fade(y[:, :int(s['dur'] * SR)], n_out=int(min(0.3, s['dur'] / 3) * SR))
    add(sfx, at_db(y, VOZ + s['db']), s['t'])
m = C.get('musica')
if m:
    y = load(BASE / m['arquivo'], dur=m['sai'] - m['entra'] + m.get('cauda', 2.0))
    add(mus, at_db(fade(y, int(0.02 * SR), int(m.get('cauda', 2.0) * SR)), VOZ + m['db']), m['entra'])

# debaixo da fala: ambiente -6 dB, efeitos -3 dB, música -8 dB
amb *= suave(np.where(fala > 0, 10 ** (-6 / 20), 1.0), 0.2)[None, :]
sfx *= suave(np.where(fala > 0, 10 ** (-3 / 20), 1.0), 0.1)[None, :]
mus *= suave(np.where(fala > 0, 10 ** (-8 / 20), 1.0), 0.25)[None, :]
if C.get('silencio_de') is not None: amb[:, int(C['silencio_de'] * SR):] = 0

mix = voz + sfx + amb + mus
g = 10 ** ((C.get('alvo_lufs', -14) - lufs(mix)) / 20)
(HERE / 'final').mkdir(exist_ok=True)
for nome, x in (('mix', teto(mix * g)), ('_voz', voz * g), ('_sfx', sfx * g), ('_amb', amb * g), ('_mus', mus * g)):
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 'f32le', '-ar', str(SR), '-ac', '2', '-i', '-', '-c:a', 'pcm_s16le', str(HERE / 'final' / f'{nome}.wav')],
                   input=x.T.astype(np.float32).tobytes(), check=True)
iv = lufs(voz * g); rel = {n: round(lufs(x * g), 1) for n, x in (('sfx', sfx), ('amb', amb), ('mus', mus)) if np.abs(x).max() > 0}
print(f'voz I={iv:.1f} LUFS | stems I: {rel}')
print('regra: cada stem pelo menos 10 dB abaixo da voz ->', {k: v <= iv - 10 for k, v in rel.items()})
