"""Checagem POR PLANO (ciclo loop + grafo). Só conta medida feita por programa; "o modelo achou bom" não é checagem.

Para cada segmento da linha (plano X de t a t+dur) mede:
  1. fala × roteiro: as palavras do roteiro que caem no trecho (linha['palavras'], tiradas do alinhamento da voz) contra
     o STT do áudio FINAL no mesmo trecho (faster-whisper, com tempo por palavra). Reprova abaixo de --limiar-fala (0,95).
     Sem o faster-whisper instalado, esta medida é pulada com aviso.
  2. texto/cartão na faixa da UI (15% de baixo) ou na borda: OCR da skill checar-video do pacote (aponte CHECAR_VIDEO_DIR pra pasta dela;
     sem ela, esta medida é pulada com aviso). Só reprova se o segmento tem
     sobreposição nossa (cartoes/continua/selo); texto que é da própria cena vira aviso.
  3. quadro parado acima do limite (1,5 s): trechos parados do /checar-video que caem no segmento.
  4. volume do trecho (LUFS integrado do pedaço): com fala, entre -20 e -9; sem fala, entre -32 e -9. Trecho < 1,2 s não mede.
Saída: <saida>/veredito.json (por plano: APROVADO/REPROVADO + motivos com PROVA).
uso: python checar_planos.py --linha linha.json --video final.mp4 --saida pasta [--limiar-fala 0.95] [--sem-stt]
"""
import os, sys, json, re, argparse, subprocess, unicodedata, difflib

_cv = os.environ.get('CHECAR_VIDEO_DIR') or os.path.expanduser('~/.claude/skills/checar-video')
CHECAR = os.path.join(_cv, 'scripts', 'checar.py'); PRESET = os.path.join(_cv, 'presets', 'generico.json')
SOBREPOE = ('cartoes', 'continua', 'selo', 'monitor')


def norm(w):
    w = unicodedata.normalize('NFD', w.lower())
    return re.sub(r'[^a-z0-9]', '', ''.join(c for c in w if unicodedata.category(c) != 'Mn'))


def parecido(a, b):
    return a == b or (len(a) > 2 and difflib.SequenceMatcher(None, a, b).ratio() >= 0.75)


def lufs_trecho(video, t0, dur):
    r = subprocess.run(['ffmpeg', '-hide_banner', '-ss', f'{t0:.3f}', '-t', f'{dur:.3f}', '-i', video, '-vn', '-af', 'ebur128', '-f', 'null', '-'],
                       capture_output=True, text=True).stderr
    m = re.findall(r'I:\s+(-?[\d.]+) LUFS', r)
    return float(m[-1]) if m else None


def mudanca_1s(video, w=54, h=96):
    """parado à prova de grão: média de 3 quadros (apaga o grão, que muda a cada quadro) e compara com 1 s depois, numa imagem
    bem pequena. Calibrado no ep6 do LUMEN: plano congelado = 0,42; plano real mais lento = 1,5+. d[k] cobre ~k/10 .. k/10+1 s."""
    import numpy as np
    p = subprocess.Popen(['ffmpeg', '-v', 'error', '-i', video, '-vf', f'fps=10,scale={w}:{h}:flags=area', '-f', 'rawvideo', '-pix_fmt', 'gray', '-'], stdout=subprocess.PIPE)
    fr = []
    while True:
        b = p.stdout.read(w * h)
        if len(b) < w * h: break
        fr.append(np.frombuffer(b, np.uint8).astype(np.float32))
    fr = np.array(fr); sm = (fr[:-2] + fr[1:-1] + fr[2:]) / 3
    return np.mean(np.abs(sm[10:] - sm[:-10]), axis=1)


