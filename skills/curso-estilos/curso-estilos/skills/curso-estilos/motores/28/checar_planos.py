"""Checagem POR PLANO. Só conta medida feita por programa; "o modelo achou bom" não é checagem.

Para cada segmento da linha (plano X de t a t+dur) mede:
  1. fala × roteiro: as palavras do roteiro que caem no trecho (linha['palavras'], tiradas do alinhamento da voz) contra
     o STT do áudio FINAL no mesmo trecho (faster-whisper, com tempo por palavra). Reprova abaixo de --limiar-fala (0,95).
     Só roda se o vídeo tem áudio, a linha tem palavras e o faster-whisper está instalado.
  2. texto/cartão na faixa da UI (15% de baixo) ou na borda: OCR da skill checar-video. Só reprova se o segmento tem
     sobreposição nossa (cartoes/continua/selo/monitor); texto que é da própria cena vira aviso.
     Só roda se algum segmento tem sobreposição nossa (ou com --texto) e se a skill checar-video for achada
     (env CHECAR_VIDEO = caminho do checar.py, a pasta irmã do pacote, ou a skill instalada no Claude Code).
  3. quadro parado acima do limite (1,5 s): medida própria, à prova de grão.
  4. volume do trecho (LUFS integrado do pedaço): com fala, entre -20 e -9; sem fala, entre -32 e -9. Trecho < 1,2 s não mede.
Saída: <saida>/veredito.json (por plano: APROVADO/REPROVADO + motivos com PROVA).
uso: python checar_planos.py --linha linha.json --video final.mp4 --saida pasta [--limiar-fala 0.95] [--sem-stt]
"""
import os, sys, json, re, argparse, subprocess, unicodedata, difflib

AQUI = os.path.dirname(os.path.abspath(__file__))
SOBREPOE = ('cartoes', 'continua', 'selo', 'monitor')


def acha_checar():
    """checar.py da skill irmã checar-video (opcional). Devolve (script, preset) ou (None, None)."""
    cands = [os.environ.get('CHECAR_VIDEO'),
             os.path.join(AQUI, '..', '..', '..', 'checar-video', 'scripts', 'checar.py'),          # dentro do pacote
             os.path.join(os.path.expanduser('~'), '.claude', 'skills', 'checar-video', 'scripts', 'checar.py')]
    for c in cands:
        if c and os.path.exists(c):
            c = os.path.abspath(c); return c, os.path.join(os.path.dirname(os.path.dirname(c)), 'presets', 'generico.json')
    return None, None


def norm(w):
    w = unicodedata.normalize('NFD', w.lower())
    return re.sub(r'[^a-z0-9]', '', ''.join(c for c in w if unicodedata.category(c) != 'Mn'))


def parecido(a, b):
    return a == b or (len(a) > 2 and difflib.SequenceMatcher(None, a, b).ratio() >= 0.75)


def sonda(video):
    j = json.loads(subprocess.check_output(['ffprobe', '-v', 'error', '-show_entries', 'stream=codec_type,width,height', '-of', 'json', video]))
    v = next(s for s in j['streams'] if s['codec_type'] == 'video')
    return v['width'], v['height'], any(s['codec_type'] == 'audio' for s in j['streams'])


def lufs_trecho(video, t0, dur):
    r = subprocess.run(['ffmpeg', '-hide_banner', '-ss', f'{t0:.3f}', '-t', f'{dur:.3f}', '-i', video, '-vn', '-af', 'ebur128', '-f', 'null', '-'],
                       capture_output=True, text=True).stderr
    m = re.findall(r'I:\s+(-?[\d.]+) LUFS', r)
    return float(m[-1]) if m else None


