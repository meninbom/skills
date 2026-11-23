"""Tempo de cada palavra das tomadas escolhidas. Grátis: STT local (faster-whisper, CPU, int8).

Corta o silêncio da ponta (60 ms antes do 1º som, 150 ms depois do último), então os tempos valem dentro do
pedaço aparado. Quem monta usa o mesmo corte: começa a fala em <id>_ini e dura <id>_dur.

lê <ep>/voz/escolha.json e <ep>/voz/pecas/<id>_<T>_-16.wav
grava <ep>/voz/palavras.json:
  {"N1": [["palavra", ini, fim], ...], "N1_ini": 0.31, "N1_dur": 2.84, ...}   (segundos)

uso: python palavras.py <pasta do ep> [--modelo small]
"""
import os, sys, json, subprocess

for _s in (sys.stdout, sys.stderr):   # acento certo no Git Bash (sem isso o Windows usa cp1252 no pipe)
    try:
        _s.reconfigure(encoding='utf-8')
    except Exception:
        pass
AQUI = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, AQUI)
import kitcfg  # noqa: E402

SR = 16000


def main():
    args = [a for a in sys.argv[1:] if not a.startswith('--')]
    if not args:
        raise SystemExit(__doc__)
    ep = args[0]
    modelo = sys.argv[sys.argv.index('--modelo') + 1] if '--modelo' in sys.argv else 'small'
    V = os.path.join(ep, 'voz'); P = os.path.join(V, 'pecas')
    arq = os.path.join(V, 'escolha.json')
    if not os.path.isfile(arq):
        raise SystemExit(f'PAREI: não achei {arq} (rode o escolher_tomadas.py antes)')
    ESC = json.load(open(arq, encoding='utf-8'))
    ff = kitcfg.get('ferramentas.ffmpeg', 'ffmpeg')
    try:
        import numpy as np
        from faster_whisper import WhisperModel
    except ImportError:
        raise SystemExit('PAREI: falta o faster-whisper. Instale com: pip install faster-whisper')
    m = WhisperModel(modelo, device='cpu', compute_type='int8')
    out = {}
    for fid, tk in ESC.items():
        f = os.path.join(P, f'{fid}_{tk}_-16.wav')
        if not os.path.exists(f):
            print(f'{fid}: falta {f}, pulo'); continue
        a = np.frombuffer(subprocess.check_output([ff, '-nostdin', '-v', 'error', '-i', f, '-f', 'f32le', '-ac', '1', '-ar', str(SR), '-']),
                          np.float32).copy()
        ini = 0
        if len(a):
            env = np.convolve(np.abs(a), np.ones(80) / 80, 'same')
            on = np.flatnonzero(env > env.max() * 0.003) if env.max() > 0 else []
            if len(on):
                ini = max(0, on[0] - int(0.06 * SR))
                a = a[ini: min(len(a), on[-1] + int(0.15 * SR))]
        segs, _ = m.transcribe(a, language='pt', beam_size=5, word_timestamps=True)
        out[fid] = [[w.word.strip(), round(w.start, 2), round(w.end, 2)] for s in segs for w in (s.words or [])]
        out[fid + '_ini'] = round(ini / SR, 3)
        out[fid + '_dur'] = round(len(a) / SR, 2)
        print(fid, tk, out[fid + '_dur'], ' '.join(f'{w}@{t0:.2f}' for w, t0, _ in out[fid]) or '(nada)')
    with open(os.path.join(V, 'palavras.json'), 'w', encoding='utf-8') as fh:
        json.dump(out, fh, ensure_ascii=False, indent=0)
    print(f'palavras.json: {sum(1 for k in out if not k.endswith(("_ini", "_dur")))} fala(s)')


if __name__ == '__main__':
    main()