def stt_palavras(video):
    import numpy as np
    try: from faster_whisper import WhisperModel
    except ImportError: print('aviso: faster-whisper não instalado; fala x roteiro não foi medida'); return None
    aud = np.frombuffer(subprocess.check_output(['ffmpeg', '-v', 'error', '-i', video, '-vn', '-ac', '1', '-ar', '16000', '-f', 'f32le', '-']), np.float32)
    m = WhisperModel('small', device='cpu', compute_type='int8')
    segs, _ = m.transcribe(aud, language='pt', word_timestamps=True, vad_filter=False)
    out = []
    for s in segs:
        for w in (s.words or []): out.append((w.start, w.end, norm(w.word)))
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--linha'); ap.add_argument('--video'); ap.add_argument('--saida')
    ap.add_argument('--limiar-fala', type=float, default=0.95); ap.add_argument('--sem-stt', action='store_true')
    ap.add_argument('--max-parado', type=float, default=1.5); ap.add_argument('--limiar-parado', type=float, default=1.0)
    a = ap.parse_args()
    os.makedirs(a.saida, exist_ok=True)
    L = json.load(open(a.linha, encoding='utf-8')); S = L['segmentos']; PAL = L.get('palavras', [])
    # 1 rodada da checar-video no vídeo inteiro (OCR, movimento, áudio) -> eventos com tempo
    qa_dir = os.path.join(a.saida, 'qa_inteiro'); qa = {'quadros': {}, 'movimento': {}, 'audio': {}}
    if os.path.exists(CHECAR):
        subprocess.run([sys.executable, CHECAR, a.video, '--config', PRESET, '--sem-stt', '--out', qa_dir], capture_output=True)
        if os.path.exists(os.path.join(qa_dir, 'qa.json')): qa = json.load(open(os.path.join(qa_dir, 'qa.json'), encoding='utf-8'))
        else: print('aviso: a checar-video não gravou qa.json; texto na UI/borda não foi medido')
    else: print('aviso: skill checar-video não encontrada (CHECAR_VIDEO_DIR); texto na UI/borda não foi medido')
    H_ = int(subprocess.check_output(['ffprobe', '-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=height', '-of', 'csv=p=0', a.video]).split()[0])
    stt = None if a.sem_stt else stt_palavras(a.video)
    if stt is None: a.sem_stt = True; stt = []
    MUD = mudanca_1s(a.video)
    planos = []
    for i, s in enumerate(S):
        t0, t1 = s['t'], s['t'] + s['dur']; motivos, avisos = [], []
        # 1) fala do plano
        esp = [norm(w) for t, w in PAL if t0 <= t < t1 and norm(w)]
        if esp and not a.sem_stt:
            ouv = [w for (ws, we, w) in stt if ws < t1 + 0.4 and we > t0 - 0.4]
            usados, ok = set(), 0
            for w in esp:
                j = next((k for k, x in enumerate(ouv) if k not in usados and parecido(w, x)), None)
                if j is not None: usados.add(j); ok += 1
            taxa = ok / len(esp)
            item = dict(tipo='fala', medida=round(taxa, 3), limite=a.limiar_fala, prova=f'{ok}/{len(esp)} palavras do roteiro ouvidas no STT entre {t0:.2f}–{t1:.2f} s',
                        faltaram=[w for w in esp][:0])
            if taxa < a.limiar_fala:
                faltam = list(esp)
                for w in ouv:
                    k = next((n for n, x in enumerate(faltam) if parecido(x, w)), None)
                    if k is not None: faltam.pop(k)
                item['faltaram'] = faltam[:8]; motivos.append(item)
        # 2) texto na UI / borda
        nosso = any(k in s for k in SOBREPOE)
        for chave, nome in (('texto_na_zona_ui', 'texto_zona_ui'), ('texto_na_borda', 'texto_borda')):
            for it in qa.get('quadros', {}).get(chave, []):
                if t0 <= it['t'] < t1:
                    item = dict(tipo=nome, prova=f"OCR em {it['t']} s: '{it['texto'][:30]}' caixa {it['caixa']} (faixa da UI começa em y={int(H_ * 0.85)})")
                    (motivos if nosso else avisos).append(item)
        # 3) parado (medida própria, à prova de grão) + a da checar-video
        if not s.get('parado_ok'):
            k0, k1 = int(t0 * 10), max(int(t0 * 10), int(t1 * 10) - 10); run, pior = 0, 0
            for k in range(k0, min(k1, len(MUD))):
                run = run + 1 if MUD[k] < a.limiar_parado else 0; pior = max(pior, run)
            if pior and pior / 10 + 1.0 > a.max_parado:
                motivos.append(dict(tipo='parado', medida=round(pior / 10 + 1.0, 2), limite=a.max_parado,
                                    prova=f'mudança em 1 s abaixo de {a.limiar_parado} por {pior / 10 + 1.0:.1f} s seguidos dentro de {t0:.2f}–{t1:.2f} s (mín. {float(MUD[k0:max(k0 + 1, min(k1, len(MUD)))].min()):.2f})'))
        for p0, p1 in qa.get('movimento', {}).get('trechos_parados_longos', []):
            sob = min(p1, t1) - max(p0, t0)
            if sob > 0.3 and (p1 - p0) > a.max_parado and not any(m['tipo'] == 'parado' for m in motivos):
                motivos.append(dict(tipo='parado', medida=round(p1 - p0, 2), limite=a.max_parado, prova=f'trecho parado {p0}–{p1} s ({p1 - p0:.2f} s)'))
        # 4) volume do trecho
        if s['dur'] >= 1.2:
            lu = lufs_trecho(a.video, t0, s['dur']); lo = -20 if esp else -32
            if lu is not None and not (lo <= lu <= -9):
                motivos.append(dict(tipo='volume', medida=lu, limite=[lo, -9], prova=f'LUFS integrado do trecho {t0:.2f}–{t1:.2f} s = {lu}'))
        planos.append(dict(i=i, plano=s['plano'], t=round(t0, 3), dur=round(s['dur'], 3),
                           veredito='REPROVADO' if motivos else 'APROVADO', motivos=motivos, avisos=avisos))
    json.dump(dict(video=a.video, planos=planos, audio=qa.get('audio', {})), open(os.path.join(a.saida, 'veredito.json'), 'w', encoding='utf-8'), indent=1, ensure_ascii=False)
    rep = [p for p in planos if p['veredito'] == 'REPROVADO']
    print(f'{len(planos)} planos, {len(rep)} reprovados:', ', '.join(f"#{p['i']} {p['plano']} ({'/'.join(m['tipo'] for m in p['motivos'])})" for p in rep) or 'nenhum')


if __name__ == '__main__':
    main()
