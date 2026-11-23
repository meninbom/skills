"""checar_planos: checagem POR PLANO do vídeo final. Só conta medida feita por programa; "o modelo achou bom" não é checagem.

Para cada segmento da linha (plano X de t a t+dur) mede:
  1. fala × roteiro: as palavras que caem no trecho (linha["palavras"]) contra o STT do áudio FINAL no mesmo trecho
     (faster-whisper na CPU, int8). Reprova abaixo de --limiar-fala (0,95). --sem-stt pula.
  2. texto na faixa da UI (15% de baixo) ou na borda: OCR da skill checar-video. Só reprova se o segmento tem
     texto posto pelo ciclo (cartoes/selo/aviso/raiox); texto que é da própria imagem vira aviso.
  3. trecho parado acima de 1,5 s (medida própria, à prova de grão) + os parados da checar-video.
  4. volume do trecho (LUFS do pedaço): com fala, entre -20 e -9; sem fala, entre -32 e -9. Trecho < 1,2 s não mede.
Saída: <saida>/veredito.json (por plano: APROVADO/REPROVADO + motivos com PROVA).
uso: python checar_planos.py --linha linha.json --video final.mp4 --saida pasta [--limiar-fala 0.95] [--sem-stt] [--lingua pt]
O checar.py vem de checar_video.script no kit.config.json; se vazio, da skill checar-video instalada ao lado desta.
"""
import sys as _sys_utf8
for _s in (_sys_utf8.stdout, _sys_utf8.stderr):   # acento certo no terminal do Windows, inclusive nas mensagens de erro
    try: _s.reconfigure(encoding='utf-8')
    except Exception: pass
import os, sys, json, re, argparse, subprocess, unicodedata, difflib

AQUI = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, AQUI)
import kitcfg  # noqa: E402

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
FF = kitcfg.get('ferramentas.ffmpeg', 'ffmpeg')
SOBREPOE = ('cartoes', 'selo', 'aviso', 'raiox')
PRESET_PADRAO = {"paleta": None, "tem_fotos": True, "ignorar_faixas": [[0.0, 0.06]], "zona_ui_baixo": 0.15}


def acha_checar():
    p = kitcfg.get('checar_video.script')
    if p and not os.path.isfile(p):
        raise SystemExit(f'checar_planos: checar_video.script aponta pra "{p}", que não existe.')
    p = kitcfg.acha_checar_video()
    if p: return p
    raise SystemExit('checar_planos: não achei a skill checar-video. Ela vem no plugin curso-estilos: instale com '
                     '/plugin install curso-estilos@doti-cursos, ou ponha o caminho do checar.py em checar_video.script no kit.config.json.')


def acha_preset(checar, saida):
    d = os.path.dirname(checar)
    for c in (os.path.join(d, '..', 'presets', 'generico.json'), os.path.join(d, 'presets', 'generico.json'), os.path.join(d, 'generico.json')):
        if os.path.isfile(c): return os.path.abspath(c)
    p = os.path.join(saida, 'preset_generico.json')
    json.dump(PRESET_PADRAO, open(p, 'w', encoding='utf-8'), indent=1)
    return p


def norm(w):
    w = unicodedata.normalize('NFD', str(w).lower())
    return re.sub(r'[^a-z0-9]', '', ''.join(c for c in w if unicodedata.category(c) != 'Mn'))


def parecido(a, b):
    return a == b or (len(a) > 2 and difflib.SequenceMatcher(None, a, b).ratio() >= 0.75)


def lufs_trecho(video, t0, dur):
    r = subprocess.run([FF, '-hide_banner', '-ss', f'{t0:.3f}', '-t', f'{dur:.3f}', '-i', video, '-vn', '-af', 'ebur128', '-f', 'null', '-'],
                       capture_output=True, text=True, encoding='utf-8', errors='replace').stderr
    m = re.findall(r'I:\s+(-?[\d.]+) LUFS', r)
    return float(m[-1]) if m else None


def mudanca_1s(video, w=54, h=96):
    """parado à prova de grão: média de 3 quadros (apaga o grão, que muda a cada quadro) comparada com 1 s depois, numa imagem
    bem pequena. Plano congelado ~0,4; plano vivo mais lento ~1,5+. d[k] cobre ~k/10 .. k/10+1 s."""
    import numpy as np
    p = subprocess.Popen([FF, '-v', 'error', '-i', video, '-vf', f'fps=10,scale={w}:{h}:flags=area', '-f', 'rawvideo', '-pix_fmt', 'gray', '-'],
                         stdout=subprocess.PIPE)
    fr = []
    while True:
        b = p.stdout.read(w * h)
        if len(b) < w * h: break
        fr.append(np.frombuffer(b, np.uint8).astype(np.float32))
    p.wait()
    fr = np.array(fr); sm = (fr[:-2] + fr[1:-1] + fr[2:]) / 3
    return np.mean(np.abs(sm[10:] - sm[:-10]), axis=1)


