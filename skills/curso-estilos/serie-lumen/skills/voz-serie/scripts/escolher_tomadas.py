"""Escolhe a melhor tomada (A, B…) de cada fala do episódio. Grátis: STT local (faster-whisper, CPU, int8).

Critério: 1) a que bate mais com o texto do falas.tsv (palavra por palavra);
          2) empate (até 4 pontos de diferença): a mais curta (menos arrastada).
Grava <ep>/voz/escolha.json {id: "A"} e <ep>/voz/tomadas.md (tabela + a lista OUVIR).

O STT NÃO pega pronúncia errada: ele "corrige" pra palavra provável. Por isso a lista OUVIR traz as falas em que
ele tropeçou (menos de 90% de acerto). Ouça essas antes de montar. Trocou de tomada depois de ouvir? Edite o
escolha.json à mão e não rode este script de novo (ele reescreve o arquivo).

uso: python escolher_tomadas.py <pasta do ep> [--modelo small]
"""
import os, re, sys, json, subprocess, unicodedata
from difflib import SequenceMatcher

for _s in (sys.stdout, sys.stderr):   # acento certo no Git Bash (sem isso o Windows usa cp1252 no pipe)
    try:
        _s.reconfigure(encoding='utf-8')
    except Exception:
        pass
AQUI = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, AQUI)
import kitcfg  # noqa: E402

SR = 16000
NUM = {'zero': '0', 'um': '1', 'uma': '1', 'dois': '2', 'duas': '2', 'tres': '3', 'quatro': '4', 'cinco': '5', 'seis': '6',
       'sete': '7', 'oito': '8', 'nove': '9', 'dez': '10', 'onze': '11', 'doze': '12', 'treze': '13', 'quatorze': '14',
       'catorze': '14', 'quinze': '15', 'dezesseis': '16', 'dezessete': '17', 'dezoito': '18', 'dezenove': '19', 'vinte': '20',
       'trinta': '30', 'quarenta': '40', 'cinquenta': '50', 'cem': '100', 'mil': '1000'}


def norm(s):
    s = unicodedata.normalize('NFKD', s.lower()).encode('ascii', 'ignore').decode()
    return [NUM.get(w, w) for w in re.sub(r'[^a-z0-9 ]', ' ', s).split() if w]


def falas(tsv):
    out = {}
    for ln in open(tsv, encoding='utf-8-sig'):
        p = ln.rstrip('\r\n').split('\t')
        if len(p) < 4 or ln.lstrip().startswith('#') or p[1].strip().upper() == 'PAUSA':
            continue
        out[p[0].strip()] = re.sub(r'\[[^\]]*\]\s*', '', '\t'.join(p[3:])).strip()
    return out


def pcm(ff, arq):
    import numpy as np
    return np.frombuffer(subprocess.check_output([ff, '-nostdin', '-v', 'error', '-i', arq, '-f', 'f32le', '-ac', '1', '-ar', str(SR), '-']),
                         np.float32)


def main():
    args = [a for a in sys.argv[1:] if not a.startswith('--')]
    if not args:
        raise SystemExit(__doc__)
    ep = args[0]
    modelo = sys.argv[sys.argv.index('--modelo') + 1] if '--modelo' in sys.argv else 'small'
    V = os.path.join(ep, 'voz'); P = os.path.join(V, 'pecas')
    tsv = os.path.join(V, 'falas.tsv')
    if not os.path.isfile(tsv):
        raise SystemExit(f'PAREI: não achei {tsv}')
    ff = kitcfg.get('ferramentas.ffmpeg', 'ffmpeg')
    try:
        from faster_whisper import WhisperModel
    except ImportError:
        raise SystemExit('PAREI: falta o faster-whisper. Instale com: pip install faster-whisper')
    TXT = falas(tsv)
    m = WhisperModel(modelo, device='cpu', compute_type='int8')   # cpu sempre: em cuda ele trava em alguns PCs
    esc, ouvir = {}, []
    linhas = ['| fala | tomada | casa c/ texto | dur | ouvido (STT) |', '|---|---|---|---|---|']
    for fid, txt in TXT.items():
        cands = []
        for tk in 'ABCD':
            f = os.path.join(P, f'{fid}_{tk}_-16.wav')
            if not os.path.exists(f):
                continue
            a = pcm(ff, f)
            segs, _ = m.transcribe(a, language='pt', beam_size=5, vad_filter=False)
            ouv = ' '.join(s.text.strip() for s in segs).strip()
            r = SequenceMatcher(None, norm(txt), norm(ouv)).ratio() if norm(txt) else 0.0
            dur = len(a) / SR
            cands.append((tk, r, dur, ouv))
            linhas.append(f'| {fid} | {tk} | {r:.0%} | {dur:.2f}s | {ouv or "(nada)"} |')
        if not cands:
            print(f'{fid}: nenhuma tomada em {P} (rode o gerar_vozes.sh)')
            continue
        melhor = max(c[1] for c in cands)
        ok = [c for c in cands if c[1] >= melhor - 0.04]
        tk, r, dur, ouv = min(ok, key=lambda c: c[2])
        esc[fid] = tk
        if r < 0.9:
            ouvir.append(f'- **{fid}_{tk}** ({r:.0%}): texto "{txt}" / STT ouviu "{ouv or "(nada)"}"')
        print(f'{fid}: {tk} ({r:.0%}, {dur:.2f}s)')
    with open(os.path.join(V, 'escolha.json'), 'w', encoding='utf-8') as f:
        json.dump(esc, f, ensure_ascii=False, indent=1)
    md = linhas + ['', 'escolha: ' + json.dumps(esc, ensure_ascii=False), '',
                   '## OUVIR (o STT tropeçou; pronúncia errada ele não pega)'] + (ouvir or ['- nenhuma'])
    with open(os.path.join(V, 'tomadas.md'), 'w', encoding='utf-8') as f:
        f.write('\n'.join(md) + '\n')
    print(f'escolha.json: {len(esc)} fala(s). OUVIR: {len(ouvir)} (lista em {os.path.join(V, "tomadas.md")})')


if __name__ == '__main__':
    main()
