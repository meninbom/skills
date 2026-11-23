"""Emenda local (ffmpeg/numpy) das frases novas na voz _tight original do lote, nas pausas entre frases.
Gera <video>_v4_t<k>.wav + <video>_v4_t<k>.words.json e mede volume/tom de cada take contra a voz vizinha.
uso: python emendar.py
"""
import json, subprocess, numpy as np, librosa

LOTE = 'voz/'
SR = 48000


def load(p):
    raw = subprocess.check_output(['ffmpeg', '-v', 'error', '-i', p, '-ac', '1', '-ar', str(SR), '-f', 'f32le', '-'])
    return np.frombuffer(raw, np.float32).copy()


def words(p):
    return json.load(open(p, encoding='utf-8'))


def norm(w):
    return ''.join(c for c in w.lower() if c.isalnum())


def idx(ws, palavra, depois=0.0):
    for i, w in enumerate(ws):
        if norm(w['w']).startswith(norm(palavra)) and w['start'] >= depois:
            return i
    raise ValueError(palavra)


def pausa(ws, i):
    """ponto médio da pausa ANTES da palavra i"""
    return (ws[i - 1]['end'] + ws[i]['start']) / 2


def lufs(x):
    import pyloudnorm as pyln
    return pyln.Meter(SR).integrated_loudness(x.astype(np.float64)) if len(x) > SR * 0.5 else float('nan')


def f0(x):
    y = librosa.resample(x, orig_sr=SR, target_sr=16000)
    f, v, _ = librosa.pyin(y, fmin=70, fmax=300, sr=16000)
    f = f[v]
    return float(np.nanmedian(f)) if len(f) else float('nan')


def xfade(a, b, ms=25):
    n = int(SR * ms / 1000)
    r = np.linspace(0, 1, n, dtype=np.float32)
    return np.concatenate([a[:-n], a[-n:] * (1 - r) + b[:n] * r, b[n:]])


def shift(ws, dt, lo=-1e9, hi=1e9):
    return [{'w': w['w'], 'start': round(w['start'] + dt, 3), 'end': round(w['end'] + dt, 3)} for w in ws if lo <= w['start'] < hi]


GAIN = {('panic', 1): -1.0, ('panic', 2): -0.8}
out = {}
for video in ['robot', 'panic', 'sabotage', 'nickname']:
    O = load(LOTE + f'{video}_tight.mp3')
    ow = words(LOTE + f'{video}_tight.words.json')
    out[video] = {}
    for k in (1, 2):
        T = load(f'{video}_t{k}_tight.mp3') * (10 ** (GAIN.get((video, k), 0.0) / 20))
        tw = words(f'{video}_t{k}_tight.words.json')
        if video == 'robot':
            io, it = idx(ow, 'Ou', 37), idx(tw, 'Ou')
            xo, xt = pausa(ow, io), pausa(tw, it)
            y = xfade(O[:int(xo * SR)], T[int(xt * SR):])
            ws = shift(ow, 0, hi=xo) + shift(tw, xo - xt, lo=xt)
            novo, viz = T[int(xt * SR):], O[int((xo - 8) * SR):int(xo * SR)]
        elif video == 'panic':
            # c do item 9: corta 'Isso é mito... fato.' (27,400 -> 31,633, medido pelo agente nas pausas)
            c0, c1 = 27.400, 31.633
            io, it = idx(ow, 'O', 38.8), idx(tw, 'O', 5)
            xo, xt = pausa(ow, io), pausa(tw, it)
            base = xfade(O[:int(c0 * SR)], O[int(c1 * SR):int(xo * SR)])
            xo2 = xo - (c1 - c0)
            y = xfade(base, T[int(xt * SR):])
            ws = shift(ow, 0, hi=c0) + shift(ow, -(c1 - c0), lo=c1, hi=xo) + shift(tw, xo2 - xt, lo=xt)
            novo, viz = T[int(xt * SR):], O[int((xo - 8) * SR):int(xo * SR)]
        elif video == 'sabotage':
            io, it = idx(ow, 'francês', 10.5) - 1, idx(tw, 'francês', 5) - 1
            xo, xt = pausa(ow, io), pausa(tw, it)
            y = xfade(T[:int(xt * SR)], O[int(xo * SR):])
            ws = shift(tw, 0, hi=xt) + shift(ow, xt - xo, lo=xo)
            novo, viz = T[:int(xt * SR)], O[int(xo * SR):int((xo + 8) * SR)]
        else:  # nickname: troca a frase 2 (O eke ... aumento.)
            ia, ib = idx(ow, 'O', 8.3), idx(ow, 'Ou', 13)
            ta = idx(tw, 'O', 5)
            xa, xb = pausa(ow, ia), pausa(ow, ib)
            xt0 = pausa(tw, ta)
            xt1 = min(tw[-1]['end'] + 0.12, len(T) / SR)
            seg = T[int(xt0 * SR):int(xt1 * SR)]
            y = xfade(xfade(O[:int(xa * SR)], seg), O[int(xb * SR):])
            d = (xt1 - xt0) - (xb - xa)
            ws = shift(ow, 0, hi=xa) + shift(tw, xa - xt0, lo=xt0) + shift(ow, d, lo=xb)
            novo, viz = seg, np.concatenate([O[int((xa - 6) * SR):int(xa * SR)], O[int(xb * SR):int((xb + 4) * SR)]])
        trocado = {'robot': O[int(xo * SR):] if video == 'robot' else None}.get(video)
        if video == 'panic': trocado = O[int(xo * SR):]
        if video == 'sabotage': trocado = O[:int(xo * SR)]
        if video == 'nickname': trocado = O[int(xa * SR):int(xb * SR)]
        nome = f'{video}_v4_t{k}'
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 'f32le', '-ar', str(SR), '-ac', '1', '-i', '-', '-c:a', 'pcm_s24le', nome + '.wav'],
                       input=y.astype(np.float32).tobytes(), check=True)
        json.dump(ws, open(nome + '.words.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
        m = {'dur': round(len(y) / SR, 2), 'dur_orig': round(len(O) / SR, 2), 'lufs_novo': round(lufs(novo), 1), 'lufs_viz': round(lufs(viz), 1),
             'f0_novo': round(f0(novo), 1), 'f0_viz': round(f0(viz), 1), 'dur_novo': round(len(novo) / SR, 2), 'f0_trocado': round(f0(trocado), 1), 'lufs_trocado': round(lufs(trocado), 1)}
        out[video][k] = m
        print(video, k, m, flush=True)
json.dump(out, open('emendas_medidas.json', 'w'), indent=1)