def stt_palavras(video, lingua):
    import numpy as np
    from faster_whisper import WhisperModel
    aud = np.frombuffer(subprocess.check_output([FF, '-v', 'error', '-i', video, '-vn', '-ac', '1', '-ar', '16000', '-f', 'f32le', '-']), np.float32)
    m = WhisperModel('small', device='cpu', compute_type='int8')
    segs, _ = m.transcribe(aud, language=lingua, word_timestamps=True, vad_filter=False)
    return [(w.start, w.end, norm(w.word)) for s in segs for w in (s.words or [])]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--linha', required=True); ap.add_argument('--video', required=True); ap.add_argument('--saida', required=True)
    ap.add_argument('--limiar-fala', type=float, default=0.95); ap.add_argument('--sem-stt', action='store_true')
    ap.add_argument('--lingua', default='pt')
    ap.add_argument('--max-parado', type=float, default=1.5); ap.add_argument('--limiar-parado', type=float, default=1.0)
    a = ap.parse_args()
    os.makedirs(a.saida, exist_ok=True)
    L = json.load(open(a.linha, encoding='utf-8')); S = L['segmentos']; PAL = L.get('palavras', [])
    checar = acha_checar(); preset = acha_preset(checar, a.saida)
    # 1 rodada da checar-video no vídeo inteiro (OCR, movimento, áudio) -> eventos com tempo
    qa_dir = os.path.join(a.saida, 'qa_inteiro')
    env = dict(os.environ, PYTHONIOENCODING='utf-8', PYTHONUTF8='1')
    r = subprocess.run([sys.executable, checar, a.video, '--config', preset, '--sem-stt', '--out', qa_dir],
                       capture_output=True, text=True, encoding='utf-8', errors='replace', env=env)
    qa_json = os.path.join(qa_dir, 'qa.json')
    if not os.path.exists(qa_json):
        raise SystemExit(f'checar_planos: a checar-video não gerou {qa_json}.\n{(r.stderr or r.stdout)[-1200:]}')
    qa = json.load(open(qa_json, encoding='utf-8'))
    H_ = qa['info']['h']
    stt = [] if a.sem_stt else stt_palavras(a.video, a.lingua)
    MUD = mudanca_1s(a.video)
    planos = []
    for i, s in enumerate(S):
        t0, t1 = float(s['t']), float(s['t']) + float(s['dur']); motivos, avisos = [], []
        # 1) fala do plano
        esp = [norm(w) for t, w in PAL if t0 <= t < t1 and norm(w)]
        if esp and not a.sem_stt:
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
        # 3) parado (medida própria, à prova de grão) + a da checar-video
        if not s.get('parado_ok') and len(MUD):
            k0, k1 = int(t0 * 10), max(int(t0 * 10), int(t1 * 10) - 10); run, pior = 0, 0
            for k in range(k0, min(k1, len(MUD))):
                run = run + 1 if MUD[k] < a.limiar_parado else 0; pior = max(pior, run)
            if pior and pior / 10 + 1.0 > a.max_parado:
                trecho = MUD[k0:max(k0 + 1, min(k1, len(MUD)))]
                motivos.append(dict(tipo='parado', medida=round(pior / 10 + 1.0, 2), limite=a.max_parado,
                                    prova=f'mudança em 1 s abaixo de {a.limiar_parado} por {pior / 10 + 1.0:.1f} s seguidos dentro de {t0:.2f}–{t1:.2f} s (mín. {float(trecho.min()):.2f})'))
        if not s.get('parado_ok'):
            for p0, p1 in qa.get('movimento', {}).get('trechos_parados_longos', []):
                sob = min(p1, t1) - max(p0, t0)
                if sob > 0.3 and (p1 - p0) > a.max_parado and not any(m['tipo'] == 'parado' for m in motivos):
                    motivos.append(dict(tipo='parado', medida=round(p1 - p0, 2), limite=a.max_parado, prova=f'trecho parado {p0}–{p1} s ({p1 - p0:.2f} s)'))
        # 4) volume do trecho
        if float(s['dur']) >= 1.2:
            lu = lufs_trecho(a.video, t0, float(s['dur'])); lo = -20 if esp else -32
            if lu is not None and not (lo <= lu <= -9):
                motivos.append(dict(tipo='volume', medida=lu, limite=[lo, -9], prova=f'LUFS integrado do trecho {t0:.2f}–{t1:.2f} s = {lu}'))
        planos.append(dict(i=i, plano=s['plano'], t=round(t0, 3), dur=round(float(s['dur']), 3),
                           veredito='REPROVADO' if motivos else 'APROVADO', motivos=motivos, avisos=avisos))
    json.dump(dict(video=a.video, stt=not a.sem_stt, planos=planos, audio=qa.get('audio')),
              open(os.path.join(a.saida, 'veredito.json'), 'w', encoding='utf-8'), indent=1, ensure_ascii=False)
    rep = [p for p in planos if p['veredito'] == 'REPROVADO']
    print(f'{len(planos)} planos, {len(rep)} reprovados:',
          ', '.join(f"#{p['i']} {p['plano']} ({'/'.join(m['tipo'] for m in p['motivos'])})" for p in rep) or 'nenhum')


if __name__ == '__main__':
    main()