def mudanca(video, janela=1.0, w=54, h=96):
    """parado à prova de grão: média de 3 quadros (apaga o grão, que muda a cada quadro) e compara com `janela` s depois, numa imagem
    bem pequena, a 10 qps. Calibrado com janela de 1 s num episódio real: plano congelado = 0,42; plano real mais lento = 1,5+.
    d[k] cobre ~k/10 .. k/10+janela s."""
    import numpy as np
    J = max(1, int(round(janela * 10)))
    p = subprocess.Popen(['ffmpeg', '-v', 'error', '-i', video, '-vf', f'fps=10,scale={w}:{h}:flags=area', '-f', 'rawvideo', '-pix_fmt', 'gray', '-'], stdout=subprocess.PIPE)
    fr = []
    while True:
        b = p.stdout.read(w * h)
        if len(b) < w * h: break
        fr.append(np.frombuffer(b, np.uint8).astype(np.float32))
    fr = np.array(fr); sm = (fr[:-2] + fr[1:-1] + fr[2:]) / 3
    return np.mean(np.abs(sm[J:] - sm[:-J]), axis=1), J


def stt_palavras(video):
    import numpy as np
    from faster_whisper import WhisperModel
    aud = np.frombuffer(subprocess.check_output(['ffmpeg', '-v', 'error', '-i', video, '-vn', '-ac', '1', '-ar', '16000', '-f', 'f32le', '-']), np.float32)
    m = WhisperModel('small', device='cpu', compute_type='int8')
    segs, _ = m.transcribe(aud, language=os.environ.get('CICLO_IDIOMA', 'pt'), word_timestamps=True, vad_filter=False)
    out = []
    for s in segs:
        for w in (s.words or []): out.append((w.start, w.end, norm(w.word)))
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--linha'); ap.add_argument('--video'); ap.add_argument('--saida')
    ap.add_argument('--limiar-fala', type=float, default=0.95); ap.add_argument('--sem-stt', action='store_true')
    ap.add_argument('--max-parado', type=float, default=1.5); ap.add_argument('--limiar-parado', type=float, default=1.0)
    ap.add_argument('--janela-parado', type=float, default=1.0)
    ap.add_argument('--texto', action='store_true', help='roda o OCR mesmo sem sobreposição nossa (texto da cena vira aviso)')
    a = ap.parse_args()
    os.makedirs(a.saida, exist_ok=True)
    L = json.load(open(a.linha, encoding='utf-8')); S = L['segmentos']; PAL = L.get('palavras', [])
    W_, H_, tem_audio = sonda(a.video); notas = []
    # 1 rodada da skill checar-video no vídeo inteiro (OCR, movimento, áudio) -> eventos com tempo. Opcional.
    qa = {'quadros': {}, 'movimento': {}, 'audio': {}}
    tem_nosso = any(k in s for s in S for k in SOBREPOE)      # sem sobreposição nossa não há o que reprovar por texto: pula o OCR (é a parte lenta)
    script, preset = acha_checar() if (tem_nosso or a.texto) else (None, None)
    if not (tem_nosso or a.texto): pass
    elif script:
        qa_dir = os.path.join(a.saida, 'qa_inteiro')
        subprocess.run([sys.executable, script, a.video, '--config', preset, '--sem-stt', '--out', qa_dir], capture_output=True)
        try: qa = json.load(open(os.path.join(qa_dir, 'qa.json'), encoding='utf-8'))
        except Exception: notas.append('a skill checar-video falhou: sem checagem de texto na UI/borda')
    else:
        notas.append('skill checar-video não achada: sem checagem de texto na UI/borda (defina CHECAR_VIDEO)')
    stt = []; faz_stt = tem_audio and PAL and not a.sem_stt
    if faz_stt:
        try: stt = stt_palavras(a.video)
        except ImportError: faz_stt = False; notas.append('faster-whisper não instalado: sem checagem de fala')
    if not tem_audio: notas.append('vídeo sem áudio: sem checagem de fala e de volume')
    MUD, J = mudanca(a.video, a.janela_parado)
    planos = []
    for i, s in enumerate(S):
        t0, t1 = s['t'], s['t'] + s['dur']; motivos, avisos = [], []
        # 1) fala do plano
        esp = [norm(w) for t, w in PAL if t0 <= t < t1 and norm(w)]
        if esp and faz_stt:
            ouv = [w for (ws, we, w) in stt if ws < t1 + 0.4 and we > t0 - 0.4]
            usados, ok = set(), 0
            for w in esp:
                j = next((k for k, x in enumerate(ouv) if k not in usados and parecido(w, x)), None)
                if j is not None: usados.add(j); ok += 1
            taxa = ok / len(esp)
            if taxa < a.limiar_fala:
                faltam = list(esp)
                for w in ouv:
                    k = next((n for n, x in enumerate(faltam) if parecido(x, w)), None)
                    if k is not None: faltam.pop(k)
                motivos.append(dict(tipo='fala', medida=round(taxa, 3), limite=a.limiar_fala, faltaram=faltam[:8],
                                    prova=f'{ok}/{len(esp)} palavras do roteiro ouvidas no STT entre {t0:.2f}–{t1:.2f} s'))
        # 2) texto na UI / borda
        nosso = any(k in s for k in SOBREPOE)
        for chave, nome in (('texto_na_zona_ui', 'texto_zona_ui'), ('texto_na_borda', 'texto_borda')):
            for it in qa.get('quadros', {}).get(chave, []):
                if t0 <= it['t'] < t1:
                    item = dict(tipo=nome, prova=f"OCR em {it['t']} s: '{it['texto'][:30]}' caixa {it['caixa']} (faixa da UI começa em y={int(H_ * 0.85)})")
                    (motivos if nosso else avisos).append(item)
        # 3) parado (medida própria, à prova de grão) + a da skill checar-video
        if not s.get('parado_ok'):
            k0, k1 = int(round(t0 * 10)), max(int(round(t0 * 10)), int(round(t1 * 10)) - J); run, pior = 0, 0
            for k in range(k0, min(k1, len(MUD))):
                run = run + 1 if MUD[k] < a.limiar_parado else 0; pior = max(pior, run)
            seg_parado = pior / 10 + a.janela_parado
            if pior and seg_parado > a.max_parado:
                motivos.append(dict(tipo='parado', medida=round(seg_parado, 2), limite=a.max_parado,
                                    prova=f'mudança em {a.janela_parado:g} s abaixo de {a.limiar_parado} por {seg_parado:.1f} s seguidos dentro de {t0:.2f}–{t1:.2f} s (mín. {float(MUD[k0:max(k0 + 1, min(k1, len(MUD)))].min()):.2f})'))
        for p0, p1 in qa.get('movimento', {}).get('trechos_parados_longos', []):
            sob = min(p1, t1) - max(p0, t0)
            if sob > 0.3 and (p1 - p0) > a.max_parado and not s.get('parado_ok') and not any(m['tipo'] == 'parado' for m in motivos):
                motivos.append(dict(tipo='parado', medida=round(p1 - p0, 2), limite=a.max_parado, prova=f'trecho parado {p0}–{p1} s ({p1 - p0:.2f} s)'))
        # 4) volume do trecho
        if tem_audio and s['dur'] >= 1.2:
            lu = lufs_trecho(a.video, t0, s['dur']); lo = -20 if esp else -32
            if lu is not None and not (lo <= lu <= -9):
                motivos.append(dict(tipo='volume', medida=lu, limite=[lo, -9], prova=f'LUFS integrado do trecho {t0:.2f}–{t1:.2f} s = {lu}'))
        planos.append(dict(i=i, plano=s['plano'], t=round(t0, 3), dur=round(s['dur'], 3),
                           veredito='REPROVADO' if motivos else 'APROVADO', motivos=motivos, avisos=avisos))
    json.dump(dict(video=os.path.basename(a.video), notas=notas, planos=planos, audio=qa.get('audio', {})),
              open(os.path.join(a.saida, 'veredito.json'), 'w', encoding='utf-8'), indent=1, ensure_ascii=False)
    rep = [p for p in planos if p['veredito'] == 'REPROVADO']
    print(f'{len(planos)} planos, {len(rep)} reprovados:', ', '.join(f"#{p['i']} {p['plano']} ({'/'.join(m['tipo'] for m in p['motivos'])})" for p in rep) or 'nenhum')
    for n in notas: print('  nota:', n)


if __name__ == '__main__':
    main()
