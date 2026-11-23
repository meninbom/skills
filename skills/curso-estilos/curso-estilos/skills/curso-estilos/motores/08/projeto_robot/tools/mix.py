"""Mix do robot (le projeto/mix.json). Nao gera musica, nao chama servico pago, nao usa SFX de biblioteca.

  voz FIXA (voz/robot_tight.mp3) -> -16 LUFS so com ganho estatico (public/audio/voz_-16lufs.wav)
  trilha da sua biblioteca de trilhas, trecho escolhido, medida SEPARADA e posta N dB abaixo da voz (12-15)
     + sidechain pela voz (ratio >= 4; reducao medida e registrada)
  ambiente do proprio H3 (som diegetico), passa-faixa 150 Hz-5 kHz (nada agudo), no maximo 1 a cada 3 s,
     cada trecho >= 18 dB abaixo da voz
  master -14 LUFS, true peak <= -1,5 dBTP (o AAC sobe ~0,5 dB), 48 kHz estereo

uso:
  python tools/mix.py                          -> ../mix.wav + out/som/ (stems + mix_relatorio.json)
  python tools/mix.py --mux VIDEO SAIDA.mp4    -> SAIDA.mp4 = video (copiado) + ../mix.wav em AAC 48 kHz 192k
"""
import argparse, json, os, re, subprocess, wave
import numpy as np, pyloudnorm as pyln
from scipy.signal import butter, sosfilt, sosfiltfilt

HERE = os.path.dirname(os.path.abspath(__file__))
PROJ = os.path.abspath(os.path.join(HERE, '..'))
ROBOT = os.path.abspath(os.path.join(PROJ, '..'))
CFG = json.load(open(os.path.join(PROJ, 'mix.json'), encoding='utf-8'))
SR = 48000
DUR = CFG.get('dur_s', 45.4)
N = int(round(DUR * SR))
METER = pyln.Meter(SR)
SOM = os.path.join(PROJ, 'out', 'som')
db = lambda x: 10 ** (x / 20)


def p(x):
    return x if os.path.isabs(x) else os.path.join(PROJ, x)


def load(path, start=0.0, dur=None, ch=2):
    cmd = ['ffmpeg', '-v', 'error', '-ss', f'{start:.4f}', '-i', path] + (['-t', f'{dur:.4f}'] if dur else []) + \
          ['-ac', str(ch), '-ar', str(SR), '-f', 'f32le', '-']
    raw = subprocess.run(cmd, capture_output=True, check=True).stdout
    return np.frombuffer(raw, dtype=np.float32).reshape(-1, ch).astype(np.float64)


def fit(x, n=N):
    y = np.zeros((n, x.shape[1])); k = min(n, len(x)); y[:k] = x[:k]; return y


def lufs(x):
    return float(METER.integrated_loudness(x))


def rms_db(x):
    return float(20 * np.log10(np.sqrt(np.mean(np.square(x))) + 1e-12))


def wav(path, x):
    with wave.open(path, 'wb') as f:
        f.setnchannels(x.shape[1]); f.setsampwidth(2); f.setframerate(SR)
        f.writeframes((np.clip(x, -1, 1) * 32767).round().astype(np.int16).tobytes())


def true_peak_db(x):
    # 4x de sobreamostragem (o mesmo criterio do ebur128 true peak)
    from scipy.signal import resample_poly
    up = resample_poly(x, 4, 1, axis=0)
    return float(20 * np.log10(np.abs(up).max() + 1e-12))


def envelope_db(x, ataque_ms, soltura_ms):
    """seguidor de envelope (pico) em dB, mono"""
    m = np.abs(x).max(axis=1) if x.ndim > 1 else np.abs(x)
    a = np.exp(-1 / (SR * ataque_ms / 1000)); r = np.exp(-1 / (SR * soltura_ms / 1000))
    env = np.empty_like(m); e = 0.0
    for i, v in enumerate(m):                       # 2,2 M amostras: ok em ~2 s
        c = a if v > e else r
        e = c * e + (1 - c) * v
        env[i] = e
    return 20 * np.log10(env + 1e-9)


def limitador(x, teto_db, olhar_ms=2.0, soltura_ms=80.0):
    """limitador de pico com olhar a frente: o ganho cai antes do pico e volta com soltura; nunca passa do teto"""
    from scipy.ndimage import minimum_filter1d
    teto = db(teto_db)
    pk = np.abs(x).max(axis=1)
    look = max(1, int(SR * olhar_ms / 1000))
    g = minimum_filter1d(np.minimum(1.0, teto / np.maximum(pk, 1e-9)), size=2 * look + 1)
    r = np.exp(-1 / (SR * soltura_ms / 1000))
    out = np.empty_like(g); e = 1.0
    for i, v in enumerate(g):
        e = v if v < e else r * e + (1 - r) * v
        out[i] = e
    return x * out[:, None], float(-20 * np.log10(out.min()))


def main():
    os.makedirs(SOM, exist_ok=True)
    rel = {'versao': 'v3 17/10', 'regras': 'voz -16 | trilha 12-15 dB abaixo medida separada | sidechain ratio >= 4 | '
           'diegetico H3 <= 1 a cada 3 s, abaixo da voz | master -14 LUFS, AAC 48 kHz'}

    # ---------------- voz (FIXA, ja normalizada; aqui so confere e encaixa no tempo)
    voz = fit(load(p(CFG['voz']['arquivo'])))
    voz *= db(CFG['voz']['lufs'] - lufs(voz))
    words = json.load(open(p('src/data/words.json'), encoding='utf-8'))
    ws = words if isinstance(words, list) else words.get('words', [])
    fala = np.zeros(N, bool)
    for w in ws:
        fala[int(w['start'] * SR):min(N, int(w['end'] * SR))] = True
    v_lufs = lufs(voz)
    rel['voz'] = {'arquivo': CFG['voz']['origem'], 'lufs': round(v_lufs, 2), 'true_peak_dbtp': round(true_peak_db(voz), 2)}

    # ---------------- trilha: trecho + fades, medida SEPARADA e posta N dB abaixo da voz
    T = CFG['trilha']
    tr = fit(load(T['arquivo'], T['inicio_s'], DUR + 0.5))
    fi, fo = int(T['fade_in_s'] * SR), int(T['fade_out_s'] * SR)
    tr[:fi] *= np.linspace(0, 1, fi)[:, None] ** 2
    tr[N - fo:] *= np.linspace(1, 0, fo)[:, None] ** 2
    if T.get('passa_alta_hz'):                       # tira o sub que o celular nao toca: o arpejo (300 Hz-2 kHz) sobe no mesmo LUFS
        tr = sosfilt(butter(2, T['passa_alta_hz'], btype='high', fs=SR, output='sos'), tr, axis=0)
    alvo_tr = v_lufs - T['abaixo_da_voz_db']
    tr *= db(alvo_tr - lufs(tr))
    tr_lufs = lufs(tr)

    # sidechain: chave = voz; limiar relativo ao nivel de pico da fala; ratio >= 4
    sc = T['sidechain']
    assert sc['ratio'] >= 4, 'sidechain ratio tem que ser >= 4'
    env = envelope_db(voz, sc['attack_ms'], sc['release_ms'])
    ref = np.percentile(env[fala], 50)
    thr = ref + sc['limiar_rel_fala_db']
    over = np.maximum(0, env - thr)
    red = np.minimum(sc['reducao_max_db'], over * (1 - 1 / sc['ratio']))
    # suaviza a curva de ganho (sem bombear): media movel de 30 ms
    k = int(0.03 * SR)
    red = np.convolve(red, np.ones(k) / k, mode='same')
    tr_d = tr * db(-red)[:, None]
    rel['trilha'] = {
        'arquivo': T['arquivo'], 'inicio_s': T['inicio_s'], 'passa_alta_hz': T.get('passa_alta_hz'), 'por_que': T.get('por_que', ''),
        'lufs_isolada': round(tr_lufs, 2), 'voz_menos_trilha_db_medida_separada': round(v_lufs - tr_lufs, 2),
        'durante_fala_rel_voz_db': round(rms_db(tr_d[fala]) - rms_db(voz[fala]), 2),
        'sidechain': {'ratio': sc['ratio'], 'limiar_db': round(float(thr), 1), 'ataque_ms': sc['attack_ms'], 'soltura_ms': sc['release_ms'],
                      'reducao_media_na_fala_db': round(float(red[fala].mean()), 2), 'reducao_max_db': round(float(red.max()), 2)},
    }

    # ---------------- ambiente do H3 (diegetico), passa-faixa, <= 1 a cada 3 s, abaixo da voz
    A = CFG['ambiente_h3']
    ts = sorted(a['t'] for a in A['trechos'])
    assert all(b - a >= 3.0 for a, b in zip(ts, ts[1:])), 'ambiente: no maximo 1 a cada 3 s'
    sos = butter(4, [A['passa_alta_hz'], A['passa_baixa_hz']], btype='band', fs=SR, output='sos')
    amb = np.zeros((N, 2)); usados = []
    voz_fala_rms = rms_db(voz[fala])
    for a in A['trechos']:
        w = p(f"public/audio/amb_{a['clip']}.wav")
        if not os.path.exists(w):
            print('sem ambiente', a['clip']); continue
        seg = load(w, a['de'], a['dur'])
        seg = sosfiltfilt(sos, seg, axis=0)
        n = len(seg); f = min(int(0.08 * SR), n // 4); g = min(int(0.2 * SR), n // 3)
        seg[:f] *= np.linspace(0, 1, f)[:, None]; seg[n - g:] *= np.linspace(1, 0, g)[:, None]
        alvo = a.get('lufs', A['lufs'])
        nivel = lufs(seg) if n >= 0.45 * SR else rms_db(seg) - 0.7
        seg *= db(alvo - nivel)
        i0 = int(a['t'] * SR); i1 = min(N, i0 + n)
        amb[i0:i1] += seg[:i1 - i0]
        usados.append({'t': a['t'], 'clip': a['clip'], 'dur': a['dur'], 'o_que': a['por_que'],
                       'rel_voz_db': round(rms_db(seg) - voz_fala_rms, 1)})
    rel['ambiente_h3'] = {'passa_faixa_hz': [A['passa_alta_hz'], A['passa_baixa_hz']], 'trechos': usados}
    rel['sfx_biblioteca'] = []

    # ---------------- soma, master -14 LUFS, true peak
    M = CFG['master']
    mix = voz + tr_d + amb
    mix *= db(M['lufs'] - lufs(mix))
    mix, red_lim = limitador(mix, M['true_peak'] - 0.6)
    for _ in range(3):                               # o limitador baixa ~0,1 LU: reajusta
        mix *= db(M['lufs'] - lufs(mix))
        mix, r2 = limitador(mix, M['true_peak'] - 0.6)
        red_lim = max(red_lim, r2)
    tp = true_peak_db(mix)
    out = os.path.join(ROBOT, 'mix.wav')
    wav(out, mix)
    # stems no mesmo ganho do master (para medir e para refazer so uma camada)
    g = db(M['lufs'] - lufs(voz + tr_d + amb))
    for nome, x in (('voz', voz), ('trilha', tr_d), ('trilha_sem_sidechain', tr), ('ambiente', amb)):
        wav(os.path.join(SOM, f'stem_{nome}.wav'), x * g)

    # celular: passa-alta 300 Hz + passa-baixa 8 kHz, mono
    cel = sosfilt(butter(4, [300, 8000], btype='band', fs=SR, output='sos'), mix.mean(axis=1))
    trc = sosfilt(butter(4, [300, 8000], btype='band', fs=SR, output='sos'), tr_d.mean(axis=1))
    vzc = sosfilt(butter(4, [300, 8000], btype='band', fs=SR, output='sos'), voz.mean(axis=1))
    rel['master'] = {'arquivo': out, 'lufs': round(lufs(mix), 2), 'true_peak_dbtp': round(tp, 2), 'limitador_reducao_max_db': round(red_lim, 2),
                     'taxa': SR, 'canais': 2}
    rel['celular'] = {'queda_mix_db': round(rms_db(cel) - rms_db(mix.mean(axis=1)), 2),
                      'queda_trilha_db': round(rms_db(trc) - rms_db(tr_d.mean(axis=1)), 2),
                      'trilha_rel_fala_no_celular_db': round(rms_db(trc[fala]) - rms_db(vzc[fala]), 2)}
    json.dump(rel, open(os.path.join(SOM, 'mix_relatorio.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    print(json.dumps(rel, ensure_ascii=False, indent=1))


def mux(video, saida):
    m = CFG['master']
    src = os.path.join(ROBOT, 'mix.wav')
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', video, '-i', src, '-map', '0:v', '-map', '1:a', '-c:v', 'copy',
                    '-c:a', 'aac', '-b:a', f"{m['kbps']}k", '-ar', '48000', '-ac', '2', '-shortest', '-movflags', '+faststart', saida], check=True)
    r = subprocess.run(['ffmpeg', '-hide_banner', '-i', saida, '-map', '0:a', '-af', 'ebur128=peak=true', '-f', 'null', '-'],
                       capture_output=True, text=True).stderr
    i = re.findall(r'I:\s+(-?[\d.]+) LUFS', r)[-1]; tp = re.findall(r'Peak:\s+(-?[\d.]+) dBFS', r)[-1]
    print(f'{saida}: {i} LUFS, true peak {tp} dBTP, AAC 48 kHz')


if __name__ == '__main__':
    ap = argparse.ArgumentParser()
    ap.add_argument('--mux', nargs=2, metavar=('VIDEO', 'SAIDA'))
    a = ap.parse_args()
    if a.mux:
        mux(*a.mux)
    else:
        main()
